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
    "Holiday Party Bounce House Rentals San Antonio - Christmas & Seasonal | SATX Bounce",
  description:
    "Professional bounce house rentals for holiday parties, Christmas celebrations, Halloween events, and seasonal festivities in San Antonio. Create magical holiday memories with festive entertainment and reliable delivery.",
  alternates: {
    canonical: "/holiday-parties",
  },
  keywords:
    "holiday party bounce house rental san antonio, christmas party rentals, halloween bounce house, holiday event equipment, seasonal party rentals, winter celebration bounce house, holiday festival equipment",
  openGraph: {
    title:
      "Holiday Party Bounce House Rentals San Antonio - Christmas & Seasonal | SATX Bounce",
    description:
      "Professional bounce house rentals for holiday parties, Christmas celebrations, Halloween events, and seasonal festivities in San Antonio. Create magical holiday memories with festive entertainment and reliable delivery.",
    type: "website",
    url: "https://www.satxbounce.com/holiday-parties",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Holiday Party Bounce House Rentals San Antonio - Christmas & Seasonal | SATX Bounce",
    description:
      "Professional bounce house rentals for holiday parties, Christmas celebrations, Halloween events, and seasonal festivities in San Antonio. Create magical holiday memories with festive entertainment and reliable delivery.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for Holiday Parties
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Holiday Parties",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional holiday party bounce house and party rental service in San Antonio, TX. Specializing in Christmas celebrations, Halloween events, and seasonal festivities with festive entertainment and reliable service.",
  "@id": "https://www.satxbounce.com/holiday-parties",
  url: "https://www.satxbounce.com/holiday-parties",
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

// Custom Hero Section for Holiday Parties
const HolidayPartiesHeroSection: React.FC = () => {
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
          Holiday Party
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Bounce House Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Create magical memories with
          <span className="font-bold text-blue-300">
            {" "}
            festive entertainment{" "}
          </span>
          and
          <span className="font-bold text-purple-300">
            {" "}
            seasonal celebrations
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

export default async function HolidayPartiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <HolidayPartiesHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Holiday Party Benefits Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Why Families Choose SATX Bounce for Holiday Celebrations
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Holiday parties are special occasions that deserve memorable
            entertainment. Our bounce houses add excitement and joy to your
            seasonal celebrations, creating magical moments that families will
            treasure for years to come while handling the unique considerations
            of holiday events.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎄 Festive Atmosphere
              </div>
              <div className="text-sm text-white/80">
                Create magical holiday memories with fun entertainment
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌡️ Weather Ready
              </div>
              <div className="text-sm text-white/80">
                Indoor and outdoor options for any weather conditions
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📅 Holiday Scheduling
              </div>
              <div className="text-sm text-white/80">
                Flexible booking for busy holiday calendars
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                👨‍👩‍👧‍👦 Multi-Generation Fun
              </div>
              <div className="text-sm text-white/80">
                Entertainment that brings families together
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
          Get Your Holiday Party Quote
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Holiday Event Types Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Perfect for All Holiday Celebrations
          </h2>
          <p className="text-lg mb-6">
            Our bounce house rentals and party equipment create festive
            experiences for various holiday celebrations and seasonal events
            throughout the year:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎄</span>
              <span>
                Christmas Parties - Festive celebrations with holiday magic
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎃</span>
              <span>
                Halloween Events - Spooky fun for trick-or-treat celebrations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🇺🇸</span>
              <span>
                4th of July Parties - Patriotic celebrations with summer fun
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🐰</span>
              <span>
                Easter Celebrations - Spring festivities and egg hunt events
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎆</span>
              <span>
                New Year's Events - Ring in the new year with excitement
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">💝</span>
              <span>Valentine's Day - Love-themed family celebrations</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Seasonal Planning Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Year-Round Holiday Entertainment
          </h2>
          <p className="text-lg mb-6 text-white/90">
            San Antonio's mild climate allows for outdoor holiday celebrations
            throughout most of the year. We provide both indoor and outdoor
            bounce house options to ensure your holiday party is perfect
            regardless of the season or weather conditions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌸 Spring Holidays
              </div>
              <div className="text-sm text-white/80">
                Easter, Mother's Day, Memorial Day celebrations
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                ☀️ Summer Holidays
              </div>
              <div className="text-sm text-white/80">
                4th of July, Father's Day, Labor Day events
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🍂 Fall Holidays
              </div>
              <div className="text-sm text-white/80">
                Halloween, Thanksgiving, harvest celebrations
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                ❄️ Winter Holidays
              </div>
              <div className="text-sm text-white/80">
                Christmas, New Year's, winter festivities
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holiday Planning Tips Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Holiday Party Planning Tips
          </h2>
          <p className="text-lg mb-6">
            Make your holiday celebration extra special with these expert tips
            from our party planning professionals who have helped create
            countless magical holiday memories:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📅 Book Early
              </h3>
              <p className="text-sm text-gray-600">
                Holiday weekends fill up quickly. Reserve your bounce house 4-6
                weeks in advance for popular holidays.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🌡️ Weather Backup
              </h3>
              <p className="text-sm text-gray-600">
                Have indoor alternatives ready for outdoor holiday parties,
                especially during winter months.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🎨 Theme Coordination
              </h3>
              <p className="text-sm text-gray-600">
                Coordinate bounce house colors with your holiday decorations for
                a cohesive festive atmosphere.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                👨‍👩‍👧‍👦 Multi-Age Appeal
              </h3>
              <p className="text-sm text-gray-600">
                Choose equipment that accommodates different age groups for
                multi-generational holiday gatherings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Holiday Venue Information Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Popular Holiday Party Venues in San Antonio
          </h2>
          <p className="text-lg mb-6 text-white/90">
            From intimate backyard gatherings to large community celebrations,
            we deliver holiday entertainment to venues throughout San Antonio
            and surrounding areas, ensuring your seasonal celebration is
            memorable and magical.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏡 Backyard Parties
              </div>
              <div className="text-sm text-white/80">
                Intimate family holiday celebrations
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏢 Community Centers
              </div>
              <div className="text-sm text-white/80">
                Large holiday gatherings and events
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">⛪ Churches</div>
              <div className="text-sm text-white/80">
                Holiday fellowship and celebration events
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">🏞️ Parks</div>
              <div className="text-sm text-white/80">
                Outdoor holiday festivals and celebrations
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
            Ready to Create Holiday Magic?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Book your holiday party bounce house rental today and make this
            season unforgettable!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=holiday-party"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
