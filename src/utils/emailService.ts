import sgMail from "@sendgrid/mail";

// Initialize with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export interface EmailData {
  to: string;
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
    await sgMail.send(emailData);
  } catch (error) {
    console.error("Error sending email with SendGrid:", error);
    throw error;
  }
}
