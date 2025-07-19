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
    "Community Gathering Bounce House Rentals San Antonio - HOA Events | SATX Bounce",
  description:
    "Professional bounce house rentals for community gatherings, HOA events, neighborhood parties, and block parties in San Antonio. Build stronger communities with fun entertainment and reliable delivery service.",
  alternates: {
    canonical: "/community-gatherings",
  },
  keywords:
    "community gathering bounce house rental san antonio, HOA event rentals, neighborhood party equipment, block party bounce house, community festival rentals, homeowners association events, civic celebration equipment",
  openGraph: {
    title:
      "Community Gathering Bounce House Rentals San Antonio - HOA Events | SATX Bounce",
    description:
      "Professional bounce house rentals for community gatherings, HOA events, neighborhood parties, and block parties in San Antonio. Build stronger communities with fun entertainment and reliable delivery service.",
    type: "website",
    url: "https://www.satxbounce.com/community-gatherings",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Community Gathering Bounce House Rentals San Antonio - HOA Events | SATX Bounce",
    description:
      "Professional bounce house rentals for community gatherings, HOA events, neighborhood parties, and block parties in San Antonio. Build stronger communities with fun entertainment and reliable delivery service.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for Community Gatherings
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Community Gatherings",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional community gathering bounce house and party rental service in San Antonio, TX. Specializing in HOA events, neighborhood parties, and block parties with community-focused service and reliable entertainment.",
  "@id": "https://www.satxbounce.com/community-gatherings",
  url: "https://www.satxbounce.com/community-gatherings",
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

// Custom Hero Section for Community Gatherings
const CommunityGatheringsHeroSection: React.FC = () => {
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
          Community Gathering
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Bounce House Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Building stronger communities with
          <span className="font-bold text-blue-300"> neighborhood fun </span>
          and
          <span className="font-bold text-purple-300"> HOA celebrations</span>
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

export default async function CommunityGatheringsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <CommunityGatheringsHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Community Gathering Benefits Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Why Communities Choose SATX Bounce for Neighborhood Events
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Strong communities are built through shared experiences and
            connections. Our bounce houses create the perfect atmosphere for
            neighbors to come together, children to play, and lasting
            friendships to form while supporting your community's goals and
            bringing residents closer together.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏘️ Community Building
              </div>
              <div className="text-sm text-white/80">
                Activities that bring neighbors together and build connections
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                👨‍👩‍👧‍👦 Family-Friendly
              </div>
              <div className="text-sm text-white/80">
                Entertainment that appeals to all ages and family types
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📋 Easy Planning
              </div>
              <div className="text-sm text-white/80">
                Simple coordination with HOA boards and event committees
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                💰 Group Pricing
              </div>
              <div className="text-sm text-white/80">
                Special rates for community events and large gatherings
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
          Get Your Community Event Quote
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Community Event Types Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Perfect for All Types of Community Events
          </h2>
          <p className="text-lg mb-6">
            Our bounce house rentals and party equipment create engaging
            experiences for various community gatherings and neighborhood
            celebrations:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏘️</span>
              <span>
                HOA Events - Homeowners association celebrations and meetings
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎪</span>
              <span>
                Block Parties - Neighborhood street celebrations and gatherings
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏞️</span>
              <span>
                Community Festivals - Large-scale neighborhood celebrations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎉</span>
              <span>
                Civic Celebrations - City and municipal community events
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🤝</span>
              <span>
                Meet & Greets - Welcome new neighbors and build connections
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏆</span>
              <span>
                Community Awards - Recognize neighborhood achievements
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* San Antonio Communities Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Serving San Antonio Area Communities
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We proudly serve master-planned communities, established
            neighborhoods, and HOAs throughout the San Antonio metropolitan
            area, helping build stronger community connections through fun and
            engaging events.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">🏘️ Stone Oak</div>
              <div className="text-sm text-white/80">
                Master-planned community events
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌳 Alamo Heights
              </div>
              <div className="text-sm text-white/80">
                Historic neighborhood gatherings
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">🏞️ Boerne</div>
              <div className="text-sm text-white/80">
                Hill Country community celebrations
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏡 All Neighborhoods
              </div>
              <div className="text-sm text-white/80">
                Every community deserves great events
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Building Tips Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Building Stronger Communities Through Events
          </h2>
          <p className="text-lg mb-6">
            Based on our experience with hundreds of community events, here are
            proven strategies to create successful gatherings that bring
            neighbors together:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📅 Regular Events
              </h3>
              <p className="text-sm text-gray-600">
                Schedule quarterly or seasonal events to maintain community
                engagement and build anticipation.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                👥 Inclusive Planning
              </h3>
              <p className="text-sm text-gray-600">
                Include diverse community members in planning to ensure events
                appeal to all residents.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🎯 Multi-Age Activities
              </h3>
              <p className="text-sm text-gray-600">
                Plan activities for different age groups to encourage
                whole-family participation.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📢 Clear Communication
              </h3>
              <p className="text-sm text-gray-600">
                Use multiple channels to promote events and ensure all residents
                are informed and invited.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HOA Partnership Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Partnering with HOAs and Community Leaders
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We understand the unique needs of homeowners associations and
            community organizations. Our professional approach and reliable
            service make event planning easier for volunteer committees and
            community leaders.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📋 Easy Coordination
              </div>
              <div className="text-sm text-white/80">
                Simple booking process designed for volunteer committees
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                💰 Budget-Friendly
              </div>
              <div className="text-sm text-white/80">
                Competitive pricing that works with HOA budgets
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🛡️ Fully Insured
              </div>
              <div className="text-sm text-white/80">
                Comprehensive coverage for community events
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
            Ready to Bring Your Community Together?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Contact us today for special community pricing and event planning
            assistance!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=community-event"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
