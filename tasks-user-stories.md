# Epic: Order Task Management System

## Current Implementation Status & Future Roadmap

## ✅ COMPLETED FEATURES (Phase 1-5)

### 1. Task Creation and Management ✅ COMPLETE

**As an admin, I want to create tasks for specific orders so that I can assign work to my employees.**

**Implemented Features:**

- ✅ Full CRUD operations for tasks within order detail view
- ✅ Task types: Delivery, Setup, Pickup, Maintenance with icons
- ✅ Rich task descriptions (up to 1000 characters)
- ✅ Scheduled date/time with past-date validation
- ✅ Priority levels: High (red), Medium (yellow), Low (green)
- ✅ Status workflow: Pending → Assigned → In Progress → Completed/Cancelled
- ✅ Edit/delete functionality with business rule enforcement
- ✅ Automatic order linkage and task sorting

**Technical Implementation:**

- Task model with Mongoose validation and indexes
- API endpoints: `/api/v1/orders/[id]/tasks` and `/api/v1/tasks/[id]`
- React components: TaskSection, TaskForm, TaskCard, StatusBadge

### 2. Contractor Assignment ✅ COMPLETE

**As an admin, I want to assign tasks to contractors so that work can be distributed effectively.**

**Implemented Features:**

- ✅ Comprehensive contractor management system
- ✅ Multi-contractor assignment per task
- ✅ Contractor profiles with skills, contact info, and status
- ✅ Visual contractor selection interface
- ✅ Active/inactive contractor management
- ✅ Skills-based contractor organization

**Technical Implementation:**

- Contractor model with skills tracking and soft delete
- API endpoints: `/api/v1/contractors/*`
- Admin interface: `/admin/contractors` with full CRUD operations
- Enhanced task assignment with contractor arrays

### 3. Task Status Tracking ✅ COMPLETE

**As an admin, I want to track the status of all tasks so that I know the progress of order fulfillment.**

**Implemented Features:**

- ✅ Real-time status tracking with color-coded badges
- ✅ Automatic status change logging with timestamps
- ✅ Order filtering by task status using MongoDB aggregation
- ✅ Audit trail with TaskStatusHistory model
- ✅ User accountability (who changed what, when)

**Technical Implementation:**

- TaskStatusHistory model for audit trails
- Enhanced orders API with task status filtering
- Frontend task status filter in orders page
- Automatic logging on status updates

## 🚧 IN PROGRESS & UPCOMING FEATURES

### 4. Mobile Contractor Application (Phase 6) 🔄 NEXT

**As a contractor, I want a mobile app to view and manage my assigned tasks like Uber Driver.**

**Planned Features:**

- 📱 Standalone Ionic mobile application
- 🔐 Contractor registration and authentication
- 📋 Task claiming system (unclaimed tasks visible to all, claimed tasks private)
- 🔔 Push notifications for new available tasks
- 📊 Personal task dashboard with status management
- 🗺️ GPS integration for delivery navigation
- 📸 Photo capture for task completion
- 💼 QuickBooks Online integration for W-9 onboarding

**Technical Architecture:**

- **Backend**: Express.js server (separate from Next.js)
- **Database**: MongoDB Atlas (tasks and contractors collections)
- **Mobile**: Ionic framework with Capacitor
- **Authentication**: JWT-based contractor auth
- **Integrations**: QuickBooks Online API, Push notifications

### 5. Express.js API Server (Phase 6a) 🔄 IMMEDIATE NEXT

**Standalone API server for mobile app communication**

**Requirements:**

- Express.js server with MongoDB Atlas connection
- TypeScript for type safety and error detection
- RESTful API endpoints for tasks and contractors
- JWT authentication for contractors
- Real-time notifications (WebSocket/Server-Sent Events)
- QuickBooks Online integration for contractor onboarding
- Task claiming/assignment logic

**API Endpoints Needed:**

```
POST /api/auth/contractor/register - Contractor registration
POST /api/auth/contractor/login - Contractor authentication
GET /api/contractors/me - Get contractor profile
PUT /api/contractors/me - Update contractor profile

GET /api/tasks/available - Get unclaimed tasks
GET /api/tasks/my-tasks - Get contractor's claimed tasks
POST /api/tasks/:id/claim - Claim an available task
PUT /api/tasks/:id/status - Update task status
POST /api/tasks/:id/complete - Mark task complete with photos/notes

POST /api/quickbooks/connect - Initiate QuickBooks OAuth
POST /api/quickbooks/w9 - Submit W-9 information
```

### 6. Contractor Mobile App Features (Phase 6b)

**Core Functionality:**

- **Onboarding Flow**: Registration → QuickBooks W-9 → Profile setup
- **Task Discovery**: Browse available tasks with filters
- **Task Management**: Claim, update status, complete with photos
- **Navigation**: GPS integration for delivery addresses
- **Notifications**: Real-time alerts for new tasks
- **Profile**: Manage skills, availability, contact info

**User Experience:**

- Uber-like interface for task claiming
- Offline capability with sync
- One-tap status updates
- Photo documentation for completions
- Earnings tracking and tax document management

## 📋 REMAINING ADMIN FEATURES (Future Phases)

### 7. Task Calendar View (Phase 7)

- Calendar visualization of all tasks
- Drag-and-drop rescheduling
- Resource allocation view
- Scheduling conflict detection

### 8. Bulk Task Creation (Phase 8)

- Task templates for common order types
- Automatic task generation on order confirmation
- Customizable default workflows

### 9. Task Reporting & Analytics (Phase 9)

- Contractor performance metrics
- Task completion analytics
- Bottleneck identification
- Payroll integration reports

### 10. Advanced Communication (Phase 10)

- Task-specific messaging
- Photo attachments and issue reporting
- Team collaboration features
- Customer communication integration

## 🏗️ TECHNICAL ARCHITECTURE

### Current Stack (Admin Web App)

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS with custom components

### Planned Stack (Mobile App)

- **Mobile Framework**: Ionic with Capacitor
- **Backend API**: Express.js (separate server)
- **Database**: MongoDB Atlas (shared with web app)
- **Authentication**: JWT tokens
- **Push Notifications**: Firebase Cloud Messaging
- **Integrations**: QuickBooks Online API

### Database Collections

```typescript
// Existing
interface Task {
  _id: ObjectId;
  orderId: ObjectId;
  type: "Delivery" | "Setup" | "Pickup" | "Maintenance";
  description: string;
  scheduledDateTime: Date;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "Assigned" | "In Progress" | "Completed" | "Cancelled";
  assignedContractors: ObjectId[];
  claimedBy?: ObjectId; // NEW: For mobile app claiming
  createdAt: Date;
  updatedAt: Date;
}

interface Contractor {
  _id: ObjectId;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  isActive: boolean;
  // NEW: Mobile app fields
  passwordHash?: string; // For mobile auth
  fcmToken?: string; // For push notifications
  quickbooksId?: string; // QuickBooks integration
  w9Completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskStatusHistory {
  _id: ObjectId;
  taskId: ObjectId;
  orderId: ObjectId;
  previousStatus?: TaskStatus;
  newStatus: TaskStatus;
  changedBy: ObjectId;
  changedByName: string;
  reason?: string;
  createdAt: Date;
}
```

## 🎯 IMMEDIATE NEXT STEPS

1. **Set up Express.js API Server**

   - Initialize Express project with TypeScript
   - Configure MongoDB Atlas connection
   - Implement JWT authentication
   - Create contractor registration/login endpoints

2. **QuickBooks Integration**

   - Set up QuickBooks Online developer account
   - Implement OAuth flow for contractor onboarding
   - Create W-9 data collection and submission

3. **Task Claiming System**

   - Modify Task model to support claiming
   - Implement task availability logic
   - Create claiming/releasing endpoints

4. **Mobile App Foundation**

   - Initialize Ionic project
   - Set up authentication screens
   - Create task listing and detail views
   - Implement push notification setup

5. **Real-time Notifications**
   - Set up Firebase Cloud Messaging
   - Implement WebSocket/SSE for real-time updates
   - Create notification triggers for new tasks

This roadmap transforms the current admin-focused task management system into a comprehensive contractor ecosystem with mobile capabilities, similar to gig economy platforms like Uber Driver.
