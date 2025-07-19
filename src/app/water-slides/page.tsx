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
    "Water Slide Rentals San Antonio - Inflatable Water Slides | SATX Bounce",
  description:
    "Beat the Texas heat with our premium water slide rentals in San Antonio! Tropical water slides, double lanes, and combo units with splash pools. Free delivery and professional setup for your summer party.",
  alternates: {
    canonical: "/water-slides",
  },
  keywords:
    "water slide rental san antonio, inflatable water slides, backyard water slides, summer party rentals, water slide with pool, tropical water slide, double lane water slide, wet bounce house combo",
  openGraph: {
    title:
      "Water Slide Rentals San Antonio - Inflatable Water Slides | SATX Bounce",
    description:
      "Beat the Texas heat with our premium water slide rentals in San Antonio! Tropical water slides, double lanes, and combo units with splash pools. Free delivery and professional setup for your summer party.",
    type: "website",
    url: "https://www.satxbounce.com/water-slides",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Water Slide Rentals San Antonio - Inflatable Water Slides | SATX Bounce",
    description:
      "Beat the Texas heat with our premium water slide rentals in San Antonio! Tropical water slides, double lanes, and combo units with splash pools. Free delivery and professional setup for your summer party.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Product schema for water slides
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Water Slide Rentals San Antonio",
  description:
    "Professional water slide rentals for parties and events in San Antonio, Texas. Multiple sizes and styles available with free delivery and setup.",
  brand: {
    "@type": "Brand",
    name: "SATX Bounce",
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "199.95",
    highPrice: "399.95",
    offerCount: "8",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "150",
  },
};

// Local business structured data for Water Slides
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Water Slides",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional water slide rental service in San Antonio, TX. Specializing in inflatable water slides, tropical themes, and combo units with splash pools for summer parties and events.",
  "@id": "https://www.satxbounce.com/water-slides",
  url: "https://www.satxbounce.com/water-slides",
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

// Custom Hero Section for Water Slides
const WaterSlidesHeroSection: React.FC = () => {
  return (
    <div className="relative w-full min-h-[800px] flex items-center justify-center bg-cover bg-center bg-fixed overflow-hidden">
      {/* Optimized Background with GPU acceleration */}
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-900"
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
          <div className="w-64 h-64 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-600/20 blur-3xl"></div>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl md:text-8xl font-extrabold mb-6 text-white animate-fade-in-down drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Water Slide
          <span className="block mt-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-transparent bg-clip-text animate-pulse">
            Rentals San Antonio
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Beat the Texas heat with
          <span className="font-bold text-cyan-300">
            {" "}
            premium water slides{" "}
          </span>
          and
          <span className="font-bold text-blue-300"> splash pool combos</span>
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up mb-16 sm:mb-0">
          <a
            href="/order"
            className="group relative px-8 py-4 bg-cyan-600 text-white text-lg font-bold rounded-xl overflow-hidden transition-all duration-300 hover:bg-cyan-700 hover:scale-105 hover:shadow-xl"
          >
            BOOK NOW
          </a>

          <a
            href="/products"
            className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-bold rounded-xl border-2 border-white/30 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-xl hover:border-white/50 flex items-center justify-center"
          >
            View All Products
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

export default async function WaterSlidesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([localBusinessSchema, productSchema]),
        }}
      />

      {/* Hero Section */}
      <WaterSlidesHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Water Slide Categories Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Premium Water Slide Collection
          </h2>
          <p className="text-lg mb-6 text-white/90">
            From single lane slides to massive double lane water slides, we have
            the perfect inflatable water slide for your San Antonio summer
            party. All water slides include splash pools, safety rails, and
            professional setup with water connections.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white/20 rounded-lg p-6">
              <div className="text-4xl mb-3">🌊</div>
              <h3 className="font-semibold text-white mb-2">
                Single Lane Slides
              </h3>
              <p className="text-sm text-white/80 mb-3">
                Perfect for smaller parties and backyards. Ages 5-14.
              </p>
              <div className="text-cyan-300 font-bold">Starting at $199.95</div>
            </div>
            <div className="bg-white/20 rounded-lg p-6">
              <div className="text-4xl mb-3">🏝️</div>
              <h3 className="font-semibold text-white mb-2">Tropical Themes</h3>
              <p className="text-sm text-white/80 mb-3">
                Stunning tropical designs with extended slides. Ages 5+.
              </p>
              <div className="text-cyan-300 font-bold">Starting at $349.95</div>
            </div>
            <div className="bg-white/20 rounded-lg p-6">
              <div className="text-4xl mb-3">🎢</div>
              <h3 className="font-semibold text-white mb-2">
                Double Lane & Combos
              </h3>
              <p className="text-sm text-white/80 mb-3">
                Racing slides and bounce house combos. Ages 5+.
              </p>
              <div className="text-cyan-300 font-bold">Starting at $299.95</div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Texas Heat Relief Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Beat the San Antonio Heat with Water Slide Rentals
          </h2>
          <p className="text-lg mb-6">
            San Antonio summers can reach over 100°F, making water slides the
            perfect solution for outdoor parties and events. Our inflatable
            water slides provide refreshing fun while keeping guests cool and
            entertained.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🌡️ Summer Cooling
              </h3>
              <p className="text-sm text-gray-600">
                Perfect for Texas heat - water slides provide instant relief
                from temperatures that regularly exceed 95°F from May through
                September.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                💧 Continuous Water Flow
              </h3>
              <p className="text-sm text-gray-600">
                Built-in water systems keep slides wet and slippery for safe,
                fun sliding. Includes splash pools for safe landings.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🏊 All Ages Fun
              </h3>
              <p className="text-sm text-gray-600">
                Age-appropriate options from 5+ to adult-friendly slides.
                Multiple capacity options for different party sizes.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🎉 Party Enhancement
              </h3>
              <p className="text-sm text-gray-600">
                Transform any backyard into a water park experience. Perfect for
                birthday parties, family reunions, and summer celebrations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Requirements Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Water Slide Setup Requirements
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Our professional team handles all setup and water connections.
            Here's what you need to know about preparing your space for water
            slide rentals in San Antonio.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌱 Grass Surface
              </div>
              <div className="text-sm text-white/80">
                Required for all water slides - provides safe, soft landing area
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                ⚡ Power Access
              </div>
              <div className="text-sm text-white/80">
                Standard electrical outlet within 100 feet of setup area
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                💧 Water Connection
              </div>
              <div className="text-sm text-white/80">
                Garden hose access for continuous water flow to slide
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📏 Space Requirements
              </div>
              <div className="text-sm text-white/80">
                20x30 to 40x30 feet depending on slide size
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Guidelines Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Water Slide Safety & Age Guidelines
          </h2>
          <p className="text-lg mb-6">
            Safety is our top priority. All water slides include safety features
            and come with comprehensive safety guidelines for worry-free fun.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                👶 Ages 5-14 (Most Slides)
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Blue Water Slide</li>
                <li>• Lime Water Slide</li>
                <li>• Single lane options</li>
                <li>• Perfect for kids parties</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🧑 Ages 5+ (All Ages)
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tropical Water Slides</li>
                <li>• Pink Waterslide</li>
                <li>• Double Lane Slides</li>
                <li>• Adult-friendly options</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🛡️ Safety Features
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Safety rails on all slides</li>
                <li>• Splash pools for safe landing</li>
                <li>• Non-slip climbing surfaces</li>
                <li>• Adult supervision required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact-form" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Get Your Water Slide Rental Quote
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Seasonal Booking Tips */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            San Antonio Water Slide Season
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Water slide season in San Antonio runs from March through October,
            with peak demand during summer months. Book early to secure your
            preferred date and take advantage of early season pricing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌸 Spring (Mar-May)
              </div>
              <div className="text-sm text-white/80">
                Perfect weather, lower demand, best availability
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                ☀️ Summer (Jun-Aug)
              </div>
              <div className="text-sm text-white/80">
                Peak season, highest demand, book 4-6 weeks ahead
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🍂 Fall (Sep-Oct)
              </div>
              <div className="text-sm text-white/80">
                Still warm, great for late season parties
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

      {/* Info Sections */}
      <InfoSections />

      {/* CTA Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-primary-purple">
            Ready to Make a Splash in San Antonio?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Book your water slide rental today and beat the Texas heat with
            premium inflatable water slides!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=water-slide"
            className="bg-cyan-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-cyan-700 hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
