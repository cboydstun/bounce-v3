import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Task from "@/models/Task";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TaskStatus } from "@/types/task";

export async function GET(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to view payment reports" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TaskStatus | null;
    const contractorId = searchParams.get("contractorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const reportType = searchParams.get("type") || "summary";

    // Validate status if provided
    if (status) {
      const validStatuses = [
        "Pending",
        "Assigned",
        "In Progress",
        "Completed",
        "Cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status parameter" },
          { status: 400 },
        );
      }
    }

    // Validate date format if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return NextResponse.json(
        { error: "Invalid startDate format" },
        { status: 400 },
      );
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json(
        { error: "Invalid endDate format" },
        { status: 400 },
      );
    }

    // Validate amount parameters
    if (minAmount && (isNaN(Number(minAmount)) || Number(minAmount) < 0)) {
      return NextResponse.json(
        { error: "Invalid minAmount parameter" },
        { status: 400 },
      );
    }

    if (maxAmount && (isNaN(Number(maxAmount)) || Number(maxAmount) < 0)) {
      return NextResponse.json(
        { error: "Invalid maxAmount parameter" },
        { status: 400 },
      );
    }

    if (reportType === "summary") {
      // Get payment statistics
      const filters: any = {};
      if (status) filters.status = status;
      if (contractorId) filters.contractorId = contractorId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const stats = await Task.getPaymentStats(filters);

      // Get additional breakdown by status
      const statusBreakdown = await Task.aggregate([
        {
          $match: {
            ...(contractorId && { assignedContractors: contractorId }),
            ...(startDate && {
              scheduledDateTime: { $gte: new Date(startDate) },
            }),
            ...(endDate && {
              scheduledDateTime: {
                ...((startDate && { $gte: new Date(startDate) }) || {}),
                $lte: new Date(endDate),
              },
            }),
          },
        },
        {
          $group: {
            _id: "$status",
            totalAmount: {
              $sum: {
                $cond: [{ $ne: ["$paymentAmount", null] }, "$paymentAmount", 0],
              },
            },
            taskCount: { $sum: 1 },
            paidTasks: {
              $sum: {
                $cond: [{ $ne: ["$paymentAmount", null] }, 1, 0],
              },
            },
            averageAmount: {
              $avg: {
                $cond: [
                  { $ne: ["$paymentAmount", null] },
                  "$paymentAmount",
                  null,
                ],
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      return NextResponse.json({
        summary: stats,
        statusBreakdown,
        filters: {
          status,
          contractorId,
          startDate,
          endDate,
        },
      });
    } else if (reportType === "detailed") {
      // Build query for detailed report
      const query: any = {};

      if (status) query.status = status;
      if (contractorId) query.assignedContractors = contractorId;
      if (startDate || endDate) {
        query.scheduledDateTime = {};
        if (startDate) query.scheduledDateTime.$gte = new Date(startDate);
        if (endDate) query.scheduledDateTime.$lte = new Date(endDate);
      }
      if (minAmount || maxAmount) {
        query.paymentAmount = {};
        if (minAmount) query.paymentAmount.$gte = Number(minAmount);
        if (maxAmount) query.paymentAmount.$lte = Number(maxAmount);
      }

      // Get detailed task list with payment information
      const tasks = await Task.find(query)
        .select(
          "_id orderId type title description scheduledDateTime priority status assignedContractors paymentAmount createdAt updatedAt",
        )
        .sort({ scheduledDateTime: -1 })
        .limit(1000); // Limit to prevent large responses

      return NextResponse.json({
        tasks,
        count: tasks.length,
        filters: {
          status,
          contractorId,
          startDate,
          endDate,
          minAmount,
          maxAmount,
        },
      });
    } else if (reportType === "range") {
      // Payment amount range analysis
      const ranges = [
        { min: 0, max: 50, label: "$0 - $50" },
        { min: 50, max: 100, label: "$50 - $100" },
        { min: 100, max: 200, label: "$100 - $200" },
        { min: 200, max: 500, label: "$200 - $500" },
        { min: 500, max: 1000, label: "$500 - $1,000" },
        { min: 1000, max: 999999.99, label: "$1,000+" },
      ];

      const rangeAnalysis = await Promise.all(
        ranges.map(async (range) => {
          const query: any = {
            paymentAmount: { $gte: range.min, $lte: range.max },
          };

          if (status) query.status = status;
          if (contractorId) query.assignedContractors = contractorId;
          if (startDate || endDate) {
            query.scheduledDateTime = {};
            if (startDate) query.scheduledDateTime.$gte = new Date(startDate);
            if (endDate) query.scheduledDateTime.$lte = new Date(endDate);
          }

          const result = await Task.aggregate([
            { $match: query },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: "$paymentAmount" },
                averageAmount: { $avg: "$paymentAmount" },
              },
            },
          ]);

          return {
            range: range.label,
            min: range.min,
            max: range.max,
            count: result[0]?.count || 0,
            totalAmount: result[0]?.totalAmount || 0,
            averageAmount: result[0]?.averageAmount || 0,
          };
        }),
      );

      return NextResponse.json({
        rangeAnalysis,
        filters: {
          status,
          contractorId,
          startDate,
          endDate,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid report type. Use 'summary', 'detailed', or 'range'" },
        { status: 400 },
      );
    }
  } catch (error: unknown) {
    console.error("Error generating payment report:", error);
    return NextResponse.json(
      { error: "Failed to generate payment report" },
      { status: 500 },
    );
  }
}
