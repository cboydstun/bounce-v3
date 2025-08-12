import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Contact from "@/models/Contact";
import Task from "@/models/Task";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  parseDateCT,
  formatDateCT,
  parseDateStartOfDayUTC,
  parseDateEndOfDayUTC,
  parseDateFromNotes,
  getEventDateDisplay,
} from "@/utils/dateUtils";
import { sendEmail } from "@/utils/emailService";
import twilio from "twilio";
import {
  generateNewOrderEmailAdmin,
  generateNewOrderEmailCustomer,
} from "@/utils/orderEmailTemplates";

/**
 * GET endpoint to list all orders
 * This endpoint is protected and requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const status = url.searchParams.get("status");
    const paymentStatus = url.searchParams.get("paymentStatus");
    const contactId = url.searchParams.get("contactId");
    const orderNumber = url.searchParams.get("orderNumber");
    const customer = url.searchParams.get("customer");
    const taskStatus = url.searchParams.get("taskStatus");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // Build query
    const query: Record<string, unknown> = {};

    // Date range filter using UTC to match database storage
    // Use $or to check eventDate first, then deliveryDate as fallback
    if (startDate && endDate) {
      const parsedStartDate = parseDateStartOfDayUTC(startDate);
      const parsedEndDate = parseDateEndOfDayUTC(endDate);

      query.$or = [
        {
          eventDate: {
            $gte: parsedStartDate,
            $lte: parsedEndDate,
          },
        },
        {
          $and: [
            { eventDate: { $exists: false } },
            {
              deliveryDate: {
                $gte: parsedStartDate,
                $lte: parsedEndDate,
              },
            },
          ],
        },
      ];
    } else if (startDate) {
      const parsedStartDate = parseDateStartOfDayUTC(startDate);

      query.$or = [
        { eventDate: { $gte: parsedStartDate } },
        {
          $and: [
            { eventDate: { $exists: false } },
            { deliveryDate: { $gte: parsedStartDate } },
          ],
        },
      ];
    } else if (endDate) {
      const parsedEndDate = parseDateEndOfDayUTC(endDate);

      query.$or = [
        { eventDate: { $lte: parsedEndDate } },
        {
          $and: [
            { eventDate: { $exists: false } },
            { deliveryDate: { $lte: parsedEndDate } },
          ],
        },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by contact ID
    if (contactId) {
      query.contactId = contactId;
    }

    // Filter by order number
    if (orderNumber) {
      query.orderNumber = orderNumber;
    }

    // Filter by customer (name, email, or phone)
    if (customer) {
      // If we already have a date-based $or query, we need to combine them using $and
      if (query.$or) {
        const dateOrQuery = query.$or;
        delete query.$or;

        query.$and = [
          { $or: dateOrQuery },
          {
            $or: [
              { customerName: { $regex: customer, $options: "i" } },
              { customerEmail: { $regex: customer, $options: "i" } },
              { customerPhone: { $regex: customer, $options: "i" } },
            ],
          },
        ];
      } else {
        query.$or = [
          { customerName: { $regex: customer, $options: "i" } },
          { customerEmail: { $regex: customer, $options: "i" } },
          { customerPhone: { $regex: customer, $options: "i" } },
        ];
      }
    }

    let orders;

    // If filtering by task status, we need to use aggregation
    if (taskStatus) {
      const pipeline: any[] = [
        // Match orders based on existing filters
        { $match: query },
        // Lookup tasks for each order
        {
          $lookup: {
            from: "tasks",
            localField: "_id",
            foreignField: "orderId",
            as: "tasks",
          },
        },
        // Filter orders that have tasks with the specified status
        {
          $match: {
            "tasks.status": taskStatus,
          },
        },
        // Sort by createdAt (newest first)
        { $sort: { createdAt: -1 } },
        // Add pagination
        { $skip: (page - 1) * limit },
        { $limit: limit },
        // Remove tasks field from final result to match original structure
        { $unset: "tasks" },
      ];

      orders = await Order.aggregate(pipeline);

      // Get total count for pagination
      const countPipeline: any[] = [
        { $match: query },
        {
          $lookup: {
            from: "tasks",
            localField: "_id",
            foreignField: "orderId",
            as: "tasks",
          },
        },
        {
          $match: {
            "tasks.status": taskStatus,
          },
        },
        { $count: "total" },
      ];

      const countResult = await Order.aggregate(countPipeline);
      const totalOrders = countResult[0]?.total || 0;
      const totalPages = Math.ceil(totalOrders / limit);

      return NextResponse.json({
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          limit,
        },
      });
    } else {
      // Alternative approach: Fetch all orders and filter in JavaScript
      // This is more reliable than complex MongoDB aggregation

      // Build MongoDB query without date filters - we'll handle dates in JavaScript
      const mongoQuery = { ...query };

      // Remove date-based $or queries but preserve customer search $or queries
      if (mongoQuery.$or && Array.isArray(mongoQuery.$or)) {
        // Check if this is a date-based $or query by looking for eventDate/deliveryDate
        const isDateQuery = (mongoQuery.$or as any[]).some(
          (condition: any) =>
            condition.eventDate ||
            condition.deliveryDate ||
            (condition.$and &&
              Array.isArray(condition.$and) &&
              condition.$and.some(
                (subCondition: any) =>
                  subCondition.eventDate || subCondition.deliveryDate,
              )),
        );

        if (isDateQuery) {
          delete mongoQuery.$or;
        }
      }

      // Remove date-based $and queries but preserve customer search $and queries
      if (mongoQuery.$and && Array.isArray(mongoQuery.$and)) {
        // Check if this contains date queries
        const hasDateQuery = (mongoQuery.$and as any[]).some(
          (condition: any) =>
            condition.$or &&
            Array.isArray(condition.$or) &&
            condition.$or.some(
              (subCondition: any) =>
                subCondition.eventDate ||
                subCondition.deliveryDate ||
                (subCondition.$and &&
                  Array.isArray(subCondition.$and) &&
                  subCondition.$and.some(
                    (deepCondition: any) =>
                      deepCondition.eventDate || deepCondition.deliveryDate,
                  )),
            ),
        );

        if (hasDateQuery) {
          // Keep only non-date $and conditions (like customer search)
          mongoQuery.$and = (mongoQuery.$and as any[]).filter(
            (condition: any) =>
              !(
                condition.$or &&
                Array.isArray(condition.$or) &&
                condition.$or.some(
                  (subCondition: any) =>
                    subCondition.eventDate ||
                    subCondition.deliveryDate ||
                    (subCondition.$and &&
                      Array.isArray(subCondition.$and) &&
                      subCondition.$and.some(
                        (deepCondition: any) =>
                          deepCondition.eventDate || deepCondition.deliveryDate,
                      )),
                )
              ),
          );

          // If no $and conditions remain, remove the $and
          if ((mongoQuery.$and as any[]).length === 0) {
            delete mongoQuery.$and;
          }
        }
      }

      // Fetch all orders that match non-date criteria (including customer search)
      const allOrders = await Order.find(mongoQuery).sort({ createdAt: -1 });

      // Apply date filtering in JavaScript
      let filteredOrders = allOrders;

      if (startDate || endDate) {
        const parsedStartDate = startDate
          ? parseDateStartOfDayUTC(startDate)
          : null;
        const parsedEndDate = endDate ? parseDateEndOfDayUTC(endDate) : null;

        filteredOrders = allOrders.filter((order) => {
          // Try to get a date from the order using multiple sources
          let orderDate: Date | null = null;

          // 1. Try eventDate first
          if (order.eventDate) {
            orderDate = new Date(order.eventDate);
          }
          // 2. Try deliveryDate as fallback
          else if (order.deliveryDate) {
            orderDate = new Date(order.deliveryDate);
          }
          // 3. Try parsing from notes as last resort
          else if (order.notes) {
            orderDate = parseDateFromNotes(order.notes);
          }

          if (!orderDate) {
            return false; // Exclude orders without any date
          }

          // Check if order date falls within the filter range
          const isInRange =
            (!parsedStartDate || orderDate >= parsedStartDate) &&
            (!parsedEndDate || orderDate <= parsedEndDate);

          return isInRange;
        });
      }

      // Apply customer filtering in JavaScript if customer search was removed from MongoDB query
      // This happens when we have both date and customer filters
      if (customer && (startDate || endDate)) {
        filteredOrders = filteredOrders.filter((order) => {
          const customerLower = customer.toLowerCase();

          // Search in customer name
          if (
            order.customerName &&
            order.customerName.toLowerCase().includes(customerLower)
          ) {
            return true;
          }

          // Search in customer email
          if (
            order.customerEmail &&
            order.customerEmail.toLowerCase().includes(customerLower)
          ) {
            return true;
          }

          // Search in customer phone
          if (
            order.customerPhone &&
            order.customerPhone.toLowerCase().includes(customerLower)
          ) {
            return true;
          }

          return false;
        });
      }

      // Apply pagination to filtered results
      const totalOrders = filteredOrders.length;
      const totalPages = Math.ceil(totalOrders / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      orders = filteredOrders.slice(startIndex, endIndex);

      return NextResponse.json({
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          limit,
        },
      });
    }
  } catch (error: unknown) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

/**
 * POST endpoint to create a new order
 * This endpoint is public and does not require authentication
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const orderData = await request.json();

    // Validate required fields
    const requiredFields = ["items", "paymentMethod"];
    const missingFields = requiredFields.filter((field) => !orderData[field]);

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate that either contactId or customerEmail is provided
    if (!orderData.contactId && !orderData.customerEmail) {
      console.error("Missing contactId and customerEmail");
      return NextResponse.json(
        { error: "Either contactId or customer email must be provided" },
        { status: 400 },
      );
    }

    // If contactId is provided, check if an order already exists for this contact
    // and populate customer information and dates from the contact
    if (orderData.contactId) {
      const existingOrder = await Order.findOne({
        contactId: orderData.contactId,
      });
      if (existingOrder) {
        console.error("Order already exists for contact:", orderData.contactId);
        return NextResponse.json(
          { error: "An order already exists for this contact" },
          { status: 400 },
        );
      }

      // Get contact details to populate customer information and dates
      const contact = await Contact.findById(orderData.contactId);
      if (!contact) {
        console.error("Contact not found:", orderData.contactId);
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 },
        );
      }

      // Populate customer information from contact
      if (!orderData.customerName) {
        // Use customerName from contact if available, otherwise derive from email
        orderData.customerName =
          contact.customerName ||
          (contact.email ? contact.email.split("@")[0] : "Customer");
      }

      if (!orderData.customerEmail) {
        orderData.customerEmail = contact.email;
      }

      if (!orderData.customerPhone && contact.phone) {
        orderData.customerPhone = contact.phone;
      }

      if (!orderData.customerAddress && contact.streetAddress) {
        orderData.customerAddress = contact.streetAddress;
      }

      if (!orderData.customerCity && contact.city) {
        orderData.customerCity = contact.city;
      }

      if (!orderData.customerState && contact.state) {
        orderData.customerState = contact.state;
      }

      if (!orderData.customerZipCode && contact.partyZipCode) {
        orderData.customerZipCode = contact.partyZipCode;
      }

      // Set deliveryDate from contact if not provided in orderData
      if (!orderData.deliveryDate && contact.deliveryDate) {
        orderData.deliveryDate = contact.deliveryDate;
      }
      // Set eventDate from contact's partyDate if not provided in orderData
      if (!orderData.eventDate && contact.partyDate) {
        orderData.eventDate = contact.partyDate;
      }
    }

    // Enhanced items validation with detailed error messages
    if (!orderData.items) {
      console.error("Items field is missing from request");
      return NextResponse.json(
        {
          error: "Missing 'items' field in request body",
          received: typeof orderData.items,
          debug: "Items field was not provided in the request",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(orderData.items)) {
      console.error(
        "Items is not an array:",
        typeof orderData.items,
        orderData.items,
      );
      return NextResponse.json(
        {
          error: "Items must be an array",
          received: typeof orderData.items,
          value: orderData.items,
          debug: "Items field exists but is not an array",
        },
        { status: 400 },
      );
    }

    if (orderData.items.length === 0) {
      console.error("Items array is empty");
      return NextResponse.json(
        {
          error: "Order must contain at least one item",
          debug: "Items array exists but is empty",
        },
        { status: 400 },
      );
    }

    // Validate each item structure
    for (let i = 0; i < orderData.items.length; i++) {
      const item = orderData.items[i];
      const requiredItemFields = [
        "type",
        "name",
        "quantity",
        "unitPrice",
        "totalPrice",
      ];

      for (const field of requiredItemFields) {
        if (item[field] === undefined || item[field] === null) {
          console.error(`Item ${i + 1} missing field ${field}:`, item);
          return NextResponse.json(
            {
              error: `Item ${i + 1} is missing required field: ${field}`,
              item: item,
              debug: `Validation failed for item at index ${i}`,
            },
            { status: 400 },
          );
        }
      }
    }

    // Additional duplicate prevention: Check for recent orders with same customer email and similar total
    if (orderData.customerEmail) {
      // Use shorter window for development (30 seconds) vs production (1 minute)
      const isDevelopment = process.env.NODE_ENV === "development";
      const timeWindow = isDevelopment ? 30 * 1000 : 60 * 1000; // 30 seconds vs 1 minute
      const timeAgo = new Date(Date.now() - timeWindow);
      const recentOrder = await Order.findOne({
        customerEmail: orderData.customerEmail,
        totalAmount: orderData.totalAmount,
        createdAt: { $gte: timeAgo },
      });

      if (recentOrder) {
        console.error("Potential duplicate order detected:", {
          customerEmail: orderData.customerEmail,
          totalAmount: orderData.totalAmount,
          recentOrderId: recentOrder._id,
          recentOrderNumber: recentOrder.orderNumber,
        });
        return NextResponse.json(
          {
            error:
              "A similar order was recently created. Please wait a few minutes before placing another order.",
            debug: "Duplicate prevention triggered",
            existingOrderNumber: recentOrder.orderNumber,
          },
          { status: 429 },
        );
      }
    }

    // Simplified availability check to prevent timeouts
    if (
      orderData.items &&
      orderData.items.length > 0 &&
      (orderData.eventDate || orderData.deliveryDate)
    ) {
      const eventDate = orderData.eventDate || orderData.deliveryDate;
      const eventDateStr = new Date(eventDate).toISOString().split("T")[0];

      // Get bounce house items from the order
      const bouncerItems = orderData.items.filter(
        (item: any) => item.type === "bouncer",
      );

      if (bouncerItems.length > 0) {
        try {
          // Quick availability check with timeout
          const availabilityPromise = Promise.all([
            // Check existing orders (simplified query)
            Order.countDocuments({
              $or: [
                {
                  eventDate: {
                    $gte: new Date(eventDateStr + "T00:00:00.000Z"),
                    $lte: new Date(eventDateStr + "T23:59:59.999Z"),
                  },
                },
                {
                  deliveryDate: {
                    $gte: new Date(eventDateStr + "T00:00:00.000Z"),
                    $lte: new Date(eventDateStr + "T23:59:59.999Z"),
                  },
                },
              ],
              "items.name": { $in: bouncerItems.map((item: any) => item.name) },
              status: { $nin: ["Cancelled", "Refunded"] },
            }),
            // Check existing contacts (simplified query)
            Contact.countDocuments({
              bouncer: { $in: bouncerItems.map((item: any) => item.name) },
              partyDate: {
                $gte: new Date(eventDateStr + "T00:00:00.000Z"),
                $lte: new Date(eventDateStr + "T23:59:59.999Z"),
              },
              confirmed: { $in: ["Confirmed", "Converted"] },
              ...(orderData.contactId && { _id: { $ne: orderData.contactId } }),
            }),
          ]);

          // Set a 5-second timeout for availability check
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Availability check timeout")),
              5000,
            ),
          );

          const [existingOrdersCount, existingContactsCount] =
            (await Promise.race([availabilityPromise, timeoutPromise])) as [
              number,
              number,
            ];

          // If there are existing bookings, we have a potential conflict
          if (existingOrdersCount > 0 || existingContactsCount > 0) {
            console.warn("Potential booking conflict detected:", {
              eventDate: eventDateStr,
              items: bouncerItems.map((item: any) => item.name),
              existingOrders: existingOrdersCount,
              existingContacts: existingContactsCount,
            });

            // Log the conflict but allow the order to proceed
            // The admin will need to manually resolve any actual conflicts
            console.log(
              "Order proceeding despite potential conflict - admin review required",
            );
          }
        } catch (availabilityError) {
          console.error(
            "Availability check failed during order creation:",
            availabilityError,
          );
          // Continue with order creation - availability will be verified manually if needed
        }
      }
    }

    // Generate order number if not provided
    if (!orderData.orderNumber) {
      orderData.orderNumber = await Order.generateOrderNumber();
    }

    // Calculate subtotal if not provided
    if (!orderData.subtotal) {
      orderData.subtotal = orderData.items.reduce(
        (sum: number, item: any) => sum + (item.totalPrice || 0),
        0,
      );
    }

    // Set default delivery fee if not provided
    if (!orderData.deliveryFee && orderData.deliveryFee !== 0) {
      orderData.deliveryFee = 0; // FREE DELIVERY
    }

    // Calculate processing fee if not provided (3% of subtotal)
    if (!orderData.processingFee && orderData.processingFee !== 0) {
      orderData.processingFee =
        Math.round(orderData.subtotal * 0.03 * 100) / 100;
    }

    // Calculate total amount if not provided
    if (!orderData.totalAmount) {
      orderData.totalAmount =
        Math.round(
          (orderData.subtotal +
            (orderData.taxAmount || 0) +
            orderData.deliveryFee +
            orderData.processingFee -
            (orderData.discountAmount || 0)) *
            100,
        ) / 100;
    }

    // Calculate balance due if not provided
    if (!orderData.balanceDue) {
      orderData.balanceDue =
        Math.round(
          (orderData.totalAmount - (orderData.depositAmount || 0)) * 100,
        ) / 100;
    }

    // Set default status values if not provided
    if (!orderData.status) {
      orderData.status = "Pending";
    }

    if (!orderData.paymentStatus) {
      orderData.paymentStatus = "Pending";
    }

    // Create order
    const order = await Order.create(orderData);

    // If order was created from a contact, update the contact status to "Converted"
    if (orderData.contactId) {
      await Contact.findByIdAndUpdate(orderData.contactId, {
        confirmed: "Converted",
      });
    }

    // Send notifications asynchronously to prevent blocking the response
    console.log("🔍 Checking sourcePage condition:", {
      sourcePage: orderData.sourcePage,
      condition: orderData.sourcePage !== "admin",
      willSendNotifications: orderData.sourcePage !== "admin",
    });

    if (orderData.sourcePage !== "admin") {
      console.log(
        "� Starting notification process for order:",
        order.orderNumber,
      );
      console.log("📧 Email recipients:", [
        process.env.OTHER_EMAIL,
        process.env.SECOND_EMAIL,
        process.env.ADMIN_EMAIL,
      ]);
      console.log("�📱 SMS recipients:", [
        process.env.USER_PHONE_NUMBER,
        process.env.ADMIN_PHONE_NUMBER,
      ]);

      // Don't await these operations - let them run in background
      setImmediate(async () => {
        console.log(
          "⚡ setImmediate callback executing for order:",
          order.orderNumber,
        );

        // Send email to admin
        try {
          console.log("📧 Attempting to send admin notification email...");
          const emailResult = await sendEmail({
            from: process.env.EMAIL as string,
            to: [
              process.env.OTHER_EMAIL as string,
              process.env.SECOND_EMAIL as string,
              process.env.ADMIN_EMAIL as string,
            ],
            subject: `New Order: ${order.orderNumber}`,
            text: generateNewOrderEmailAdmin(order),
            html: generateNewOrderEmailAdmin(order),
          });
          console.log(
            "✅ Admin notification email sent successfully:",
            emailResult,
          );
        } catch (emailError) {
          console.error("❌ Error sending admin notification email:", {
            error: emailError,
            message:
              emailError instanceof Error
                ? emailError.message
                : String(emailError),
            stack: emailError instanceof Error ? emailError.stack : undefined,
            orderNumber: order.orderNumber,
          });
        }

        // Send confirmation email to customer if email is provided
        if (order.customerEmail) {
          try {
            console.log(
              "📧 Attempting to send customer confirmation email to:",
              order.customerEmail,
            );
            const customerEmailResult = await sendEmail({
              from: process.env.EMAIL as string,
              to: order.customerEmail,
              subject: `Your Order Confirmation: ${order.orderNumber}`,
              text: generateNewOrderEmailCustomer(order),
              html: generateNewOrderEmailCustomer(order),
            });
            console.log(
              "✅ Customer confirmation email sent successfully:",
              customerEmailResult,
            );
          } catch (emailError) {
            console.error("❌ Error sending customer confirmation email:", {
              error: emailError,
              message:
                emailError instanceof Error
                  ? emailError.message
                  : String(emailError),
              stack: emailError instanceof Error ? emailError.stack : undefined,
              customerEmail: order.customerEmail,
              orderNumber: order.orderNumber,
            });
          }
        } else {
          console.log(
            "⚠️ No customer email provided, skipping customer notification",
          );
        }

        // Send SMS notification
        try {
          console.log("📱 Attempting to send SMS notifications...");
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;
          const fromNumber = process.env.TWILIO_PHONE_NUMBER;

          console.log("📱 Twilio credentials check:", {
            hasAccountSid: !!accountSid,
            hasAuthToken: !!authToken,
            hasFromNumber: !!fromNumber,
            accountSidLength: accountSid?.length,
            authTokenLength: authToken?.length,
          });

          if (accountSid && authToken && fromNumber) {
            const client = twilio(accountSid, authToken);

            // Format items for SMS
            const itemsList = order.items
              .map((item: any) => `${item.name} x${item.quantity}`)
              .join(", ");

            // Create SMS body with order details
            const smsBody = `
              New Order: ${order.orderNumber}
              Items: ${itemsList}
              Total: $${order.totalAmount}
              Customer: ${order.customerName || "N/A"}
              Email: ${order.customerEmail || "N/A"}
              Phone: ${order.customerPhone || "N/A"}
              Event Date: ${getEventDateDisplay(order)}
            `.trim();

            console.log(
              "📱 SMS body prepared:",
              smsBody.substring(0, 100) + "...",
            );

            // Create array of recipient phone numbers
            const recipients = [
              process.env.USER_PHONE_NUMBER,
              process.env.ADMIN_PHONE_NUMBER,
            ].filter(Boolean); // Remove any undefined/null values

            console.log("📱 SMS recipients:", recipients);

            // Send SMS to each recipient
            for (const phoneNumber of recipients) {
              try {
                console.log(`📱 Sending SMS to ${phoneNumber}...`);
                const smsResult = await client.messages.create({
                  body: smsBody,
                  from: fromNumber,
                  to: phoneNumber as string,
                });
                console.log(`✅ SMS sent successfully to ${phoneNumber}:`, {
                  sid: smsResult.sid,
                  status: smsResult.status,
                });
              } catch (individualSmsError) {
                console.error(`❌ Error sending SMS to ${phoneNumber}:`, {
                  error: individualSmsError,
                  message:
                    individualSmsError instanceof Error
                      ? individualSmsError.message
                      : String(individualSmsError),
                  stack:
                    individualSmsError instanceof Error
                      ? individualSmsError.stack
                      : undefined,
                  phoneNumber,
                  orderNumber: order.orderNumber,
                });
              }
            }
          } else {
            console.error("❌ Missing Twilio credentials:", {
              hasAccountSid: !!accountSid,
              hasAuthToken: !!authToken,
              hasFromNumber: !!fromNumber,
            });
          }
        } catch (smsError) {
          console.error("❌ Error in SMS notification setup:", {
            error: smsError,
            message:
              smsError instanceof Error ? smsError.message : String(smsError),
            stack: smsError instanceof Error ? smsError.stack : undefined,
            orderNumber: order.orderNumber,
          });
        }
      });
    }

    // Return the order immediately without waiting for notifications
    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating order:", error);

    // Ensure we always return JSON, never HTML
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Log the full error for debugging
    console.error("Full error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: `Failed to create order: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        debug:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
