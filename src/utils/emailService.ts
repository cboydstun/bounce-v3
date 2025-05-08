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
    // Just use the standard approach with text and html properties
    // SendGrid will handle the MIME types correctly
    await sgMail.send(emailData);
  } catch (error) {
    console.error("Error sending email with SendGrid:", error);
    throw error;
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
    const adminEmail = process.env.EMAIL;

    if (!adminEmail) {
      throw new Error("Admin email is not configured");
    }

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

    // Create email data
    const emailData = {
      to: adminEmail,
      from: adminEmail,
      subject: "Search Ranking Changes Alert",
      text,
      html,
    };

    // Send the email
    await sendEmail(emailData);
  } catch (error) {
    console.error("Error sending ranking change notification:", error);
    throw error;
  }
}
