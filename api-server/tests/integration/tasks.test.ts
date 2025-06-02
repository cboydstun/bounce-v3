import request from "supertest";
import app from "../../src/app.test.js";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from "../setup/testDatabase.js";
import { TestHelpers } from "../setup/testHelpers.js";
import Task from "../../src/models/Task.js";

describe("Task Management Integration Tests", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe("GET /api/tasks/available", () => {
    let testContractor: any;
    let authHeaders: any;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        skills: ["delivery", "setup"],
        isVerified: true,
      });
      authHeaders = TestHelpers.getAuthHeaders(
        testContractor._id,
        testContractor,
      );

      // Create test tasks
      await TestHelpers.createTestTask({
        description: "Delivery Task",
        type: "Delivery",
        status: "Pending",
        paymentAmount: 75.50,
        location: {
          type: "Point",
          coordinates: [-98.4936, 29.4241], // San Antonio
        },
      });

      await TestHelpers.createTestTask({
        description: "Setup Task",
        type: "Setup",
        status: "Pending",
        location: {
          type: "Point",
          coordinates: [-98.52, 29.45], // Further location (about 3km away)
        },
      });

      await TestHelpers.createTestTask({
        description: "Assigned Task",
        type: "Delivery",
        status: "Assigned",
        assignedTo: "other-contractor-id",
      });
    });

    it("should return available tasks for authenticated contractor", async () => {
      const response = await request(app)
        .get("/api/tasks/available")
        .set(authHeaders)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("tasks");
      expect(response.body.data).toHaveProperty("pagination");
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
      expect(response.body.data.tasks.length).toBe(2); // Only pending tasks

      // Verify all tasks are pending
      response.body.data.tasks.forEach((task: any) => {
        expect(task.status).toBe("published");
      });
    });

    it("should filter tasks by skills", async () => {
      const response = await request(app)
        .get("/api/tasks/available?skills=delivery")
        .set(authHeaders)
        .expect(200);

      expect(response.body.data.tasks.length).toBe(1);
      expect(response.body.data.tasks[0].description).toBe("Delivery Task");
      expect(response.body.data.tasks[0].type).toBe("delivery");
    });

    it("should filter tasks by location and radius", async () => {
      const response = await request(app)
        .get("/api/tasks/available?lat=29.4241&lng=-98.4936&radius=2")
        .set(authHeaders)
        .expect(200);

      expect(response.body.data.tasks.length).toBe(1);
      expect(response.body.data.tasks[0].description).toBe("Delivery Task");
    });

    it("should support pagination", async () => {
      // Create more tasks
      for (let i = 0; i < 15; i++) {
        await TestHelpers.createTestTask({
          description: `Task ${i}`,
          type: "Delivery",
          status: "Pending",
        });
      }

      const response = await request(app)
        .get("/api/tasks/available?page=1&limit=10")
        .set(authHeaders)
        .expect(200);

      expect(response.body.data.tasks.length).toBe(10);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.total).toBeGreaterThan(10);
    });

    it("should include payment amounts in task responses", async () => {
      const response = await request(app)
        .get("/api/tasks/available")
        .set(authHeaders)
        .expect(200);

      expect(response.body.data.tasks.length).toBeGreaterThan(0);
      
      // Find the task with payment amount
      const taskWithPayment = response.body.data.tasks.find(
        (task: any) => task.description === "Delivery Task"
      );
      
      expect(taskWithPayment).toBeDefined();
      expect(taskWithPayment.compensation).toBeDefined();
      expect(taskWithPayment.compensation.baseAmount).toBe(75.50);
      expect(taskWithPayment.compensation.totalAmount).toBe(75.50);
      
      // Task without payment amount should default to 50
      const taskWithoutPayment = response.body.data.tasks.find(
        (task: any) => task.description === "Setup Task"
      );
      
      expect(taskWithoutPayment).toBeDefined();
      expect(taskWithoutPayment.compensation.baseAmount).toBe(50);
      expect(taskWithoutPayment.compensation.totalAmount).toBe(50);
    });

    it("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/tasks/available")
        .expect(401);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Access token required");
    });
  });

  describe("GET /api/tasks/my-tasks", () => {
    let testContractor: any;
    let authHeaders: any;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        isVerified: true,
      });
      authHeaders = TestHelpers.getAuthHeaders(
        testContractor._id,
        testContractor,
      );

      // Create tasks assigned to contractor
      await TestHelpers.createTestTask({
        description: "My Assigned Task",
        status: "Assigned",
        assignedTo: testContractor._id,
      });

      await TestHelpers.createTestTask({
        description: "My In Progress Task",
        status: "In Progress",
        assignedTo: testContractor._id,
      });

      // Create task assigned to someone else
      await TestHelpers.createTestTask({
        description: "Other Contractor Task",
        status: "Assigned",
        assignedTo: "other-contractor-id",
      });
    });

    it("should return only contractor's assigned tasks", async () => {
      const response = await request(app)
        .get("/api/tasks/my-tasks")
        .set(authHeaders)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("tasks");
      expect(response.body.data.tasks.length).toBe(2);

      response.body.data.tasks.forEach((task: any) => {
        expect(task.contractor.contractorId).toBe(testContractor._id);
      });
    });

    it("should filter tasks by status", async () => {
      const response = await request(app)
        .get("/api/tasks/my-tasks?status=Assigned")
        .set(authHeaders)
        .expect(200);

      expect(response.body.data.tasks.length).toBe(1);
      expect(response.body.data.tasks[0].status).toBe("assigned");
      expect(response.body.data.tasks[0].description).toBe("My Assigned Task");
    });

    it("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/tasks/my-tasks")
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/tasks/:id/claim", () => {
    let testContractor: any;
    let authHeaders: any;
    let testTask: any;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        skills: ["delivery"],
        isVerified: true,
      });
      authHeaders = TestHelpers.getAuthHeaders(
        testContractor._id,
        testContractor,
      );

      testTask = await TestHelpers.createTestTask({
        title: "Claimable Task",
        skills: ["delivery"],
        status: "Pending",
      });
    });

    it("should claim available task successfully", async () => {
      const response = await request(app)
        .post(`/api/tasks/${testTask._id}/claim`)
        .set(authHeaders)
        .expect(200);

      expect(response.body).toHaveProperty("task");
      expect(response.body).toHaveProperty("message");
      expect(response.body.task.status).toBe("Assigned");
      expect(response.body.task.assignedTo).toBe(testContractor._id);

      // Verify in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask?.status).toBe("Assigned");
      expect(updatedTask?.assignedTo?.toString()).toBe(testContractor._id);
    });

    it("should reject claiming already assigned task", async () => {
      // First claim
      await request(app)
        .post(`/api/tasks/${testTask._id}/claim`)
        .set(authHeaders)
        .expect(200);

      // Second claim attempt
      const response = await request(app)
        .post(`/api/tasks/${testTask._id}/claim`)
        .set(authHeaders)
        .expect(409);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("already assigned");
    });

    it("should reject claiming task without required skills", async () => {
      const contractorWithoutSkills = await TestHelpers.createTestContractor({
        skills: ["setup"], // Different skill
        isVerified: true,
      });
      const wrongAuthHeaders = TestHelpers.getAuthHeaders(
        contractorWithoutSkills._id,
        contractorWithoutSkills,
      );

      const response = await request(app)
        .post(`/api/tasks/${testTask._id}/claim`)
        .set(wrongAuthHeaders)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("required skills");
    });

    it("should reject claiming non-existent task", async () => {
      const fakeTaskId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .post(`/api/tasks/${fakeTaskId}/claim`)
        .set(authHeaders)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Task not found");
    });

    it("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .post(`/api/tasks/${testTask._id}/claim`)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PUT /api/tasks/:id/status", () => {
    let testContractor: any;
    let authHeaders: any;
    let testTask: any;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        isVerified: true,
      });
      authHeaders = TestHelpers.getAuthHeaders(
        testContractor._id,
        testContractor,
      );

      testTask = await TestHelpers.createTestTask({
        status: "Assigned",
        assignedTo: testContractor._id,
      });
    });

    it("should update task status successfully", async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}/status`)
        .set(authHeaders)
        .send({ status: "In Progress" })
        .expect(200);

      expect(response.body).toHaveProperty("task");
      expect(response.body.task.status).toBe("In Progress");

      // Verify in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask?.status).toBe("In Progress");
    });

    it("should reject invalid status transitions", async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}/status`)
        .set(authHeaders)
        .send({ status: "Pending" }) // Can't go back to Pending
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Validation failed");
    });

    it("should reject updating task not assigned to contractor", async () => {
      const otherContractor = await TestHelpers.createTestContractor({
        isVerified: true,
      });
      const otherAuthHeaders = TestHelpers.getAuthHeaders(
        otherContractor._id,
        otherContractor,
      );

      const response = await request(app)
        .put(`/api/tasks/${testTask._id}/status`)
        .set(otherAuthHeaders)
        .send({ status: "In Progress" })
        .expect(403);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("not assigned to you");
    });

    it("should reject invalid status values", async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}/status`)
        .set(authHeaders)
        .send({ status: "Invalid Status" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Validation failed");
    });
  });

  describe("POST /api/tasks/:id/complete", () => {
    let testContractor: any;
    let authHeaders: any;
    let testTask: any;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        isVerified: true,
      });
      authHeaders = TestHelpers.getAuthHeaders(
        testContractor._id,
        testContractor,
      );

      testTask = await TestHelpers.createTestTask({
        status: "In Progress",
        assignedTo: testContractor._id,
      });
    });

    it("should complete task successfully with notes", async () => {
      const completionData = {
        notes: "Task completed successfully. Customer was satisfied.",
      };

      const response = await request(app)
        .post(`/api/tasks/${testTask._id}/complete`)
        .set(authHeaders)
        .send(completionData)
        .expect(200);

      expect(response.body).toHaveProperty("task");
      expect(response.body).toHaveProperty("message");
      expect(response.body.task.status).toBe("Completed");
      expect(response.body.task.completionNotes).toBe(completionData.notes);

      // Verify in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask?.status).toBe("Completed");
      expect(updatedTask?.completedAt).toBeTruthy();
    });

    it("should reject completing task not in progress", async () => {
      // Create task in wrong status
      const wrongStatusTask = await TestHelpers.createTestTask({
        status: "Assigned",
        assignedTo: testContractor._id,
      });

      const response = await request(app)
        .post(`/api/tasks/${wrongStatusTask._id}/complete`)
        .set(authHeaders)
        .send({ notes: "Completion notes" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("must be in progress");
    });

    it("should reject completing task not assigned to contractor", async () => {
      const otherContractor = await TestHelpers.createTestContractor({
        isVerified: true,
      });
      const otherAuthHeaders = TestHelpers.getAuthHeaders(
        otherContractor._id,
        otherContractor,
      );

      const response = await request(app)
        .post(`/api/tasks/${testTask._id}/complete`)
        .set(otherAuthHeaders)
        .send({ notes: "Completion notes" })
        .expect(403);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("not assigned to you");
    });

    it("should handle completion without notes", async () => {
      const response = await request(app)
        .post(`/api/tasks/${testTask._id}/complete`)
        .set(authHeaders)
        .send({})
        .expect(200);

      expect(response.body.task.status).toBe("Completed");
      expect(response.body.task.completionNotes).toBeUndefined();
    });
  });

  describe("GET /api/tasks/:id", () => {
    let testContractor: any;
    let authHeaders: any;
    let testTask: any;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        isVerified: true,
      });
      authHeaders = TestHelpers.getAuthHeaders(
        testContractor._id,
        testContractor,
      );

      testTask = await TestHelpers.createTestTask({
        title: "Test Task Details",
        description: "Detailed task description",
        status: "Pending",
      });
    });

    it("should return task details for available task", async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .set(authHeaders)
        .expect(200);

      expect(response.body).toHaveProperty("task");
      expect(response.body.task._id).toBe(testTask._id);
      expect(response.body.task.title).toBe("Test Task Details");
      expect(response.body.task.description).toBe("Detailed task description");
    });

    it("should return task details for assigned task", async () => {
      // Assign task to contractor
      await Task.findByIdAndUpdate(testTask._id, {
        status: "Assigned",
        assignedTo: testContractor._id,
      });

      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.task.status).toBe("Assigned");
      expect(response.body.task.assignedTo).toBe(testContractor._id);
    });

    it("should reject access to task assigned to other contractor", async () => {
      // Assign task to different contractor
      await Task.findByIdAndUpdate(testTask._id, {
        status: "Assigned",
        assignedTo: "other-contractor-id",
      });

      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .set(authHeaders)
        .expect(403);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain(
        "You do not have access to this task",
      );
    });

    it("should return 404 for non-existent task", async () => {
      const fakeTaskId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .get(`/api/tasks/${fakeTaskId}`)
        .set(authHeaders)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Task not found");
    });

    it("should reject invalid task ID format", async () => {
      const response = await request(app)
        .get("/api/tasks/invalid-id")
        .set(authHeaders)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Validation failed");
    });
  });

  describe("Task Workflow Integration", () => {
    let testContractor: any;
    let authHeaders: any;
    let testTask: any;

    beforeEach(async () => {
      testContractor = await TestHelpers.createTestContractor({
        skills: ["delivery", "setup"],
        isVerified: true,
      });
      authHeaders = TestHelpers.getAuthHeaders(
        testContractor._id,
        testContractor,
      );

      testTask = await TestHelpers.createTestTask({
        skills: ["delivery"],
        status: "Pending",
      });
    });

    it("should complete full task workflow: claim -> start -> complete", async () => {
      // Step 1: Claim task
      const claimResponse = await request(app)
        .post(`/api/tasks/${testTask._id}/claim`)
        .set(authHeaders)
        .expect(200);

      expect(claimResponse.body.task.status).toBe("Assigned");

      // Step 2: Start task
      const startResponse = await request(app)
        .put(`/api/tasks/${testTask._id}/status`)
        .set(authHeaders)
        .send({ status: "In Progress" })
        .expect(200);

      expect(startResponse.body.task.status).toBe("In Progress");

      // Step 3: Complete task
      const completeResponse = await request(app)
        .post(`/api/tasks/${testTask._id}/complete`)
        .set(authHeaders)
        .send({ notes: "Task completed successfully" })
        .expect(200);

      expect(completeResponse.body.task.status).toBe("Completed");
      expect(completeResponse.body.task.completionNotes).toBe(
        "Task completed successfully",
      );

      // Verify final state in database
      const finalTask = await Task.findById(testTask._id);
      expect(finalTask?.status).toBe("Completed");
      expect(finalTask?.assignedTo?.toString()).toBe(testContractor._id);
      expect(finalTask?.completedAt).toBeTruthy();
    });
  });
});
