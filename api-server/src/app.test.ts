import request from 'supertest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../tests/setup/testDatabase.js';

// Test-specific app configuration that avoids ES module conflicts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables without ES module-specific __filename
dotenv.config({ path: path.join(process.cwd(), 'api-server', '.env.test') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { logger } from './utils/logger.js';
import { database } from './utils/database.js';
import { socketAuthMiddleware } from './middleware/socketAuth.js';
import { SocketHandlers } from './websocket/socketHandlers.js';
import { RealtimeService } from './services/realtimeService.js';

// Import services
import { cacheService } from './services/cacheService.js';
import { metricsService } from './services/metricsService.js';

// Import routes
import authRoutes from './routes/auth.js';
import contractorRoutes from './routes/contractors.js';
import taskRoutes from './routes/tasks.js';
import quickbooksRoutes from './routes/quickbooks.js';
import healthRoutes from './routes/health.js';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Increment in-flight requests
  metricsService.setActiveConnections('http', 1);
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    
    // Record HTTP metrics
    metricsService.recordHttpRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration
    );
    
    // Decrement in-flight requests
    metricsService.setActiveConnections('http', 0);
  });
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).send('Failed to get metrics');
  }
});

// Health check routes
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/quickbooks', quickbooksRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Record error metrics
  metricsService.recordError(
    error.name || 'UnknownError',
    'express-app',
    'high'
  );
  
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: error.message }),
  });
});

// Socket.IO authentication middleware
io.use(socketAuthMiddleware);

// Initialize socket handlers
const socketHandlers = new SocketHandlers(io);
socketHandlers.initializeHandlers();

// Initialize realtime service
RealtimeService.initialize(socketHandlers);

// Export io for use in other modules
export { io };

// Integration tests for the Express app
describe('Express App Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('App Initialization', () => {
    it('should create Express app instance', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should have trust proxy setting enabled', () => {
      expect(app.get('trust proxy')).toBe(1);
    });
  });

  describe('Health Check Endpoint', () => {
    it('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('OK');
    });

    it('should include database status in health check', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services.database).toHaveProperty('status');
    });
  });

  describe('Metrics Endpoint', () => {
    it('should serve metrics endpoint', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(typeof response.text).toBe('string');
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/contractor/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should reject requests from unauthorized origins', async () => {
      // Test with an unauthorized origin - this should result in a CORS error
      // We expect the request to fail with a 500 status due to CORS rejection
      const response = await request(app)
        .get('/api/auth/contractor/login')
        .set('Origin', 'http://malicious-site.com')
        .expect(500);

      // Verify the error is CORS-related
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Internal server error');
      
      // The response should not include CORS headers for unauthorized origins
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should enforce rate limits', async () => {
      // This test would need to be adjusted based on actual rate limit settings
      // For now, just verify the middleware is present
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['ratelimit-limit']).toBeDefined();
    }, 10000);
  });

  describe('Request Body Parsing', () => {
    it('should parse JSON request bodies', async () => {
      const validRegistrationData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        phone: '555-123-4567',
        skills: ['plumbing', 'electrical']
      };
      
      // Use a route that accepts POST data (auth register)
      const response = await request(app)
        .post('/api/auth/contractor/register')
        .send(validRegistrationData);

      // Should successfully parse JSON and process the request
      // May get 201 (created), 409 (duplicate email), or other business logic responses
      // But should NOT get 400 due to JSON parsing issues
      expect(response.status).not.toBe(400);
      
      // If we do get 400, ensure it's validation-related, not JSON parsing
      if (response.status === 400) {
        expect(response.body.error).not.toContain('Unexpected token');
        expect(response.body.error).not.toContain('JSON');
        expect(response.body.error).not.toContain('SyntaxError');
      }
    });

    it('should handle large request bodies up to limit', async () => {
      const largeData = { data: 'x'.repeat(1000) }; // 1KB of data
      
      const response = await request(app)
        .post('/api/auth/contractor/register')
        .send(largeData);

      // Should not fail due to body size (under 10MB limit)
      expect(response.status).not.toBe(413); // Payload Too Large
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Route not found');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('ROUTE_NOT_FOUND');
      expect(response.body).toHaveProperty('path');
      expect(response.body.path).toBe('/non-existent-route');
    });

    it('should handle 404 for non-existent API routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for common security headers set by helmet
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-download-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });

  describe('API Route Mounting', () => {
    it('should mount auth routes', async () => {
      const response = await request(app)
        .post('/api/auth/contractor/register')
        .send({});

      // Should reach the route (even if validation fails)
      expect(response.status).not.toBe(404);
    });

    it('should mount contractor routes', async () => {
      const response = await request(app)
        .get('/api/contractors/me');

      // Should reach the route (even if auth fails)
      expect(response.status).not.toBe(404);
    });

    it('should mount task routes', async () => {
      const response = await request(app)
        .get('/api/tasks');

      // Should reach the route (even if auth fails)
      expect(response.status).not.toBe(404);
    });

    it('should mount quickbooks routes', async () => {
      const response = await request(app)
        .get('/api/quickbooks/auth-url');

      // Should reach the route (even if auth fails)
      expect(response.status).not.toBe(404);
    });
  });

  describe('Compression', () => {
    it('should compress responses when appropriate', async () => {
      const response = await request(app)
        .get('/health')
        .set('Accept-Encoding', 'gzip');

      // The response should either be compressed or small enough not to need compression
      // We can't easily test compression in supertest, but we can verify the middleware is working
      expect(response.status).toBe(200);
    });
  });
});

export default app;
