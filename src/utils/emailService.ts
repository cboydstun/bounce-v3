import sgMail from "@sendgrid/mail";
import { RankingChangeNotification } from "@/types/searchRanking";
import { formatDisplayDateCT } from "./dateUtils";

// Initialize with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export interface EmailData {
  to: string | string[];
  from: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 * @param emailData The email data to send
 */
export async function sendEmail(emailData: EmailData): Promise<void> {
  try {
    // Validate SendGrid API key
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY environment variable is not set");
    }

    // 📧 COMPREHENSIVE EMAIL LOGGING 📧
    const recipientCount = Array.isArray(emailData.to)
      ? emailData.to.length
      : 1;
    const recipients = Array.isArray(emailData.to)
      ? emailData.to
      : [emailData.to];

    console.log("📧 EMAIL SEND ATTEMPT:", {
      timestamp: new Date().toISOString(),
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      recipientCount,
      recipients: recipients,
      hasHtml: !!emailData.html,
      textLength: emailData.text.length,
      htmlLength: emailData.html?.length || 0,
    });

    // 🚨 SAFETY CHECK: Alert if sending to multiple recipients 🚨
    if (recipientCount > 1) {
      console.warn("⚠️  MULTIPLE RECIPIENTS DETECTED:", {
        timestamp: new Date().toISOString(),
        recipientCount,
        recipients: recipients,
        subject: emailData.subject,
      });
    }

    // 🚨 EXTRA SAFETY: Check for test mode indicators 🚨
    const isTestEmail = recipients.some(
      (email) =>
        email.includes(process.env.OTHER_EMAIL || "") ||
        email.includes("test") ||
        email.includes("admin"),
    );

    if (isTestEmail) {
      console.log("🧪 TEST EMAIL DETECTED:", {
        timestamp: new Date().toISOString(),
        recipients: recipients,
        subject: emailData.subject,
      });
    }

    // Send the email
    const response = await sgMail.send(emailData);

    // Log successful send with full details
    console.log("✅ EMAIL SENT SUCCESSFULLY:", {
      timestamp: new Date().toISOString(),
      messageId: response[0]?.headers?.["x-message-id"],
      statusCode: response[0]?.statusCode,
      to: emailData.to,
      subject: emailData.subject,
      recipientCount,
      isTestEmail,
    });
  } catch (error: any) {
    // Enhanced error logging
    console.error("❌ EMAIL SEND FAILED:", {
      timestamp: new Date().toISOString(),
      to: emailData.to,
      subject: emailData.subject,
      error: error.message,
      code: error.code,
      response: error.response?.body,
      statusCode: error.response?.statusCode,
      recipientCount: Array.isArray(emailData.to) ? emailData.to.length : 1,
    });

    // Provide more specific error messages
    if (error.code === 401) {
      throw new Error(
        "SendGrid authentication failed. Please check your API key.",
      );
    } else if (error.code === 403) {
      throw new Error(
        "SendGrid access forbidden. Please verify your sender email address.",
      );
    } else if (error.response?.body?.errors) {
      const errorMessages = error.response.body.errors
        .map((err: any) => err.message)
        .join(", ");
      throw new Error(`SendGrid error: ${errorMessages}`);
    } else {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}

/**
 * Send a notification email for significant ranking changes
 * @param changes Array of ranking changes to notify about
 */
export async function sendRankingChangeNotification(
  changes: RankingChangeNotification[],
): Promise<void> {
  try {
    // Validate required environment variables
    const senderEmail = process.env.EMAIL; // orders@satxbounce.com
    const primaryRecipient = process.env.OTHER_EMAIL; // chrisboydstun@gmail.com
    const secondaryRecipient = process.env.SECOND_EMAIL; // satxbounce@gmail.com

    if (!senderEmail) {
      throw new Error(
        "EMAIL environment variable is not configured (sender email)",
      );
    }

    if (!primaryRecipient) {
      throw new Error(
        "OTHER_EMAIL environment variable is not configured (primary recipient)",
      );
    }

    if (!secondaryRecipient) {
      throw new Error(
        "SECOND_EMAIL environment variable is not configured (secondary recipient)",
      );
    }

    // Create recipient list
    const recipients = [primaryRecipient, secondaryRecipient];

    console.log("📧 Preparing ranking change notification:", {
      timestamp: new Date().toISOString(),
      senderEmail,
      recipients,
      changesCount: changes.length,
    });

    // Format the email content
    let text = "Significant changes in search rankings:\n\n";
    let html = "<h2>Significant changes in search rankings</h2><ul>";

    changes.forEach((change) => {
      const direction = change.change > 0 ? "up" : "down";
      const formattedDate = formatDisplayDateCT(change.date);

      text += `Keyword: "${change.keyword}"\n`;
      text += `Position: ${change.previousPosition} → ${change.currentPosition} (${Math.abs(change.change)} positions ${direction})\n`;
      text += `Date: ${formattedDate}\n`;
      text += `URL: ${change.url}\n\n`;

      html += `<li>
        <strong>Keyword:</strong> "${change.keyword}"<br>
        <strong>Position:</strong> ${change.previousPosition} → ${change.currentPosition} 
        <span style="color:${direction === "up" ? "green" : "red"}">
          (${Math.abs(change.change)} positions ${direction})
        </span><br>
        <strong>Date:</strong> ${formattedDate}<br>
        <strong>URL:</strong> <a href="${change.url}">${change.url}</a>
      </li>`;
    });

    html += "</ul>";

    // Add footer with timestamp
    const footerText = `\n\nThis alert was generated on ${formatDisplayDateCT(new Date())}.`;
    const footerHtml = `<p style="margin-top: 20px; font-size: 12px; color: #666;">This alert was generated on ${formatDisplayDateCT(new Date())}.</p>`;

    text += footerText;
    html += footerHtml;

    // Create email data with correct sender and multiple recipients
    const emailData = {
      to: recipients,
      from: senderEmail, // orders@satxbounce.com
      subject: "Search Ranking Changes Alert",
      text,
      html,
    };

    // Send the email
    await sendEmail(emailData);

    console.log("✅ Ranking change notification sent successfully:", {
      timestamp: new Date().toISOString(),
      senderEmail,
      recipients,
      changesCount: changes.length,
    });
  } catch (error) {
    console.error("Error sending ranking change notification:", error);
    throw error;
  }
}
