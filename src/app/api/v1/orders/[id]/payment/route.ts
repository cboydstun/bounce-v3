import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { sendEmail } from "@/utils/emailService";
import { generatePaymentConfirmationEmail } from "@/utils/orderEmailTemplates";

/**
 * POST endpoint to initiate a payment for an order
 * This endpoint is public and does not require authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const order = await Order.findById(resolvedParams.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { amount } = await request.json();

    // Validate amount
    if (!amount) {
      return NextResponse.json(
        { error: "Payment amount is required" },
        { status: 400 },
      );
    }

    // Validate that amount matches either total amount or deposit amount
    const totalAmount = parseFloat(order.totalAmount.toFixed(2));
    const depositAmount = parseFloat(order.depositAmount.toFixed(2));

    if (
      parseFloat(amount.toFixed(2)) !== totalAmount &&
      parseFloat(amount.toFixed(2)) !== depositAmount
    ) {
      return NextResponse.json(
        {
          error: `Payment amount must match either the total amount (${totalAmount}) or deposit amount (${depositAmount})`,
        },
        { status: 400 },
      );
    }

    // In a real implementation, you would create a PayPal order here
    // For this implementation, we'll simulate it by generating a random order ID
    const paypalOrderId = `PAY-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    return NextResponse.json({
      paypalOrderId,
      amount,
      currency: "USD",
      orderNumber: order.orderNumber,
    });
  } catch (error: unknown) {
    console.error("Error initiating payment:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 },
    );
  }
}

/**
 * PATCH endpoint to record a payment transaction for an order
 * This endpoint is public and does not require authentication
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const order = await Order.findById(resolvedParams.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const paymentData = await request.json();

    // Validate required fields
    const requiredFields = ["transactionId", "amount", "status"];
    const missingFields = requiredFields.filter((field) => !paymentData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Add the transaction to the order
    const transaction = {
      transactionId: paymentData.transactionId,
      payerId: paymentData.payerId,
      payerEmail: paymentData.payerEmail,
      amount: paymentData.amount,
      currency: paymentData.currency || "USD",
      status: paymentData.status,
      createdAt: new Date(),
    };

    // Add transaction to paypalTransactions array
    if (!order.paypalTransactions) {
      order.paypalTransactions = [];
    }
    order.paypalTransactions.push(transaction);

    // Update payment status based on transaction
    const totalAmount = parseFloat(order.totalAmount.toFixed(2));
    const paidAmount = order.paypalTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    // If full amount is paid
    if (parseFloat(paidAmount.toFixed(2)) >= totalAmount) {
      order.paymentStatus = "Paid";
      order.status = "Paid";
      order.balanceDue = 0;
    } else {
      // Partial payment (deposit)
      order.paymentStatus = "Authorized";
      order.balanceDue = totalAmount - paidAmount;
    }

    // Save the updated order
    await order.save();

    // Get the latest transaction (the one just added)
    const latestTransaction =
      order.paypalTransactions[order.paypalTransactions.length - 1];

    // Send payment confirmation to customer if email is provided
    if (order.customerEmail) {
      try {
        await sendEmail({
          from: process.env.EMAIL as string,
          to: order.customerEmail,
          subject: `Payment Confirmation: ${order.orderNumber}`,
          text: generatePaymentConfirmationEmail(order, latestTransaction),
          html: generatePaymentConfirmationEmail(order, latestTransaction),
        });
      } catch (emailError) {
        console.error("Error sending payment confirmation email:", emailError);
        // Continue execution even if email fails
      }
    }

    // Send payment notification to admin
    try {
      await sendEmail({
        from: process.env.EMAIL as string,
        to: process.env.EMAIL as string,
        subject: `Payment Received: ${order.orderNumber} - $${latestTransaction.amount.toFixed(2)}`,
        text: generatePaymentConfirmationEmail(order, latestTransaction),
        html: generatePaymentConfirmationEmail(order, latestTransaction),
      });
    } catch (emailError) {
      console.error(
        "Error sending admin payment notification email:",
        emailError,
      );
      // Continue execution even if email fails
    }

    return NextResponse.json({
      message: "Payment transaction recorded successfully",
      order,
    });
  } catch (error: unknown) {
    console.error("Error recording payment transaction:", error);
    return NextResponse.json(
      { error: "Failed to record payment transaction" },
      { status: 500 },
    );
  }
}
