# Bounce Mobile API Server - Complete Deployment Documentation

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
4. [API Endpoints](#api-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Authentication](#authentication)
7. [Error Handling](#error-handling)
8. [Monitoring & Health Checks](#monitoring--health-checks)
9. [Security Configuration](#security-configuration)
10. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **MongoDB**: Local instance or MongoDB Atlas
- **Redis**: Optional but recommended for production
- **Docker**: Optional for containerized deployment

### Installation

```bash
# Clone and navigate to api-server
cd api-server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables (see Environment Setup section)
nano .env

# Build the application
npm run build

# Start development server
npm run dev

# Or start production server
npm start
```

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in the `api-server` directory with the following variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=4000

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bounce-mobile-api

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Bounce House Rentals

# File Upload Configuration (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# QuickBooks Integration
QUICKBOOKS_CLIENT_ID=your-quickbooks-client-id
QUICKBOOKS_CLIENT_SECRET=your-quickbooks-client-secret
QUICKBOOKS_REDIRECT_URI=https://yourdomain.com/api/quickbooks/callback
QUICKBOOKS_SCOPE=com.intuit.quickbooks.accounting
QUICKBOOKS_ENVIRONMENT=production

# Encryption Configuration (32 characters exactly)
ENCRYPTION_KEY=your-32-character-encryption-key-here
ENCRYPTION_ALGORITHM=aes-256-cbc

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis Configuration (Optional but recommended)
REDIS_URL=redis://localhost:6379
CACHE_PREFIX=bounce-api

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key

# Application URLs
API_BASE_URL=https://api.yourdomain.com
WEB_BASE_URL=https://yourdomain.com
```

### Environment Variable Details

| Variable                | Description                          | Required | Default     |
| ----------------------- | ------------------------------------ | -------- | ----------- |
| `NODE_ENV`              | Environment (development/production) | Yes      | development |
| `PORT`                  | Server port                          | No       | 4000        |
| `MONGODB_URI`           | MongoDB connection string            | Yes      | -           |
| `JWT_SECRET`            | JWT signing secret (min 32 chars)    | Yes      | -           |
| `JWT_REFRESH_SECRET`    | Refresh token secret (min 32 chars)  | Yes      | -           |
| `SENDGRID_API_KEY`      | SendGrid API key for emails          | Yes      | -           |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                | Yes      | -           |
| `QUICKBOOKS_CLIENT_ID`  | QuickBooks app client ID             | Yes      | -           |
| `ENCRYPTION_KEY`        | 32-character encryption key          | Yes      | -           |
| `REDIS_URL`             | Redis connection URL                 | No       | -           |

## 🐳 Deployment Options

### Option 1: Docker Deployment (Recommended)

```bash
# Build Docker image
docker build -t bounce-mobile-api .

# Run with environment file
docker run -d \
  --name bounce-api \
  -p 4000:4000 \
  --env-file .env \
  bounce-mobile-api

# Or use docker-compose
cat > docker-compose.yml << EOF
version: '3.8'
services:
  api:
    build: .
    ports:
      - "4000:4000"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF

docker-compose up -d
```

### Option 2: PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Option 3: Manual Deployment Script

```bash
# Use the provided deployment script
chmod +x scripts/deploy.sh

# Deploy to production
./scripts/deploy.sh -e production

# Deploy to staging
./scripts/deploy.sh -e staging

# Deploy with options
./scripts/deploy.sh -e production --skip-tests
```

## 📡 API Endpoints

### Base URL

- **Development**: `http://localhost:4000`
- **Production**: `https://your-api-domain.com`

### Authentication Endpoints

#### Register Contractor

```http
POST /api/auth/contractor/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePassword123!",
  "skills": ["delivery", "setup"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "contractor": {
      "id": "contractor_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "skills": ["delivery", "setup"],
      "isVerified": false
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  },
  "message": "Registration successful. Please check your email for verification."
}
```

#### Login Contractor

```http
POST /api/auth/contractor/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### Refresh Token

```http
POST /api/auth/contractor/refresh
Content-Type: application/json

{
  "refreshToken": "jwt_refresh_token"
}
```

#### Logout

```http
POST /api/auth/contractor/logout
Authorization: Bearer jwt_access_token
```

### Task Management Endpoints

#### Get Available Tasks

```http
GET /api/tasks/available?skills=delivery,setup&lat=29.4241&lng=-98.4936&radius=50&page=1&limit=20
Authorization: Bearer jwt_access_token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_id",
        "title": "Bounce House Delivery",
        "description": "Deliver and setup bounce house",
        "location": {
          "type": "Point",
          "coordinates": [-98.4936, 29.4241]
        },
        "address": "123 Main St, San Antonio, TX",
        "skillsRequired": ["delivery", "setup"],
        "status": "Pending",
        "scheduledDate": "2025-05-29T10:00:00.000Z",
        "estimatedDuration": 120,
        "compensation": {
          "baseAmount": 75.0,
          "bonuses": [],
          "totalAmount": 75.0,
          "currency": "USD",
          "paymentMethod": "direct_deposit",
          "paymentSchedule": "weekly"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

#### Get My Tasks

```http
GET /api/tasks/my-tasks?status=assigned&page=1&limit=20
Authorization: Bearer jwt_access_token
```

#### Claim Task

```http
POST /api/tasks/{task_id}/claim
Authorization: Bearer jwt_access_token
```

#### Update Task Status

```http
PUT /api/tasks/{task_id}/status
Authorization: Bearer jwt_access_token
Content-Type: application/json

{
  "status": "In Progress"
}
```

#### Complete Task

```http
POST /api/tasks/{task_id}/complete
Authorization: Bearer jwt_access_token
Content-Type: multipart/form-data

notes: "Task completed successfully"
photos: [file1.jpg, file2.jpg]
```

### Task Payment Management Endpoints

#### Update Task Payment Amount

```http
PUT /api/tasks/{task_id}/payment
Authorization: Bearer jwt_access_token
Content-Type: application/json

{
  "paymentAmount": 125.50,
  "changeReason": "Adjusted for additional equipment"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task_id",
      "paymentAmount": 125.5,
      "updatedAt": "2025-06-01T21:00:00.000Z"
    },
    "paymentHistory": {
      "id": "history_id",
      "taskId": "task_id",
      "previousAmount": 75.0,
      "newAmount": 125.5,
      "changedBy": "admin_user_id",
      "changeReason": "Adjusted for additional equipment",
      "timestamp": "2025-06-01T21:00:00.000Z"
    }
  },
  "message": "Payment amount updated successfully"
}
```

#### Get Task Payment History

```http
GET /api/tasks/{task_id}/payment/history
Authorization: Bearer jwt_access_token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "history_id_1",
        "taskId": "task_id",
        "previousAmount": null,
        "newAmount": 75.0,
        "changedBy": "admin_user_id",
        "changeReason": "Initial payment amount set",
        "timestamp": "2025-05-28T10:00:00.000Z"
      },
      {
        "id": "history_id_2",
        "taskId": "task_id",
        "previousAmount": 75.0,
        "newAmount": 125.5,
        "changedBy": "admin_user_id",
        "changeReason": "Adjusted for additional equipment",
        "timestamp": "2025-06-01T21:00:00.000Z"
      }
    ],
    "totalChanges": 2
  }
}
```

#### Generate Payment Reports

```http
GET /api/tasks/payment-reports?startDate=2025-05-01&endDate=2025-05-31&status=Completed&contractorId=contractor_id&format=json
Authorization: Bearer jwt_access_token
```

**Query Parameters:**

| Parameter      | Type   | Description                       | Required |
| -------------- | ------ | --------------------------------- | -------- |
| `startDate`    | string | Start date (YYYY-MM-DD)           | Yes      |
| `endDate`      | string | End date (YYYY-MM-DD)             | Yes      |
| `status`       | string | Task status filter                | No       |
| `contractorId` | string | Filter by specific contractor     | No       |
| `format`       | string | Response format (json/csv)        | No       |
| `groupBy`      | string | Group by (status/contractor/date) | No       |

**Response:**

```json
{
  "success": true,
  "data": {
    "report": {
      "summary": {
        "totalTasks": 45,
        "totalPaymentAmount": 3375.0,
        "averagePaymentAmount": 75.0,
        "tasksWithPayment": 42,
        "tasksWithoutPayment": 3
      },
      "breakdown": {
        "byStatus": {
          "Completed": {
            "count": 30,
            "totalAmount": 2250.0,
            "averageAmount": 75.0
          },
          "In Progress": {
            "count": 10,
            "totalAmount": 750.0,
            "averageAmount": 75.0
          },
          "Pending": {
            "count": 5,
            "totalAmount": 375.0,
            "averageAmount": 75.0
          }
        },
        "byContractor": [
          {
            "contractorId": "contractor_1",
            "contractorName": "John Doe",
            "taskCount": 15,
            "totalAmount": 1125.0,
            "averageAmount": 75.0
          }
        ]
      },
      "tasks": [
        {
          "id": "task_id",
          "title": "Bounce House Delivery",
          "status": "Completed",
          "paymentAmount": 75.0,
          "contractorName": "John Doe",
          "completedDate": "2025-05-28T15:30:00.000Z"
        }
      ]
    },
    "generatedAt": "2025-06-01T21:00:00.000Z",
    "reportPeriod": {
      "startDate": "2025-05-01",
      "endDate": "2025-05-31"
    }
  }
}
```

#### Clear Task Payment Amount

```http
DELETE /api/tasks/{task_id}/payment
Authorization: Bearer jwt_access_token
Content-Type: application/json

{
  "changeReason": "Payment amount no longer applicable"
}
```

### QuickBooks Integration Endpoints

#### Connect to QuickBooks

```http
POST /api/quickbooks/connect
Authorization: Bearer jwt_access_token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "authUrl": "https://appcenter.intuit.com/connect/oauth2?..."
  }
}
```

#### Submit W-9 Form

```http
POST /api/quickbooks/w9/submit
Authorization: Bearer jwt_access_token
Content-Type: application/json

{
  "taxClassification": "individual",
  "name": "John Doe",
  "businessName": "",
  "taxId": "123-45-6789",
  "address": {
    "street": "123 Main St",
    "city": "San Antonio",
    "state": "TX",
    "zipCode": "78201"
  },
  "signature": "John Doe",
  "signatureDate": "2025-05-28"
}
```

#### Download W-9 PDF

```http
GET /api/quickbooks/w9/download
Authorization: Bearer jwt_access_token
```

### Health & Monitoring Endpoints

#### Basic Health Check

```http
GET /health
```

#### Detailed Health Check

```http
GET /health/detailed
```

#### Prometheus Metrics

```http
GET /metrics
```

## 🔄 WebSocket Events

### Connection

```javascript
const socket = io("ws://localhost:4000", {
  auth: {
    token: "jwt_access_token",
  },
});
```

### Event Types

#### Task Events

- `task:new` - New task available
- `task:assigned` - Task assigned to contractor
- `task:updated` - Task status updated
- `task:claimed` - Task claimed by another contractor
- `task:completed` - Task marked as completed
- `task:cancelled` - Task cancelled

#### Notification Events

- `notification:system` - System-wide notifications
- `notification:personal` - Personal notifications

#### Connection Events

- `connection:established` - Connection confirmed
- `ping` / `pong` - Heartbeat mechanism

### Example Usage

```javascript
// Listen for new tasks
socket.on("task:new", (task) => {
  console.log("New task available:", task);
});

// Listen for personal notifications
socket.on("notification:personal", (notification) => {
  console.log("Personal notification:", notification);
});

// Update location
socket.emit("contractor:location-update", {
  lat: 29.4241,
  lng: -98.4936,
});
```

## 🔐 Authentication

### JWT Token Structure

**Access Token** (15 minutes):

```json
{
  "contractorId": "contractor_id",
  "email": "john@example.com",
  "name": "John Doe",
  "isVerified": true,
  "iat": 1640995200,
  "exp": 1640996100
}
```

**Refresh Token** (7 days):

```json
{
  "contractorId": "contractor_id",
  "type": "refresh",
  "iat": 1640995200,
  "exp": 1641600000
}
```

### Authentication Flow

1. **Register/Login** → Receive access + refresh tokens
2. **API Requests** → Include `Authorization: Bearer {access_token}`
3. **Token Expires** → Use refresh token to get new access token
4. **Logout** → Invalidate refresh token

### Headers Required

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

## 🚨 Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2025-05-28T21:00:00.000Z"
}
```

### Common Error Codes

| Code                  | Status | Description                                    |
| --------------------- | ------ | ---------------------------------------------- |
| `VALIDATION_ERROR`    | 400    | Invalid input data                             |
| `UNAUTHORIZED`        | 401    | Invalid or missing token                       |
| `FORBIDDEN`           | 403    | Insufficient permissions                       |
| `NOT_FOUND`           | 404    | Resource not found                             |
| `CONFLICT`            | 409    | Resource conflict (e.g., task already claimed) |
| `RATE_LIMIT_EXCEEDED` | 429    | Too many requests                              |
| `INTERNAL_ERROR`      | 500    | Server error                                   |

## 📊 Monitoring & Health Checks

### Health Check Endpoints

#### Basic Health Check

```http
GET /health
```

Returns basic server status for load balancers.

#### Detailed Health Check

```http
GET /health/detailed
```

Returns comprehensive system status including:

- Database connectivity
- Cache status
- External service configuration
- System metrics
- Performance data

#### Kubernetes Probes

```http
GET /health/ready   # Readiness probe
GET /health/live    # Liveness probe
```

### Prometheus Metrics

Access metrics at `/metrics` endpoint:

**Key Metrics:**

- `bounce_api_http_requests_total` - HTTP request count
- `bounce_api_http_request_duration_seconds` - Request duration
- `bounce_api_db_queries_total` - Database query count
- `bounce_api_auth_attempts_total` - Authentication attempts
- `bounce_api_websocket_connections_active` - Active WebSocket connections
- `bounce_api_errors_total` - Error count by type

### Logging

Logs are structured JSON format:

```json
{
  "level": "info",
  "message": "POST /api/auth/contractor/login",
  "timestamp": "2025-05-28T21:00:00.000Z",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "duration": 150
}
```

## 🔒 Security Configuration

### Security Headers

- **Helmet.js**: Comprehensive security headers
- **CORS**: Configurable origin restrictions
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi schema validation

### Data Protection

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Secrets**: Minimum 32 characters
- **Encryption**: AES-256-CBC for sensitive data
- **SQL Injection**: Mongoose ODM protection

### File Upload Security

- **File Type Validation**: Images only
- **Size Limits**: 10MB per file, 5 files max
- **Cloudinary Integration**: Secure cloud storage

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check MongoDB URI
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI"

# Check network access (for Atlas)
curl -I https://cloud.mongodb.com
```

#### 2. JWT Token Errors

```bash
# Verify JWT secrets are set and minimum 32 characters
echo $JWT_SECRET | wc -c
echo $JWT_REFRESH_SECRET | wc -c

# Check token format in requests
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/tasks/my-tasks
```

#### 3. Email Delivery Issues

```bash
# Verify SendGrid configuration
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json"
```

#### 4. File Upload Problems

```bash
# Check Cloudinary configuration
curl "https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/image/upload" \
  -X POST \
  -F "file=@test.jpg" \
  -F "api_key=$CLOUDINARY_API_KEY" \
  -F "timestamp=$(date +%s)" \
  -F "signature=CALCULATED_SIGNATURE"
```

#### 5. Redis Connection Issues

```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping

# Check if Redis is optional
# Server will work without Redis but with reduced performance
```

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development npm run dev
```

### Log Analysis

View PM2 logs:

```bash
pm2 logs bounce-mobile-api
pm2 logs bounce-mobile-api --lines 100
```

View Docker logs:

```bash
docker logs bounce-api
docker logs -f bounce-api  # Follow logs
```

### Performance Issues

Check metrics:

```bash
curl http://localhost:4000/metrics | grep bounce_api_http_request_duration
curl http://localhost:4000/health/detailed
```

Monitor PM2:

```bash
pm2 monit
```

### Database Performance

Check MongoDB slow queries:

```javascript
// In MongoDB shell
db.setProfilingLevel(2, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(5);
```

## 📞 Support

### Getting Help

1. **Check Logs**: Always check application logs first
2. **Health Endpoints**: Use `/health/detailed` for system status
3. **Metrics**: Monitor `/metrics` for performance issues
4. **Documentation**: Refer to this documentation and README.md

### Useful Commands

```bash
# Check server status
curl http://localhost:4000/health

# Test authentication
curl -X POST http://localhost:4000/api/auth/contractor/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Monitor logs
tail -f logs/app.log

# Check PM2 status
pm2 status

# Restart application
pm2 restart bounce-mobile-api

# View environment variables
pm2 env 0
```

---

## 🎉 Deployment Checklist

Before going to production:

- [ ] Set strong JWT secrets (32+ characters)
- [ ] Configure production MongoDB URI
- [ ] Set up SendGrid for email delivery
- [ ] Configure Cloudinary for file uploads
- [ ] Set up QuickBooks app credentials
- [ ] Generate 32-character encryption key
- [ ] Configure CORS for your domain
- [ ] Set up Redis for caching (recommended)
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and alerting
- [ ] Test all API endpoints
- [ ] Verify WebSocket connections
- [ ] Test file upload functionality
- [ ] Verify email delivery
- [ ] Test QuickBooks integration
- [ ] Run load tests
- [ ] Set up backup procedures
- [ ] Configure log rotation
- [ ] Set up health check monitoring

**The Bounce Mobile API Server is now ready for production deployment!**
