# Bounce v3

A modern web application built with Next.js, React, and TypeScript, featuring a comprehensive suite of features for business management and customer engagement.

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Framework**: Next.js 15.1.3
- **Build Tool**: Turbopack
- **Styling**: TailwindCSS
- **Linting**: ESLint
- **Cloud Services**: Cloudinary for media management
- **Deployment**: Vercel

## Features

- **Blog Management**: Full-featured blog system with rich text editing
- **Product Management**: Product catalog with detailed views and admin controls
- **Contact System**: Contact forms with admin management interface
- **Admin Panel**: Secure administrative interface for content management
- **Customer Reviews**: Display and management of customer feedback
- **Authentication**: Secure login system with protected routes
- **Responsive Design**: Mobile-friendly interface with modern UI components
- **Analytics**: Built-in analytics tracking

## Project Structure

```
src/
├── app/                # Next.js App Router pages and layouts
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Home page
│   ├── about/         # About page
│   ├── blogs/         # Blog pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [slug]/    # Dynamic blog routes
│   ├── contact/       # Contact page
│   ├── faq/           # FAQ page
│   └── products/      # Product pages
│       ├── page.tsx
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
│   └── ProductFilters.tsx
├── config/           # Configuration files
│   └── constants.ts
├── types/           # TypeScript type definitions
│   ├── blog.ts
│   ├── faq.ts
│   └── product.ts
└── utils/           # Utility functions
    ├── api.ts
    ├── env.ts
    └── generateSitemap.ts

public/             # Public assets
├── hero-background.gif
├── logo.png
├── logo192.png
├── logo512.png
├── manifest.json
├── next.svg
├── og-image.jpg
├── robots.txt
├── sitemap.xml
├── twitter-image.jpg
└── vercel.svg
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

## Build

To build for production:

```bash
npm run build
```

This will generate optimized production files in the `.next` directory. After building, a sitemap will be automatically generated.

## Configuration Files

- `next.config.ts`: Next.js configuration
- `tsconfig.json`: TypeScript configuration
- `eslint.config.mjs`: ESLint configuration
- `tailwind.config.ts`: TailwindCSS configuration
- `postcss.config.mjs`: PostCSS configuration
