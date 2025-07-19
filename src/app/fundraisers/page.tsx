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
    "Fundraiser Bounce House Rentals San Antonio - Charity Events | SATX Bounce",
  description:
    "Professional bounce house rentals for fundraisers, charity events, and nonprofit celebrations in San Antonio. Special pricing for fundraising events with reliable delivery and setup to maximize your cause's success.",
  alternates: {
    canonical: "/fundraisers",
  },
  keywords:
    "fundraiser bounce house rental san antonio, charity event rentals, nonprofit party equipment, fundraising event bounce house, community fundraiser rentals, charity carnival equipment, nonprofit event planning",
  openGraph: {
    title:
      "Fundraiser Bounce House Rentals San Antonio - Charity Events | SATX Bounce",
    description:
      "Professional bounce house rentals for fundraisers, charity events, and nonprofit celebrations in San Antonio. Special pricing for fundraising events with reliable delivery and setup to maximize your cause's success.",
    type: "website",
    url: "https://www.satxbounce.com/fundraisers",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Fundraiser Bounce House Rentals San Antonio - Charity Events | SATX Bounce",
    description:
      "Professional bounce house rentals for fundraisers, charity events, and nonprofit celebrations in San Antonio. Special pricing for fundraising events with reliable delivery and setup to maximize your cause's success.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for Fundraisers
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Fundraisers",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional fundraiser bounce house and party rental service in San Antonio, TX. Specializing in charity events, nonprofit fundraisers, and community cause celebrations with special pricing and community support focus.",
  "@id": "https://www.satxbounce.com/fundraisers",
  url: "https://www.satxbounce.com/fundraisers",
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

// Custom Hero Section for Fundraisers
const FundraisersHeroSection: React.FC = () => {
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
          Fundraiser
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Bounce House Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Supporting your cause with
          <span className="font-bold text-blue-300"> special pricing </span>
          and
          <span className="font-bold text-purple-300">
            {" "}
            community partnership
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

export default async function FundraisersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <FundraisersHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Fundraiser Benefits Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Why Nonprofits Choose SATX Bounce for Fundraising Events
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We believe in supporting the important work that nonprofits and
            charitable organizations do in our community. Our special fundraiser
            pricing and community-focused approach help maximize your event's
            success while keeping costs low to benefit your cause.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                💝 Special Pricing
              </div>
              <div className="text-sm text-white/80">
                Discounted rates for registered nonprofits and charities
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🤝 Community Support
              </div>
              <div className="text-sm text-white/80">
                Partnering with local causes and community initiatives
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📈 Revenue Maximization
              </div>
              <div className="text-sm text-white/80">
                Expert advice to help maximize your fundraising success
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎯 Event Planning
              </div>
              <div className="text-sm text-white/80">
                Dedicated support for successful fundraising events
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
          Get Your Fundraiser Quote
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Fundraiser Types Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Perfect for All Types of Fundraising Events
          </h2>
          <p className="text-lg mb-6">
            Our bounce house rentals and party equipment help create engaging
            fundraising events that attract families and maximize community
            participation:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎪</span>
              <span>
                Charity Carnivals - Community-wide fundraising celebrations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏃</span>
              <span>
                Walk/Run Events - Add family fun to athletic fundraisers
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎨</span>
              <span>
                Arts & Culture Fundraisers - Support local arts organizations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏥</span>
              <span>
                Medical Fundraisers - Support families facing medical challenges
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🐾</span>
              <span>
                Animal Rescue Events - Support local animal welfare
                organizations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🌱</span>
              <span>
                Environmental Causes - Eco-friendly fundraising celebrations
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Fundraising Success Tips Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Maximize Your Fundraising Success
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Based on our experience supporting hundreds of fundraising events,
            here are proven strategies to help your cause achieve its
            fundraising goals and create lasting community impact.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                👨‍👩‍👧‍👦 Family Appeal
              </div>
              <div className="text-sm text-white/80">
                Bounce houses attract families, increasing attendance and
                donations
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📱 Social Media
              </div>
              <div className="text-sm text-white/80">
                Fun activities create shareable moments for online promotion
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎟️ Multiple Revenue
              </div>
              <div className="text-sm text-white/80">
                Combine bounce house fees with other fundraising activities
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🤝 Sponsorships
              </div>
              <div className="text-sm text-white/80">
                Attract local business sponsors for family-friendly events
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Partnership Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Supporting San Antonio's Nonprofit Community
          </h2>
          <p className="text-lg mb-6">
            We're committed to supporting the vital work of nonprofits and
            charitable organizations throughout San Antonio. Our community
            partnership approach includes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                💰 Nonprofit Discounts
              </h3>
              <p className="text-sm text-gray-600">
                Special pricing for registered 501(c)(3) organizations and
                verified charitable causes.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📋 Event Planning Support
              </h3>
              <p className="text-sm text-gray-600">
                Free consultation and planning assistance to help maximize your
                event's success.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🤝 Community Partnerships
              </h3>
              <p className="text-sm text-gray-600">
                Long-term relationships with local nonprofits for ongoing
                fundraising support.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📈 Success Tracking
              </h3>
              <p className="text-sm text-gray-600">
                Help measure event success and provide insights for future
                fundraising improvements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nonprofit Qualification Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Qualifying for Nonprofit Pricing
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We offer special discounted pricing for qualified nonprofit
            organizations and charitable causes. Contact us with your
            organization's information to learn about available discounts and
            community support options.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📄 501(c)(3) Status
              </div>
              <div className="text-sm text-white/80">
                Registered nonprofit organizations
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏫 Educational Institutions
              </div>
              <div className="text-sm text-white/80">
                Schools and educational nonprofits
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                ⛪ Religious Organizations
              </div>
              <div className="text-sm text-white/80">
                Churches and faith-based charities
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
            Ready to Make Your Fundraiser a Success?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Contact us today for special nonprofit pricing and fundraising event
            planning support!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=fundraiser"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
