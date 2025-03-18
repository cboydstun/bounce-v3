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
- **Contact System**: Contact forms with admin management interface
- **Admin Panel**: Secure administrative interface for content management
- **Customer Reviews**: Display and management of customer feedback
- **Authentication**: Secure JWT-based authentication with:
  - Token storage in both localStorage and cookies for robust auth persistence
  - "Remember Me" functionality with configurable token expiration
  - Protected routes with middleware-based access control
  - Secure password hashing with bcrypt
  - Rate limiting for login attempts
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

### Blogs API

- `GET /api/v1/blogs` - Retrieve all blog posts
  - Query parameters:
    - `category`: Filter by blog category
    - `tag`: Filter by blog tag
    - `search`: Search blogs by text
    - `status`: Filter by status (published, draft, archived)
    - `limit`: Number of blogs per page (default: 10)
    - `page`: Page number for pagination (default: 1)
- `GET /api/v1/blogs/:id` - Retrieve a specific blog post by ID or slug
- `POST /api/v1/blogs` - Create a new blog post (authenticated users only)
- `PUT /api/v1/blogs/:id` - Update a blog post by ID (author or admin only)
- `DELETE /api/v1/blogs/:id` - Delete a blog post by ID (author or admin only)
- `POST /api/v1/blogs/:slug/images` - Upload an image to a blog post (author or admin only)
- `DELETE /api/v1/blogs/:slug/images/:filename` - Delete an image from a blog post (author or admin only)

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
  }
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
- Admin interface for managing products

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
  }
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
