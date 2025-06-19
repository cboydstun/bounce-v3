import { Order } from "@/types/order";
import { sendEmail } from "@/utils/emailService";
import { differenceInHours, format } from "date-fns";

export type UrgencyLevel = "normal" | "urgent" | "critical";

/**
 * Service class for handling agreement-related email communications
 */
export class AgreementEmailService {
  private readonly fromEmail: string;
  private readonly companyName: string;
  private readonly companyPhone: string;

  constructor() {
    this.fromEmail = process.env.EMAIL || "noreply@bouncehouserental.com";
    this.companyName = "SATX Bounce LLC";
    this.companyPhone = "512-210-0194";
  }

  /**
   * Send initial agreement email when first created
   */
  async sendInitialAgreement(order: Order, signingUrl: string): Promise<void> {
    const subject = `Action Required: Sign Rental Agreement for ${this.formatEventDate(order)}`;

    const emailContent = this.generateInitialAgreementEmail(order, signingUrl);

    await sendEmail({
      from: this.fromEmail,
      to: order.customerEmail!,
      subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  }

  /**
   * Send reminder email based on urgency level
   */
  async sendReminderEmail(
    order: Order,
    urgencyLevel: UrgencyLevel,
    signingUrl: string,
  ): Promise<void> {
    const subject = this.getReminderSubject(order, urgencyLevel);
    const emailContent = this.generateReminderEmail(
      order,
      urgencyLevel,
      signingUrl,
    );

    await sendEmail({
      from: this.fromEmail,
      to: order.customerEmail!,
      subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  }

  /**
   * Send final warning email
   */
  async sendFinalWarning(order: Order, signingUrl: string): Promise<void> {
    const subject = `🚨 URGENT: Sign Agreement NOW or Risk Delivery Cancellation - ${order.orderNumber}`;

    const emailContent = this.generateFinalWarningEmail(order, signingUrl);

    await sendEmail({
      from: this.fromEmail,
      to: order.customerEmail!,
      subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  }

  /**
   * Send confirmation email when agreement is signed
   */
  async sendAgreementSigned(order: Order): Promise<void> {
    const subject = `✅ Agreement Signed - Your Rental is Confirmed! ${order.orderNumber}`;

    const emailContent = this.generateAgreementSignedEmail(order);

    await sendEmail({
      from: this.fromEmail,
      to: order.customerEmail!,
      subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  }

  /**
   * Generate initial agreement email content
   */
  private generateInitialAgreementEmail(
    order: Order,
    signingUrl: string,
  ): { text: string; html: string } {
    const eventDate = this.formatEventDate(order);
    const deliveryDate = this.formatDeliveryDate(order);
    const itemsList = this.formatItemsList(order);

    const text = `
Dear ${order.customerName || "Valued Customer"},

Thank you for choosing ${this.companyName} for your upcoming event!

ORDER DETAILS:
Order Number: ${order.orderNumber}
Event Date: ${eventDate}
Total Amount: $${order.totalAmount.toFixed(2)}

RENTAL ITEMS:
${itemsList}

IMPORTANT: RENTAL AGREEMENT REQUIRED
Before we can deliver your rental equipment, we need you to sign our rental agreement. This protects both you and our equipment, and includes important safety guidelines.

SIGN YOUR AGREEMENT NOW:
${signingUrl}

Please sign the agreement as soon as possible. We require all agreements to be signed at least 24 hours before delivery to ensure everything is ready for your event.

If you have any questions, please don't hesitate to contact us at ${this.companyPhone}.

Thank you for your business!

${this.companyName}
${this.companyPhone}
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rental Agreement Required</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">${this.companyName}</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Rental Agreement Required</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Dear ${order.customerName || "Valued Customer"},</p>
        
        <p>Thank you for choosing ${this.companyName} for your upcoming event!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Order Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Event Date:</strong> ${eventDate}</p>
            <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #667eea;">Rental Items</h3>
            <div style="font-family: monospace; background: #f8f9fa; padding: 15px; border-radius: 4px;">
                ${itemsList.replace(/\n/g, "<br>")}
            </div>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">⚠️ IMPORTANT: Rental Agreement Required</h3>
            <p style="margin-bottom: 0;">Before we can deliver your rental equipment, we need you to sign our rental agreement. This protects both you and our equipment, and includes important safety guidelines.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${signingUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold; display: inline-block;">
                📝 SIGN YOUR AGREEMENT NOW
            </a>
        </div>
        
        <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;"><strong>Deadline:</strong> Please sign the agreement as soon as possible. We require all agreements to be signed at least 24 hours before delivery.</p>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact us at <strong>${this.companyPhone}</strong>.</p>
        
        <p>Thank you for your business!</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #6c757d;">${this.companyName}</p>
            <p style="margin: 5px 0 0 0; color: #6c757d;">${this.companyPhone}</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return { text, html };
  }

  /**
   * Generate reminder email content
   */
  private generateReminderEmail(
    order: Order,
    urgencyLevel: UrgencyLevel,
    signingUrl: string,
  ): { text: string; html: string } {
    const eventDate = this.formatEventDate(order);
    const deliveryDate = this.formatDeliveryDate(order);
    const hoursUntilDelivery = this.getHoursUntilDelivery(order);
    const urgencyMessage = this.getUrgencyMessage(
      urgencyLevel,
      hoursUntilDelivery,
    );

    const text = `
REMINDER: Rental Agreement Still Needed - ${order.orderNumber}

Dear ${order.customerName || "Valued Customer"},

${urgencyMessage}

ORDER DETAILS:
Order Number: ${order.orderNumber}
Event Date: ${eventDate}
Delivery Date: ${deliveryDate}
Hours Until Delivery: ${hoursUntilDelivery}

SIGN YOUR AGREEMENT NOW:
${signingUrl}

${this.getUrgencyInstructions(urgencyLevel)}

Contact us immediately at ${this.companyPhone} if you have any questions.

${this.companyName}
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rental Agreement Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${this.getUrgencyColor(urgencyLevel)}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">${this.getUrgencyIcon(urgencyLevel)} REMINDER</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Rental Agreement Still Needed</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Dear ${order.customerName || "Valued Customer"},</p>
        
        <div style="background: ${this.getUrgencyBackgroundColor(urgencyLevel)}; border: 1px solid ${this.getUrgencyBorderColor(urgencyLevel)}; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: ${this.getUrgencyTextColor(urgencyLevel)}; font-weight: bold;">${urgencyMessage}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${this.getUrgencyColor(urgencyLevel)};">
            <h3 style="margin-top: 0; color: ${this.getUrgencyColor(urgencyLevel)};">Order Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Event Date:</strong> ${eventDate}</p>
            <p><strong>Delivery Date:</strong> ${deliveryDate}</p>
            <p><strong>Hours Until Delivery:</strong> ${hoursUntilDelivery}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${signingUrl}" style="background: ${this.getUrgencyColor(urgencyLevel)}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold; display: inline-block; animation: pulse 2s infinite;">
                📝 SIGN YOUR AGREEMENT NOW
            </a>
        </div>
        
        <div style="background: ${this.getUrgencyBackgroundColor(urgencyLevel)}; border: 1px solid ${this.getUrgencyBorderColor(urgencyLevel)}; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: ${this.getUrgencyTextColor(urgencyLevel)};">${this.getUrgencyInstructions(urgencyLevel)}</p>
        </div>
        
        <p>Contact us immediately at <strong>${this.companyPhone}</strong> if you have any questions.</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #6c757d;">${this.companyName}</p>
            <p style="margin: 5px 0 0 0; color: #6c757d;">${this.companyPhone}</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return { text, html };
  }

  /**
   * Generate final warning email content
   */
  private generateFinalWarningEmail(
    order: Order,
    signingUrl: string,
  ): { text: string; html: string } {
    const eventDate = this.formatEventDate(order);
    const deliveryDate = this.formatDeliveryDate(order);
    const hoursUntilDelivery = this.getHoursUntilDelivery(order);

    const text = `
🚨 FINAL WARNING: Sign Agreement NOW or Risk Delivery Cancellation

Dear ${order.customerName || "Valued Customer"},

THIS IS YOUR FINAL WARNING. Your rental delivery is scheduled in ${hoursUntilDelivery} hours, but we still haven't received your signed rental agreement.

WITHOUT A SIGNED AGREEMENT, WE CANNOT DELIVER YOUR RENTAL EQUIPMENT.

ORDER AT RISK:
Order Number: ${order.orderNumber}
Event Date: ${eventDate}
Delivery Date: ${deliveryDate}
Hours Until Delivery: ${hoursUntilDelivery}

SIGN IMMEDIATELY TO AVOID CANCELLATION:
${signingUrl}

If you don't sign the agreement within the next few hours, we will have to cancel your delivery and you may lose your deposit.

CALL US IMMEDIATELY: ${this.companyPhone}

${this.companyName}
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FINAL WARNING - Agreement Required</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 32px;">🚨 FINAL WARNING</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">Agreement Required NOW</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px; font-weight: bold;">Dear ${order.customerName || "Valued Customer"},</p>
        
        <div style="background: #f8d7da; border: 2px solid #dc3545; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24; font-weight: bold; font-size: 16px;">THIS IS YOUR FINAL WARNING. Your rental delivery is scheduled in ${hoursUntilDelivery} hours, but we still haven't received your signed rental agreement.</p>
        </div>
        
        <div style="background: #dc3545; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; font-size: 20px;">WITHOUT A SIGNED AGREEMENT, WE CANNOT DELIVER YOUR RENTAL EQUIPMENT</h3>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin-top: 0; color: #dc3545;">Order At Risk</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Event Date:</strong> ${eventDate}</p>
            <p><strong>Delivery Date:</strong> ${deliveryDate}</p>
            <p><strong>Hours Until Delivery:</strong> <span style="color: #dc3545; font-weight: bold;">${hoursUntilDelivery}</span></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${signingUrl}" style="background: #dc3545; color: white; padding: 20px 40px; text-decoration: none; border-radius: 5px; font-size: 20px; font-weight: bold; display: inline-block; box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);">
                🚨 SIGN IMMEDIATELY TO AVOID CANCELLATION
            </a>
        </div>
        
        <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ If you don't sign the agreement within the next few hours, we will have to cancel your delivery and you may lose your deposit.</p>
        </div>
        
        <div style="text-align: center; background: #dc3545; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0;">CALL US IMMEDIATELY</h3>
            <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">${this.companyPhone}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #6c757d;">${this.companyName}</p>
            <p style="margin: 5px 0 0 0; color: #6c757d;">${this.companyPhone}</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return { text, html };
  }

  /**
   * Generate agreement signed confirmation email
   */
  private generateAgreementSignedEmail(order: Order): {
    text: string;
    html: string;
  } {
    const eventDate = this.formatEventDate(order);
    const deliveryDate = this.formatDeliveryDate(order);

    const text = `
✅ Agreement Signed - Your Rental is Confirmed!

Dear ${order.customerName || "Valued Customer"},

Great news! We've received your signed rental agreement and your order is now confirmed for delivery.

ORDER CONFIRMED:
Order Number: ${order.orderNumber}
Event Date: ${eventDate}
Delivery Date: ${deliveryDate}
Status: Ready for Delivery

Your rental equipment will be delivered as scheduled. Our delivery team will contact you on the day of delivery to confirm timing.

Thank you for choosing ${this.companyName}!

If you have any questions, please contact us at ${this.companyPhone}.

${this.companyName}
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agreement Signed - Order Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 32px;">✅ Agreement Signed</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Your Rental is Confirmed!</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Dear ${order.customerName || "Valued Customer"},</p>
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #155724; font-weight: bold; font-size: 16px;">Great news! We've received your signed rental agreement and your order is now confirmed for delivery.</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #28a745;">Order Confirmed</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Event Date:</strong> ${eventDate}</p>
            <p><strong>Delivery Date:</strong> ${deliveryDate}</p>
            <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Ready for Delivery</span></p>
        </div>
        
        <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;">Your rental equipment will be delivered as scheduled. Our delivery team will contact you on the day of delivery to confirm timing.</p>
        </div>
        
        <p>Thank you for choosing ${this.companyName}!</p>
        
        <p>If you have any questions, please contact us at <strong>${this.companyPhone}</strong>.</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #6c757d;">${this.companyName}</p>
            <p style="margin: 5px 0 0 0; color: #6c757d;">${this.companyPhone}</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return { text, html };
  }

  // Helper methods
  private formatEventDate(order: Order): string {
    // Event date and delivery date are the same thing
    const date =
      order.deliveryDate || order.eventDate || this.extractDateFromNotes(order);
    if (date) {
      return format(new Date(date), "EEEE, MMMM do, yyyy");
    }
    return "Date TBD";
  }

  private formatDeliveryDate(order: Order): string {
    // Event date and delivery date are the same thing
    const date =
      order.deliveryDate || order.eventDate || this.extractDateFromNotes(order);
    if (date) {
      return format(new Date(date), "EEEE, MMMM do, yyyy");
    }
    return "Date TBD";
  }

  /**
   * Extract delivery date from notes field as fallback
   * Looks for patterns like "Delivery: 2025-07-08 11:00"
   */
  private extractDateFromNotes(order: Order): Date | null {
    if (!order.notes) return null;

    try {
      // Look for "Delivery: YYYY-MM-DD HH:MM" pattern
      const deliveryMatch = order.notes.match(
        /Delivery:\s*(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2})?/i,
      );
      if (deliveryMatch) {
        const dateStr = deliveryMatch[1]; // YYYY-MM-DD
        const timeStr = deliveryMatch[2] || "12:00"; // Default to noon if no time
        const fullDateStr = `${dateStr}T${timeStr}:00`;

        console.log(`Extracted date from notes: ${fullDateStr}`);
        return new Date(fullDateStr);
      }

      // Look for other date patterns in notes
      const dateMatch = order.notes.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        console.log(`Extracted date from notes: ${dateMatch[1]}`);
        return new Date(`${dateMatch[1]}T12:00:00`);
      }
    } catch (error) {
      console.warn("Error parsing date from notes:", error);
    }

    return null;
  }

  private formatItemsList(order: Order): string {
    return order.items
      .map(
        (item) =>
          `${item.name} (Qty: ${item.quantity}) - $${item.totalPrice.toFixed(2)}`,
      )
      .join("\n");
  }

  private getHoursUntilDelivery(order: Order): string {
    if (!order.deliveryDate) return "TBD";

    const hours = differenceInHours(new Date(order.deliveryDate), new Date());
    if (hours < 1) return "Less than 1 hour";
    if (hours === 1) return "1 hour";
    return `${hours} hours`;
  }

  private getReminderSubject(order: Order, urgencyLevel: UrgencyLevel): string {
    const urgencyPrefix = {
      normal: "Reminder:",
      urgent: "⚠️ URGENT:",
      critical: "🚨 CRITICAL:",
    }[urgencyLevel];

    return `${urgencyPrefix} Sign Rental Agreement - ${order.orderNumber}`;
  }

  private getUrgencyMessage(
    urgencyLevel: UrgencyLevel,
    hoursUntilDelivery: string,
  ): string {
    switch (urgencyLevel) {
      case "normal":
        return `We still need your signed rental agreement for your upcoming delivery in ${hoursUntilDelivery}.`;
      case "urgent":
        return `URGENT: Your delivery is in ${hoursUntilDelivery} and we still need your signed rental agreement!`;
      case "critical":
        return `CRITICAL: Your delivery is in ${hoursUntilDelivery} and we MUST have your signed agreement immediately or we cannot deliver!`;
    }
  }

  private getUrgencyInstructions(urgencyLevel: UrgencyLevel): string {
    switch (urgencyLevel) {
      case "normal":
        return "Please sign the agreement at your earliest convenience to ensure smooth delivery.";
      case "urgent":
        return "Please sign the agreement immediately. Delivery may be delayed without a signed agreement.";
      case "critical":
        return "You must sign the agreement within the next few hours or your delivery will be cancelled.";
    }
  }

  private getUrgencyColor(urgencyLevel: UrgencyLevel): string {
    switch (urgencyLevel) {
      case "normal":
        return "#007bff";
      case "urgent":
        return "#ffc107";
      case "critical":
        return "#dc3545";
    }
  }

  private getUrgencyBackgroundColor(urgencyLevel: UrgencyLevel): string {
    switch (urgencyLevel) {
      case "normal":
        return "#d1ecf1";
      case "urgent":
        return "#fff3cd";
      case "critical":
        return "#f8d7da";
    }
  }

  private getUrgencyBorderColor(urgencyLevel: UrgencyLevel): string {
    switch (urgencyLevel) {
      case "normal":
        return "#bee5eb";
      case "urgent":
        return "#ffeaa7";
      case "critical":
        return "#f5c6cb";
    }
  }

  private getUrgencyTextColor(urgencyLevel: UrgencyLevel): string {
    switch (urgencyLevel) {
      case "normal":
        return "#0c5460";
      case "urgent":
        return "#856404";
      case "critical":
        return "#721c24";
    }
  }

  private getUrgencyIcon(urgencyLevel: UrgencyLevel): string {
    switch (urgencyLevel) {
      case "normal":
        return "📧";
      case "urgent":
        return "⚠️";
      case "critical":
        return "🚨";
    }
  }
}

// Export singleton instance
export const agreementEmailService = new AgreementEmailService();
