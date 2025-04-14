import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import mongoose from "mongoose";

/**
 * POST endpoint to initiate a PayPal payment for an order
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

    // Find the order
    const order = await Order.findById(resolvedParams.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get payment data from request
    const paymentData = await request.json();
    const { amount } = paymentData;

    // Validate payment amount
    if (!amount) {
      return NextResponse.json(
        { error: "Payment amount is required" },
        { status: 400 },
      );
    }

    // Validate payment amount matches order amount or deposit amount
    const isFullPayment = Math.abs(amount - order.totalAmount) < 0.01;
    const isDepositPayment = Math.abs(amount - order.depositAmount) < 0.01;

    if (!isFullPayment && !isDepositPayment) {
      return NextResponse.json(
        {
          error:
            "Payment amount must match either the total amount or deposit amount",
        },
        { status: 400 },
      );
    }

    // In a real implementation, this would call the PayPal API to create a payment
    // For now, we'll simulate a successful PayPal payment creation
    const paypalOrderId = `PAY-${Date.now()}-${Math.floor(
      Math.random() * 1000000,
    )}`;

    // Return the PayPal order ID
    return NextResponse.json({
      paypalOrderId,
      amount,
      currency: "USD",
      orderNumber: order.orderNumber,
    });
  } catch (error: unknown) {
    console.error("Error initiating PayPal payment:", error);
    return NextResponse.json(
      { error: "Failed to initiate PayPal payment" },
      { status: 500 },
    );
  }
}

/**
 * PATCH endpoint to update an order with PayPal transaction details
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

    // Find the order
    const order = await Order.findById(resolvedParams.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get transaction data from request
    const transactionData = await request.json();
    const {
      transactionId,
      payerId,
      payerEmail,
      amount,
      currency,
      status,
    } = transactionData;

    // Validate required fields
    if (!transactionId || !amount || !status) {
      return NextResponse.json(
        { error: "Transaction ID, amount, and status are required" },
        { status: 400 },
      );
    }

    // Create a new PayPal transaction
    const newTransaction = {
      transactionId,
      payerId,
      payerEmail,
      amount,
      currency: currency || "USD",
      status,
      createdAt: new Date(),
    };

    // Add the transaction to the order's paypalTransactions array
    if (!order.paypalTransactions) {
      order.paypalTransactions = [];
    }
    order.paypalTransactions.push(newTransaction);

    // Update payment status based on transaction status
    if (status === "COMPLETED") {
      // Check if this is a full payment (matches total amount)
      const isFullPayment = Math.abs(amount - order.totalAmount) < 0.01;
      
      if (isFullPayment) {
        // For full payment, set status to Paid and balance to 0
        order.paymentStatus = "Paid";
        order.status = "Paid";
        order.balanceDue = 0; // Explicitly set to 0
      } else {
        // For partial payments, calculate the total paid from all transactions
        const totalPaid = order.paypalTransactions.reduce(
          (sum, transaction) =>
            transaction.status === "COMPLETED" ? sum + transaction.amount : sum,
          0,
        );
        
        // Set balance due based on total paid
        order.balanceDue = Math.max(0, order.totalAmount - totalPaid);
        
        // If balance is now 0 or very close to 0, mark as fully paid
        if (order.balanceDue < 0.01) {
          order.paymentStatus = "Paid";
          order.status = "Paid";
          order.balanceDue = 0; // Explicitly set to 0 to avoid floating point issues
        } 
        // If the payment is for the deposit amount, mark as Authorized
        else if (Math.abs(amount - order.depositAmount) < 0.01) {
          order.paymentStatus = "Authorized";
        }
        // For other partial payments
        else {
          order.paymentStatus = "Authorized";
        }
      }
    } else if (status === "FAILED") {
      // Don't change payment status for failed transactions
    }

    // Save the updated order
    await order.save();

    return NextResponse.json({
      message: "Payment transaction recorded successfully",
      order,
    });
  } catch (error: unknown) {
    console.error("Error recording PayPal transaction:", error);
    return NextResponse.json(
      { error: "Failed to record PayPal transaction" },
      { status: 500 },
    );
  }
}
