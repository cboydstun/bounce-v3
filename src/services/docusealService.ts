import { Order } from "@/types/order";
import crypto from "crypto";

/**
 * Custom error for when a DocuSeal submission is not found (404)
 */
export class SubmissionNotFoundError extends Error {
  public readonly submissionId: string;

  constructor(message: string, submissionId: string) {
    super(message);
    this.name = "SubmissionNotFoundError";
    this.submissionId = submissionId;
  }
}

export interface DocuSealSubmitter {
  id: number;
  submission_id: number;
  uuid: string;
  email: string;
  slug: string;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  declined_at: string | null;
  created_at: string;
  updated_at: string;
  name: string;
  phone?: string;
  external_id?: string;
  metadata?: Record<string, any>;
  status: "sent" | "opened" | "completed" | "declined";
  values?: Array<{
    field: string;
    value: string;
  }>;
  preferences?: {
    send_email: boolean;
    send_sms: boolean;
  };
  role: string;
  embed_src: string; // This is the signing URL
}

export interface DocuSealSubmission {
  id: string; // This will be the submission_id from the submitters
  status: "pending" | "completed" | "declined" | "expired";
  submitters: DocuSealSubmitter[];
  documents?: Array<{
    id: string;
    url: string;
    filename: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface DocuSealTemplate {
  id: string;
  name: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
}

export interface DocuSealWebhookPayload {
  event_type:
    | "submission.completed"
    | "submission.viewed"
    | "submission.declined";
  data: {
    submission: DocuSealSubmission;
  };
}

/**
 * Service class for interacting with DocuSeal API
 */
export class DocuSealService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly templateId: string;
  private readonly webhookSecret?: string;

  constructor() {
    this.baseUrl =
      process.env.DOCUSEAL_BASE_URL || "https://sign.slowbill.xyz/api";
    this.apiKey = process.env.DOCUSEAL_API_KEY || "";
    this.templateId = process.env.DOCUSEAL_TEMPLATE_ID || "";
    this.webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET;

    if (!this.apiKey) {
      throw new Error("DOCUSEAL_API_KEY environment variable is required");
    }
    if (!this.templateId) {
      throw new Error("DOCUSEAL_TEMPLATE_ID environment variable is required");
    }
  }

  /**
   * Create a new submission for an order
   */
  async createSubmission(order: Order): Promise<DocuSealSubmission> {
    try {
      // Prepare submission data
      const submissionData = {
        template_id: this.templateId,
        send_email: false, // We'll handle email sending ourselves
        submitters: [
          {
            name: order.customerName || "Customer",
            email: order.customerEmail,
            role: "Customer",
          },
        ],
        fields: this.prepareOrderFields(order),
        metadata: {
          order_id: order._id,
          order_number: order.orderNumber,
        },
      };

      const response = await fetch(`${this.baseUrl}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": this.apiKey,
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DocuSeal API error: ${response.status} - ${errorText}`,
        );
      }

      // DocuSeal returns an array of submitters, not a submission object
      const submitters: DocuSealSubmitter[] = await response.json();
      console.log(
        "DocuSeal API response:",
        JSON.stringify(submitters, null, 2),
      );

      if (!submitters || submitters.length === 0) {
        throw new Error("DocuSeal returned empty submitters array");
      }

      const firstSubmitter = submitters[0];
      if (!firstSubmitter.submission_id) {
        throw new Error("DocuSeal submitter missing submission_id");
      }

      // Create a submission object from the submitters array
      const submission: DocuSealSubmission = {
        id: String(firstSubmitter.submission_id),
        status: this.mapSubmitterStatusToSubmissionStatus(
          firstSubmitter.status,
        ),
        submitters: submitters,
        created_at: firstSubmitter.created_at,
        updated_at: firstSubmitter.updated_at,
      };

      return submission;
    } catch (error) {
      console.error("Error creating DocuSeal submission:", error);
      throw new Error(
        `Failed to create DocuSeal submission: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get submission status by ID
   */
  async getSubmissionStatus(submissionId: string): Promise<DocuSealSubmission> {
    try {
      const response = await fetch(
        `${this.baseUrl}/submissions/${submissionId}`,
        {
          headers: {
            "X-Auth-Token": this.apiKey,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        // Handle 404 specifically - submission doesn't exist
        if (response.status === 404) {
          throw new SubmissionNotFoundError(
            `Submission ${submissionId} not found in DocuSeal`,
            submissionId,
          );
        }

        throw new Error(
          `DocuSeal API error: ${response.status} - ${errorText}`,
        );
      }

      const rawResponse = await response.json();
      console.log(
        "DocuSeal GET submission response:",
        JSON.stringify(rawResponse, null, 2),
      );

      // Handle different response formats from GET vs POST
      let submission: DocuSealSubmission;

      if (Array.isArray(rawResponse)) {
        // If it's an array (like POST response), convert it
        const submitters = rawResponse as DocuSealSubmitter[];
        if (submitters.length === 0) {
          throw new Error("Empty submitters array from DocuSeal");
        }

        const firstSubmitter = submitters[0];
        submission = {
          id: String(firstSubmitter.submission_id),
          status: this.mapSubmitterStatusToSubmissionStatus(
            firstSubmitter.status,
          ),
          submitters: submitters,
          created_at: firstSubmitter.created_at,
          updated_at: firstSubmitter.updated_at,
        };
      } else {
        // If it's an object (different GET format), use it directly but ensure submitters have embed_src
        submission = rawResponse as DocuSealSubmission;

        // Ensure submitters have the signing URL field
        if (submission.submitters) {
          submission.submitters = submission.submitters.map((submitter) => ({
            ...submitter,
            // If embed_src is missing but we have other URL fields, try to use them
            embed_src:
              submitter.embed_src ||
              (submitter as any).signing_url ||
              (submitter as any).url ||
              "",
          }));
        }
      }

      return submission;
    } catch (error) {
      console.error("Error getting DocuSeal submission status:", error);

      // Re-throw SubmissionNotFoundError as-is
      if (error instanceof SubmissionNotFoundError) {
        throw error;
      }

      throw new Error(
        `Failed to get submission status: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Download signed document from DocuSeal
   */
  async downloadSignedDocument(submissionId: string): Promise<Buffer | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/submissions/${submissionId}/download`,
        {
          method: "GET",
          headers: {
            "X-Auth-Token": this.apiKey,
            Accept: "application/pdf",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `DocuSeal API error: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Error downloading signed document:", error);
      throw error;
    }
  }

  /**
   * Void/cancel a submission
   */
  async voidSubmission(submissionId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/submissions/${submissionId}/void`,
        {
          method: "POST",
          headers: {
            "X-Auth-Token": this.apiKey,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DocuSeal API error: ${response.status} - ${errorText}`,
        );
      }
    } catch (error) {
      console.error("Error voiding DocuSeal submission:", error);
      throw new Error(
        `Failed to void submission: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get signing URL for a submission
   */
  async getSigningUrl(
    submissionId: string,
    submitterEmail: string,
  ): Promise<string> {
    try {
      const submission = await this.getSubmissionStatus(submissionId);
      const submitter = submission.submitters.find(
        (s: DocuSealSubmitter) => s.email === submitterEmail,
      );

      if (!submitter || !submitter.embed_src) {
        throw new Error("Signing URL not found for submitter");
      }

      return submitter.embed_src;
    } catch (error) {
      console.error("Error getting signing URL:", error);

      // Re-throw SubmissionNotFoundError as-is for proper handling upstream
      if (error instanceof SubmissionNotFoundError) {
        throw error;
      }

      throw new Error(
        `Failed to get signing URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Validate if a submission exists and is accessible
   */
  async validateSubmission(submissionId: string): Promise<boolean> {
    try {
      await this.getSubmissionStatus(submissionId);
      return true;
    } catch (error) {
      if (error instanceof SubmissionNotFoundError) {
        return false;
      }
      // For other errors, we can't be sure, so return false to be safe
      console.warn(`Could not validate submission ${submissionId}:`, error);
      return false;
    }
  }

  /**
   * Create a new submission or get existing one if valid
   */
  async createOrGetSubmission(
    order: Order,
    existingSubmissionId?: string,
  ): Promise<DocuSealSubmission> {
    // If we have an existing submission ID, try to validate it first
    if (
      existingSubmissionId &&
      existingSubmissionId !== "undefined" &&
      existingSubmissionId.trim() !== ""
    ) {
      try {
        console.log(
          `Attempting to retrieve existing submission: ${existingSubmissionId}`,
        );
        const submission = await this.getSubmissionStatus(existingSubmissionId);
        console.log(
          `Successfully retrieved existing submission ${existingSubmissionId}`,
        );
        return submission;
      } catch (error) {
        if (error instanceof SubmissionNotFoundError) {
          console.log(
            `Existing submission ${existingSubmissionId} not found, creating new one`,
          );
        } else {
          console.warn(
            `Error validating existing submission ${existingSubmissionId}, creating new one:`,
            error,
          );
        }
      }
    } else if (existingSubmissionId) {
      console.warn(
        `Invalid existing submission ID: "${existingSubmissionId}", creating new submission`,
      );
    }

    // Create new submission
    console.log(`Creating new submission for order ${order._id}`);
    try {
      const newSubmission = await this.createSubmission(order);

      // Validate the new submission
      if (!newSubmission || !newSubmission.id) {
        throw new Error("DocuSeal returned invalid submission - missing ID");
      }

      console.log(`Successfully created new submission ${newSubmission.id}`);
      return newSubmission;
    } catch (error) {
      console.error(
        `Failed to create new submission for order ${order._id}:`,
        error,
      );
      throw new Error(
        `Failed to create DocuSeal submission: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Map DocuSeal submitter status to submission status
   */
  private mapSubmitterStatusToSubmissionStatus(
    submitterStatus: "sent" | "opened" | "completed" | "declined",
  ): "pending" | "completed" | "declined" | "expired" {
    switch (submitterStatus) {
      case "sent":
      case "opened":
        return "pending";
      case "completed":
        return "completed";
      case "declined":
        return "declined";
      default:
        return "pending";
    }
  }

  /**
   * Verify webhook signature from DocuSeal
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn(
        "No webhook secret configured, skipping signature verification",
      );
      return true; // Allow if no secret is configured
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(body)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }

  /**
   * Sync order status with DocuSeal submission status
   * Useful for manual status updates or recovering from missed webhooks
   */
  async syncOrderWithSubmission(
    orderId: string,
  ): Promise<{ updated: boolean; status: string }> {
    try {
      const Order = (await import("@/models/Order")).default;
      await (await import("@/lib/db/mongoose")).default();

      // Find the order
      const order = await Order.findById(orderId);
      if (!order || !order.docusealSubmissionId) {
        return {
          updated: false,
          status: "Order not found or no submission ID",
        };
      }

      // Get current submission status from DocuSeal
      const submission = await this.getSubmissionStatus(
        order.docusealSubmissionId,
      );

      // Check if all submitters are completed
      const allCompleted = submission.submitters.every(
        (s) => s.status === "completed",
      );
      const anyViewed = submission.submitters.some(
        (s) => s.status === "opened" || s.status === "completed",
      );
      const anyDeclined = submission.submitters.some(
        (s) => s.status === "declined",
      );

      let newStatus = order.agreementStatus;
      let updates: any = {};

      if (allCompleted && order.agreementStatus !== "signed") {
        // Agreement was signed
        const completedSubmitter = submission.submitters.find(
          (s) => s.completed_at,
        );
        newStatus = "signed";
        updates = {
          agreementStatus: "signed",
          agreementSignedAt: completedSubmitter?.completed_at
            ? new Date(completedSubmitter.completed_at)
            : new Date(),
          deliveryBlocked: false,
          updatedAt: new Date(),
        };
      } else if (anyDeclined && order.agreementStatus !== "pending") {
        // Agreement was declined
        newStatus = "pending";
        updates = {
          agreementStatus: "pending",
          deliveryBlocked: true,
          updatedAt: new Date(),
        };
      } else if (anyViewed && order.agreementStatus === "pending") {
        // Agreement was viewed but not completed
        const viewedSubmitter = submission.submitters.find((s) => s.opened_at);
        newStatus = "viewed";
        updates = {
          agreementStatus: "viewed",
          agreementViewedAt: viewedSubmitter?.opened_at
            ? new Date(viewedSubmitter.opened_at)
            : new Date(),
          updatedAt: new Date(),
        };
      }

      // Update the order if status changed
      if (Object.keys(updates).length > 0) {
        await Order.findByIdAndUpdate(orderId, updates);
        console.log(
          `Synced order ${order.orderNumber} status: ${order.agreementStatus} -> ${newStatus}`,
        );
        return { updated: true, status: `Updated to ${newStatus}` };
      }

      return {
        updated: false,
        status: `Already up to date (${order.agreementStatus})`,
      };
    } catch (error) {
      console.error("Error syncing order with submission:", error);
      throw new Error(
        `Failed to sync order: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Prepare order fields for DocuSeal template
   */
  private prepareOrderFields(order: Order): Record<string, any> {
    // Format items list
    const itemsList = order.items
      .map(
        (item) =>
          `${item.name} (Qty: ${item.quantity}) - $${item.totalPrice.toFixed(2)}`,
      )
      .join("\n");

    // Format delivery address
    const deliveryAddress = [
      order.customerAddress,
      order.customerCity,
      order.customerState,
      order.customerZipCode,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      // Customer Information
      customer_name: order.customerName || "",
      customer_email: order.customerEmail || "",
      customer_phone: order.customerPhone || "",
      customer_address: deliveryAddress,

      // Order Information
      order_number: order.orderNumber,
      order_date: new Date(order.createdAt).toLocaleDateString(),
      event_date: order.eventDate
        ? new Date(order.eventDate).toLocaleDateString()
        : "",
      delivery_date: order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString()
        : "",

      // Rental Items
      rental_items: itemsList,
      subtotal: `$${order.subtotal.toFixed(2)}`,
      tax_amount: `$${order.taxAmount.toFixed(2)}`,
      delivery_fee: `$${order.deliveryFee.toFixed(2)}`,
      processing_fee: `$${order.processingFee.toFixed(2)}`,
      discount_amount:
        order.discountAmount > 0
          ? `-$${order.discountAmount.toFixed(2)}`
          : "$0.00",
      total_amount: `$${order.totalAmount.toFixed(2)}`,

      // Payment Information
      deposit_amount: `$${order.depositAmount.toFixed(2)}`,
      balance_due: `$${order.balanceDue.toFixed(2)}`,
      payment_method: order.paymentMethod,

      // Additional Information
      notes: order.notes || "",

      // Company Information (these should be in your template)
      company_name: "SATX Bounce LLC",
      company_phone: "512-210-0194",
      company_email: process.env.EMAIL || "",
      company_address: process.env.COMPANY_ADDRESS || "",
    };
  }
}

// Export singleton instance
export const docusealService = new DocuSealService();
