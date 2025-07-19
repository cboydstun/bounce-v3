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
    "Graduation Party Bounce House Rentals San Antonio - High School & College | SATX Bounce",
  description:
    "Professional bounce house rentals for graduation parties, high school celebrations, college graduations, and achievement milestones in San Antonio. Create memorable graduation celebrations with fun entertainment and reliable delivery.",
  alternates: {
    canonical: "/graduation-parties",
  },
  keywords:
    "graduation party bounce house rental san antonio, high school graduation rentals, college graduation party equipment, graduation celebration bounce house, achievement party rentals, milestone celebration equipment",
  openGraph: {
    title:
      "Graduation Party Bounce House Rentals San Antonio - High School & College | SATX Bounce",
    description:
      "Professional bounce house rentals for graduation parties, high school celebrations, college graduations, and achievement milestones in San Antonio. Create memorable graduation celebrations with fun entertainment and reliable delivery.",
    type: "website",
    url: "https://www.satxbounce.com/graduation-parties",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Graduation Party Bounce House Rentals San Antonio - High School & College | SATX Bounce",
    description:
      "Professional bounce house rentals for graduation parties, high school celebrations, college graduations, and achievement milestones in San Antonio. Create memorable graduation celebrations with fun entertainment and reliable delivery.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for Graduation Parties
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Graduation Parties",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional graduation party bounce house and party rental service in San Antonio, TX. Specializing in high school graduations, college celebrations, and achievement milestones with memorable entertainment and reliable service.",
  "@id": "https://www.satxbounce.com/graduation-parties",
  url: "https://www.satxbounce.com/graduation-parties",
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

// Custom Hero Section for Graduation Parties
const GraduationPartiesHeroSection: React.FC = () => {
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
          Graduation Party
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Bounce House Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Celebrate achievements with
          <span className="font-bold text-blue-300">
            {" "}
            milestone entertainment{" "}
          </span>
          and
          <span className="font-bold text-purple-300">
            {" "}
            memorable celebrations
          </span>
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up mb-16 sm:mb-0">
          <a
            href="/order"
            className="group relative px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl overflow-hidden transition-all duration-300 hover:bg-blue-700 hover:scale-105 hover:shadow-xl"
          >
            BOOK NOW
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

export default async function GraduationPartiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <GraduationPartiesHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Graduation Party Benefits Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Why Families Choose SATX Bounce for Graduation Celebrations
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Graduation is a major milestone that deserves a memorable
            celebration. Our bounce houses add excitement and joy to your
            achievement celebrations, creating fun experiences that bring
            families together while honoring the graduate's hard work and
            dedication to their educational journey.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎓 Milestone Celebration
              </div>
              <div className="text-sm text-white/80">
                Honor achievements with memorable entertainment
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                👨‍👩‍👧‍👦 Multi-Generation Appeal
              </div>
              <div className="text-sm text-white/80">
                Fun for graduates, siblings, and extended family
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📸 Photo Opportunities
              </div>
              <div className="text-sm text-white/80">
                Create lasting memories and celebration photos
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎉 Stress-Free Planning
              </div>
              <div className="text-sm text-white/80">
                Easy booking during busy graduation season
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
          Get Your Graduation Party Quote
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Graduation Types Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Perfect for All Graduation Milestones
          </h2>
          <p className="text-lg mb-6">
            Our bounce house rentals and party equipment create memorable
            experiences for various graduation celebrations and educational
            achievements:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎓</span>
              <span>
                High School Graduation - Celebrate the transition to adulthood
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏛️</span>
              <span>
                College Graduation - Honor years of hard work and dedication
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">👶</span>
              <span>
                Kindergarten Graduation - First educational milestone
                celebration
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏫</span>
              <span>
                Middle School Promotion - Transition to high school celebration
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">📚</span>
              <span>
                Graduate School - Advanced degree achievement celebrations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎖️</span>
              <span>
                Military Graduation - Honor service and training completion
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Graduation Season Planning Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Graduation Season Planning in San Antonio
          </h2>
          <p className="text-lg mb-6 text-white/90">
            San Antonio's graduation season runs from May through August, with
            peak demand in May and June. Our experienced team helps you plan the
            perfect celebration during this busy time, ensuring your graduate's
            special day is everything they deserve.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌸 May Graduations
              </div>
              <div className="text-sm text-white/80">
                High school and college ceremonies peak
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                ☀️ June Celebrations
              </div>
              <div className="text-sm text-white/80">
                Summer party season begins
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎓 July & August
              </div>
              <div className="text-sm text-white/80">
                Summer graduations and delayed celebrations
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">📅 Book Early</div>
              <div className="text-sm text-white/80">
                Reserve 6-8 weeks in advance
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graduation Party Planning Tips Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Graduation Party Planning Tips
          </h2>
          <p className="text-lg mb-6">
            Make your graduate's celebration extra special with these expert
            tips from our party planning professionals who have helped create
            countless memorable graduation parties:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📅 Plan Around Ceremonies
              </h3>
              <p className="text-sm text-gray-600">
                Schedule your party for the day after graduation to allow time
                for ceremony photos and family time.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                👥 Include Friends
              </h3>
              <p className="text-sm text-gray-600">
                Coordinate with other families for joint celebrations to include
                the graduate's friend group.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🎨 School Colors
              </h3>
              <p className="text-sm text-gray-600">
                Incorporate school colors and themes into decorations to honor
                the graduate's achievement.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📸 Memory Making
              </h3>
              <p className="text-sm text-gray-600">
                Create photo opportunities and memory stations to capture this
                important milestone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* San Antonio Schools Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Celebrating San Antonio Area Graduates
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We're proud to celebrate graduates from schools throughout the San
            Antonio area, from local high schools to major universities. Every
            achievement deserves recognition, and we're here to help make your
            graduate's celebration special.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏫 Local High Schools
              </div>
              <div className="text-sm text-white/80">
                SAISD, NEISD, NISD and private schools
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">🏛️ UTSA</div>
              <div className="text-sm text-white/80">
                University of Texas at San Antonio
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎓 Trinity University
              </div>
              <div className="text-sm text-white/80">
                Private university graduates
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📚 Community Colleges
              </div>
              <div className="text-sm text-white/80">
                Alamo Colleges and technical schools
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
            Ready to Celebrate Your Graduate?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Book your graduation party bounce house rental today and create
            memories that will last a lifetime!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=graduation-party"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
