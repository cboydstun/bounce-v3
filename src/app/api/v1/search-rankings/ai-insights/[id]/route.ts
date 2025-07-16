import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AIInsight } from "@/models";
import dbConnect from "@/lib/db/mongoose";
import mongoose from "mongoose";

/**
 * Transform MongoDB insight document to frontend format
 */
function transformInsight(insight: any) {
  return {
    id: insight._id.toString(),
    type: insight.type,
    priority: insight.priority,
    title: insight.title,
    message: insight.message,
    affectedKeywords: insight.affectedKeywords,
    actionItems: insight.actionItems,
    confidenceScore: insight.confidenceScore,
    generatedAt: insight.generatedAt,
    category: insight.category,
    status: insight.status,
    notes: insight.notes,
    sessionId: insight.sessionId?.toString(),
    completedAt: insight.completedAt,
    dismissedAt: insight.dismissedAt,
    completedBy: insight.completedBy?.toString(),
    dismissedBy: insight.dismissedBy?.toString(),
  };
}

/**
 * PATCH /api/v1/search-rankings/ai-insights/[id]
 * Update insight status (complete, dismiss, etc.)
 */
export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;
    const body = await req.json();
    const { status, notes } = body;

    // Validate ID format
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid insight ID" },
        { status: 400 },
      );
    }

    if (!status) {
      return NextResponse.json(
        { message: "Status is required" },
        { status: 400 },
      );
    }

    // Validate status
    const validStatuses = ["new", "in_progress", "completed", "dismissed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    let updatedInsight;

    if (status === "completed") {
      updatedInsight = await AIInsight.markCompleted(
        id,
        (session.user as any).id,
        notes,
      );
    } else if (status === "dismissed") {
      updatedInsight = await AIInsight.markDismissed(
        id,
        (session.user as any).id,
        notes,
      );
    } else {
      // For other status updates
      updatedInsight = await AIInsight.findByIdAndUpdate(
        id,
        {
          status,
          notes: notes || undefined,
        },
        { new: true },
      );
    }

    if (!updatedInsight) {
      return NextResponse.json(
        { message: "Insight not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      insight: transformInsight(updatedInsight),
    });
  } catch (error) {
    console.error("Error updating insight:", error);
    return NextResponse.json(
      { message: "Failed to update insight" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/search-rankings/ai-insights/[id]
 * Delete an insight (soft delete by marking as dismissed)
 */
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;

    // Validate ID format
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid insight ID" },
        { status: 400 },
      );
    }

    const deletedInsight = await AIInsight.markDismissed(
      id,
      (session.user as any).id,
      "Deleted by user",
    );

    if (!deletedInsight) {
      return NextResponse.json(
        { message: "Insight not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Insight deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting insight:", error);
    return NextResponse.json(
      { message: "Failed to delete insight" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/v1/search-rankings/ai-insights/[id]
 * Get a specific insight by ID
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;

    // Validate ID format
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid insight ID" },
        { status: 400 },
      );
    }

    const insight = await AIInsight.findById(id).populate("sessionId");

    if (!insight) {
      return NextResponse.json(
        { message: "Insight not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      insight: transformInsight(insight),
    });
  } catch (error) {
    console.error("Error fetching insight:", error);
    return NextResponse.json(
      { message: "Failed to fetch insight" },
      { status: 500 },
    );
  }
}
