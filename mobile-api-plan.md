## 📋 Express.js API Server Architecture Plan

### 🎯 **Project Overview**

We'll create a standalone Express.js server that runs separately from the Next.js application, specifically designed for mobile app communication. This server will reuse the existing MongoDB models and database connection while providing contractor-focused endpoints.

### 🏗️ **Project Structure**

```javascript
api-server/
├── src/
│   ├── controllers/
│   │   ├── authController.ts       # Contractor authentication
│   │   ├── contractorController.ts # Contractor profile management
│   │   ├── taskController.ts       # Task operations
│   │   └── quickbooksController.ts # QuickBooks integration
│   ├── middleware/
│   │   ├── auth.ts                 # JWT authentication middleware
│   │   ├── validation.ts           # Request validation
│   │   ├── rateLimiting.ts         # Rate limiting
│   │   └── cors.ts                 # CORS configuration
│   ├── models/                     # Symlinked from main project
│   ├── types/                      # Symlinked from main project
│   ├── routes/
│   │   ├── auth.ts                 # Authentication routes
│   │   ├── contractors.ts          # Contractor routes
│   │   ├── tasks.ts                # Task routes
│   │   └── quickbooks.ts           # QuickBooks routes
│   ├── services/
│   │   ├── authService.ts          # Authentication logic
│   │   ├── taskService.ts          # Task business logic
│   │   ├── notificationService.ts  # Real-time notifications
│   │   └── quickbooksService.ts    # QuickBooks integration
│   ├── utils/
│   │   ├── database.ts             # Database connection
│   │   ├── jwt.ts                  # JWT utilities
│   │   └── validation.ts           # Validation schemas
│   ├── websocket/
│   │   └── socketHandlers.ts       # WebSocket event handlers
│   └── app.ts                      # Express app configuration
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

### 🔧 **Technology Stack**

- **Framework**: Express.js with TypeScript
- **Database**: MongoDB Atlas (reusing existing connection)
- **Authentication**: JWT tokens
- **Real-time**: Socket.io for WebSocket communication
- **Validation**: Joi or Zod for request validation
- **Rate Limiting**: express-rate-limit
- **File Upload**: Multer for task completion photos
- **QuickBooks**: QuickBooks Online SDK
- **Testing**: Jest + Supertest

### 🔐 **Enhanced Contractor Model**

We'll need to extend the existing Contractor model to support authentication:

```typescript
interface ContractorAuth extends Contractor {
  password: string; // Hashed password
  refreshTokens: string[]; // Array of valid refresh tokens
  lastLogin?: Date; // Last login timestamp
  isVerified: boolean; // Email verification status
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  quickbooksConnected: boolean;
  quickbooksTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
}
```

### 📡 **API Endpoints Implementation**

#### **Authentication Endpoints**

```typescript
POST /api/auth/contractor/register
- Body: { name, email, phone, password }
- Response: { contractor, accessToken, refreshToken }

POST /api/auth/contractor/login
- Body: { email, password }
- Response: { contractor, accessToken, refreshToken }

POST /api/auth/contractor/refresh
- Body: { refreshToken }
- Response: { accessToken }

POST /api/auth/contractor/logout
- Headers: Authorization Bearer token
- Response: { message: "Logged out successfully" }
```

#### **Contractor Profile Endpoints**

```typescript
GET /api/contractors/me
- Headers: Authorization Bearer token
- Response: { contractor profile }

PUT /api/contractors/me
- Headers: Authorization Bearer token
- Body: { name?, phone?, skills? }
- Response: { updated contractor }
```

#### **Task Management Endpoints**

```typescript
GET /api/tasks/available
- Headers: Authorization Bearer token
- Query: ?skills=delivery,setup&location=lat,lng&radius=50
- Response: { tasks: [...], pagination }

GET /api/tasks/my-tasks
- Headers: Authorization Bearer token
- Query: ?status=assigned&page=1&limit=20
- Response: { tasks: [...], pagination }

POST /api/tasks/:id/claim
- Headers: Authorization Bearer token
- Response: { task, message }

PUT /api/tasks/:id/status
- Headers: Authorization Bearer token
- Body: { status: "In Progress" | "Completed" }
- Response: { task }

POST /api/tasks/:id/complete
- Headers: Authorization Bearer token
- Body: { notes?, photos?: File[] }
- Response: { task, message }
```

#### **QuickBooks Integration Endpoints**

```typescript
POST /api/quickbooks/connect
- Headers: Authorization Bearer token
- Response: { authUrl }

POST /api/quickbooks/callback
- Body: { code, state }
- Response: { success: true }

POST /api/quickbooks/w9
- Headers: Authorization Bearer token
- Body: { taxId, businessName, address, ... }
- Response: { success: true }
```

### 🔄 **Real-time Notifications**

Using Socket.io for real-time updates:

```typescript
// WebSocket Events
"task:new"; // New task available
"task:assigned"; // Task assigned to contractor
"task:updated"; // Task status updated
"task:cancelled"; // Task cancelled
"contractor:message"; // Admin message to contractor
```

### 🛡️ **Security Features**

1. **JWT Authentication**: Access tokens (15min) + Refresh tokens (7 days)
2. **Rate Limiting**: 100 requests per 15 minutes per IP
3. **Input Validation**: Comprehensive request validation
4. **CORS**: Configured for mobile app origins
5. **Password Hashing**: bcrypt with salt rounds
6. **SQL Injection Protection**: Mongoose ODM
7. **File Upload Security**: File type/size validation

### 📱 **Mobile App Integration**

The API will be optimized for mobile apps with:

- **Pagination**: All list endpoints support pagination
- **Filtering**: Location-based task filtering
- **Offline Support**: Structured responses for caching
- **Push Notifications**: Integration ready endpoints
- **Image Optimization**: Cloudinary integration for photos

### 🔗 **Database Integration**

- **Reuse Existing Models**: Task, Contractor, Order models
- **New Collections**: ContractorAuth, RefreshTokens, TaskPhotos
- **Indexes**: Optimized for mobile queries (location, status, contractor)
- **Transactions**: For critical operations like task claiming

### 🚀 **Deployment Strategy**

1. **Development**: Run on port 4000 alongside Next.js (port 3000)
2. **Production**: Deploy to separate server/container
3. **Environment Variables**: Separate .env for API server
4. **Process Management**: PM2 for production
5. **Monitoring**: Health check endpoints

### 📊 **Performance Considerations**

- **Connection Pooling**: MongoDB connection optimization
- **Caching**: Redis for session management and frequent queries
- **Compression**: gzip compression for responses
- **Logging**: Structured logging with Winston
- **Metrics**: Prometheus metrics for monitoring

### 🧪 **Testing Strategy**

- **Unit Tests**: Controllers, services, utilities
- **Integration Tests**: API endpoints with test database
- **Authentication Tests**: JWT token validation
- **WebSocket Tests**: Real-time functionality
- **Load Tests**: Performance under mobile app load

### 📋 **Implementation Phases**

**Phase 1: Core Setup** (Day 1)

- Express.js server setup with TypeScript
- Database connection and model integration
- Basic authentication middleware
- Health check endpoints

**Phase 2: Authentication** (Day 2)

- Contractor registration/login
- JWT token management
- Password reset functionality
- Refresh token rotation

**Phase 3: Task Management** (Day 3)

- Available tasks endpoint with filtering
- Task claiming logic
- Status update endpoints
- Task completion with photos

**Phase 4: Real-time Features** (Day 4)

- WebSocket integration
- Real-time notifications
- Connection management
- Event broadcasting

**Phase 5: QuickBooks Integration** (Day 5)

- OAuth flow implementation
- W-9 form submission
- Contractor onboarding workflow
- Token management

**Phase 6: Testing & Optimization** (Day 6)

- Comprehensive testing
- Performance optimization
- Security audit
- Documentation

# MAY 28TH, 2025

## **Current Development Status: ~50% Complete**

### ✅ **What's Been Implemented (Phase 1 - Core Setup) - COMPLETE**

**Infrastructure & Setup:**

- ✅ Express.js server with TypeScript configuration
- ✅ All required dependencies installed (Express, Socket.io, JWT, bcrypt, SendGrid, etc.)
- ✅ Comprehensive middleware stack (CORS, helmet, compression, rate limiting)
- ✅ Database connection utility with MongoDB Atlas integration
- ✅ Winston logging system with structured logging
- ✅ Health check endpoint
- ✅ Socket.io WebSocket setup with basic connection handling
- ✅ Graceful shutdown handling
- ✅ Error handling middleware
- ✅ Environment configuration with .env and .env.example

**Authentication Foundation:**

- ✅ ContractorAuth model with full schema (password hashing, refresh tokens, QuickBooks integration)
- ✅ JWT utilities with complete token generation/verification
- ✅ Authentication middleware (token verification, optional auth, verification requirements)
- ✅ Auth routes with validation middleware integration

**Project Structure:**

- ✅ Well-organized directory structure matching the plan
- ✅ Controllers, routes, middleware, models, utils, and services directories created

### ✅ **What's Been Implemented (Phase 2 - Authentication Logic) - COMPLETE**

**Authentication System:**

- ✅ **Complete registration logic** with password validation and email verification
- ✅ **Login implementation** with credential verification and JWT token generation
- ✅ **Refresh token rotation logic** with database storage and validation
- ✅ **Password reset functionality** with secure token generation
- ✅ **Email verification system** with SendGrid integration
- ✅ **Comprehensive validation middleware** using Joi schemas
- ✅ **Email service** with professional HTML templates
- ✅ **Security features** including input sanitization, rate limiting, and CORS
- ✅ **Token utilities** for secure token generation and validation
- ✅ **Logout functionality** with refresh token invalidation

**Testing Results (All Passed):**

- ✅ Registration with valid/invalid data
- ✅ Login with valid/invalid credentials
- ✅ Token refresh and validation
- ✅ Password reset flow
- ✅ Protected endpoint authentication
- ✅ Input validation and sanitization
- ✅ Security middleware functionality

### ❌ **What's Missing (Major Implementation Needed)**

**Phase 3 - Task Management (100% remaining):**

- ❌ Task controllers and business logic
- ❌ Location-based filtering
- ❌ Task claiming mechanism
- ❌ Status update workflows
- ❌ Photo upload for task completion

**Phase 4 - Real-time Features (90% remaining):**

- ❌ WebSocket event handlers
- ❌ Real-time notification system
- ❌ Task broadcasting logic

**Phase 5 - QuickBooks Integration (100% remaining):**

- ❌ OAuth flow implementation
- ❌ W-9 form handling
- ❌ Token management

**Phase 6 - Testing & Services (80% remaining):**

- ❌ Service layer implementations
- ❌ Comprehensive automated testing suite
- ❌ Additional middleware (file upload, etc.)
- ✅ Validation schemas (authentication complete)

## 🚀 **Recommended Next Steps**

The authentication system is **production-ready** and fully functional! Next priorities:

1. **Build task management system** - Controllers, services, and business logic
2. **Add real-time features** - Complete WebSocket handlers
3. **Integrate QuickBooks** - OAuth and W-9 functionality
4. **Implement comprehensive testing** - Automated test suite
5. **Add file upload capabilities** - Photo upload for task completion
6. **Performance optimization** - Caching and monitoring
