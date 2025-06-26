import { Contact, Order, PromoOptin } from "@/models";
import MarketingCampaign, {
  IMarketingRecipient,
  ICampaignFilters,
} from "@/models/MarketingCampaign";
import { sendEmail, EmailData } from "@/utils/emailService";

export interface RecipientData {
  email: string;
  name: string;
  source: "contacts" | "orders" | "promoOptins";
  sourceId: string;
  consentStatus: boolean;
  lastActivity?: Date;
  orderHistory?: string[];
  preferences?: string[];
}

export interface RecipientFilters {
  sources?: ("contacts" | "orders" | "promoOptins")[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasOrders?: boolean;
  consentOnly?: boolean;
  productCategories?: string[];
}

/**
 * Get eligible recipients from all collections with deduplication
 */
export async function getEligibleRecipients(
  filters: RecipientFilters = {},
): Promise<RecipientData[]> {
  const recipients: Map<string, RecipientData> = new Map();
  const sources = filters.sources || ["contacts", "orders", "promoOptins"];

  try {
    // Get recipients from contacts collection
    if (sources.includes("contacts")) {
      const contactQuery: any = {};

      if (filters.dateRange) {
        contactQuery.createdAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end,
        };
      }

      const contacts = await Contact.find(contactQuery).lean();

      for (const contact of contacts) {
        if (!contact.email) continue;

        // For contacts, we assume consent if they provided contact info
        const consentStatus = true;

        if (filters.consentOnly && !consentStatus) continue;

        const existing = recipients.get(contact.email);
        const contactDate = contact.createdAt
          ? new Date(contact.createdAt)
          : new Date();
        if (!existing || contactDate > (existing.lastActivity || new Date(0))) {
          recipients.set(contact.email, {
            email: contact.email,
            name: contact.bouncer || "Customer",
            source: "contacts",
            sourceId: contact._id.toString(),
            consentStatus,
            lastActivity: contactDate,
            preferences: [
              contact.tablesChairs && "Tables & Chairs",
              contact.generator && "Generator",
              contact.popcornMachine && "Popcorn Machine",
              contact.cottonCandyMachine && "Cotton Candy Machine",
              contact.snowConeMachine && "Snow Cone Machine",
              contact.basketballShoot && "Basketball Shoot",
              contact.slushyMachine && "Slushy Machine",
              contact.overnight && "Overnight Rental",
            ].filter(Boolean) as string[],
          });
        }
      }
    }

    // Get recipients from orders collection
    if (sources.includes("orders")) {
      const orderQuery: any = {};

      if (filters.dateRange) {
        orderQuery.createdAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end,
        };
      }

      if (filters.hasOrders) {
        orderQuery.status = { $in: ["Paid", "Confirmed"] };
      }

      const orders = await Order.find(orderQuery).lean();

      for (const order of orders) {
        const email = order.customerEmail;
        if (!email) continue;

        // For orders, we assume consent since they made a purchase
        const consentStatus = true;

        if (filters.consentOnly && !consentStatus) continue;

        const orderHistory = order.items?.map((item) => item.name) || [];

        const existing = recipients.get(email);
        const orderDate = order.createdAt
          ? new Date(order.createdAt)
          : new Date();
        if (!existing || orderDate > (existing.lastActivity || new Date(0))) {
          recipients.set(email, {
            email,
            name: order.customerName || "Customer",
            source: "orders",
            sourceId: order._id.toString(),
            consentStatus,
            lastActivity: orderDate,
            orderHistory,
            preferences: orderHistory,
          });
        }
      }
    }

    // Get recipients from promo opt-ins collection
    if (sources.includes("promoOptins")) {
      const promoQuery: any = {};

      if (filters.dateRange) {
        promoQuery.createdAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end,
        };
      }

      const promoOptins = await PromoOptin.find(promoQuery).lean();

      for (const promo of promoOptins) {
        if (!promo.email) continue;

        const consentStatus = promo.consentToContact;

        if (filters.consentOnly && !consentStatus) continue;

        const existing = recipients.get(promo.email);
        if (
          !existing ||
          new Date(promo.createdAt) > (existing.lastActivity || new Date(0))
        ) {
          recipients.set(promo.email, {
            email: promo.email,
            name: promo.name || "Customer",
            source: "promoOptins",
            sourceId: promo._id.toString(),
            consentStatus,
            lastActivity: new Date(promo.createdAt),
            preferences: [promo.promoName],
          });
        }
      }
    }

    return Array.from(recipients.values()).sort(
      (a, b) =>
        (b.lastActivity?.getTime() || 0) - (a.lastActivity?.getTime() || 0),
    );
  } catch (error) {
    console.error("Error getting eligible recipients:", error);
    throw new Error("Failed to fetch eligible recipients");
  }
}

/**
 * Create marketing recipients from recipient data
 */
export function createMarketingRecipients(
  recipients: RecipientData[],
): IMarketingRecipient[] {
  return recipients.map((recipient) => ({
    email: recipient.email,
    name: recipient.name,
    source: recipient.source,
    sourceId: recipient.sourceId,
    status: "pending" as const,
    unsubscribeToken: generateUnsubscribeToken(),
  }));
}

/**
 * Send marketing campaign emails with rate limiting
 */
export async function sendMarketingCampaign(
  campaignId: string,
  batchSize: number = 50,
  delayMs: number = 1000,
): Promise<void> {
  try {
    const campaign = await MarketingCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Allow campaigns in "draft", "scheduled", or "sending" status
    // "sending" is allowed to handle cases where the API route already updated the status
    if (
      campaign.status !== "draft" &&
      campaign.status !== "scheduled" &&
      campaign.status !== "sending"
    ) {
      throw new Error("Campaign is not in a sendable state");
    }

    // Update campaign status
    campaign.status = "sending";
    campaign.sentAt = new Date();
    await campaign.save();

    let pendingRecipients = campaign.recipients.filter(
      (r) => r.status === "pending",
    );

    // 🚨 CRITICAL TEST MODE SAFETY CHECK 🚨
    if (campaign.testMode) {
      const adminEmail = process.env.OTHER_EMAIL;

      if (!adminEmail) {
        throw new Error(
          "OTHER_EMAIL environment variable not configured - cannot send test emails",
        );
      }

      // In test mode, replace all recipients with admin email only
      // But keep the original recipient structure for webhook processing
      campaign.recipients = [
        {
          email: adminEmail,
          name: "Test Admin",
          source: "contacts" as const,
          sourceId: "test",
          status: "pending" as const,
          unsubscribeToken: "test-token",
        },
      ];

      // Update pendingRecipients to match
      pendingRecipients = campaign.recipients.filter(
        (r) => r.status === "pending",
      );

      // SAFETY CHECK: Verify we only have 1 recipient
      if (pendingRecipients.length !== 1) {
        throw new Error(
          `TEST MODE SAFETY VIOLATION: ${pendingRecipients.length} recipients found, expected exactly 1`,
        );
      }

      // EXTRA SAFETY: Verify the email is correct
      if (pendingRecipients[0].email !== adminEmail) {
        throw new Error(
          `TEST MODE SAFETY VIOLATION: Wrong email ${pendingRecipients[0].email}, expected ${adminEmail}`,
        );
      }

      console.log("🚨 TEST MODE SEND INITIATED:", {
        timestamp: new Date().toISOString(),
        campaignId,
        campaignName: campaign.name,
        testEmail: adminEmail,
        originalRecipientCount: 1,
        actualSendCount: 1,
        subject: campaign.subject,
      });

      // Save the campaign with updated recipients for test mode
      await campaign.save();
    } else {
      console.log("📧 PRODUCTION MODE SEND INITIATED:", {
        timestamp: new Date().toISOString(),
        campaignId,
        campaignName: campaign.name,
        recipientCount: pendingRecipients.length,
        subject: campaign.subject,
      });
    }

    // Process recipients in batches
    for (let i = 0; i < pendingRecipients.length; i += batchSize) {
      const batch = pendingRecipients.slice(i, i + batchSize);

      // Send emails in parallel for this batch
      const emailPromises = batch.map(async (recipient) => {
        try {
          const unsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?token=${recipient.unsubscribeToken}`;

          // Add unsubscribe link to email content
          const emailContent =
            campaign.htmlContent +
            `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>You received this email because you opted in to receive marketing communications from us.</p>
              <p><a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe from marketing emails</a></p>
            </div>
          `;

          const emailData: EmailData = {
            to: recipient.email,
            from: process.env.EMAIL || "noreply@example.com",
            subject: campaign.subject,
            text: campaign.content,
            html: emailContent,
          };

          await sendEmail(emailData);

          // Update recipient status
          recipient.status = "sent";
          recipient.sentAt = new Date();

          return { success: true, email: recipient.email };
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);

          // Update recipient status with failure
          recipient.status = "failed";
          recipient.failureReason =
            error instanceof Error ? error.message : "Unknown error";

          return { success: false, email: recipient.email, error };
        }
      });

      // Wait for batch to complete
      const results = await Promise.allSettled(emailPromises);

      // Save progress after each batch
      await campaign.save();

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < pendingRecipients.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Update final campaign status
    campaign.status = "completed";
    campaign.completedAt = new Date();
    await campaign.save();
  } catch (error) {
    console.error("Error sending marketing campaign:", error);

    // Update campaign status to failed
    try {
      const campaign = await MarketingCampaign.findById(campaignId);
      if (campaign) {
        campaign.status = "failed";
        await campaign.save();
      }
    } catch (saveError) {
      console.error("Error updating campaign status:", saveError);
    }

    throw error;
  }
}

/**
 * Handle email tracking webhooks from SendGrid
 */
export async function handleEmailWebhook(events: any[]): Promise<void> {
  try {
    console.log("🔄 PROCESSING EMAIL WEBHOOK EVENTS:", {
      timestamp: new Date().toISOString(),
      eventCount: events.length,
    });

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        const {
          email,
          event: eventType,
          timestamp,
          sg_message_id,
          reason,
        } = event;

        // Skip events without required fields
        if (!email || !eventType) {
          console.warn("⚠️ SKIPPING EVENT: Missing email or event type", {
            timestamp: new Date().toISOString(),
            event,
          });
          skippedCount++;
          continue;
        }

        console.log("📧 PROCESSING EVENT:", {
          timestamp: new Date().toISOString(),
          email,
          eventType,
          messageId: sg_message_id,
          eventTimestamp: timestamp,
        });

        // Find campaigns with this recipient email
        const campaigns = await MarketingCampaign.find({
          "recipients.email": email,
          status: { $in: ["sending", "completed"] },
        });

        if (campaigns.length === 0) {
          console.warn("⚠️ NO CAMPAIGNS FOUND for email:", {
            timestamp: new Date().toISOString(),
            email,
            eventType,
          });
          skippedCount++;
          continue;
        }

        console.log("🎯 FOUND CAMPAIGNS:", {
          timestamp: new Date().toISOString(),
          email,
          campaignCount: campaigns.length,
          campaignIds: campaigns.map((c) => String(c._id)),
        });

        for (const campaign of campaigns) {
          const recipient = campaign.recipients.find((r) => r.email === email);
          if (!recipient) {
            console.warn("⚠️ RECIPIENT NOT FOUND in campaign:", {
              timestamp: new Date().toISOString(),
              email,
              campaignId: String(campaign._id),
              campaignName: campaign.name,
            });
            continue;
          }

          const eventDate = new Date(timestamp * 1000);
          const previousStatus = recipient.status;

          console.log("📊 UPDATING RECIPIENT STATUS:", {
            timestamp: new Date().toISOString(),
            email,
            campaignId: String(campaign._id),
            campaignName: campaign.name,
            previousStatus,
            eventType,
            eventDate: eventDate.toISOString(),
          });

          switch (eventType) {
            case "delivered":
              if (recipient.status === "sent") {
                recipient.status = "delivered";
                recipient.deliveredAt = eventDate;
                console.log("✅ STATUS UPDATED: sent → delivered", {
                  timestamp: new Date().toISOString(),
                  email,
                  campaignId: String(campaign._id),
                });
              } else {
                console.log(
                  "ℹ️ DELIVERY EVENT IGNORED: recipient not in 'sent' status",
                  {
                    timestamp: new Date().toISOString(),
                    email,
                    currentStatus: recipient.status,
                  },
                );
              }
              break;

            case "open":
              if (["sent", "delivered"].includes(recipient.status)) {
                recipient.status = "opened";
                recipient.openedAt = eventDate;
                console.log("✅ STATUS UPDATED: → opened", {
                  timestamp: new Date().toISOString(),
                  email,
                  campaignId: String(campaign._id),
                  previousStatus,
                });
              } else {
                console.log(
                  "ℹ️ OPEN EVENT IGNORED: recipient not in valid status",
                  {
                    timestamp: new Date().toISOString(),
                    email,
                    currentStatus: recipient.status,
                  },
                );
              }
              break;

            case "click":
              if (["sent", "delivered", "opened"].includes(recipient.status)) {
                recipient.status = "clicked";
                recipient.clickedAt = eventDate;
                console.log("✅ STATUS UPDATED: → clicked", {
                  timestamp: new Date().toISOString(),
                  email,
                  campaignId: String(campaign._id),
                  previousStatus,
                });
              } else {
                console.log(
                  "ℹ️ CLICK EVENT IGNORED: recipient not in valid status",
                  {
                    timestamp: new Date().toISOString(),
                    email,
                    currentStatus: recipient.status,
                  },
                );
              }
              break;

            case "bounce":
            case "dropped":
            case "spamreport":
            case "unsubscribe":
              const newStatus =
                eventType === "unsubscribe" ? "unsubscribed" : "failed";
              recipient.status = newStatus;
              recipient.failureReason = reason || eventType;
              console.log("❌ STATUS UPDATED: → " + newStatus, {
                timestamp: new Date().toISOString(),
                email,
                campaignId: String(campaign._id),
                previousStatus,
                reason: reason || eventType,
              });
              break;

            default:
              console.log("ℹ️ UNKNOWN EVENT TYPE:", {
                timestamp: new Date().toISOString(),
                email,
                eventType,
                campaignId: String(campaign._id),
              });
              break;
          }

          // Save the campaign with updated recipient status
          await campaign.save();

          console.log("💾 CAMPAIGN SAVED:", {
            timestamp: new Date().toISOString(),
            campaignId: String(campaign._id),
            email,
            newStatus: recipient.status,
          });
        }

        processedCount++;
      } catch (eventError) {
        console.error("❌ ERROR PROCESSING INDIVIDUAL EVENT:", {
          timestamp: new Date().toISOString(),
          event,
          error:
            eventError instanceof Error ? eventError.message : "Unknown error",
          stack: eventError instanceof Error ? eventError.stack : undefined,
        });
        errorCount++;
      }
    }

    console.log("✅ WEBHOOK PROCESSING COMPLETE:", {
      timestamp: new Date().toISOString(),
      totalEvents: events.length,
      processedCount,
      skippedCount,
      errorCount,
    });
  } catch (error) {
    console.error("❌ CRITICAL ERROR in handleEmailWebhook:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Handle unsubscribe requests
 */
export async function handleUnsubscribe(token: string): Promise<boolean> {
  try {
    const campaigns = await MarketingCampaign.find({
      "recipients.unsubscribeToken": token,
    });

    let found = false;
    for (const campaign of campaigns) {
      const recipient = campaign.recipients.find(
        (r) => r.unsubscribeToken === token,
      );
      if (recipient) {
        recipient.status = "unsubscribed";
        await campaign.save();
        found = true;
      }
    }

    return found;
  } catch (error) {
    console.error("Error handling unsubscribe:", error);
    throw error;
  }
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: string) {
  try {
    const campaign = await MarketingCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const recipients = campaign.recipients;
    const stats = {
      total: recipients.length,
      sent: recipients.filter((r) =>
        ["sent", "delivered", "opened", "clicked"].includes(r.status),
      ).length,
      delivered: recipients.filter((r) =>
        ["delivered", "opened", "clicked"].includes(r.status),
      ).length,
      opened: recipients.filter((r) => ["opened", "clicked"].includes(r.status))
        .length,
      clicked: recipients.filter((r) => r.status === "clicked").length,
      failed: recipients.filter((r) => r.status === "failed").length,
      unsubscribed: recipients.filter((r) => r.status === "unsubscribed")
        .length,
    };

    const rates = {
      deliveryRate: stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0,
      openRate:
        stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0,
      clickRate: stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0,
    };

    return {
      campaign: {
        id: campaign._id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        sentAt: campaign.sentAt,
        completedAt: campaign.completedAt,
      },
      stats,
      rates,
      recipients: recipients.map((r) => ({
        email: r.email,
        name: r.name,
        status: r.status,
        sentAt: r.sentAt,
        deliveredAt: r.deliveredAt,
        openedAt: r.openedAt,
        clickedAt: r.clickedAt,
        failureReason: r.failureReason,
      })),
    };
  } catch (error) {
    console.error("Error getting campaign analytics:", error);
    throw error;
  }
}

/**
 * Generate a unique unsubscribe token
 */
function generateUnsubscribeToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(16).toString("hex");
}
