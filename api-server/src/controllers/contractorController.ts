import { Response } from "express";
import { logger } from "../utils/logger.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import ContractorAuth, {
  IContractorAuthDocument,
} from "../models/ContractorAuth.js";
import TaskService from "../services/taskService.js";

interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  skills?: Array<{
    id: string;
    name: string;
    category: string;
    level: string;
    certified: boolean;
  }>;
  businessName?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
  };
}

class ContractorController {
  /**
   * Get contractor profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;

      if (!contractorId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      logger.info("Get contractor profile", { contractorId });

      // Find contractor by ID
      const contractor = await ContractorAuth.findById(contractorId);
      if (!contractor) {
        logger.warn("Contractor not found", { contractorId });
        res.status(404).json({
          success: false,
          error: "Contractor not found",
          code: "CONTRACTOR_NOT_FOUND",
        });
        return;
      }

      // Format skills for mobile app
      const formattedSkills =
        contractor.skills?.map((skill) => ({
          id: skill.toLowerCase().replace(/\s+/g, "_"),
          name: skill,
          category: this.getSkillCategory(skill),
          level: "intermediate" as const,
          certified: false,
        })) || [];

      // Return contractor profile (without sensitive data)
      res.json({
        success: true,
        data: {
          id: contractor._id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          skills: formattedSkills,
          businessName: contractor.businessName || "",
          emergencyContact: contractor.emergencyContact || {
            name: "",
            phone: "",
            relationship: "",
          },
          profileImage: contractor.profileImage,
          isActive: contractor.isActive,
          isVerified: contractor.isVerified,
          quickbooksConnected: contractor.quickbooksConnected,
          totalJobs: 0, // Placeholder - would come from tasks
          rating: 0, // Placeholder - would come from reviews
          completionRate: 0, // Placeholder - would come from tasks
          onTimeRate: 0, // Placeholder - would come from tasks
          createdAt: contractor.createdAt,
          updatedAt: contractor.updatedAt,
        },
        message: "Profile retrieved successfully",
      });
    } catch (error) {
      logger.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve profile",
        code: "GET_PROFILE_FAILED",
      });
    }
  }

  /**
   * Update contractor profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;
      const updateData: UpdateProfileRequest = req.body;

      if (!contractorId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      logger.info("Update contractor profile", { contractorId, updateData });

      // Find contractor by ID
      const contractor = await ContractorAuth.findById(contractorId);
      if (!contractor) {
        logger.warn("Contractor not found", { contractorId });
        res.status(404).json({
          success: false,
          error: "Contractor not found",
          code: "CONTRACTOR_NOT_FOUND",
        });
        return;
      }

      // Validate and update fields
      if (updateData.name !== undefined) {
        if (!updateData.name.trim()) {
          res.status(400).json({
            success: false,
            error: "Name is required",
            code: "VALIDATION_ERROR",
          });
          return;
        }
        contractor.name = updateData.name.trim();
      }

      if (updateData.phone !== undefined) {
        if (updateData.phone && !/^\+?[\d\s\-\(\)]+$/.test(updateData.phone)) {
          res.status(400).json({
            success: false,
            error: "Invalid phone number format",
            code: "VALIDATION_ERROR",
          });
          return;
        }
        contractor.phone = updateData.phone;
      }

      if (updateData.skills !== undefined) {
        // Extract skill names from the skills array
        const skillNames = updateData.skills
          .filter((skill) => skill && skill.name)
          .map((skill) => skill.name.trim())
          .filter((name) => name.length > 0);

        contractor.skills = skillNames;
      }

      if (updateData.businessName !== undefined) {
        const trimmedBusinessName = updateData.businessName.trim();
        if (trimmedBusinessName) {
          contractor.businessName = trimmedBusinessName;
        } else {
          delete contractor.businessName;
        }
      }

      if (updateData.emergencyContact !== undefined) {
        const { emergencyContact } = updateData;

        // Validate emergency contact if provided
        if (emergencyContact.name || emergencyContact.phone) {
          if (!emergencyContact.name?.trim()) {
            res.status(400).json({
              success: false,
              error:
                "Emergency contact name is required when contact info is provided",
              code: "VALIDATION_ERROR",
            });
            return;
          }

          if (!emergencyContact.phone?.trim()) {
            res.status(400).json({
              success: false,
              error:
                "Emergency contact phone is required when contact info is provided",
              code: "VALIDATION_ERROR",
            });
            return;
          }

          if (!/^\+?[\d\s\-\(\)]+$/.test(emergencyContact.phone)) {
            res.status(400).json({
              success: false,
              error: "Invalid emergency contact phone format",
              code: "VALIDATION_ERROR",
            });
            return;
          }
        }

        const trimmedEmail = emergencyContact.email?.trim();
        contractor.emergencyContact = {
          name: emergencyContact.name?.trim() || "",
          phone: emergencyContact.phone?.trim() || "",
          relationship: emergencyContact.relationship?.trim() || "",
          ...(trimmedEmail && { email: trimmedEmail }),
        };
      }

      // Save updated contractor
      await contractor.save();

      // Format skills for response
      const formattedSkills =
        contractor.skills?.map((skill) => ({
          id: skill.toLowerCase().replace(/\s+/g, "_"),
          name: skill,
          category: this.getSkillCategory(skill),
          level: "intermediate" as const,
          certified: false,
        })) || [];

      logger.info("Profile updated successfully", { contractorId });

      // Return updated profile
      res.json({
        success: true,
        data: {
          id: contractor._id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          skills: formattedSkills,
          businessName: contractor.businessName || "",
          emergencyContact: contractor.emergencyContact || {
            name: "",
            phone: "",
            relationship: "",
          },
          profileImage: contractor.profileImage,
          isActive: contractor.isActive,
          isVerified: contractor.isVerified,
          quickbooksConnected: contractor.quickbooksConnected,
          totalJobs: 0, // Placeholder
          rating: 0, // Placeholder
          completionRate: 0, // Placeholder
          onTimeRate: 0, // Placeholder
          createdAt: contractor.createdAt,
          updatedAt: contractor.updatedAt,
        },
        message: "Profile updated successfully",
      });
    } catch (error) {
      logger.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update profile",
        code: "UPDATE_PROFILE_FAILED",
      });
    }
  }

  /**
   * Update contractor profile photo
   */
  async updateProfilePhoto(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;

      if (!contractorId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No photo file provided",
          code: "NO_FILE_PROVIDED",
        });
        return;
      }

      logger.info("Update profile photo", {
        contractorId,
        fileName: req.file.originalname,
      });

      // Find contractor by ID
      const contractor = await ContractorAuth.findById(contractorId);
      if (!contractor) {
        logger.warn("Contractor not found", { contractorId });
        res.status(404).json({
          success: false,
          error: "Contractor not found",
          code: "CONTRACTOR_NOT_FOUND",
        });
        return;
      }

      // TODO: Implement Cloudinary upload here
      // For now, we'll simulate a successful upload
      const photoUrl = `https://cloudinary.com/demo/image/upload/contractor_${contractorId}_${Date.now()}.jpg`;

      // Update contractor profile image
      contractor.profileImage = photoUrl;
      await contractor.save();

      logger.info("Profile photo updated successfully", {
        contractorId,
        photoUrl,
      });

      res.json({
        success: true,
        data: {
          url: photoUrl,
          publicId: `contractor_${contractorId}_${Date.now()}`,
          width: 800,
          height: 800,
          format: "jpg",
          bytes: req.file.size,
        },
        message: "Profile photo updated successfully",
      });
    } catch (error) {
      logger.error("Update profile photo error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update profile photo",
        code: "PHOTO_UPDATE_FAILED",
      });
    }
  }

  /**
   * Get contractor payment history
   */
  async getPaymentHistory(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;

      if (!contractorId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      const { page = "1", limit = "20", startDate, endDate } = req.query;

      logger.info("Get contractor payment history", {
        contractorId,
        page,
        limit,
        startDate,
        endDate,
      });

      // Build filters for completed tasks with payments
      const filters: any = {
        status: "Completed",
        page: parseInt(page as string, 10),
        limit: Math.min(parseInt(limit as string, 10), 50),
      };

      // Add date filtering if provided
      if (startDate || endDate) {
        filters.dateRange = {};
        if (startDate) {
          filters.dateRange.start = new Date(startDate as string);
        }
        if (endDate) {
          filters.dateRange.end = new Date(endDate as string);
        }
      }

      // Get completed tasks for this contractor
      const completedTasks = await TaskService.getContractorTasks(
        contractorId,
        filters,
      );

      // Transform tasks to payment history format
      const paymentHistory = completedTasks.tasks
        .filter((task) => task.paymentAmount && task.paymentAmount > 0)
        .map((task) => {
          const taskObj = task.toObject();
          return {
            id: taskObj._id.toString(),
            orderId: taskObj.orderId,
            taskTitle: taskObj.title || `${taskObj.type} Task`,
            taskType: taskObj.type,
            amount: taskObj.paymentAmount,
            paymentDate: taskObj.completedAt,
            paymentStatus: "paid", // Assuming completed tasks are paid
            paymentMethod: "direct_deposit",
            address: taskObj.address,
            scheduledDate: taskObj.scheduledDateTime,
            completedDate: taskObj.completedAt,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.paymentDate).getTime() -
            new Date(a.paymentDate).getTime(),
        );

      // Calculate summary statistics
      const totalAmount = paymentHistory.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );
      const averagePayment =
        paymentHistory.length > 0 ? totalAmount / paymentHistory.length : 0;

      res.json({
        success: true,
        data: {
          payments: paymentHistory,
          summary: {
            totalPayments: paymentHistory.length,
            totalAmount: Math.round(totalAmount * 100) / 100,
            averagePayment: Math.round(averagePayment * 100) / 100,
          },
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: paymentHistory.length,
            totalPages: Math.ceil(paymentHistory.length / filters.limit),
          },
        },
        message: "Payment history retrieved successfully",
      });
    } catch (error) {
      logger.error("Get payment history error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve payment history",
        code: "PAYMENT_HISTORY_FAILED",
      });
    }
  }

  /**
   * Get contractor earnings details
   */
  async getEarningsDetails(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;

      if (!contractorId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      logger.info("Get contractor earnings details", { contractorId });

      // Get all completed tasks for this contractor
      const completedTasks = await TaskService.getContractorTasks(
        contractorId,
        {
          status: "Completed",
          page: 1,
          limit: 1000, // Get all completed tasks
        },
      );

      // Calculate detailed earnings using Central Time
      const now = new Date();
      const centralTime = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Chicago" }),
      );

      // Initialize earnings data structures
      const dailyEarnings: { [key: string]: number } = {};
      const weeklyEarnings: { [key: string]: number } = {};
      const monthlyEarnings: { [key: string]: number } = {};
      const taskTypeEarnings: {
        [key: string]: { count: number; total: number };
      } = {};

      let totalEarnings = 0;
      let completedTasksCount = 0;

      // Process each completed task
      for (const task of completedTasks.tasks) {
        const taskObj = task.toObject();
        const paymentAmount = taskObj.paymentAmount || 0;
        const completedAt = taskObj.completedAt
          ? new Date(taskObj.completedAt)
          : null;
        const taskType = taskObj.type || "Unknown";

        if (paymentAmount > 0 && completedAt) {
          totalEarnings += paymentAmount;
          completedTasksCount++;

          // Convert to Central Time for grouping
          const completedCentral = new Date(
            completedAt.toLocaleString("en-US", {
              timeZone: "America/Chicago",
            }),
          );

          // Daily earnings
          const dayKey = completedCentral.toISOString().split("T")[0];
          if (dayKey) {
            dailyEarnings[dayKey] =
              (dailyEarnings[dayKey] || 0) + paymentAmount;
          }

          // Weekly earnings (ISO week)
          const weekStart = new Date(completedCentral);
          weekStart.setDate(
            completedCentral.getDate() - completedCentral.getDay(),
          );
          const weekKey = weekStart.toISOString().split("T")[0];
          if (weekKey) {
            weeklyEarnings[weekKey] =
              (weeklyEarnings[weekKey] || 0) + paymentAmount;
          }

          // Monthly earnings
          const monthKey = `${completedCentral.getFullYear()}-${String(completedCentral.getMonth() + 1).padStart(2, "0")}`;
          if (monthKey) {
            monthlyEarnings[monthKey] =
              (monthlyEarnings[monthKey] || 0) + paymentAmount;
          }

          // Task type earnings
          if (taskType && !taskTypeEarnings[taskType]) {
            taskTypeEarnings[taskType] = { count: 0, total: 0 };
          }
          if (taskType && taskTypeEarnings[taskType]) {
            taskTypeEarnings[taskType].count++;
            taskTypeEarnings[taskType].total += paymentAmount;
          }
        }
      }

      // Convert to arrays and sort
      const dailyData = Object.entries(dailyEarnings)
        .map(([date, amount]) => ({
          date,
          amount: Math.round(amount * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days

      const weeklyData = Object.entries(weeklyEarnings)
        .map(([weekStart, amount]) => ({
          weekStart,
          amount: Math.round(amount * 100) / 100,
        }))
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .slice(-12); // Last 12 weeks

      const monthlyData = Object.entries(monthlyEarnings)
        .map(([month, amount]) => ({
          month,
          amount: Math.round(amount * 100) / 100,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Last 12 months

      const taskTypeData = Object.entries(taskTypeEarnings)
        .map(([type, data]) => ({
          taskType: type,
          count: data.count,
          totalEarnings: Math.round(data.total * 100) / 100,
          averagePerTask: Math.round((data.total / data.count) * 100) / 100,
        }))
        .sort((a, b) => b.totalEarnings - a.totalEarnings);

      // Calculate performance metrics
      const averagePerTask =
        completedTasksCount > 0 ? totalEarnings / completedTasksCount : 0;
      const last30Days = dailyData
        .slice(-30)
        .reduce((sum, day) => sum + day.amount, 0);
      const last7Days = dailyData
        .slice(-7)
        .reduce((sum, day) => sum + day.amount, 0);

      const earningsDetails = {
        summary: {
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          completedTasks: completedTasksCount,
          averagePerTask: Math.round(averagePerTask * 100) / 100,
          last30DaysEarnings: Math.round(last30Days * 100) / 100,
          last7DaysEarnings: Math.round(last7Days * 100) / 100,
        },
        trends: {
          daily: dailyData,
          weekly: weeklyData,
          monthly: monthlyData,
        },
        breakdown: {
          byTaskType: taskTypeData,
        },
        performance: {
          bestDay:
            dailyData.length > 0
              ? dailyData.reduce((max, day) =>
                  day.amount > max.amount ? day : max,
                )
              : null,
          bestWeek:
            weeklyData.length > 0
              ? weeklyData.reduce((max, week) =>
                  week.amount > max.amount ? week : max,
                )
              : null,
          bestMonth:
            monthlyData.length > 0
              ? monthlyData.reduce((max, month) =>
                  month.amount > max.amount ? month : max,
                )
              : null,
        },
      };

      logger.info("Earnings details calculated", {
        contractorId,
        totalEarnings,
        completedTasksCount,
      });

      res.json({
        success: true,
        data: earningsDetails,
        message: "Earnings details retrieved successfully",
      });
    } catch (error) {
      logger.error("Get earnings details error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve earnings details",
        code: "EARNINGS_DETAILS_FAILED",
      });
    }
  }

  /**
   * Get contractor earnings summary
   */
  async getEarningsSummary(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;

      if (!contractorId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      logger.info("Get contractor earnings summary", { contractorId });

      // Get all completed tasks for this contractor
      const completedTasks = await TaskService.getContractorTasks(
        contractorId,
        {
          status: "Completed",
          page: 1,
          limit: 1000, // Get all completed tasks
        },
      );

      // Calculate earnings using Central Time (America/Chicago)
      const now = new Date();
      const centralTime = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Chicago" }),
      );

      // Calculate week boundaries (Sunday to Saturday)
      const startOfWeek = new Date(centralTime);
      startOfWeek.setDate(centralTime.getDate() - centralTime.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Calculate month boundaries
      const startOfMonth = new Date(
        centralTime.getFullYear(),
        centralTime.getMonth(),
        1,
      );
      const endOfMonth = new Date(
        centralTime.getFullYear(),
        centralTime.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      let totalEarnings = 0;
      let thisWeekEarnings = 0;
      let thisMonthEarnings = 0;
      let completedTasksCount = 0;

      // Process each completed task
      for (const task of completedTasks.tasks) {
        const taskObj = task.toObject();
        const paymentAmount = taskObj.paymentAmount || 0;
        const completedAt = taskObj.completedAt
          ? new Date(taskObj.completedAt)
          : null;

        if (paymentAmount > 0) {
          totalEarnings += paymentAmount;
          completedTasksCount++;

          if (completedAt) {
            // Convert completed date to Central Time for comparison
            const completedCentral = new Date(
              completedAt.toLocaleString("en-US", {
                timeZone: "America/Chicago",
              }),
            );

            // Check if task was completed this week
            if (
              completedCentral >= startOfWeek &&
              completedCentral <= endOfWeek
            ) {
              thisWeekEarnings += paymentAmount;
            }

            // Check if task was completed this month
            if (
              completedCentral >= startOfMonth &&
              completedCentral <= endOfMonth
            ) {
              thisMonthEarnings += paymentAmount;
            }
          }
        }
      }

      // Calculate average per task
      const averagePerTask =
        completedTasksCount > 0 ? totalEarnings / completedTasksCount : 0;

      const earningsData = {
        totalEarnings: Math.round(totalEarnings * 100) / 100, // Round to 2 decimal places
        thisWeekEarnings: Math.round(thisWeekEarnings * 100) / 100,
        thisMonthEarnings: Math.round(thisMonthEarnings * 100) / 100,
        completedTasks: completedTasksCount,
        averagePerTask: Math.round(averagePerTask * 100) / 100,
      };

      logger.info("Earnings summary calculated", {
        contractorId,
        earningsData,
      });

      res.json({
        success: true,
        data: earningsData,
        message: "Earnings summary retrieved successfully",
      });
    } catch (error) {
      logger.error("Get earnings summary error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve earnings summary",
        code: "EARNINGS_SUMMARY_FAILED",
      });
    }
  }

  /**
   * Helper method to categorize skills
   */
  private getSkillCategory(skill: string): string {
    const skillLower = skill.toLowerCase();

    if (skillLower.includes("delivery") || skillLower.includes("transport")) {
      return "delivery";
    }
    if (
      skillLower.includes("setup") ||
      skillLower.includes("installation") ||
      skillLower.includes("breakdown")
    ) {
      return "setup";
    }
    if (skillLower.includes("electrical") || skillLower.includes("electric")) {
      return "electrical";
    }
    if (skillLower.includes("safety") || skillLower.includes("inspection")) {
      return "safety";
    }
    if (skillLower.includes("maintenance") || skillLower.includes("repair")) {
      return "equipment_maintenance";
    }

    return "customer_service";
  }
}

export const contractorController = new ContractorController();
export default contractorController;
