# Bounce v3

A modern web application built with Next.js, React, and TypeScript, featuring a comprehensive suite of features for business management and customer engagement.

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Framework**: Next.js 15.1.3
- **Build Tool**: Turbopack
- **Styling**: TailwindCSS with aspect-ratio and line-clamp plugins
- **Typography**: Geist and Geist_Mono fonts from Google Fonts
- **Icons**: Lucide React
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Jest and React Testing Library
- **Cloud Services**: Cloudinary for media management
- **Analytics**: Google Analytics and Google Tag Manager
- **Deployment**: Vercel

## Features

- **Blog Management**: Full-featured blog system with rich text editing
- **Product Management**: Product catalog with detailed views and admin controls
- **Product Availability**: Interactive calendar showing product availability by date
- **Contact System**: Contact forms with admin management interface
- **Admin Panel**: Secure administrative interface for content management
- **Analytics Dashboard**: Comprehensive analytics with revenue tracking, booking trends, and product popularity
- **Calendar View**: Visual calendar for tracking bookings with color-coded status indicators
- **Customer Reviews**: Display and management of customer feedback
- **Authentication**: Secure JWT-based authentication with:
  - Token storage in both localStorage and cookies for robust auth persistence
  - "Remember Me" functionality with configurable token expiration
  - Protected routes with middleware-based access control
  - Secure password hashing with bcrypt
  - Rate limiting for login attempts
  - NextAuth.js integration with simplified configuration for production stability
- **Responsive Design**: Mobile-friendly interface with modern UI components
- **Analytics**: Built-in analytics tracking with Google Analytics and Google Tag Manager
- **SEO Optimization**: Comprehensive metadata, OpenGraph, and Twitter cards
- **Structured Data**: JsonLd implementation for improved search engine visibility
- **Legal Pages**: Privacy Policy and Terms of Service

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

## Development

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

   - Copy `.env.sample` to `.env.local`
   - Configure required environment variables:

     ```
     # MongoDB Connection
     MONGODB_URI=your_mongodb_connection_string

     # Authentication
     JWT_SECRET=your_secure_jwt_secret_key

     # API Configuration (optional, for external API access)
     API_BASE_URL=http://localhost:3000
     ```

3. Start development server:

```bash
npm run dev
```

4. Run linting:

```bash
npm run lint
```

5. Run tests:

```bash
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

6. Format code:

```bash
npm run format
```

7. Type check:

```bash
npm run type-check
```

## Build

To build for production:

```bash
npm run build
```

This will generate optimized production files in the `.next` directory. After building, a sitemap will be automatically generated.

## Configuration Files

- `next.config.ts`: Next.js configuration (includes image domains for Cloudinary and GIPHY)
- `tsconfig.json`: TypeScript configuration
- `eslint.config.mjs`: ESLint configuration
- `tailwind.config.ts`: TailwindCSS configuration
- `postcss.config.mjs`: PostCSS configuration
- `vercel.json`: Vercel deployment configuration
- `jest.config.ts`: Jest testing configuration
- `jest.setup.ts`: Jest setup configuration
