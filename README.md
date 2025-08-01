# Bounce v3

A modern web application built with Next.js, React, and TypeScript, featuring a comprehensive suite of features for business management and customer engagement.

## Tech Stack

### Core Framework

- **Frontend Framework**: React 19.0.0 with TypeScript 5
- **Framework**: Next.js 15.2.3
- **Build Tool**: Turbopack (experimental)
- **Styling**: TailwindCSS 3.4.1 with aspect-ratio plugin
- **Typography**: Geist and Geist_Mono fonts
- **Icons**: Lucide React 0.469.0

### Development Tools

- **Linting**: ESLint 9 with Next.js configuration
- **Formatting**: Prettier 3.4.2
- **Testing**: Jest 29.7.0 and React Testing Library 16.1.0
- **Type Checking**: TypeScript with strict configuration

### Backend & Database

- **Database**: MongoDB with Mongoose 8.12.1
- **Authentication**: NextAuth.js 4.24.11 with JWT
- **Password Hashing**: bcryptjs 3.0.2
- **Rate Limiting**: express-rate-limit 7.5.0

### External Services

- **Cloud Storage**: Cloudinary 2.6.0 for media management
- **Email Service**: SendGrid 8.1.5 for transactional emails
- **SMS Service**: Twilio 5.5.0 for notifications
- **Payment Processing**: PayPal React SDK 8.8.3
- **Analytics**: Google Analytics and Google Tag Manager
- **Maps & Routing**: Leaflet 1.9.4 with React-Leaflet 5.0.0
- **Route Optimization**: OpenRouteService API

### UI & Interaction Libraries

- **Charts**: Chart.js 4.4.8 with React-ChartJS-2 5.3.0
- **Calendar**: React Big Calendar 1.18.0
- **Date Handling**: Date-fns 4.1.0 and Moment.js 2.30.1
- **Drag & Drop**: DnD Kit 6.3.1
- **Modals**: React Modal 3.16.3
- **Notifications**: React Hot Toast 2.5.2
- **Form Controls**: React DatePicker 8.2.1

### Development Dependencies

- **Testing Utilities**: MongoDB Memory Server 10.1.4
- **Build Tools**: Babel, PostCSS, ts-node
- **Code Quality**: ESLint, Prettier, TypeScript

### Deployment

- **Platform**: Vercel
- **CI/CD**: GitHub Actions

## Features

### Core Business Features

- **Blog Management**: Full-featured blog system with rich text editing and image uploads
- **Product Management**: Product catalog with detailed views, admin controls, and availability tracking
- **Product Availability**: Interactive calendar showing product availability by date with color-coded status
- **Contact System**: Contact forms with admin management interface and automated notifications
- **Order Management**: Complete order lifecycle from creation to fulfillment with PayPal integration
- **Party Packages**: Pre-configured package deals with automatic pricing and savings calculations
- **Customer Reviews**: Display and management of customer feedback with rating system
- **Promotional System**: Promo opt-ins with targeted campaigns and visibility controls

### Advanced Analytics & Insights

- **Analytics Dashboard**: Comprehensive analytics with revenue tracking, booking trends, and product popularity
- **Form Engagement Analytics**: Track user interactions across different forms with conversion funnel analysis
- **Search Rankings Tracking**: Monitor SEO performance and competitor analysis
- **Visitor Analytics**: Track user behavior, device fingerprinting, and engagement metrics
- **Business Intelligence**: KPI tracking, seasonal analysis, and forecasting capabilities
- **Calendar View**: Visual calendar for tracking bookings with color-coded status indicators

### Technical Features

- **Authentication & Authorization**: Unified NextAuth.js-based authentication with comprehensive role-based access control:

  - **NextAuth.js Integration**: Exclusive use of NextAuth.js 4.24.11 for all web authentication
  - **JWT Strategy**: Secure JWT-based session management with configurable token expiration
  - **Session Validation**: Consistent user ID validation across all API routes
  - **Secure Password Hashing**: bcryptjs integration with pre-save hooks
  - **Rate Limiting**: Built-in protection against brute force attacks
  - **Role-based Access Control (RBAC)** at multiple levels:
    - **Database Level**: User model with enum role validation (`admin`, `customer`, `user`)
    - **API Level**: Role-based middleware (`withRoleAuth`, `withAdminAuth`, `withUserAuth`)
    - **UI Level**: Conditional rendering based on user role with type safety
    - **Application Level**: Route protection in Next.js middleware
  - **Type Safety**: Consistent role types derived from User model across the application
  - **Error Handling**: Standardized 401/403 responses with descriptive error messages

- **Route Optimization**: Delivery route planning with OpenRouteService integration
- **Mobile Authentication**: Dedicated mobile API endpoints with device-specific authentication
- **Testing Infrastructure**: Comprehensive test suite with console utilities and debugging tools
- **Performance Monitoring**: Advanced analytics tracking and performance optimization

### User Experience Features

- **Responsive Design**: Mobile-friendly interface with modern UI components
- **Interactive Maps**: Leaflet-based mapping for delivery areas and route visualization
- **Drag & Drop Interface**: DnD Kit integration for intuitive admin interfaces
- **Real-time Notifications**: Toast notifications and email/SMS alerts
- **Package Deals Visibility**: First-time visitors don't see "Package Deals" in navigation until they interact with a promotional popup:
  - Context-based state management for immediate UI updates without page refresh
  - Cookie-based persistence for returning visitors
  - Promotional popup with form submission to unlock Package Deals
  - Comprehensive test coverage for visibility conditions

### SEO & Marketing

- **SEO Optimization**: Comprehensive metadata, OpenGraph, and Twitter cards
- **Structured Data**: JsonLd implementation for improved search engine visibility
- **Analytics Integration**: Google Analytics and Google Tag Manager with custom event tracking
- **Search Engine Monitoring**: Automated search ranking tracking and competitor analysis
- **Legal Compliance**: Privacy Policy and Terms of Service pages

### Payment & Communication

- **PayPal Integration**: Secure payment processing with PayPal React SDK
- **Email Notifications**: SendGrid integration for transactional emails
- **SMS Notifications**: Twilio integration for order updates and alerts
- **Multi-step Checkout**: Guided checkout process with progress tracking

### Agreement Management & Digital Signatures

- **DocuSeal Integration**: Complete digital signature workflow for rental agreements
- **Automated Agreement Generation**: Dynamic agreement creation with order-specific details
- **Real-time Status Tracking**: Live updates when customers view, sign, or decline agreements
- **Delivery Protection**: Automatic delivery blocking until agreements are signed
- **Batch Status Synchronization**: One-click sync for all pending agreements
- **Email Notifications**: Branded email templates with signing links and reminders

### Customer Relationship Management

- **Kudos Email System**: Personalized follow-up email system to maintain positive customer relationships and encourage Google reviews:

  - **Admin Dashboard**: Comprehensive interface at `/admin/kudos` for managing customer follow-up emails
  - **Smart Customer Detection**: Automatically identifies eligible customers from recent orders and contacts
  - **Intelligent Name Resolution**: Uses actual customer names from database records, with professional fallback for missing names
  - **Claude AI Integration**: Leverages Claude Sonnet 4 to generate personalized, warm thank-you emails
  - **Customizable Templates**: Three-field input system for positive comments that get naturally incorporated into emails
  - **Google Review Integration**: Includes clear call-to-action for 5-star Google reviews with direct review links
  - **Email Tracking**: Comprehensive tracking of sent emails with timestamps and status monitoring
  - **Duplicate Prevention**: Prevents sending multiple kudos emails to the same customer
  - **Professional Email Delivery**: SendGrid integration for reliable email delivery
  - **Filtering & Pagination**: Advanced filtering by date range, email status, and customer type
  - **Name Validation**: Robust validation ensures only quality customer names are used for personalization

- **AI-Powered Marketing Email Campaign System**: Comprehensive email marketing platform leveraging Claude 4 API and SendGrid integration:
  - **Campaign Management Dashboard**: Full-featured interface at `/admin/marketing-emails` for creating, managing, and analyzing email campaigns
  - **AI Content Generation**: Claude 4 API integration for generating personalized email content based on campaign parameters
  - **Multi-Source Recipient Management**: Automatically aggregates recipients from contacts, orders, and promo opt-ins collections with deduplication
  - **Advanced Filtering & Targeting**: Filter recipients by date range, consent status, order history, and source collection
  - **Campaign Creation Wizard**: Multi-step campaign creation process with AI assistance and content preview
  - **Template System**: Support for promotional, seasonal, product announcement, and custom email templates
  - **Test Mode**: Safe testing functionality to send campaigns to admin email before full deployment
  - **Bulk Email Delivery**: SendGrid integration with rate limiting and batch processing for reliable delivery
  - **Real-time Analytics**: Comprehensive tracking of delivery rates, open rates, click rates, and recipient engagement
  - **Campaign Status Tracking**: Monitor campaigns through draft, sending, completed, and failed states
  - **Compliance Features**: Automatic unsubscribe links, consent respect, and GDPR compliance
  - **Campaign History**: Complete audit trail with timestamps, recipient lists, and performance metrics
  - **Edit & Resend**: Full CRUD operations for draft campaigns with content regeneration capabilities

## API Routes

The application provides a comprehensive RESTful API with the following endpoints:

### Users API

- `POST /api/v1/users/login` - Authenticate user and retrieve JWT token
- `POST /api/v1/users/register` - Register a new user account
- `GET /api/v1/users/profile` - Retrieve the authenticated user's profile
- `PUT /api/v1/users/profile` - Update the authenticated user's profile

### Products API

- `GET /api/v1/products` - Retrieve all products
  - Query parameters:
    - `category`: Filter by product category
    - `search`: Search products by text
    - `availability`: Filter by availability status
    - `limit`: Number of products per page (default: 10)
    - `page`: Page number for pagination (default: 1)
- `GET /api/v1/products/:slug` - Retrieve a specific product by slug
- `POST /api/v1/products` - Create a new product (admin only)
- `PUT /api/v1/products/:slug` - Update a product by slug (admin only)
- `DELETE /api/v1/products/:slug` - Delete a product by slug (admin only)
- `GET /api/v1/products/availability` - Check product availability for a specific date
  - Query parameters:
    - `productId`: The ID of the product to check (alternative to slug)
    - `slug`: The slug of the product to check (alternative to productId)
    - `date`: The date to check availability for (YYYY-MM-DD format)
  - Response format:
    ```json
    {
      "available": true,
      "product": {
        "name": "Bounce House",
        "slug": "bounce-house",
        "status": "available"
      }
    }
    ```
    or if unavailable:
    ```json
    {
      "available": false,
      "product": {
        "name": "Bounce House",
        "slug": "bounce-house",
        "status": "available"
      },
      "reason": "Product is already booked for this date"
    }
    ```

### Blogs API

- `GET /api/v1/blogs` - Retrieve all blog posts
  - Query parameters:
    - `category`: Filter by blog category
    - `tag`: Filter by blog tag
    - `search`: Search blogs by text
    - `status`: Filter by status (published, draft, archived)
    - `limit`: Number of blogs per page (default: 10)
    - `page`: Page number for pagination (default: 1)
  - Response format:
    ```json
    {
      "blogs": [
        {
          "_id": "67d9dcc99a94b06936b304c7",
          "title": "Sample Blog Post",
          "slug": "sample-blog-post",
          "author": "6382a44a44b6735842231ed2",
          "introduction": "This is a sample introduction.",
          "body": "This is the main content of the blog post.",
          "conclusion": "This is the conclusion of the blog post.",
          "status": "published",
          "publishDate": "2025-03-18T20:51:21.719Z",
          "categories": ["test"],
          "tags": ["sample"],
          "readTime": 1,
          "meta": { "views": 0, "likes": 0, "shares": 0 }
        }
      ],
      "pagination": {
        "total": 42,
        "page": 1,
        "limit": 10,
        "pages": 5
      }
    }
    ```
- `GET /api/v1/blogs/:slug` - Retrieve a specific blog post by slug
- `POST /api/v1/blogs` - Create a new blog post (authenticated users only)
  - Required fields: `title`, `introduction`, `body`, `conclusion`
  - Optional fields: `excerpt`, `categories`, `tags`, `status`, `featuredImage`
  - Authentication: JWT token in Authorization header
- `PUT /api/v1/blogs/:slug` - Update a blog post by slug (author or admin only)
- `DELETE /api/v1/blogs/:slug` - Delete a blog post by slug (author or admin only)
- `POST /api/v1/blogs/:slug/images` - Upload an image to a blog post (author or admin only)
- `DELETE /api/v1/blogs/:slug/images/:filename` - Delete an image from a blog post (author or admin only)

#### Development Scripts for Blogs

The project includes development scripts to help with blog creation and testing:

- `scripts/create-dev-blog.js` - Creates a sample blog post with authentication for development purposes
- `create-blog.js` - Another example script for blog creation with JWT authentication

To use these scripts:

```bash
# Install required dependencies
npm install jsonwebtoken @types/jsonwebtoken

# Run the development script
node scripts/create-dev-blog.js
```

### Contacts API

- `GET /api/v1/contacts` - Retrieve all contact requests (authenticated users only)
  - Query parameters:
    - `startDate`: Filter by start date
    - `endDate`: Filter by end date
    - `confirmed`: Filter by confirmation status
    - `limit`: Number of contacts per page (default: 50)
    - `page`: Page number for pagination (default: 1)
- `GET /api/v1/contacts/:id` - Retrieve a specific contact request by ID (authenticated users only)
- `POST /api/v1/contacts` - Create a new contact request (public)
- `PUT /api/v1/contacts/:id` - Update a contact request by ID (authenticated users only)
- `DELETE /api/v1/contacts/:id` - Delete a contact request by ID (admin only)

### Reviews API

- `GET /api/v1/reviews` - Retrieve all customer reviews
  - Query parameters:
    - `placeId`: Filter by place ID
    - `limit`: Number of reviews per page (default: 10)
    - `page`: Page number for pagination (default: 1)
  - Response format:
    ```json
    {
      "reviews": [
        {
          "_id": "65f9d8c1e0f5a123456789ab",
          "placeId": "place123",
          "reviewId": "review123",
          "authorName": "John Doe",
          "rating": 5,
          "text": "Great service!",
          "time": "2025-03-18T15:30:00.000Z",
          "likes": 10,
          "isLocalGuide": false,
          "createdAt": "2025-03-18T15:30:00.000Z",
          "updatedAt": "2025-03-18T15:30:00.000Z"
        }
      ],
      "pagination": {
        "total": 42,
        "page": 1,
        "limit": 10,
        "pages": 5
      }
    }
    ```
- `GET /api/v1/reviews/:id` - Retrieve a specific customer review by ID
- `POST /api/v1/reviews` - Create a new customer review (authenticated users only)
  - Required fields: `placeId`, `authorName`, `rating`, `text`
  - Optional fields: `authorUrl`, `profilePhotoUrl`, `language`, `isLocalGuide`
- `PUT /api/v1/reviews/:id` - Update a customer review by ID (owner or admin only)
- `DELETE /api/v1/reviews/:id` - Delete a customer review by ID (owner or admin only)

### Party Packages API

- `GET /api/v1/partypackages` - Retrieve all party packages
  - Query parameters:
    - `search`: Search packages by text
    - `limit`: Number of packages per page (default: 10)
    - `page`: Page number for pagination (default: 1)
  - Response format:
    ```json
    {
      "packages": [
        {
          "_id": "67e4e8139915f2580aa94478",
          "id": "dual-waterslide-extravaganza",
          "slug": "dual-waterslide-extravaganza",
          "name": "Dual Waterslide Extravaganza",
          "description": "Double the slides, double the fun! Perfect for larger water parties",
          "items": [
            {
              "id": "67e4bfd24af754a5a42bfcf1",
              "name": "Blue Double Lane Waterslide",
              "quantity": 1
            },
            {
              "id": "67e4bfd24af754a5a42bfcf2",
              "name": "Pink Waterslide",
              "quantity": 1
            },
            {
              "id": "67e4bfd24af754a5a42bfcf6",
              "name": "Tables and Chairs",
              "quantity": 3
            }
          ],
          "totalRetailPrice": 859.7,
          "packagePrice": 649.95,
          "savings": 209.75,
          "savingsPercentage": 24,
          "recommendedPartySize": {
            "min": 20,
            "max": 50
          },
          "ageRange": {
            "min": 5,
            "max": 99
          },
          "duration": "full-day",
          "spaceRequired": "70x40 feet minimum",
          "powerRequired": true,
          "seasonalRestrictions": "Temperature must be above 75°F",
          "createdAt": "2025-03-27T05:54:27.153Z",
          "updatedAt": "2025-03-27T05:54:27.153Z"
        }
      ],
      "total": 5
    }
    ```
- `GET /api/v1/partypackages/:slug` - Retrieve a specific party package by slug
- `POST /api/v1/partypackages` - Create a new party package (admin only)
  - Required fields: `id`, `name`, `description`, `items`, `totalRetailPrice`, `packagePrice`, `savings`, `savingsPercentage`, `recommendedPartySize`, `ageRange`, `duration`, `spaceRequired`, `powerRequired`
  - Optional fields: `seasonalRestrictions`
- `PUT /api/v1/partypackages/:id` - Update a party package by ID (admin only)
- `DELETE /api/v1/partypackages/:id` - Delete a party package by ID (admin only)

### Promo Opt-ins API

- `GET /api/v1/promo-optins` - Retrieve all promotional opt-ins (authenticated users only)
  - Query parameters:
    - `email`: Filter by email address
    - `promoName`: Filter by promotion name
    - `startDate`: Filter by start date
    - `endDate`: Filter by end date
    - `search`: Search by name or email
    - `limit`: Number of opt-ins per page (default: 25)
    - `page`: Page number for pagination (default: 1)
  - Response format:
    ```json
    {
      "promoOptins": [
        {
          "_id": "67d9dcc99a94b06936b304c8",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "555-123-4567",
          "promoName": "Summer Special",
          "consentToContact": true,
          "createdAt": "2025-04-08T15:30:00.000Z",
          "updatedAt": "2025-04-08T15:30:00.000Z"
        }
      ],
      "pagination": {
        "total": 42,
        "page": 1,
        "limit": 25,
        "pages": 2
      }
    }
    ```
- `GET /api/v1/promo-optins/:id` - Retrieve a specific promo opt-in by ID (authenticated users only)
- `POST /api/v1/promo-optins` - Create a new promo opt-in (public)
  - Required fields: `name`, `email`, `promoName`, `consentToContact`
  - Optional fields: `phone`
- `PUT /api/v1/promo-optins/:id` - Update a promo opt-in by ID (authenticated users only)
- `DELETE /api/v1/promo-optins/:id` - Delete a promo opt-in by ID (authenticated users only)

### Orders API

- `GET /api/v1/orders` - Retrieve all orders (authenticated users only)
  - Query parameters:
    - `startDate`: Filter orders created on or after this date (ISO format)
    - `endDate`: Filter orders created on or before this date (ISO format)
    - `status`: Filter orders by status
    - `paymentStatus`: Filter orders by payment status
    - `contactId`: Filter orders by contact ID
    - `orderNumber`: Filter orders by order number
  - Response format:
    ```json
    {
      "orders": [
        {
          "_id": "60d21b4667d0d8992e610c85",
          "orderNumber": "BB-2024-0001",
          "contactId": "60d21b4667d0d8992e610c84",
          "items": [
            {
              "type": "bouncer",
              "name": "Test Bouncer",
              "quantity": 1,
              "unitPrice": 150,
              "totalPrice": 150
            }
          ],
          "subtotal": 150,
          "taxAmount": 12.38,
          "discountAmount": 0,
          "deliveryFee": 20,
          "processingFee": 4.5,
          "totalAmount": 186.88,
          "depositAmount": 50,
          "balanceDue": 136.88,
          "status": "Pending",
          "paymentStatus": "Pending",
          "paymentMethod": "paypal",
          "tasks": ["Delivery", "Setup", "Pickup"],
          "agreementStatus": "not_sent",
          "agreementSentAt": null,
          "agreementSignedAt": null,
          "deliveryBlocked": false,
          "docusealSubmissionId": null,
          "createdAt": "2024-04-14T15:00:00.000Z",
          "updatedAt": "2024-04-14T15:00:00.000Z"
        }
      ]
    }
    ```
- `GET /api/v1/orders/:id` - Retrieve a specific order by ID (authenticated users only)
- `POST /api/v1/orders` - Create a new order (public)
  - Required fields: `items`, `paymentMethod`
  - Either `contactId` or `customerEmail` must be provided
  - Optional fields: `taxAmount`, `discountAmount`, `deliveryFee`, `depositAmount`, `notes`, `tasks`
  - Auto-calculated fields: `subtotal`, `processingFee`, `totalAmount`, `balanceDue`, `orderNumber`
- `PUT /api/v1/orders/:id` - Update an order by ID (authenticated users only)
- `DELETE /api/v1/orders/:id` - Delete an order by ID (authenticated users only)
  - Restrictions: Cannot delete orders with status "Paid" or "Confirmed"
- `POST /api/v1/orders/:id/payment` - Initiate payment for an order
  - Required fields: `amount`
- `PATCH /api/v1/orders/:id/payment` - Record payment transaction for an order
  - Required fields: `transactionId`, `amount`, `status`
  - Optional fields: `payerId`, `payerEmail`, `currency`

#### Agreement Management API

- `POST /api/v1/orders/:id/send-agreement` - Send rental agreement to customer
  - Creates DocuSeal submission and sends email with signing link
  - Updates order status to block delivery until signed
  - Response includes submission ID and status
- `GET /api/v1/orders/:id/send-agreement` - Check agreement status for an order
  - Returns current agreement status and DocuSeal submission details
- `POST /api/v1/orders/:id/sync-agreement` - Manually sync agreement status with DocuSeal
  - Checks current status in DocuSeal and updates database accordingly
  - Returns whether the status was updated and current status
- `POST /api/v1/orders/sync-all-agreements` - Batch sync all agreement statuses
  - Syncs all orders with DocuSeal submission IDs
  - Returns detailed results with counts of updated/current/failed orders
- `POST /api/v1/docuseal/webhook` - DocuSeal webhook endpoint for real-time updates
  - Handles `submission.completed`, `submission.viewed`, `submission.declined` events
  - Automatically updates agreement status when customers sign agreements
  - Sends confirmation emails when agreements are completed

## Products Implementation

The Products API is implemented using MongoDB and Mongoose with TypeScript. It provides a comprehensive system for managing product data with advanced features like slug generation, text search, and category filtering.

### MongoDB Schema

The product schema is designed to handle complex rental equipment data with nested schemas for various product attributes:

```typescript
// Main Product Schema
const ProductSchema = new Schema<IProductDocument, IProductModel>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      index: true,
    },
    price: {
      type: PriceSchema,
      required: [true, "Product price is required"],
    },
    rentalDuration: {
      type: String,
      enum: ["hourly", "half-day", "full-day", "weekend"],
      required: [true, "Rental duration is required"],
    },
    availability: {
      type: String,
      enum: ["available", "rented", "maintenance", "retired"],
      default: "available",
    },
    images: [ImageSchema],
    specifications: [SpecificationSchema],
    dimensions: {
      type: DimensionsSchema,
      required: [true, "Product dimensions are required"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
    },
    ageRange: {
      type: AgeRangeSchema,
      required: [true, "Age range is required"],
    },
    setupRequirements: {
      type: SetupRequirementsSchema,
      required: [true, "Setup requirements are required"],
    },
    features: {
      type: [String],
      required: [true, "Features are required"],
    },
    safetyGuidelines: {
      type: String,
      required: [true, "Safety guidelines are required"],
    },
    maintenanceSchedule: MaintenanceScheduleSchema,
    weatherRestrictions: [String],
    additionalServices: [AdditionalServiceSchema],
  },
  {
    timestamps: true,
  },
);
```

### Advanced Features

- **Automatic Slug Generation**: Products automatically generate SEO-friendly slugs from their names
- **Text Search**: Full-text search across product names, descriptions, features, and categories
- **Nested Schemas**: Complex product data is organized using nested schemas for better structure
- **Validation**: Comprehensive validation for all required fields
- **Indexing**: Strategic indexes for optimized query performance
- **Type Safety**: Full TypeScript integration with Mongoose for type safety

### TypeScript Interfaces

The product model uses TypeScript interfaces to ensure type safety:

```typescript
export interface IProductDocument extends Product, Document {
  generateSlug(): Promise<string>;
}

export interface IProductModel extends Model<IProductDocument> {
  findBySlug(slug: string): Promise<IProductDocument | null>;
  findByCategory(category: string): Promise<IProductDocument[]>;
  searchProducts(query: string): Promise<IProductDocument[]>;
}
```

### API Endpoints

The Products API provides comprehensive endpoints with filtering, pagination, and search capabilities:

- **GET /api/v1/products**: List all products with filtering and pagination
- **GET /api/v1/products/:slug**: Get a specific product by slug
- **POST /api/v1/products**: Create a new product (admin only)
- **PUT /api/v1/products/:slug**: Update a product (admin only)
- **DELETE /api/v1/products/:slug**: Delete a product (admin only)

### Frontend Components

- `ProductCarousel.tsx`: Displays featured products in a carousel
- `ProductFilters.tsx`: Provides filtering options for product listings
- `ProductAvailabilityCalendar.tsx`: Interactive calendar component that displays product availability by date
  - Shows color-coded dates (green for available, red for unavailable)
  - Allows users to select dates to check availability
  - Caches availability data to minimize API calls
  - Provides visual feedback on availability status
- Admin interface for managing products

## Contacts Implementation

The Contacts API is implemented using MongoDB and Mongoose with TypeScript. It provides a comprehensive system for managing customer contact requests with advanced features like date filtering, pagination, and role-based access control.

### MongoDB Schema

```typescript
const ContactSchema = new Schema<IContactDocument, IContactModel>(
  {
    bouncer: {
      type: String,
      required: [true, "Bouncer name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    partyDate: {
      type: String,
      required: [true, "Party date is required"],
      index: true,
    },
    partyZipCode: {
      type: String,
      required: [true, "Party zip code is required"],
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    tablesChairs: {
      type: Boolean,
      default: false,
    },
    generator: {
      type: Boolean,
      default: false,
    },
    popcornMachine: {
      type: Boolean,
      default: false,
    },
    cottonCandyMachine: {
      type: Boolean,
      default: false,
    },
    snowConeMachine: {
      type: Boolean,
      default: false,
    },
    basketballShoot: {
      type: Boolean,
      default: false,
    },
    slushyMachine: {
      type: Boolean,
      default: false,
    },
    overnight: {
      type: Boolean,
      default: false,
    },
    sourcePage: {
      type: String,
      required: [true, "Source page is required"],
      default: "website",
    },
  },
  {
    timestamps: true,
  },
);
```

### Features

- **Date Range Filtering**: Filter contacts by party date range
- **Confirmation Status Filtering**: Filter contacts by confirmation status
- **Pagination**: Server-side pagination for efficient data loading
- **Role-Based Access Control**: Admin-only access for sensitive operations
- **Email Validation**: Built-in validation for email addresses
- **Text Search**: Contacts are indexed for text search capabilities
- **Notification System**: Email and SMS notifications for new contact requests

### TypeScript Interfaces

The contact model uses TypeScript interfaces to ensure type safety:

```typescript
export interface Contact {
  _id: string;
  bouncer: string;
  email: string;
  phone?: string;
  partyDate: string;
  partyZipCode: string;
  message?: string;
  confirmed: boolean;
  tablesChairs?: boolean;
  generator?: boolean;
  popcornMachine?: boolean;
  cottonCandyMachine?: boolean;
  snowConeMachine?: boolean;
  margaritaMachine?: boolean;
  slushyMachine?: boolean;
  overnight?: boolean;
  sourcePage: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IContactDocument extends Omit<Contact, "_id">, Document {}

export interface IContactModel extends Model<IContactDocument> {
  findByEmail(email: string): Promise<IContactDocument[]>;
  findByPartyDate(date: string): Promise<IContactDocument[]>;
  findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<IContactDocument[]>;
}
```

### API Endpoints

The Contacts API provides comprehensive endpoints with filtering, pagination, and role-based access control:

- **GET /api/v1/contacts**: List all contacts with filtering and pagination (authenticated users only)
- **GET /api/v1/contacts/:id**: Get a specific contact by ID (authenticated users only)
- **POST /api/v1/contacts**: Create a new contact (public)
- **PUT /api/v1/contacts/:id**: Update a contact (authenticated users only)
- **DELETE /api/v1/contacts/:id**: Delete a contact (admin only)

### Frontend Components

- `ContactForm.tsx`: Public-facing form for submitting contact requests
- Admin interface for managing contacts with filtering and pagination
- Contact detail view for viewing and editing contact information
- `ContactCalendar.tsx`: Calendar view for visualizing contacts with color-coded status indicators

## Analytics Implementation

The application includes a comprehensive analytics dashboard that provides insights into business performance:

### Business Performance Dashboard

- **Key Performance Indicators**: Track critical metrics like conversion rate, average order value, and repeat booking rate
- **Period Filtering**: Analyze data across different time periods (current month, last 30 days, year to date, etc.)
- **Year-over-Year Comparison**: Compare current performance with previous periods
- **Trend Visualization**: Visual representation of performance trends over time

### Revenue Analytics

- **Total Revenue Tracking**: Visualizes revenue over selected time periods
- **Revenue Forecasting**: Predictive analysis of future revenue based on historical data
- **Trend Analysis**: Line chart visualization of revenue trends over time

### Booking Trends

- **Booking Volume Analysis**: Track the number of bookings over time
- **Status Breakdown**: View confirmed vs. pending bookings at a glance
- **Booking Forecasting**: Predict future booking volumes based on historical patterns
- **Period Comparison**: Compare booking volumes across different time periods

### Product Popularity

- **Most Popular Products**: Horizontal bar chart showing the most frequently booked products
- **Rental Frequency**: Track which products are rented most often
- **Data-Driven Inventory Decisions**: Identify high-demand products to inform inventory management

### Seasonal Analysis

- **Peak Period Identification**: Automatically identify busiest months or quarters
- **Low Season Detection**: Highlight periods with lower booking volumes
- **Business Insights**: Actionable recommendations based on seasonal patterns
- **Period Comparison**: View data by week, month, or quarter

### Calendar View

- **Visual Booking Calendar**: Calendar interface for viewing all bookings
- **Color-Coded Status**: Yellow for pending bookings, green for confirmed bookings
- **Date Navigation**: Easily navigate between months and view booking details
- **Booking Details**: Click on calendar events to view and edit booking details

### Frontend Components

- `KpiCards.tsx`: Display key performance indicators with trend indicators
- `ConversionAnalysis.tsx`: Analyze conversion funnel and rates over time
- `RevenueChart.tsx`: Line chart component for revenue visualization and forecasting
- `BookingsTrend.tsx`: Bar chart component for booking trend analysis
- `ProductPopularity.tsx`: Horizontal bar chart for product popularity
- `SeasonalTrends.tsx`: Analyze and visualize seasonal booking patterns
- `ForecastChart.tsx`: Predictive charts for revenue and bookings
- `RevenueChart.tsx`: Line chart component for revenue visualization
- `BookingsTrend.tsx`: Bar chart component for booking trend analysis
- `ProductPopularity.tsx`: Horizontal bar chart for product popularity
- `ContactCalendar.tsx`: Calendar component for visualizing bookings
- `FormEngagementAnalytics.tsx`: Comprehensive form engagement analytics dashboard

### Form Engagement Analytics

- **Multi-Form Tracking**: Track engagement metrics across different forms (contact form, coupon form)
- **Form Type Filtering**: Filter analytics by form type for targeted analysis
- **Conversion Funnel Visualization**: Track progression from form starts to successful submissions
- **Field Completion Analysis**: Identify which form fields cause the most friction
- **Extras Selection Analysis**: Analyze which add-on options are most popular (for contact form)
- **High Intent Visitor Identification**: Identify users who engaged with forms but didn't complete them
- **Actionable Insights**: Get specific recommendations to improve form performance
- **Abandonment Analysis**: Track where users drop off in the form completion process

## Promo Opt-ins Implementation

The Promo Opt-ins API is implemented using MongoDB and Mongoose with TypeScript. It provides a comprehensive system for managing promotional opt-ins with filtering, pagination, and authentication.

### MongoDB Schema

```typescript
const PromoOptinSchema = new Schema<IPromoOptinDocument, IPromoOptinModel>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    promoName: {
      type: String,
      required: [true, "Promotion name is required"],
      trim: true,
      index: true,
    },
    consentToContact: {
      type: Boolean,
      required: [true, "Consent to contact is required"],
      default: true,
    },
  },
  {
    timestamps: true,
  },
);
```

## PayPal Integration

The application integrates with PayPal for secure payment processing using the official PayPal React SDK (`@paypal/react-paypal-js`). This integration provides a seamless checkout experience with both PayPal and credit card payment options.

### Key Components

- **PayPalScriptProvider**: Manages the loading of the PayPal JavaScript SDK
- **PayPalButtons**: Renders the PayPal Smart Payment Buttons with customizable styling

### Configuration

```typescript
// PayPal configuration (src/config/paypal.ts)
export const paypalConfig: ReactPayPalScriptOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
  currency: "USD",
  intent: "capture",
  components: "buttons",
};
```

### Implementation

The PayPal integration is implemented in the checkout process:

```typescript
<PayPalScriptProvider options={paypalConfig}>
  <PayPalButtons
    style={{
      layout: "vertical",
      color: "gold",
      shape: "rect",
      label: "pay",
      height: 45
    }}
    createOrder={(data, actions) => {
      return actions.order.create({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              value: totalAmount.toFixed(2),
              currency_code: "USD",
            },
            description: "Bounce House Rental",
          },
        ],
        application_context: {
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      });
    }}
    onApprove={async (data, actions) => {
      const orderDetails = await actions.order.capture();
      // Process successful payment
      handlePaymentSuccess(orderDetails.id);
    }}
    onError={(err) => {
      // Handle payment errors
      handlePaymentError(err);
    }}
  />
</PayPalScriptProvider>
```

### Payment Flow

1. User clicks the PayPal button
2. PayPal modal opens for payment selection (PayPal account or credit card)
3. User completes payment in the PayPal interface
4. On successful payment, the `onApprove` callback is triggered
5. The application captures the payment and updates the order status
6. The order details are sent to the backend for processing

### Testing

A dedicated test page at `/paypal-test` allows for testing the PayPal integration with configurable amounts and detailed error reporting.

## Email Notifications

The application uses SendGrid for reliable email delivery with a clean, reusable implementation:

### SendGrid Integration

- **Email Service**: Centralized email service using SendGrid's API
- **Template System**: Reusable email templates for different notification types
- **Error Handling**: Robust error handling to prevent email failures from affecting core functionality
- **Environment Configuration**: SendGrid API key stored securely in environment variables

### Email Notification Types

- **Contact Form Submissions**: Notify administrators when customers submit contact forms
- **Order Notifications**: Email notifications for new orders, status changes, and payment confirmations
- **Promotional Opt-ins**: Confirmation emails for promotional sign-ups

### Implementation

The email system uses a centralized utility for all SendGrid operations:

```typescript
// src/utils/emailService.ts
import sgMail from "@sendgrid/mail";

// Initialize with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(emailData: EmailData): Promise<void> {
  try {
    await sgMail.send(emailData);
  } catch (error) {
    console.error("Error sending email with SendGrid:", error);
    throw error;
  }
}
```

Template functions generate consistent email content:

```typescript
// src/utils/orderEmailTemplates.ts (example)
export function generateNewOrderEmailAdmin(order: IOrderDocument): string {
  return `
    New Order Received: ${order.orderNumber}
    
    Customer: ${order.customerName || "N/A"}
    Email: ${order.customerEmail || "N/A"}
    Phone: ${order.customerPhone || "N/A"}
    
    Order Details:
    ${order.items.map((item) => `- ${item.quantity}x ${item.name}: $${item.totalPrice.toFixed(2)}`).join("\n")}
    
    Subtotal: $${order.subtotal.toFixed(2)}
    Total Amount: $${order.totalAmount.toFixed(2)}
    Payment Method: ${order.paymentMethod}
    Payment Status: ${order.paymentStatus}
  `;
}
```

## Orders Implementation

The Orders API is implemented using MongoDB and Mongoose with TypeScript. It provides a comprehensive system for managing customer orders with advanced features like order status tracking, payment processing, and task management.

### MongoDB Schema

```typescript
// Order item schema
const OrderItemSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["bouncer", "extra", "add-on"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

// PayPal transaction schema
const PayPalTransactionSchema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
    },
    payerId: String,
    payerEmail: String,
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["USD"],
      default: "USD",
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "SAVED",
        "APPROVED",
        "VOIDED",
        "COMPLETED",
        "PAYER_ACTION_REQUIRED",
        "FAILED",
      ],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
  },
  { _id: false },
);

// Main Order schema
const OrderSchema = new Schema<IOrderDocument, IOrderModel>(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: false,
      index: true,
    },

    // Direct customer information fields
    customerName: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        "Please enter a valid email address",
      ],
    },
    customerPhone: {
      type: String,
      trim: true,
      match: [/^(\+?[\d\s\-()]{7,16})?$/, "Please enter a valid phone number"],
    },
    customerAddress: {
      type: String,
      trim: true,
    },
    customerCity: {
      type: String,
      trim: true,
    },
    customerState: {
      type: String,
      trim: true,
    },
    customerZipCode: {
      type: String,
      trim: true,
    },

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [
        (items: any[]) => items.length > 0,
        "Order must contain at least one item",
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 20, // Default $20 delivery fee
    },
    processingFee: {
      type: Number,
      required: true,
      min: 0,
      default: function (this: IOrderDocument) {
        // Default 3% of subtotal, rounded to nearest cent
        return this.subtotal ? Math.round(this.subtotal * 0.03 * 100) / 100 : 0;
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Paid",
        "Confirmed",
        "Cancelled",
        "Refunded",
      ],
      default: "Pending",
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Authorized",
        "Paid",
        "Failed",
        "Refunded",
        "Partially Refunded",
      ],
      default: "Pending",
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["paypal", "cash", "quickbooks", "free"],
      required: true,
    },
    paypalTransactions: {
      type: [PayPalTransactionSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    tasks: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);
```

### Features

- **Order Status Tracking**: Track orders through their lifecycle (Pending, Processing, Paid, Confirmed, Cancelled, Refunded)
- **Payment Status Tracking**: Track payment status separately from order status (Pending, Authorized, Paid, Failed, Refunded, Partially Refunded)
- **Payment Processing**: Integration with PayPal for secure payment processing
- **Contact-to-Order Conversion**: Convert contact inquiries to orders with reference to the original contact
- **Task Management**: Associate tasks with orders for delivery, setup, pickup, etc.
- **Automatic Calculations**: Auto-calculate subtotal, processing fee, total amount, and balance due
- **Order Number Generation**: Automatically generate sequential order numbers (e.g., BB-2024-0001)
- **Date Range Filtering**: Filter orders by creation date range
- **Status Filtering**: Filter orders by order status or payment status
- **Contact Association**: Filter orders by associated contact

### TypeScript Interfaces

The order model uses TypeScript interfaces to ensure type safety:

```typescript
export interface Order {
  _id: string;
  orderNumber: string;
  contactId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZipCode?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee: number;
  processingFee: number;
  totalAmount: number;
  depositAmount: number;
  balanceDue: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paypalTransactions?: PayPalTransactionDetails[];
  notes?: string;
  tasks?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  type: OrderItemType;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IOrderDocument extends Omit<Order, "_id">, Document {
  generateOrderNumber(): Promise<string>;
}

export interface IOrderModel extends Model<IOrderDocument> {
  findByOrderNumber(orderNumber: string): Promise<IOrderDocument | null>;
  findByContactId(contactId: string): Promise<IOrderDocument[]>;
  findByStatus(status: OrderStatus): Promise<IOrderDocument[]>;
  findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<IOrderDocument[]>;
  generateOrderNumber(): Promise<string>;
}
```

### API Endpoints

The Orders API provides comprehensive endpoints with filtering, payment processing, and authentication:

- **GET /api/v1/orders**: List all orders with filtering and pagination (authenticated users only)
- **GET /api/v1/orders/:id**: Get a specific order by ID (authenticated users only)
- **POST /api/v1/orders**: Create a new order (public)
- **PUT /api/v1/orders/:id**: Update an order (authenticated users only)
- **DELETE /api/v1/orders/:id**: Delete an order (authenticated users only)
  - Restrictions: Cannot delete orders with status "Paid" or "Confirmed"
- **POST /api/v1/orders/:id/payment**: Initiate payment for an order
- **PATCH /api/v1/orders/:id/payment**: Record payment transaction for an order

### Frontend Components

- **Admin Interface**: Comprehensive admin interface for managing orders
  - Order listing with filtering by date, status, and payment status
  - Order detail view with editable fields
  - Order creation form with automatic calculations
  - Task management interface for adding and removing tasks
- **Checkout Process**: Multi-step checkout wizard for customers
  - Step1_RentalSelection: Select products and delivery dates
  - Step2_DeliveryInfo: Enter customer and delivery information
  - Step3_Extras: Add optional extras to the order
  - Step4_OrderReview: Review order details before payment
  - Step5_Payment: Complete payment via PayPal
- **Supporting Components**:
  - ProgressBar: Visual indicator of checkout progress
  - NavigationButtons: Navigation between checkout steps
  - OrderFormTracker: Analytics tracking for the checkout process
  - PayPalButton: Integration with PayPal for payment processing

### Contact-Order-Task Relationship

The system implements a relationship between Contacts, Orders, and Tasks:

1. **Contacts** represent customer inquiries and contain basic customer information
2. **Orders** are created from contacts (or directly) and contain detailed information about products, pricing, and payment
3. **Tasks** are generated from orders and represent specific jobs that need to be completed (delivery, setup, pickup, etc.)
4. **Employees** can claim and complete tasks

This relationship allows for a complete workflow from initial customer inquiry to order fulfillment and task completion.

### Features

- **Email Filtering**: Filter opt-ins by email address
- **Promotion Filtering**: Filter opt-ins by promotion name
- **Date Range Filtering**: Filter opt-ins by creation date range
- **Text Search**: Search opt-ins by name or email
- **Pagination**: Server-side pagination for efficient data loading
- **Authentication**: Protected routes for sensitive operations
- **Email Validation**: Built-in validation for email addresses

### TypeScript Interfaces

The promo opt-in model uses TypeScript interfaces to ensure type safety:

```typescript
export interface PromoOptin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  promoName: string;
  consentToContact: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPromoOptinDocument
  extends Omit<PromoOptin, "_id">,
    Document {}

export interface IPromoOptinModel extends Model<IPromoOptinDocument> {
  findByEmail(email: string): Promise<IPromoOptinDocument[]>;
  findByPromoName(promoName: string): Promise<IPromoOptinDocument[]>;
  findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<IPromoOptinDocument[]>;
}
```

### API Endpoints

The Promo Opt-ins API provides comprehensive endpoints with filtering, pagination, and authentication:

- **GET /api/v1/promo-optins**: List all promo opt-ins with filtering and pagination (authenticated users only)
- **GET /api/v1/promo-optins/:id**: Get a specific promo opt-in by ID (authenticated users only)
- **POST /api/v1/promo-optins**: Create a new promo opt-in (public)
- **PUT /api/v1/promo-optins/:id**: Update a promo opt-in (authenticated users only)
- **DELETE /api/v1/promo-optins/:id**: Delete a promo opt-in (authenticated users only)

### Frontend Components

- `PromoModal.tsx`: Modal component for displaying promotional offers
- `PromoModalWrapper.tsx`: Wrapper component for the promo modal with client-side logic
- Admin interface for managing promo opt-ins with filtering and pagination

## Package Deals Visibility Implementation

The Package Deals Visibility feature is implemented using React Context API and browser cookies to provide a seamless user experience where first-time visitors are encouraged to engage with promotional content before accessing package deals.

### Context-Based State Management

```typescript
// src/contexts/PackageDealsContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isPackageDealsVisible, setPackageDealsVisible as setCookie } from '../utils/cookieUtils';

// Define the context shape
type PackageDealsContextType = {
  isVisible: boolean;
  setVisible: () => void;
};

// Create the context with default values
const PackageDealsContext = createContext<PackageDealsContextType>({
  isVisible: false,
  setVisible: () => {},
});

// Provider component
export function PackageDealsProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  // Check cookie on initial client-side render
  useEffect(() => {
    setIsVisible(isPackageDealsVisible());
  }, []);

  // Function to set visibility
  const setVisible = () => {
    setCookie();
    setIsVisible(true);
  };

  return (
    <PackageDealsContext.Provider value={{ isVisible, setVisible }}>
      {children}
    </PackageDealsContext.Provider>
  );
}

// Custom hook for using the context
export function usePackageDeals() {
  return useContext(PackageDealsContext);
}
```

### Cookie-Based Persistence

```typescript
// src/utils/cookieUtils.ts
const PACKAGE_DEALS_COOKIE = "package_deals_visible";

export const isPackageDealsVisible = (): boolean => {
  // Only run on client side
  if (typeof window === "undefined") return false;

  return document.cookie.includes(`${PACKAGE_DEALS_COOKIE}=true`);
};

export const setPackageDealsVisible = (days: number = 365): void => {
  // Only run on client side
  if (typeof window === "undefined") return;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  document.cookie = `${PACKAGE_DEALS_COOKIE}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
};
```

### Conditional Rendering in Navigation

The Navigation component uses the context to conditionally render the Package Deals link:

```typescript
const Navigation = () => {
  const { isVisible } = usePackageDeals();

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/products", label: "Products" },
    { path: "/about", label: "About" },
    { path: "/blogs", label: "Blog" },
    { path: "/faq", label: "FAQ" },
  ];

  // Conditionally add Package Deals to navigation
  if (isVisible) {
    navLinks.push({ path: "/party-packages", label: "Package Deals" });
  }

  // Rest of the component...
};
```

### Promotional Modal Integration

The PromoModal component sets the visibility cookie when users interact with it:

```typescript
const handleGetCoupon = () => {
  // Close the modal
  setIsOpen(false);

  // Store timestamp in localStorage
  if (isClient && currentPromo) {
    const storageKey = `promo_modal_${currentPromo.name
      .replace(/\s+/g, "_")
      .toLowerCase()}`;
    localStorage.setItem(storageKey, Date.now().toString());
  }

  // Set the cookie to make package deals visible
  setPackageDealsVisible();

  // Navigate to the coupon form
  router.push(
    `/coupon-form?promo=${encodeURIComponent(currentPromo?.name || "")}`,
  );
};
```

### Form Submission Integration

The coupon form sets the visibility cookie upon successful submission:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm() || !formData.consentToContact) return;

  setIsSubmitting(true);

  try {
    // Send data to our API
    const response = await fetch("/api/v1/package-promo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        promoName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit form");
    }

    // Set the cookie to make package deals visible
    setPackageDealsVisible();

    // Redirect to the party-packages page
    router.push("/party-packages");
  } catch (error) {
    console.error("Error submitting form:", error);
  } finally {
    setIsSubmitting(false);
  }
};
```

### Testing

The feature includes comprehensive tests to verify visibility conditions:

```typescript
describe('Package Deals Visibility', () => {
  describe('Navigation Component', () => {
    it('should not show Package Deals link when visibility is false', () => {
      // Mock the context to return false for isVisible
      (usePackageDeals as jest.Mock).mockReturnValue({
        isVisible: false,
        setVisible: jest.fn(),
      });

      render(<Navigation />);

      // Verify Package Deals link is not present
      expect(screen.queryByText('Package Deals')).not.toBeInTheDocument();
    });

    it('should show Package Deals link when visibility is true', () => {
      // Mock the context to return true for isVisible
      (usePackageDeals as jest.Mock).mockReturnValue({
        isVisible: true,
        setVisible: jest.fn(),
      });

      render(<Navigation />);

      // Verify Package Deals link is present
      expect(screen.getByText('Package Deals')).toBeInTheDocument();
    });
  });
});
```

## Reviews Implementation

The Reviews API is implemented using MongoDB and Mongoose with TypeScript. It provides a robust system for storing and retrieving customer reviews with pagination, filtering, and authentication.

### MongoDB Schema

```typescript
const ReviewSchema = new Schema<IReviewDocument, IReviewModel>(
  {
    placeId: {
      type: String,
      required: [true, "Place ID is required"],
      index: true,
    },
    reviewId: {
      type: String,
      required: [true, "Review ID is required"],
      unique: true,
    },
    authorName: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    authorUrl: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || urlRegex.test(v);
        },
        message: "Invalid URL format",
      },
    },
    profilePhotoUrl: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || urlRegex.test(v);
        },
        message: "Invalid URL format",
      },
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    text: {
      type: String,
      required: [true, "Review text is required"],
    },
    relativeTimeDescription: String,
    language: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || languageRegex.test(v);
        },
        message: "Invalid language format",
      },
    },
    time: {
      type: Date,
      default: Date.now,
    },
    likes: {
      type: Number,
      default: 0,
    },
    isLocalGuide: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);
```

### Features

- **Pagination**: All review listings include pagination with customizable page size
- **Filtering**: Filter reviews by place ID
- **Authentication**: Protected routes for creating, updating, and deleting reviews
- **Validation**: Comprehensive validation for all fields
- **User Association**: Reviews can be associated with authenticated users
- **Text Search**: Reviews are indexed for text search capabilities

### Frontend Components

- `CustomerReviews.tsx`: Displays reviews with a carousel interface and statistics
- `ReviewForm.tsx`: Form for creating and editing reviews
- Admin interface for managing reviews

## Project Structure

```
src/
├── app/                # Next.js App Router pages and layouts
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Home page
│   ├── providers.tsx  # React context providers
│   ├── about/         # About page
│   ├── admin/         # Admin interface
│   │   ├── blogs/     # Blog management
│   │   ├── contacts/  # Contact management
│   │   ├── products/  # Product management
│   │   └── reviews/   # Reviews management
│   ├── blogs/         # Blog pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [slug]/    # Dynamic blog routes
│   ├── contact/       # Contact page
│   ├── faq/           # FAQ page
│   ├── login/         # Authentication page
│   ├── privacy-policy/# Privacy policy page
│   ├── tos/           # Terms of service page
│   └── products/      # Product pages
│       ├── page.tsx
│       ├── products-content.tsx
│       └── [slug]/    # Dynamic product routes
├── components/        # React components
│   ├── ui/           # Reusable UI components
│   │   ├── card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── ContactForm.tsx
│   ├── CustomerReviews.tsx
│   ├── FaqContent.tsx
│   ├── Footer.tsx
│   ├── GoogleAnalytics.tsx
│   ├── HeroSection.tsx
│   ├── InfoSections.tsx
│   ├── JsonLd.tsx
│   ├── Navigation.tsx
│   ├── OccasionsSection.tsx
│   ├── ProductCarousel.tsx
│   ├── ProductFilters.tsx
│   └── StatsSection.tsx
├── config/           # Configuration files
│   └── constants.ts
├── types/           # TypeScript type definitions
│   ├── blog.ts
│   ├── faq.ts
│   ├── product.ts
│   ├── review.ts
│   └── user.ts
└── utils/           # Utility functions
    ├── api.ts
    └── generateSitemap.ts

public/             # Public assets
├── apple-touch-icon.png
├── file.svg
├── globe.svg
├── hero-background.gif
├── hero-background.webp
├── logo.png
├── logo192.png
├── logo512.png
├── manifest.json
├── next.svg
├── og-image.jpg
├── robots.txt
├── satx-bounce-house-rental-san-antonio-dry-xl.png
├── seobilityverify_6759146.html
├── sitemap.xml
├── twitter-image.jpg
├── vercel.svg
└── window.svg
```

## Continuous Integration and Deployment

This project uses GitHub Actions for continuous integration and deployment:

- **CI Pipeline**: Runs automatically on push to the `main` branch and pull requests

  - Runs linting, type checking, tests, and builds the application
  - Ensures code quality and prevents regressions

- **CD Pipeline**: Runs automatically after successful CI builds on the `main` branch
  - Deploys the application to Vercel's production environment
  - Generates and publishes the sitemap for SEO

For detailed information about the CI/CD setup, see [.github/CI.md](.github/CI.md).

## Development

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or cloud)
- Git

### Setup Instructions

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd bounce-v3
npm install
```

2. **Set up environment variables:**

   Copy `.env.sample` to `.env.local` and configure the following variables:

   ```bash
   # Database
   MONGODB_URI=your_mongodb_connection_string

   # Authentication & Security
   JWT_SECRET=your_secure_jwt_secret_key_minimum_32_characters
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_key
   ADMIN_TOKEN=your_admin_api_token

   # API Configuration
   API_BASE_URL=http://localhost:3000
   NODE_ENV=development

   # Email Services
   SENDGRID_API_KEY=your_sendgrid_api_key
   EMAIL=your_email_address
   PASSWORD=your_email_password

   # SMS Services (Twilio)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   USER_PHONE_NUMBER=your_notification_phone_number

   # Payment Processing (PayPal)
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_LIVE_MODE=false

   # Cloud Storage (Cloudinary)
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   NEXT_CLOUDINARY_API_KEY=your_cloudinary_api_key
   NEXT_CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   NEXT_CLOUDINARY_API_CLOUDINARY_URL=your_cloudinary_url

   # Analytics
   NEXT_GOOGLE_ANALYTICS_ID=your_google_analytics_id
   NEXT_GTM_ID=your_google_tag_manager_id

   # Maps & Routing
   OPENROUTESERVICE_API_KEY=your_openrouteservice_api_key

   # Search & SEO
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_CX=your_google_custom_search_engine_id
   TARGET_DOMAIN=your_domain_name
   ```

3. **Start development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Development Commands

4. **Code Quality:**

```bash
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
npm run type-check    # TypeScript type checking
```

5. **Testing:**

```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

6. **Build:**

```bash
npm run build         # Build for production
npm run start         # Start production server
```

### Development Features

- **Hot Reload**: Turbopack provides fast hot reloading during development
- **Source Maps**: Enabled in development for better debugging experience
- **Console Utilities**: Advanced console debugging tools for development
- **Test Environment**: MongoDB Memory Server for isolated testing
- **Type Safety**: Strict TypeScript configuration with comprehensive type checking

### Troubleshooting

- **Build Errors**: The Next.js config has `ignoreBuildErrors: true` for development flexibility, but ensure TypeScript errors are resolved before production
- **Environment Variables**: Ensure all required environment variables are set, especially `MONGODB_URI` and `JWT_SECRET`
- **Port Conflicts**: If port 3000 is in use, Next.js will automatically use the next available port
- **Database Connection**: Verify MongoDB connection string and database accessibility
- **API Keys**: Ensure all third-party service API keys are valid and have appropriate permissions

## Build

To build for production:

```bash
npm run build
```

This will generate optimized production files in the `.next` directory. After building, a sitemap will be automatically generated.

## Role-Based Access Control (RBAC) Implementation

The application implements a comprehensive role-based access control system that secures content and functionality at multiple levels:

### User Roles

The system supports three user roles:

- **Admin**: Full access to all features and content
- **Customer**: Standard user access with limited administrative capabilities
- **User**: Basic access with minimal privileges

### Database Level

- **User Model**: Implements role validation in the MongoDB schema
  - Default role is "customer"
  - Enum validation ensures only valid roles ("admin", "customer", "user") can be assigned
  - Pre-save hooks ensure secure password hashing
  - Role information is stored in JWT tokens for authentication

### API Level

- **Role-Based Middleware**: API routes are protected based on user roles

  - `withRoleAuth`: Core middleware that checks user role against required role
  - `withAdminAuth`: Helper middleware for admin-only routes
  - `withUserAuth`: Helper middleware for authenticated user routes
  - Proper error responses (401 for unauthenticated, 403 for unauthorized)

- **Resource Ownership**: Additional layer of protection for user-specific resources
  - `checkOwnership`: Utility function to verify if a user owns a resource
  - `requireOwnership`: Middleware to enforce ownership requirements
  - Admins automatically pass ownership checks

### UI Level

- **Conditional Rendering**: Components render differently based on user role
  - `AdminOnly` component: Renders content only for admin users
  - `isAdmin` helper in AuthContext: Simplifies role checking in components
  - Fallback content for non-admin users

### Application Level

- **Route Protection**: Next.js middleware protects entire routes based on user role
  - Admin routes (/admin/\*) are only accessible to admin users
  - Automatic redirection to login page for unauthenticated users
  - Custom error messages for unauthorized access attempts

### Authentication Context

- **React Context API**: Provides authentication state throughout the application
  - User information including role is available via useAuth() hook
  - Automatic role validation when processing session data
  - Logout functionality with proper cleanup

### Testing

The RBAC system is thoroughly tested at all levels:

- **User Model Tests**: Verify role validation and defaults
- **Middleware Tests**: Ensure proper access control in API routes
- **Component Tests**: Validate conditional rendering based on roles
- **Utility Tests**: Confirm ownership checking functions work correctly

## Configuration Files

- `next.config.ts`: Next.js configuration (includes image domains for Cloudinary and GIPHY)
- `tsconfig.json`: TypeScript configuration
- `eslint.config.mjs`: ESLint configuration
- `tailwind.config.ts`: TailwindCSS configuration
- `postcss.config.mjs`: PostCSS configuration
- `vercel.json`: Vercel deployment configuration
- `jest.config.ts`: Jest testing configuration
- `jest.setup.ts`: Jest setup configuration
