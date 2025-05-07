import { IOrderDocument } from "@/types/order";
import { formatDateCT } from "@/utils/dateUtils";

/**
 * Generate email content for admin notification of a new order
 * @param order The order document
 * @returns Formatted email text
 */
export function generateNewOrderEmailAdmin(order: IOrderDocument): string {
  return `
    New Order Received: ${order.orderNumber}
    
    Customer: ${order.customerName || "N/A"}
    Email: ${order.customerEmail || "N/A"}
    Phone: ${order.customerPhone || "N/A"}
    
    Order Details:
    ${order.items.map((item) => `- ${item.quantity}x ${item.name}: $${item.totalPrice.toFixed(2)}`).join("\n")}
    
    Subtotal: $${order.subtotal.toFixed(2)}
    Delivery Fee: $${order.deliveryFee.toFixed(2)}
    Processing Fee: $${order.processingFee.toFixed(2)}
    Tax: $${order.taxAmount.toFixed(2)}
    Discount: $${order.discountAmount.toFixed(2)}
    
    Total Amount: $${order.totalAmount.toFixed(2)}
    Payment Method: ${order.paymentMethod}
    Payment Status: ${order.paymentStatus}
    
    Notes: ${order.notes || "None"}
  `;
}

/**
 * Generate email content for customer confirmation of a new order
 * @param order The order document
 * @returns Formatted email text with improved styling
 */
export function generateNewOrderEmailCustomer(order: IOrderDocument): string {
  const itemsList = order.items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.name}: $${item.totalPrice.toFixed(2)}`,
    )
    .join("\n");

  return `
  Dear Valued Customer,
  
  🎉 Thank you for your order with SATX Bounce LLC! 🎉
  
  We're thrilled to confirm your booking and can't wait to help make your event special.
  
  ━━━━━━━━━━ ORDER SUMMARY ━━━━━━━━━━
  
  📋 Order #: ${order.orderNumber}
  📅 Date: ${formatDateCT(order.createdAt)}
  
  ✨ YOUR ITEMS:
  ${itemsList}
  
  ━━━━━━━━━━ ORDER TOTALS ━━━━━━━━━━
  
  Subtotal: $${order.subtotal.toFixed(2)}
  Delivery Fee: $${order.deliveryFee.toFixed(2)}
  Processing Fee: $${order.processingFee.toFixed(2)}
  Tax: $${order.taxAmount.toFixed(2)}
  Discount: -$${order.discountAmount.toFixed(2)}
  ━━━━━━━━━━━━━━━━━━━━━━━
  TOTAL: $${order.totalAmount.toFixed(2)}
  
  One of our team members will be in touch shortly to confirm all the details for your event.
  
  If you have any questions about your order, please contact us at:
  📞 (512) 210-0194
  ✉️ satxbounce@gmail.com
  
  Thank you for choosing SATX Bounce House Rentals for your celebration!
  
  Bounce-tastically yours,
  SATX Bounce
  
  ━━━━━━━━━━━━━━━━━━━━━━━
  SATX Bounce LLC
  Making San Antonio celebrations more fun since 2015!
  www.satxbounce.com
    `;
}

/**
 * Generate email content for order status updates
 * @param order The order document
 * @returns Formatted email text with improved styling
 */
export function generateOrderStatusUpdateEmail(order: IOrderDocument): string {
  // Create status-specific emojis, colors and messages
  let statusEmoji = "";
  let statusMessage = "";
  let statusHeader = "";

  switch (order.status) {
    case "Confirmed":
      statusEmoji = "✅";
      statusHeader = "Great News! Your Order is Confirmed";
      statusMessage =
        "Your order has been confirmed and is now on our schedule! We're looking forward to delivering your bounce house rental and helping make your event a success.";
      break;
    case "Cancelled":
      statusEmoji = "❌";
      statusHeader = "Order Cancellation Notice";
      statusMessage =
        "Your order has been cancelled as requested. If this was not your intention or if you have any questions about this cancellation, please contact our customer service team immediately.";
      break;
    case "Paid":
      statusEmoji = "💰";
      statusHeader = "Payment Received - Thank You!";
      statusMessage =
        "Fantastic! Your payment has been received in full. Your booking is confirmed and you're all set for your upcoming event.";
      break;
    default:
      statusEmoji = "ℹ️";
      statusHeader = `Status Update: ${order.status}`;
      statusMessage = `Your order status has been updated to: ${order.status}. See below for more details.`;
  }

  const itemsList = order.items.map((item) => `• ${item.name}`).join("\n");

  return `
  Dear Valued Customer,
  
  ${statusEmoji} ${statusHeader} ${statusEmoji}
  
  ${statusMessage}
  
  ━━━━━━━━━━ ORDER INFORMATION ━━━━━━━━━━
  
  📋 Order #: ${order.orderNumber}

  ✨ YOUR ITEMS:
  ${itemsList}
  
  ━━━━━━━━━━ ORDER STATUS ━━━━━━━━━━
  
  Current Status: ${statusEmoji} ${order.status}
  Total Amount: $${order.totalAmount.toFixed(2)}
  ${order.balanceDue > 0 ? `Balance Due: $${order.balanceDue.toFixed(2)}` : ""}
  
  Thank you for choosing SATX Bounce House Rentals for your celebration!
  
  If you have any questions about your order, please contact us at:
  📞 (512) 210-0194
  ✉️ satxbounce@gmail.com
  
  Thank you for choosing SATX Bounce House Rentals for your celebration!
  
  Bounce-tastically yours,
  SATX Bounce
  
  ━━━━━━━━━━━━━━━━━━━━━━━
  SATX Bounce LLC
  Making San Antonio celebrations more fun since 2015!
  www.satxbounce.com
    `;
}

/**
 * Generate email content for payment confirmation
 * @param order The order document
 * @param transaction The payment transaction details
 * @returns Formatted email text with improved styling
 */
export function generatePaymentConfirmationEmail(
  order: IOrderDocument,
  transaction: any,
): string {
  return `
  Dear Valued Customer,
  
  ✅ Payment Confirmation: Order #${order.orderNumber}
  
  Great news! We've successfully received your payment of $${transaction.amount.toFixed(2)}.
  
  ━━━━━━━━━━ PAYMENT DETAILS ━━━━━━━━━━
  
  💳 Transaction ID: ${transaction.transactionId}
  💰 Amount Paid: $${transaction.amount.toFixed(2)}
  📅 Payment Date: ${formatDateCT(transaction.createdAt)}
  
  ━━━━━━━━━━ ORDER SUMMARY ━━━━━━━━━━
  
  🧾 Order Total: $${order.totalAmount.toFixed(2)}
  ${
    order.balanceDue > 0
      ? `⚠️ Balance Due: $${order.balanceDue.toFixed(2)}`
      : `✨ Your order is fully paid! ✨`
  }
  
  Your payment helps us prepare for your upcoming event. 

  If you have any questions about your order, please contact us at:
  📞 (512) 210-0194
  ✉️ satxbounce@gmail.com
  
  Thank you for choosing SATX Bounce House Rentals for your celebration!
  
  Bounce-tastically yours,
  SATX Bounce
  
  ━━━━━━━━━━━━━━━━━━━━━━━
  SATX Bounce LLC
  Making San Antonio celebrations more fun since 2015!
  www.satxbounce.com
    `;
}
