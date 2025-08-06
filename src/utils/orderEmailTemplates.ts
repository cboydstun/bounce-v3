import { IOrderDocument } from "@/types/order";
import { formatDateCT, getEventDateDisplay } from "@/utils/dateUtils";

/**
 * Generate email content for admin notification of a new order
 * @param order The order document
 * @returns Formatted email text
 */
export function generateNewOrderEmailAdmin(order: IOrderDocument): string {
  // Create a simple HTML version for admin emails
  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 4px 0;">- ${item.quantity}x ${item.name}: $${item.totalPrice.toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #4a5568; background-color: #f7fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(255, 255, 255, 0.9); border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 2px solid rgba(66, 153, 225, 0.2); max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="padding: 30px;">
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #805ad5;">New Order Received: ${order.orderNumber}</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Customer Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">👤 CUSTOMER INFORMATION</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 4px 0;"><strong>Customer:</strong> ${order.customerName || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;"><strong>Email:</strong> ${order.customerEmail || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;"><strong>Phone:</strong> ${order.customerPhone || "N/A"}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Delivery Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #e53e3e, #d69e2e); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">🚚 DELIVERY DETAILS</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(229, 62, 62, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(229, 62, 62, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 16px; font-weight: 600; color: #e53e3e;"><strong>📍 DELIVERY ADDRESS:</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">${order.customerAddress || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">${order.customerCity || "N/A"}, ${order.customerState || "N/A"} ${order.customerZipCode || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #e53e3e;"><strong>⏰ DELIVERY SCHEDULE:</strong></td>
                      </tr>
                      ${order.deliveryDate ? `<tr><td style="padding: 4px 0;"><strong>Delivery Date:</strong> ${formatDateCT(order.deliveryDate)}</td></tr>` : ""}
                      ${order.deliveryTimePreference ? `<tr><td style="padding: 4px 0;"><strong>Delivery Time Preference:</strong> ${order.deliveryTimePreference === "specific" ? "Specific Time Required" : "Flexible Timing"}</td></tr>` : ""}
                      ${order.pickupTimePreference ? `<tr><td style="padding: 4px 0;"><strong>Pickup Time Preference:</strong> ${order.pickupTimePreference === "specific" ? "Specific Time Required" : "Flexible Timing"}</td></tr>` : ""}
                      ${order.specificTimeCharge > 0 ? `<tr><td style="padding: 4px 0;"><strong>Specific Time Charge:</strong> $${order.specificTimeCharge.toFixed(2)}</td></tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Order Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">📋 ORDER DETAILS</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 16px; font-weight: 600; color: #805ad5;"><strong>🎉 Event Date:</strong> ${getEventDateDisplay(order)}</td>
                      </tr>
                      ${itemsList}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Order Totals -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">💰 ORDER TOTALS</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 4px 0;"><strong>Items Subtotal:</strong> $${order.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;"><strong>Delivery Fee:</strong> FREE</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;"><strong>Tax (8.25%):</strong> $${order.taxAmount.toFixed(2)}</td>
                      </tr>
                      ${
                        order.paymentMethod !== "cash"
                          ? `<tr>
                        <td style="padding: 4px 0;"><strong>Processing Fee (3%):</strong> $${order.processingFee.toFixed(2)}</td>
                      </tr>`
                          : ""
                      }
                      ${
                        order.discountAmount > 0
                          ? `<tr>
                        <td style="padding: 4px 0;"><strong>Discount:</strong> -$${order.discountAmount.toFixed(2)}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid rgba(66, 153, 225, 0.2); font-size: 16px; font-weight: 600;">
                          <strong>TOTAL:</strong> $${order.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;"><strong>Payment Status:</strong> ${order.paymentStatus}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Notes -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">📝 NOTES</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <p style="margin: 0;">${order.notes || "None"}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate email content for customer confirmation of a new order
 * @param order The order document
 * @returns Formatted HTML email with styling matching the contact form
 */
export function generateNewOrderEmailCustomer(order: IOrderDocument): string {
  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 0;">• ${item.quantity}x ${item.name}: $${item.totalPrice.toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #4a5568; background-color: #f7fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(255, 255, 255, 0.9); border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 2px solid rgba(66, 153, 225, 0.2); max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="padding: 30px;">
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #805ad5;">SATX Bounce LLC</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Greeting -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 18px; font-weight: 500;">Dear Valued Customer,</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 20px; font-weight: 600;">🎉 Thank you for your order with SATX Bounce LLC! 🎉</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px;">We're thrilled to confirm your booking and can't wait to help make your event special.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Order Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">📋 ORDER SUMMARY</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 8px 0;"><strong>Order #:</strong> ${order.orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>📅 Order Date:</strong> ${formatDateCT(order.createdAt)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #805ad5;"><strong>🎉 Event Date:</strong> ${getEventDateDisplay(order)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Delivery Details for Customer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #e53e3e, #d69e2e); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">🚚 DELIVERY INFORMATION</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(229, 62, 62, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(229, 62, 62, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 16px; font-weight: 600; color: #e53e3e;"><strong>📍 DELIVERY ADDRESS:</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">${order.customerAddress || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">${order.customerCity || "N/A"}, ${order.customerState || "N/A"} ${order.customerZipCode || "N/A"}</td>
                      </tr>
                      ${order.deliveryDate ? `<tr><td style="padding: 8px 0;"><strong>📅 Delivery Date:</strong> ${formatDateCT(order.deliveryDate)}</td></tr>` : ""}
                      ${order.deliveryTimePreference ? `<tr><td style="padding: 4px 0;"><strong>⏰ Delivery Time:</strong> ${order.deliveryTimePreference === "specific" ? "Specific Time Required" : "Flexible Timing"}</td></tr>` : ""}
                      ${order.pickupTimePreference ? `<tr><td style="padding: 4px 0;"><strong>🔄 Pickup Time:</strong> ${order.pickupTimePreference === "specific" ? "Specific Time Required" : "Flexible Timing"}</td></tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Items -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">✨ YOUR ITEMS</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${itemsList}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Order Totals -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">💰 ORDER TOTALS</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 8px 0;"><strong>Items Subtotal:</strong> $${order.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Delivery Fee:</strong> FREE</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Tax (8.25%):</strong> $${order.taxAmount.toFixed(2)}</td>
                      </tr>
                      ${
                        order.paymentMethod !== "cash"
                          ? `<tr>
                        <td style="padding: 8px 0;"><strong>Processing Fee (3%):</strong> $${order.processingFee.toFixed(2)}</td>
                      </tr>`
                          : ""
                      }
                      ${
                        order.discountAmount > 0
                          ? `<tr>
                        <td style="padding: 8px 0;"><strong>Discount:</strong> -$${order.discountAmount.toFixed(2)}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 12px 0; border-top: 1px solid rgba(66, 153, 225, 0.2); font-size: 18px; font-weight: 600;">
                          <strong>TOTAL:</strong> $${order.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Message -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px;">One of our team members will be in touch shortly to confirm all the details for your event.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px;">If you have any questions about your order, please contact us at:</p>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">📞 <a href="tel:5122100194" style="color: #805ad5; text-decoration: none; font-weight: 600;">(512) 210-0194</a></p>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">✉️ <a href="mailto:satxbounce@gmail.com" style="color: #805ad5; text-decoration: none; font-weight: 600;">satxbounce@gmail.com</a></p>
                  </td>
                </tr>
              </table>
              
              <!-- Thank You -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <p style="margin: 0; font-size: 16px;">Thank you for choosing SATX Bounce House Rentals for your celebration!</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px; font-style: italic;">Bounce-tastically yours,<br>SATX Bounce</p>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px 0; text-align: center; border-top: 1px solid rgba(66, 153, 225, 0.2);">
                    <p style="margin: 0; font-size: 14px; color: #718096;">SATX Bounce LLC</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #718096;">Making San Antonio celebrations more fun since 2015!</p>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">
                      <a href="https://www.satxbounce.com" style="color: #805ad5; text-decoration: none; font-weight: 600;">www.satxbounce.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate email content for order status updates
 * @param order The order document
 * @returns Formatted HTML email with styling matching the contact form
 */
export function generateOrderStatusUpdateEmail(order: IOrderDocument): string {
  // Create status-specific emojis, colors and messages
  let statusEmoji = "";
  let statusMessage = "";
  let statusHeader = "";
  let statusColor = "";

  switch (order.status) {
    case "Confirmed":
      statusEmoji = "✅";
      statusHeader = "Great News! Your Order is Confirmed";
      statusMessage =
        "Your order has been confirmed and is now on our schedule! We're looking forward to delivering your bounce house rental and helping make your event a success.";
      statusColor = "#68d391"; // green-400
      break;
    case "Cancelled":
      statusEmoji = "❌";
      statusHeader = "Order Cancellation Notice";
      statusMessage =
        "Your order has been cancelled as requested. If this was not your intention or if you have any questions about this cancellation, please contact our customer service team immediately.";
      statusColor = "#fc8181"; // red-400
      break;
    case "Paid":
      statusEmoji = "💰";
      statusHeader = "Payment Received - Thank You!";
      statusMessage =
        "Fantastic! Your payment has been received in full. Your booking is confirmed and you're all set for your upcoming event.";
      statusColor = "#f6ad55"; // orange-400
      break;
    default:
      statusEmoji = "ℹ️";
      statusHeader = `Status Update: ${order.status}`;
      statusMessage = `Your order status has been updated to: ${order.status}. See below for more details.`;
      statusColor = "#4299e1"; // blue-500
  }

  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 0;">• ${item.name}</td>
        </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #4a5568; background-color: #f7fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(255, 255, 255, 0.9); border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 2px solid rgba(66, 153, 225, 0.2); max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="padding: 30px;">
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #805ad5;">SATX Bounce LLC</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Greeting -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 18px; font-weight: 500;">Dear Valued Customer,</p>
                  </td>
                </tr>
              </table>
              
              <!-- Status Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" style="background-color: ${statusColor}; padding: 15px; border-radius: 8px; color: white;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${statusEmoji} ${statusHeader} ${statusEmoji}</h2>
                  </td>
                </tr>
              </table>
              
              <!-- Status Message -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px;">${statusMessage}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Order Information -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">📋 ORDER INFORMATION</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 8px 0;"><strong>Order #:</strong> ${order.orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #805ad5;"><strong>🎉 Event Date:</strong> ${getEventDateDisplay(order)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Items -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">✨ YOUR ITEMS</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${itemsList}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Order Status -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">📊 ORDER STATUS</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 8px 0;"><strong>Current Status:</strong> ${statusEmoji} ${order.status}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Items Subtotal:</strong> $${order.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Delivery Fee:</strong> FREE</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Tax (8.25%):</strong> $${order.taxAmount.toFixed(2)}</td>
                      </tr>
                      ${
                        order.paymentMethod !== "cash"
                          ? `<tr>
                        <td style="padding: 8px 0;"><strong>Processing Fee (3%):</strong> $${order.processingFee.toFixed(2)}</td>
                      </tr>`
                          : ""
                      }
                      ${
                        order.discountAmount > 0
                          ? `<tr>
                        <td style="padding: 8px 0;"><strong>Discount:</strong> -$${order.discountAmount.toFixed(2)}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 8px 0;"><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</td>
                      </tr>
                      ${order.balanceDue > 0 ? `<tr><td style="padding: 8px 0;"><strong>Balance Due:</strong> $${order.balanceDue.toFixed(2)}</td></tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Contact Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px;">If you have any questions about your order, please contact us at:</p>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">📞 <a href="tel:5122100194" style="color: #805ad5; text-decoration: none; font-weight: 600;">(512) 210-0194</a></p>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">✉️ <a href="mailto:satxbounce@gmail.com" style="color: #805ad5; text-decoration: none; font-weight: 600;">satxbounce@gmail.com</a></p>
                  </td>
                </tr>
              </table>
              
              <!-- Thank You -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <p style="margin: 0; font-size: 16px;">Thank you for choosing SATX Bounce House Rentals for your celebration!</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px; font-style: italic;">Bounce-tastically yours,<br>SATX Bounce</p>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px 0; text-align: center; border-top: 1px solid rgba(66, 153, 225, 0.2);">
                    <p style="margin: 0; font-size: 14px; color: #718096;">SATX Bounce LLC</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #718096;">Making San Antonio celebrations more fun since 2015!</p>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">
                      <a href="https://www.satxbounce.com" style="color: #805ad5; text-decoration: none; font-weight: 600;">www.satxbounce.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate email content for payment confirmation
 * @param order The order document
 * @param transaction The payment transaction details
 * @returns Formatted HTML email with styling matching the contact form
 */
export function generatePaymentConfirmationEmail(
  order: IOrderDocument,
  transaction: any,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #4a5568; background-color: #f7fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(255, 255, 255, 0.9); border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 2px solid rgba(66, 153, 225, 0.2); max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="padding: 30px;">
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #805ad5;">SATX Bounce LLC</h1>
                  </td>
                </tr>
              </table>
              
              <!-- Greeting -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 18px; font-weight: 500;">Dear Valued Customer,</p>
                  </td>
                </tr>
              </table>
              
              <!-- Payment Confirmation Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" style="background: linear-gradient(to right, #3182ce, #805ad5); padding: 15px; border-radius: 8px; color: white;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 600;">✅ Payment Confirmation: Order #${order.orderNumber}</h2>
                  </td>
                </tr>
              </table>
              
              <!-- Payment Message -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px;">Great news! We've successfully received your payment of $${transaction.amount.toFixed(2)}.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Payment Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">💳 PAYMENT DETAILS</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 8px 0;"><strong>Transaction ID:</strong> ${transaction.transactionId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Amount Paid:</strong> $${transaction.amount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Payment Date:</strong> ${formatDateCT(transaction.createdAt)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Order Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background: linear-gradient(to right, #3182ce, #805ad5); color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">📋 ORDER SUMMARY</h2>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(66, 153, 225, 0.05); padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid rgba(66, 153, 225, 0.2); border-top: none;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 8px 0;"><strong>Order #:</strong> ${order.orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>📅 Order Date:</strong> ${formatDateCT(order.createdAt)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #805ad5;"><strong>🎉 Event Date:</strong> ${getEventDateDisplay(order)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Items Subtotal:</strong> $${order.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Delivery Fee:</strong> $${order.deliveryFee.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Tax (8.25%):</strong> $${order.taxAmount.toFixed(2)}</td>
                      </tr>
                      ${
                        order.paymentMethod !== "cash"
                          ? `<tr>
                        <td style="padding: 8px 0;"><strong>Processing Fee (3%):</strong> $${order.processingFee.toFixed(2)}</td>
                      </tr>`
                          : ""
                      }
                      ${
                        order.discountAmount > 0
                          ? `<tr>
                        <td style="padding: 8px 0;"><strong>Discount:</strong> -$${order.discountAmount.toFixed(2)}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 8px 0;"><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</td>
                      </tr>
                      ${order.balanceDue > 0 ? `<tr><td style="padding: 8px 0;"><strong>Balance Due:</strong> $${order.balanceDue.toFixed(2)}</td></tr>` : ""}
                      <tr>
                        <td style="padding: 8px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Payment Status:</strong> ${order.paymentStatus}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Notes:</strong> ${order.notes || "None"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Customer:</strong> ${order.customerName || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;"><strong>Email:</strong> ${order.customerEmail || "N/A"}</td>
                      </tr>
              <tr>
                        <td style="padding: 8px 0;"><strong>Phone:</strong> ${order.customerPhone || "N/A"}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Contact Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px;">If you have any questions about your payment or order, please contact us at:</p>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">📞 <a href="tel:5122100194" style="color: #805ad5; text-decoration: none; font-weight: 600;">(512) 210-0194</a></p>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">✉️ <a href="mailto:satxbounce@gmail.com" style="color: #805ad5; text-decoration: none; font-weight: 600;">satxbounce@gmail.com</a></p>
                  </td>
                </tr>
              </table>
              
              <!-- Thank You -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <p style="margin: 0; font-size: 16px;">Thank you for your business and for choosing SATX Bounce House Rentals!</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px; font-style: italic;">Bounce-tastically yours,<br>SATX Bounce</p>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px 0; text-align: center; border-top: 1px solid rgba(66, 153, 225, 0.2);">
                    <p style="margin: 0; font-size: 14px; color: #718096;">SATX Bounce LLC</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #718096;">Making San Antonio celebrations more fun since 2015!</p>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">
                      <a href="https://www.satxbounce.com" style="color: #805ad5; text-decoration: none; font-weight: 600;">www.satxbounce.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
