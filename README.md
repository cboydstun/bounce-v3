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
- **Authentication**: Secure login system with protected routes
- **Responsive Design**: Mobile-friendly interface with modern UI components
- **Analytics**: Built-in analytics tracking with Google Analytics and Google Tag Manager
- **SEO Optimization**: Comprehensive metadata, OpenGraph, and Twitter cards
- **Structured Data**: JsonLd implementation for improved search engine visibility
- **Legal Pages**: Privacy Policy and Terms of Service

## API Routes

The application provides a RESTful API with the following endpoints:

### Products API

- `GET /api/v1/products` - Retrieve all products
- `GET /api/v1/products/:id` - Retrieve a specific product by ID
- `POST /api/v1/products` - Create a new product
- `PUT /api/v1/products/:slug` - Update a product by slug
- `DELETE /api/v1/products/:slug` - Delete a product by slug

### Blogs API

- `GET /api/v1/blogs` - Retrieve all blog posts
- `GET /api/v1/blogs/:id` - Retrieve a specific blog post by ID
- `POST /api/v1/blogs` - Create a new blog post
- `PUT /api/v1/blogs/:id` - Update a blog post by ID
- `DELETE /api/v1/blogs/:slug` - Delete a blog post by slug
- `DELETE /api/v1/blogs/:slug/images/:filename` - Delete an image from a blog post

### Users API

- `POST /api/v1/users/login` - Authenticate user and retrieve token

### Contacts API

- `GET /api/v1/contacts` - Retrieve all contact requests
- `GET /api/v1/contacts/:id` - Retrieve a specific contact request by ID
- `POST /api/v1/contacts` - Create a new contact request
- `PUT /api/v1/contacts/:id` - Update a contact request by ID
- `DELETE /api/v1/contacts/:id` - Delete a contact request by ID

### Reviews API

- `GET /api/v1/reviews` - Retrieve all customer reviews
- `POST /api/v1/reviews` - Create a new customer review
- `PUT /api/v1/reviews/:id` - Update a customer review by ID
- `DELETE /api/v1/reviews/:id` - Delete a customer review by ID

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
   - Configure required environment variables

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
