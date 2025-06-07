import express from "express";
import { authenticateToken, requireVerified } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import TaskController from "../controllers/taskController.js";
import Joi from "joi";

const router = express.Router();

// GET /api/tasks - Get available task endpoints
router.get("/", (req, res) => {
  res.json({
    message: "Task API endpoints",
    endpoints: {
      "GET /available":
        "Get available tasks with location and skills filtering",
      "GET /my-tasks": "Get contractor's assigned tasks",
      "GET /:id": "Get task details by ID",
      "POST /:id/claim": "Claim an available task",
      "PUT /:id/status": "Update task status",
      "POST /:id/complete": "Complete task with photos and notes",
    },
  });
});

// Validation schemas
const availableTasksSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  radius: Joi.number().min(1).max(500).optional(), // Max 500km radius
  skills: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
});

const myTasksSchema = Joi.object({
  status: Joi.alternatives()
    .try(
      // Single status value
      Joi.string().valid("Assigned", "In Progress", "Completed", "Cancelled"),
      // Comma-separated status values
      Joi.string().custom((value, helpers) => {
        const statuses = value.split(",").map((s: string) => s.trim());
        const validStatuses = [
          "Assigned",
          "In Progress",
          "Completed",
          "Cancelled",
        ];
        const invalidStatuses = statuses.filter(
          (s: string) => !validStatuses.includes(s),
        );

        if (invalidStatuses.length > 0) {
          return helpers.error("any.invalid", {
            value,
            invalidStatuses,
            validStatuses,
          });
        }

        return value;
      }, "comma-separated statuses"),
    )
    .optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("Assigned", "In Progress", "Completed", "Cancelled")
    .required(),
});

const completeTaskSchema = Joi.object({
  notes: Joi.string().max(2000).optional(),
  photos: Joi.array().items(Joi.string().uri()).max(5).optional(),
});

const taskIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});

// GET /api/tasks/available - Get available tasks with location and skills filtering
router.get(
  "/available",
  authenticateToken,
  requireVerified,
  validate(availableTasksSchema, "query"),
  TaskController.getAvailableTasks,
);

// GET /api/tasks/my-tasks - Get contractor's assigned tasks
router.get(
  "/my-tasks",
  authenticateToken,
  requireVerified,
  validate(myTasksSchema, "query"),
  TaskController.getMyTasks,
);

// GET /api/tasks/:id - Get task details by ID
router.get(
  "/:id",
  authenticateToken,
  requireVerified,
  validate(taskIdSchema, "params"),
  TaskController.getTaskById,
);

// POST /api/tasks/:id/claim - Claim an available task
router.post(
  "/:id/claim",
  authenticateToken,
  requireVerified,
  validate(taskIdSchema, "params"),
  TaskController.claimTask,
);

// PUT /api/tasks/:id/status - Update task status
router.put(
  "/:id/status",
  authenticateToken,
  requireVerified,
  validate(taskIdSchema, "params"),
  validate(updateStatusSchema, "body"),
  TaskController.updateTaskStatus,
);

// POST /api/tasks/:id/complete - Complete task with photos and notes
router.post(
  "/:id/complete",
  authenticateToken,
  requireVerified,
  validate(taskIdSchema, "params"),
  validate(completeTaskSchema, "body"),
  TaskController.completeTask,
);

export default router;
