import React from "react";
import PackageDealsCTA from "../components/PackageDealsCTA";
import CustomerReviews from "../components/CustomerReviews";
import ContactForm from "../components/ContactForm";
import ProductCarousel from "../components/ProductCarousel";
import InfoSections from "../components/InfoSections";
import OccasionsSection from "../components/OccasionsSection";
import HeroSection from "../components/HeroSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "San Antonio Bounce House Rentals - Free Delivery & Setup | SATX Bounce",
  description:
    "San Antonio's premier bounce house rental service. Professional and timely bounce house rentals with free delivery and no deposit required. Water slides, party equipment, and more!",
  alternates: {
    canonical: "/",
  },
  keywords:
    "bounce house rental, San Antonio party rentals, water slides, inflatable rentals, party equipment, event rentals, free delivery",
  openGraph: {
    title:
      "San Antonio Bounce House Rentals - Free Delivery & Setup | SATX Bounce",
    description:
      "San Antonio's premier bounce house rental service. Professional and timely bounce house rentals with free delivery and no deposit required.",
    type: "website",
    url: "https://www.satxbounce.com",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "San Antonio Bounce House Rentals - Free Delivery & Setup | SATX Bounce",
    description:
      "San Antonio's premier bounce house rental service. Professional and timely bounce house rentals with free delivery and no deposit required.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "San Antonio's premier bounce house and party rental service offering inflatable bounce houses, water slides, and party equipment with free delivery.",
  "@id": "https://www.satxbounce.com",
  url: "https://www.satxbounce.com",
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
};

export default async function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Occasions Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8 text-center">
          <OccasionsSection />
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact-form" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Get in Touch
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Info Sections */}
      <InfoSections />

      {/* Map Section */}
      {/* <MapSection /> */}

      {/* CTA Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-primary-purple">
            Ready to Make Your Event Unforgettable?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Book now and get free delivery within Loop 1604!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=homepage"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
