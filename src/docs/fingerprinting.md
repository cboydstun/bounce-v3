# Visitor Tracking and Analytics

This document explains how to use the visitor tracking and analytics features in the application.

## Overview

The application uses ThumbmarkJS for visitor fingerprinting and tracking. This allows us to:

1. Identify unique visitors without requiring login
2. Track visitor behavior and interactions
3. Analyze visitor engagement and conversion
4. Understand marketing attribution
5. Monitor technical performance

## How It Works

1. The `Fingerprint` component is included in the root layout and runs on every page
2. It generates a unique visitor ID using ThumbmarkJS and stores it in localStorage
3. It collects device, browser, and network information
4. It sends this data to the API, which stores it in MongoDB
5. The admin dashboard displays analytics based on this data

## Tracking Visitor Interactions

You can track various visitor interactions using the utility functions in `src/utils/trackInteraction.ts`:

```typescript
import {
  trackClick,
  trackFormStart,
  trackFormSubmit,
  trackProductView,
  trackGalleryView,
  trackVideoPlay,
  trackScroll,
  trackClientError,
  setupErrorTracking,
} from "@/utils/trackInteraction";

// Track a button click
trackClick("checkout-button", "/products/bounce-house");

// Track when a user starts filling out a form
trackFormStart("contact-form");

// Track when a user submits a form
trackFormSubmit("contact-form", undefined, {
  formType: "contact",
  productInterest: "bounce-house",
});

// Track when a user views a product
trackProductView("bounce-house", undefined, {
  productName: "Bounce House",
  category: "Inflatables",
});

// Track when a user views a gallery
trackGalleryView("product-gallery", undefined, {
  imageIndex: 2,
});

// Track when a user plays a video
trackVideoPlay("product-video", undefined, {
  videoTitle: "Bounce House Setup",
  duration: 120,
});

// Track when a user scrolls to a certain depth
trackScroll("50%");

// Track client-side errors
trackClientError(new Error("Failed to load product data"));

// Set up global error tracking (call this once at application startup)
setupErrorTracking();
```

## Tracking Conversions

You can track conversion events using the utility functions in `src/utils/trackConversion.ts`:

```typescript
import {
  trackContactForm,
  trackPriceCheck,
  trackAvailabilityCheck,
  trackBookingStarted,
  trackBookingCompleted,
  trackBookingAbandoned,
} from "@/utils/trackConversion";

// Track when a user submits a contact form
trackContactForm("bounce-house");

// Track when a user checks the price of a product
trackPriceCheck("bounce-house");

// Track when a user checks the availability of a product
trackAvailabilityCheck("bounce-house");

// Track when a user starts the booking process
trackBookingStarted("bounce-house", 150);

// Track when a user completes a booking
trackBookingCompleted("bounce-house", 150);

// Track when a user abandons a booking
trackBookingAbandoned("bounce-house", 150);
```

## UTM Parameter Tracking

The application automatically tracks UTM parameters from the URL:

- `utm_source`: The source of the traffic (e.g., google, facebook)
- `utm_medium`: The marketing medium (e.g., cpc, email, social)
- `utm_campaign`: The specific campaign name
- `utm_term`: The search terms used
- `utm_content`: The content identifier (which ad version)

Example URL with UTM parameters:

```
https://example.com/products/bounce-house?utm_source=google&utm_medium=cpc&utm_campaign=summer_rentals&utm_term=bounce%20house%20rental&utm_content=ad1
```

## Technical Performance Tracking

The application automatically tracks:

- Page load times
- Client-side errors

## Analytics Dashboard

The admin dashboard provides several analytics views:

1. **Overview**: General visitor statistics and engagement metrics
2. **Business Insights**: Actionable insights based on visitor data
3. **Visitor List**: Detailed list of all visitors

The overview tab includes:

- **Visitor Engagement Metrics**: Visit counts, return rates, pages per visit
- **Device Breakdown**: Mobile vs. desktop vs. tablet usage
- **Referrer Sources**: Where visitors are coming from
- **Popular Pages**: Most viewed pages on the site
- **Visit Time Patterns**: When visitors are most active
- **Conversion Funnel**: How visitors move through the sales funnel
- **Marketing Attribution**: Which marketing channels are most effective

## Visitor Model

The visitor data is stored in MongoDB using the following schema:

```typescript
interface IVisitor {
  // Basic identification
  visitorId: string;
  firstVisit: Date;
  lastVisit: Date;
  visitCount: number;

  // Page visits
  visitedPages: { url: string; timestamp: Date; duration?: number }[];

  // Referrer information
  referrer: string;

  // Session information
  sessions: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    bounced: boolean;
    exitPage?: string;
    pagesViewed: number;
  }[];

  // Interaction data
  interactions?: {
    type: InteractionType;
    element?: string;
    page: string;
    timestamp: Date;
    data?: Record<string, any>;
  }[];

  // Conversion funnel data
  funnelStage?: FunnelStage;
  conversionEvents?: {
    type: ConversionEventType;
    timestamp: Date;
    product?: string;
    completed: boolean;
    value?: number;
  }[];

  // Marketing attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPage?: string;

  // Engagement scoring
  engagementScore?: number;
  intentScore?: number;
  lifetimeValue?: number;
  interestCategories?: string[];

  // Device information
  userAgent: string;
  device: "Mobile" | "Tablet" | "Desktop";
  ipAddress?: string;

  // Location information
  location?: {
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };

  // Browser information
  browser: {
    name: string;
    version: string;
    engine: string;
    isIncognito?: boolean;
  };

  // OS information
  os: {
    name: string;
    version: string;
  };

  // Screen information
  screen: {
    width: number;
    height: number;
    colorDepth: number;
  };

  // Timezone information
  timezone: {
    name: string;
    offset: number;
  };

  // Language information
  language: string;

  // Hardware information
  hardware: {
    cpuCores?: number;
    memory?: number;
    gpuVendor?: string;
    gpuRenderer?: string;
  };

  // Network information
  network: {
    connectionType?: string;
    downlink?: number;
    effectiveType?: string;
  };

  // Technical performance
  pageLoadTimes?: {
    url: string;
    loadTime: number;
    timestamp: Date;
  }[];

  clientErrors?: {
    type: string;
    message: string;
    url: string;
    timestamp: Date;
  }[];
}
```

## Privacy Considerations

When using visitor tracking, consider the following privacy best practices:

1. Include information about tracking in your privacy policy
2. Do not collect personally identifiable information without consent
3. Respect Do Not Track settings
4. Provide a way for users to opt out of tracking
5. Comply with relevant privacy regulations (GDPR, CCPA, etc.)
6. Implement data retention policies
7. Secure visitor data appropriately

## Implementation Examples

### Adding Tracking to a Contact Form

```tsx
"use client";

import React, { useState } from "react";
import { trackFormStart, trackFormSubmit } from "@/utils/trackInteraction";
import { trackContactForm } from "@/utils/trackConversion";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // Track when the user starts filling out the form (only once)
    if (
      formData.name === "" &&
      formData.email === "" &&
      formData.message === ""
    ) {
      trackFormStart("contact-form");
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Track form submission interaction
    trackFormSubmit("contact-form", undefined, {
      formType: "contact",
    });

    // Track conversion event
    trackContactForm();

    // Submit the form data to your API
    // ...
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### Adding Tracking to a Product Page

```tsx
"use client";

import React, { useEffect } from "react";
import { trackProductView, trackClick } from "@/utils/trackInteraction";
import {
  trackPriceCheck,
  trackAvailabilityCheck,
  trackBookingStarted,
} from "@/utils/trackConversion";

interface ProductPageProps {
  product: {
    slug: string;
    name: string;
    category: string;
    price: number;
  };
}

export default function ProductPage({ product }: ProductPageProps) {
  useEffect(() => {
    // Track product view when the page loads
    trackProductView(product.slug, undefined, {
      productName: product.name,
      category: product.category,
      price: product.price,
    });
  }, [product]);

  const handlePriceClick = () => {
    // Track price check
    trackPriceCheck(product.slug);
    trackClick("price-button", undefined, { productSlug: product.slug });
  };

  const handleAvailabilityClick = () => {
    // Track availability check
    trackAvailabilityCheck(product.slug);
    trackClick("availability-button", undefined, { productSlug: product.slug });
  };

  const handleBookNowClick = () => {
    // Track booking started
    trackBookingStarted(product.slug, product.price);
    trackClick("book-now-button", undefined, { productSlug: product.slug });
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <button onClick={handlePriceClick}>Check Price</button>
      <button onClick={handleAvailabilityClick}>Check Availability</button>
      <button onClick={handleBookNowClick}>Book Now</button>
    </div>
  );
}
```

## Conclusion

By implementing comprehensive visitor tracking and analytics, you can gain valuable insights into user behavior, optimize your marketing efforts, and improve your conversion rates. The tools provided in this application make it easy to collect and analyze this data.
