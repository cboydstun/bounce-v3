import { Response } from "express";
import { logger } from "../utils/logger.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendEmail, EmailData } from "../utils/emailService.js";

interface SupportRequestData {
  type: "general" | "bug" | "feature";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  subject: string;
  message: string;
  systemInfo?: {
    appVersion?: string;
    platform?: string;
    userAgent?: string;
  };
}

interface BugReportData {
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  systemInfo?: {
    appVersion?: string;
    platform?: string;
    userAgent?: string;
  };
}

interface FeatureRequestData {
  title: string;
  description: string;
  useCase: string;
  priority: "low" | "medium" | "high";
  category: string;
}

class SupportController {
  /**
   * Submit a general support request
   */
  async submitSupportRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;
      const contractorName = req.contractor?.name;
      const contractorEmail = req.contractor?.email;

      if (!contractorId || !contractorName || !contractorEmail) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      const requestData: SupportRequestData = req.body;

      // Validate required fields
      if (!requestData.subject || !requestData.message || !requestData.type) {
        res.status(400).json({
          success: false,
          error: "Subject, message, and type are required",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      logger.info("Processing support request", {
        contractorId,
        type: requestData.type,
        priority: requestData.priority,
        category: requestData.category,
      });

      // Prepare email content
      const priorityEmoji = {
        low: "🟢",
        medium: "🟡",
        high: "🟠",
        urgent: "🔴",
      };

      const emailSubject = `[SUPPORT] ${priorityEmoji[requestData.priority]} ${requestData.subject}`;

      const emailText = `
Support Request from Contractor

Contractor Details:
- Name: ${contractorName}
- Email: ${contractorEmail}
- Contractor ID: ${contractorId}

Request Details:
- Type: ${requestData.type.toUpperCase()}
- Priority: ${requestData.priority.toUpperCase()}
- Category: ${requestData.category}
- Subject: ${requestData.subject}

Message:
${requestData.message}

System Information:
- App Version: ${requestData.systemInfo?.appVersion || "Not provided"}
- Platform: ${requestData.systemInfo?.platform || "Not provided"}
- User Agent: ${requestData.systemInfo?.userAgent || "Not provided"}

Submitted at: ${new Date().toISOString()}
      `.trim();

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${priorityEmoji[requestData.priority]} Support Request</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
    <h2 style="color: #333; margin-top: 0;">Contractor Details</h2>
    <ul style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">
      <li><strong>Name:</strong> ${contractorName}</li>
      <li><strong>Email:</strong> ${contractorEmail}</li>
      <li><strong>Contractor ID:</strong> ${contractorId}</li>
    </ul>
    
    <h2 style="color: #333;">Request Details</h2>
    <ul style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #e74c3c;">
      <li><strong>Type:</strong> ${requestData.type.toUpperCase()}</li>
      <li><strong>Priority:</strong> ${requestData.priority.toUpperCase()}</li>
      <li><strong>Category:</strong> ${requestData.category}</li>
      <li><strong>Subject:</strong> ${requestData.subject}</li>
    </ul>
    
    <h2 style="color: #333;">Message</h2>
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #2ecc71; white-space: pre-wrap;">${requestData.message}</div>
    
    <h2 style="color: #333;">System Information</h2>
    <ul style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #f39c12;">
      <li><strong>App Version:</strong> ${requestData.systemInfo?.appVersion || "Not provided"}</li>
      <li><strong>Platform:</strong> ${requestData.systemInfo?.platform || "Not provided"}</li>
      <li><strong>User Agent:</strong> ${requestData.systemInfo?.userAgent || "Not provided"}</li>
    </ul>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      <strong>Submitted at:</strong> ${new Date().toLocaleString()}
    </p>
  </div>
</body>
</html>
      `.trim();

      // Send email to support team
      const emailData: EmailData = {
        to: "satxbounce@gmail.com",
        from: process.env.EMAIL_FROM as string,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      };

      await sendEmail(emailData);

      // Send confirmation email to contractor
      const confirmationEmailData: EmailData = {
        to: contractorEmail,
        from: process.env.EMAIL_FROM as string,
        subject: "Support Request Received - Bounce House Contractor",
        text: `
Hi ${contractorName},

Thank you for contacting our support team. We have received your support request and will respond as soon as possible.

Request Details:
- Subject: ${requestData.subject}
- Priority: ${requestData.priority.toUpperCase()}
- Category: ${requestData.category}
- Reference ID: ${contractorId}-${Date.now()}

Your Message:
${requestData.message}

Our typical response times:
- Urgent: Within 2 hours
- High: Within 4 hours  
- Medium: Within 24 hours
- Low: Within 48 hours

Best regards,
The Bounce House Support Team
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request Received</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✅ Support Request Received</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
    <h2 style="color: #333; margin-top: 0;">Hi ${contractorName},</h2>
    
    <p>Thank you for contacting our support team. We have received your support request and will respond as soon as possible.</p>
    
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #2ecc71; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2ecc71;">Request Details:</h3>
      <ul style="margin: 0;">
        <li><strong>Subject:</strong> ${requestData.subject}</li>
        <li><strong>Priority:</strong> ${requestData.priority.toUpperCase()}</li>
        <li><strong>Category:</strong> ${requestData.category}</li>
        <li><strong>Reference ID:</strong> ${contractorId}-${Date.now()}</li>
      </ul>
    </div>
    
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #3498db;">Your Message:</h3>
      <div style="white-space: pre-wrap; margin: 0;">${requestData.message}</div>
    </div>
    
    <p>Best regards,<br>The Bounce House Support Team</p>
  </div>
</body>
</html>
        `.trim(),
      };

      await sendEmail(confirmationEmailData);

      logger.info("Support request processed successfully", {
        contractorId,
        subject: requestData.subject,
      });

      res.json({
        success: true,
        message: "Support request submitted successfully",
        data: {
          referenceId: `${contractorId}-${Date.now()}`,
          estimatedResponseTime: this.getEstimatedResponseTime(
            requestData.priority,
          ),
        },
      });
    } catch (error) {
      logger.error("Error processing support request:", error);
      res.status(500).json({
        success: false,
        error: "Failed to submit support request",
        code: "SUPPORT_REQUEST_FAILED",
      });
    }
  }

  /**
   * Submit a bug report
   */
  async submitBugReport(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;
      const contractorName = req.contractor?.name;
      const contractorEmail = req.contractor?.email;

      if (!contractorId || !contractorName || !contractorEmail) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      const bugData: BugReportData = req.body;

      // Validate required fields
      if (!bugData.title || !bugData.description) {
        res.status(400).json({
          success: false,
          error: "Title and description are required",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      logger.info("Processing bug report", {
        contractorId,
        title: bugData.title,
        priority: bugData.priority,
      });

      const priorityEmoji = {
        low: "🟢",
        medium: "🟡",
        high: "🟠",
        critical: "🔴",
      };

      const emailSubject = `[BUG] ${priorityEmoji[bugData.priority]} ${bugData.title}`;

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bug Report</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${priorityEmoji[bugData.priority]} Bug Report</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
    <h2 style="color: #333; margin-top: 0;">Reporter Details</h2>
    <ul style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">
      <li><strong>Name:</strong> ${contractorName}</li>
      <li><strong>Email:</strong> ${contractorEmail}</li>
      <li><strong>Contractor ID:</strong> ${contractorId}</li>
    </ul>
    
    <h2 style="color: #333;">Bug Details</h2>
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #e74c3c; margin-bottom: 15px;">
      <h3 style="margin-top: 0; color: #e74c3c;">Title</h3>
      <p style="margin: 0;">${bugData.title}</p>
    </div>
    
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #f39c12; margin-bottom: 15px;">
      <h3 style="margin-top: 0; color: #f39c12;">Priority & Category</h3>
      <ul style="margin: 0;">
        <li><strong>Priority:</strong> ${bugData.priority.toUpperCase()}</li>
        <li><strong>Category:</strong> ${bugData.category}</li>
      </ul>
    </div>
    
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #9b59b6; margin-bottom: 15px;">
      <h3 style="margin-top: 0; color: #9b59b6;">Description</h3>
      <div style="white-space: pre-wrap; margin: 0;">${bugData.description}</div>
    </div>
    
    ${
      bugData.stepsToReproduce
        ? `
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #34495e; margin-bottom: 15px;">
      <h3 style="margin-top: 0; color: #34495e;">Steps to Reproduce</h3>
      <div style="white-space: pre-wrap; margin: 0;">${bugData.stepsToReproduce}</div>
    </div>
    `
        : ""
    }
    
    ${
      bugData.expectedBehavior
        ? `
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #2ecc71; margin-bottom: 15px;">
      <h3 style="margin-top: 0; color: #2ecc71;">Expected Behavior</h3>
      <div style="white-space: pre-wrap; margin: 0;">${bugData.expectedBehavior}</div>
    </div>
    `
        : ""
    }
    
    ${
      bugData.actualBehavior
        ? `
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #e67e22; margin-bottom: 15px;">
      <h3 style="margin-top: 0; color: #e67e22;">Actual Behavior</h3>
      <div style="white-space: pre-wrap; margin: 0;">${bugData.actualBehavior}</div>
    </div>
    `
        : ""
    }
    
    <h2 style="color: #333;">System Information</h2>
    <ul style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #95a5a6;">
      <li><strong>App Version:</strong> ${bugData.systemInfo?.appVersion || "Not provided"}</li>
      <li><strong>Platform:</strong> ${bugData.systemInfo?.platform || "Not provided"}</li>
      <li><strong>User Agent:</strong> ${bugData.systemInfo?.userAgent || "Not provided"}</li>
    </ul>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      <strong>Reported at:</strong> ${new Date().toLocaleString()}
    </p>
  </div>
</body>
</html>
      `.trim();

      // Send email to development team
      const emailData: EmailData = {
        to: "satxbounce@gmail.com",
        from: process.env.EMAIL_FROM as string,
        subject: emailSubject,
        text: `Bug Report: ${bugData.title}\n\nFrom: ${contractorName} (${contractorEmail})\nPriority: ${bugData.priority}\n\nDescription:\n${bugData.description}`,
        html: emailHtml,
      };

      await sendEmail(emailData);

      logger.info("Bug report processed successfully", {
        contractorId,
        title: bugData.title,
      });

      res.json({
        success: true,
        message: "Bug report submitted successfully",
        data: {
          referenceId: `BUG-${contractorId}-${Date.now()}`,
          priority: bugData.priority,
        },
      });
    } catch (error) {
      logger.error("Error processing bug report:", error);
      res.status(500).json({
        success: false,
        error: "Failed to submit bug report",
        code: "BUG_REPORT_FAILED",
      });
    }
  }

  /**
   * Submit a feature request
   */
  async submitFeatureRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;
      const contractorName = req.contractor?.name;
      const contractorEmail = req.contractor?.email;

      if (!contractorId || !contractorName || !contractorEmail) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      const featureData: FeatureRequestData = req.body;

      // Validate required fields
      if (!featureData.title || !featureData.description) {
        res.status(400).json({
          success: false,
          error: "Title and description are required",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      logger.info("Processing feature request", {
        contractorId,
        title: featureData.title,
        priority: featureData.priority,
      });

      const priorityEmoji = {
        low: "🟢",
        medium: "🟡",
        high: "🟠",
      };

      const emailSubject = `[FEATURE] ${priorityEmoji[featureData.priority]} ${featureData.title}`;

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feature Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${priorityEmoji[featureData.priority]} Feature Request</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
    <h2 style="color: #333; margin-top: 0;">Requester Details</h2>
    <ul style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">
      <li><strong>Name:</strong> ${contractorName}</li>
      <li><strong>Email:</strong> ${contractorEmail}</li>
      <li><strong>Contractor ID:</strong> ${contractorId}</li>
    </ul>
    
    <h2 style="color: #333;">Feature Request Details</h2>
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #9b59b6; margin-bottom: 15px;">
      <h3 style="margin-top: 0; color: #9b59b6;">Title</h3>
      <p style="margin: 0;">${featureData.title}</p>
    </div>
    
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #f39c12; margin-bottom: 15px;">
      <h3 style="margin-top: 0; color: #f39c12;">Priority & Category</h3>
      <ul style="margin: 0;">
        <li><strong>Priority:</strong> ${featureData.priority.toUpperCase()}</li>
        <li><strong>Category:</strong> ${featureData.category}</li>
      </ul>
    </div>
    
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #2ecc71; margin-bottom: 15px;">
      <h3 style="margin-top: 0; color: #2ecc71;">Description</h3>
      <div style="white-space: pre-wrap; margin: 0;">${featureData.description}</div>
    </div>
    
    ${
      featureData.useCase
        ? `
    <div style="background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #e67e22; margin-bottom: 15px;">
      <h3 style="margin-top: 0; color: #e67e22;">Use Case</h3>
      <div style="white-space: pre-wrap; margin: 0;">${featureData.useCase}</div>
    </div>
    `
        : ""
    }
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      <strong>Requested at:</strong> ${new Date().toLocaleString()}
    </p>
  </div>
</body>
</html>
      `.trim();

      // Send email to product team
      const emailData: EmailData = {
        to: "satxbounce@gmail.com",
        from: process.env.EMAIL_FROM as string,
        subject: emailSubject,
        text: `Feature Request: ${featureData.title}\n\nFrom: ${contractorName} (${contractorEmail})\nPriority: ${featureData.priority}\n\nDescription:\n${featureData.description}`,
        html: emailHtml,
      };

      await sendEmail(emailData);

      logger.info("Feature request processed successfully", {
        contractorId,
        title: featureData.title,
      });

      res.json({
        success: true,
        message: "Feature request submitted successfully",
        data: {
          referenceId: `FEATURE-${contractorId}-${Date.now()}`,
          priority: featureData.priority,
        },
      });
    } catch (error) {
      logger.error("Error processing feature request:", error);
      res.status(500).json({
        success: false,
        error: "Failed to submit feature request",
        code: "FEATURE_REQUEST_FAILED",
      });
    }
  }

  /**
   * Get estimated response time based on priority
   */
  private getEstimatedResponseTime(priority: string): string {
    switch (priority) {
      case "urgent":
        return "Within 2 hours";
      case "high":
        return "Within 4 hours";
      case "medium":
        return "Within 24 hours";
      case "low":
        return "Within 48 hours";
      default:
        return "Within 24 hours";
    }
  }
}

export const supportController = new SupportController();
export default supportController;
