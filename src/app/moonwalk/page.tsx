import { Metadata } from "next";
import { MoonwalkContent } from "./moonwalk-content";

export const metadata: Metadata = {
  title:
    "Moonwalk Rentals San Antonio - Professional Setup & Delivery | SATX Bounce",
  description:
    "Premier moonwalk rentals in San Antonio with free delivery and setup. Professional moonwalk rental service for parties, events, and celebrations within Loop 1604.",
  alternates: {
    canonical: "/moonwalk",
  },
  keywords:
    "moonwalk rental san antonio, moonwalk rentals san antonio, san antonio moonwalk, moonwalk rental service, inflatable moonwalk, party moonwalk rentals, moonwalk delivery san antonio",
  openGraph: {
    title:
      "Moonwalk Rentals San Antonio - Professional Setup & Delivery | SATX Bounce",
    description:
      "Premier moonwalk rentals in San Antonio with free delivery and setup. Professional moonwalk rental service for parties and events.",
    type: "website",
    url: "https://satxbounce.com/moonwalk",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Moonwalk Rentals San Antonio - Professional Setup & Delivery | SATX Bounce",
    description:
      "Premier moonwalk rentals in San Antonio with free delivery and setup. Professional moonwalk rental service for parties and events.",
    images: ["/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for moonwalk services
const moonwalkBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce Moonwalk Rentals",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "San Antonio's premier moonwalk rental service offering professional inflatable moonwalk rentals with free delivery and setup for parties and events.",
  "@id": "https://www.satxbounce.com/moonwalk",
  url: "https://www.satxbounce.com/moonwalk",
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
  serviceType: "Moonwalk Rental Service",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Moonwalk Rentals",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Moonwalk Rental",
          description: "Professional moonwalk rentals for parties and events",
        },
      },
    ],
  },
};

// FAQ structured data for moonwalk
const moonwalkFAQSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a moonwalk rental?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A moonwalk rental is an inflatable bouncing structure, also known as a bounce house, that provides safe entertainment for children and adults at parties and events. Our moonwalk rentals in San Antonio come with professional setup and free delivery.",
      },
    },
    {
      "@type": "Question",
      name: "Do you deliver moonwalks in San Antonio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! We provide free moonwalk delivery and setup throughout San Antonio within Loop 1604. Our professional team handles all aspects of moonwalk installation and pickup.",
      },
    },
    {
      "@type": "Question",
      name: "How much does a moonwalk rental cost in San Antonio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Moonwalk rental prices in San Antonio vary by size and features. Contact us for current pricing on our moonwalk rentals with free delivery and no deposit required.",
      },
    },
  ],
};

export default function MoonwalkPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(moonwalkBusinessSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(moonwalkFAQSchema),
        }}
      />
      <MoonwalkContent />
    </>
  );
}
