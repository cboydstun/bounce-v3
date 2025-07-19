import React from "react";
import PackageDealsCTA from "../../components/PackageDealsCTA";
import CustomerReviews from "../../components/CustomerReviews";
import ContactForm from "../../components/ContactForm";
import ProductCarousel from "../../components/ProductCarousel";
import InfoSections from "../../components/InfoSections";
import OccasionsSection from "../../components/OccasionsSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Church Event Bounce House Rentals San Antonio - VBS & Fellowship | SATX Bounce",
  description:
    "Professional bounce house rentals for church events, VBS celebrations, fellowship gatherings, and ministry activities in San Antonio. Safe, family-friendly entertainment with free delivery and setup.",
  alternates: {
    canonical: "/church-events",
  },
  keywords:
    "church event bounce house rental san antonio, VBS bounce house, church festival rentals, fellowship event equipment, ministry party rentals, vacation bible school activities, church carnival bounce house",
  openGraph: {
    title:
      "Church Event Bounce House Rentals San Antonio - VBS & Fellowship | SATX Bounce",
    description:
      "Professional bounce house rentals for church events, VBS celebrations, fellowship gatherings, and ministry activities in San Antonio. Safe, family-friendly entertainment with free delivery and setup.",
    type: "website",
    url: "https://www.satxbounce.com/church-events",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Church Event Bounce House Rentals San Antonio - VBS & Fellowship | SATX Bounce",
    description:
      "Professional bounce house rentals for church events, VBS celebrations, fellowship gatherings, and ministry activities in San Antonio. Safe, family-friendly entertainment with free delivery and setup.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for Church Events
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Church Events",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional church event bounce house and party rental service in San Antonio, TX. Specializing in VBS celebrations, fellowship gatherings, and ministry activities with safe, family-friendly entertainment.",
  "@id": "https://www.satxbounce.com/church-events",
  url: "https://www.satxbounce.com/church-events",
  telephone: "(512) 210-0194",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Serving San Antonio",
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

// Custom Hero Section for Church Events
const ChurchEventsHeroSection: React.FC = () => {
  return (
    <div className="relative w-full min-h-[800px] flex items-center justify-center bg-cover bg-center bg-fixed overflow-hidden">
      {/* Optimized Background with GPU acceleration */}
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-blue-900"
        style={{
          backgroundImage: 'url("/hero-background.webp")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transform: "translateZ(0)", // Force GPU acceleration
          willChange: "transform",
          contain: "paint",
        }}
      />

      {/* Simplified Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/50"
        style={{ willChange: "opacity" }}
      ></div>

      {/* Reduced and optimized animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute animate-float"
          style={{
            left: "20%",
            top: "30%",
            opacity: 0.1,
            transform: "translateZ(0)",
            willChange: "transform",
          }}
        >
          <div className="w-64 h-64 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-600/20 blur-3xl"></div>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl md:text-8xl font-extrabold mb-6 text-white animate-fade-in-down drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Church Event
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Bounce House Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Family-friendly entertainment for
          <span className="font-bold text-blue-300"> VBS celebrations </span>
          and
          <span className="font-bold text-purple-300">
            {" "}
            fellowship gatherings
          </span>
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up mb-16 sm:mb-0">
          <a
            href="/order"
            className="group relative px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl overflow-hidden transition-all duration-300 hover:bg-blue-700 hover:scale-105 hover:shadow-xl"
          >
            GET QUOTE
          </a>

          <a
            href="/products"
            className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-bold rounded-xl border-2 border-white/30 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-xl hover:border-white/50 flex items-center justify-center"
          >
            View Equipment
            <svg
              className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Bottom Gradient and Wave */}
      <div className="absolute bottom-0 left-0 right-0 w-full">
        <div
          className="absolute bottom-0 left-0 right-0 h-48"
          style={{
            background: "linear-gradient(to top, #663399, transparent)",
          }}
        />
        <svg
          className="relative block w-full"
          style={{ height: "75px" }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 Q600,120 1200,0 L1200,120 L0,120 Z"
            fill="#663399"
          ></path>
        </svg>
      </div>
    </div>
  );
};

export default async function ChurchEventsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <ChurchEventsHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Church Event Benefits Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Why Churches Trust SATX Bounce for Their Events
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We understand the importance of creating safe, wholesome
            entertainment for church families. Our bounce houses provide clean
            fun that brings congregations together while supporting your
            ministry goals and community outreach efforts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                👨‍👩‍👧‍👦 Family-Friendly
              </div>
              <div className="text-sm text-white/80">
                Safe, wholesome entertainment for all ages
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🤝 Community Building
              </div>
              <div className="text-sm text-white/80">
                Activities that bring church families together
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                💝 Ministry Support
              </div>
              <div className="text-sm text-white/80">
                Special pricing for church and ministry events
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                ✝️ Values-Aligned
              </div>
              <div className="text-sm text-white/80">
                Professional service that respects your ministry
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Occasions Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8 text-center">
          <OccasionsSection />
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact-form" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Get Your Church Event Quote
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Church Event Types Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Perfect for All Types of Church Events
          </h2>
          <p className="text-lg mb-6">
            Our bounce house rentals and party equipment create memorable
            experiences for various church events and ministry activities:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">📖</span>
              <span>
                Vacation Bible School (VBS) - Make learning fun with exciting
                activities
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎪</span>
              <span>
                Church Festivals - Community outreach and fellowship
                celebrations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🍽️</span>
              <span>
                Fellowship Dinners - Add entertainment to community meals
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">👶</span>
              <span>
                Children's Ministry Events - Engage young members with active
                fun
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎉</span>
              <span>
                Church Anniversaries - Celebrate milestones with the
                congregation
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🌟</span>
              <span>
                Youth Group Activities - Build community among teenagers
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* VBS Planning Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Make Your VBS Unforgettable
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Vacation Bible School is one of the most important outreach events
            of the year. Our bounce houses help create an exciting atmosphere
            that kids will remember long after VBS ends, supporting your
            ministry's impact in the community.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📅 Week-Long Rentals
              </div>
              <div className="text-sm text-white/80">
                Special pricing for multi-day VBS programs
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎯 Age-Appropriate
              </div>
              <div className="text-sm text-white/80">
                Equipment suitable for preschool through elementary
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌤️ Indoor/Outdoor
              </div>
              <div className="text-sm text-white/80">
                Options for fellowship halls and outdoor spaces
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                👥 High Capacity
              </div>
              <div className="text-sm text-white/80">
                Equipment to handle large VBS attendance
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Church Venue Information Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Serving Churches Throughout San Antonio
          </h2>
          <p className="text-lg mb-6">
            We work with churches of all sizes and denominations throughout the
            San Antonio area, providing reliable service for both indoor and
            outdoor events:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🏢 Fellowship Halls
              </h3>
              <p className="text-sm text-gray-600">
                Indoor bounce houses perfect for fellowship halls and gymnasiums
                with proper ceiling height.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🌳 Church Grounds
              </h3>
              <p className="text-sm text-gray-600">
                Outdoor setups for church parking lots, fields, and recreational
                areas.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                ⛪ All Denominations
              </h3>
              <p className="text-sm text-gray-600">
                We serve Baptist, Methodist, Catholic, Presbyterian,
                Non-denominational, and all Christian churches.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📍 Area-Wide Service
              </h3>
              <p className="text-sm text-gray-600">
                Free delivery throughout San Antonio and surrounding communities
                including Boerne, Schertz, and Seguin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ministry Partnership Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Supporting Your Ministry Goals
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We believe in supporting the important work that churches do in our
            community. Our goal is to help you create memorable events that
            strengthen fellowship, reach new families, and support your ministry
            objectives.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🤝 Partnership Approach
              </div>
              <div className="text-sm text-white/80">
                We work with you to ensure your event's success
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                💒 Ministry Discounts
              </div>
              <div className="text-sm text-white/80">
                Special pricing for church and ministry events
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📞 Dedicated Support
              </div>
              <div className="text-sm text-white/80">
                Personal service from our church event specialists
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Sections */}
      <InfoSections />

      {/* CTA Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-primary-purple">
            Ready to Bless Your Church Event?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Contact us today for special church pricing and ministry-focused
            event planning!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=church-event"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
