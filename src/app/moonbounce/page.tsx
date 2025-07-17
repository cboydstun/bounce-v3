import { Metadata } from "next";
import { MoonbounceContent } from "./moonbounce-content";

export const metadata: Metadata = {
  title:
    "Moonbounce Rentals San Antonio - Professional Setup & Delivery | SATX Bounce",
  description:
    "Premier moonbounce rentals in San Antonio with free delivery and setup. Professional moonbounce rental service for parties, events, and celebrations within Loop 1604.",
  alternates: {
    canonical: "/landing/moonbounce",
  },
  keywords:
    "moonbounce san antonio, moonbounce rentals san antonio, san antonio moonbounce, moonbounce rental service, inflatable moonbounce, party moonbounce rentals, moonbounce delivery san antonio",
  openGraph: {
    title:
      "Moonbounce Rentals San Antonio - Professional Setup & Delivery | SATX Bounce",
    description:
      "Premier moonbounce rentals in San Antonio with free delivery and setup. Professional moonbounce rental service for parties and events.",
    type: "website",
    url: "https://satxbounce.com/landing/moonbounce",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Moonbounce Rentals San Antonio - Professional Setup & Delivery | SATX Bounce",
    description:
      "Premier moonbounce rentals in San Antonio with free delivery and setup. Professional moonbounce rental service for parties and events.",
    images: ["/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for moonbounce services
const moonbounceBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce Moonbounce Rentals",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "San Antonio's premier moonbounce rental service offering professional inflatable moonbounce rentals with free delivery and setup for parties and events.",
  "@id": "https://www.satxbounce.com/landing/moonbounce",
  url: "https://www.satxbounce.com/landing/moonbounce",
  telephone: "(512) 210-0194",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "San Antonio",
    addressLocality: "San Antonio",
    addressRegion: "TX",
    postalCode: "78201",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 29.4241,
    longitude: -98.4936,
  },
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: 29.4241,
      longitude: -98.4936,
    },
    geoRadius: "30000",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "08:00",
    closes: "20:00",
  },
  serviceType: "Moonbounce Rental Service",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Moonbounce Rentals",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Moonbounce Rental",
          description: "Professional moonbounce rentals for parties and events",
        },
      },
    ],
  },
};

// FAQ structured data for moonbounce
const moonbounceFAQSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a moonbounce rental?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A moonbounce rental is an inflatable bouncing structure, also known as a bounce house, that provides safe entertainment for children and adults at parties and events. Our moonbounce rentals in San Antonio come with professional setup and free delivery.",
      },
    },
    {
      "@type": "Question",
      name: "Do you deliver moonbounces in San Antonio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! We provide free moonbounce delivery and setup throughout San Antonio within Loop 1604. Our professional team handles all aspects of moonbounce installation and pickup.",
      },
    },
    {
      "@type": "Question",
      name: "How much does a moonbounce rental cost in San Antonio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Moonbounce rental prices in San Antonio vary by size and features. Contact us for current pricing on our moonbounce rentals with free delivery and no deposit required.",
      },
    },
  ],
};

export default function MoonbouncePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(moonbounceBusinessSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(moonbounceFAQSchema),
        }}
      />
      <MoonbounceContent />
    </>
  );
}
