import { logger } from "../utils/logger.js";
import ContractorAuth from "../models/ContractorAuth.js";
import TaskService from "../services/taskService.js";
class ContractorController {
    /**
     * Get contractor profile
     */
    async getProfile(req, res) {
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
            const formattedSkills = contractor.skills?.map((skill) => ({
                id: skill.toLowerCase().replace(/\s+/g, "_"),
                name: skill,
                category: this.getSkillCategory(skill),
                level: "intermediate",
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
        }
        catch (error) {
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
    async updateProfile(req, res) {
        try {
            const contractorId = req.contractor?.contractorId;
            const updateData = req.body;
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
                }
                else {
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
                            error: "Emergency contact name is required when contact info is provided",
                            code: "VALIDATION_ERROR",
                        });
                        return;
                    }
                    if (!emergencyContact.phone?.trim()) {
                        res.status(400).json({
                            success: false,
                            error: "Emergency contact phone is required when contact info is provided",
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
            const formattedSkills = contractor.skills?.map((skill) => ({
                id: skill.toLowerCase().replace(/\s+/g, "_"),
                name: skill,
                category: this.getSkillCategory(skill),
                level: "intermediate",
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
        }
        catch (error) {
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
    async updateProfilePhoto(req, res) {
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
        }
        catch (error) {
            logger.error("Update profile photo error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update profile photo",
                code: "PHOTO_UPDATE_FAILED",
            });
        }
    }
    /**
     * Get contractor earnings summary
     */
    async getEarningsSummary(req, res) {
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
            const completedTasks = await TaskService.getContractorTasks(contractorId, {
                status: "Completed",
                page: 1,
                limit: 1000, // Get all completed tasks
            });
            // Calculate earnings using Central Time (America/Chicago)
            const now = new Date();
            const centralTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
            // Calculate week boundaries (Sunday to Saturday)
            const startOfWeek = new Date(centralTime);
            startOfWeek.setDate(centralTime.getDate() - centralTime.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            // Calculate month boundaries
            const startOfMonth = new Date(centralTime.getFullYear(), centralTime.getMonth(), 1);
            const endOfMonth = new Date(centralTime.getFullYear(), centralTime.getMonth() + 1, 0, 23, 59, 59, 999);
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
                        const completedCentral = new Date(completedAt.toLocaleString("en-US", {
                            timeZone: "America/Chicago",
                        }));
                        // Check if task was completed this week
                        if (completedCentral >= startOfWeek &&
                            completedCentral <= endOfWeek) {
                            thisWeekEarnings += paymentAmount;
                        }
                        // Check if task was completed this month
                        if (completedCentral >= startOfMonth &&
                            completedCentral <= endOfMonth) {
                            thisMonthEarnings += paymentAmount;
                        }
                    }
                }
            }
            // Calculate average per task
            const averagePerTask = completedTasksCount > 0 ? totalEarnings / completedTasksCount : 0;
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
        }
        catch (error) {
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
    getSkillCategory(skill) {
        const skillLower = skill.toLowerCase();
        if (skillLower.includes("delivery") || skillLower.includes("transport")) {
            return "delivery";
        }
        if (skillLower.includes("setup") ||
            skillLower.includes("installation") ||
            skillLower.includes("breakdown")) {
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
//# sourceMappingURL=contractorController.js.map