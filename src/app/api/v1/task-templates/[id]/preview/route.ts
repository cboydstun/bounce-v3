import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import TaskTemplate from "@/models/TaskTemplate";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TemplateEngine } from "@/utils/templateEngine";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to preview task templates" },
        { status: 401 },
      );
    }

    // Validate that we have a proper user ID
    if (!session.user.id) {
      return NextResponse.json(
        { error: "User session is invalid - missing user ID" },
        { status: 401 },
      );
    }

    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { error: "User session is invalid - invalid user ID format" },
        { status: 401 },
      );
    }

    await dbConnect();

    const { id } = params;

    // Validate template ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid template ID format" },
        { status: 400 },
      );
    }

    // Find template
    const template = await TaskTemplate.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Get request body
    const body = await request.json();
    const { orderId, useSampleData } = body;

    let order;

    if (useSampleData || !orderId) {
      // Use sample order data for preview
      order = {
        _id: "sample-order-id",
        orderNumber: "ORD-2025-001",
        customerName: "John Smith",
        customerEmail: "john.smith@example.com",
        customerPhone: "(555) 123-4567",
        customerAddress: "123 Main Street",
        customerCity: "Austin",
        customerState: "TX",
        customerZipCode: "78701",
        eventDate: new Date("2025-02-15T14:00:00.000Z"),
        deliveryDate: new Date("2025-02-14T09:00:00.000Z"),
        totalAmount: 299.99,
        notes: "Setup in backyard. Please call upon arrival.",
        items: [
          {
            _id: "item1",
            name: "Large Bounce House",
            quantity: 1,
            price: 199.99,
          },
          {
            _id: "item2",
            name: "Water Slide",
            quantity: 1,
            price: 100.0,
          },
        ],
        status: "Confirmed",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Validate order ID
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return NextResponse.json(
          { error: "Invalid order ID format" },
          { status: 400 },
        );
      }

      // Find real order
      const realOrder = await Order.findById(orderId);
      if (!realOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Convert Mongoose document to plain object with proper typing
      const orderObj = realOrder.toObject();
      order = {
        ...orderObj,
        _id: (orderObj._id as mongoose.Types.ObjectId).toString(),
      };
    }

    // Generate preview using template engine
    const preview = TemplateEngine.generateTaskPreview(
      template.titlePattern,
      template.descriptionPattern,
      template.paymentRules,
      template.schedulingRules,
      order as any, // Type assertion since we're handling both sample and real data
      template.name,
    );

    // Add template information to response
    const response = {
      template: {
        _id: template._id,
        name: template.name,
        description: template.description,
        titlePattern: template.titlePattern,
        descriptionPattern: template.descriptionPattern,
        paymentRules: template.paymentRules,
        schedulingRules: template.schedulingRules,
      },
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        eventDate: order.eventDate,
        deliveryDate: order.deliveryDate,
      },
      preview,
      availableVariables: TemplateEngine.getAvailableVariables(),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error generating template preview:", error);
    return NextResponse.json(
      { error: "Failed to generate template preview" },
      { status: 500 },
    );
  }
}
