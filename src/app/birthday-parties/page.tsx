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
    "Birthday Party Bounce House Rentals San Antonio - Free Delivery | SATX Bounce",
  description:
    "Make your child's birthday party unforgettable with our premium bounce house rentals in San Antonio. Professional water slides, bounce houses, and party equipment with free delivery and setup. Perfect for kids birthday parties of all ages.",
  alternates: {
    canonical: "/birthday-parties",
  },
  keywords:
    "birthday party bounce house rental san antonio, kids birthday party rentals, children's party bounce house, birthday party water slides, san antonio birthday party equipment, bounce house birthday party, inflatable birthday party rentals",
  openGraph: {
    title:
      "Birthday Party Bounce House Rentals San Antonio - Free Delivery | SATX Bounce",
    description:
      "Make your child's birthday party unforgettable with our premium bounce house rentals in San Antonio. Professional water slides, bounce houses, and party equipment with free delivery and setup.",
    type: "website",
    url: "https://www.satxbounce.com/birthday-parties",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Birthday Party Bounce House Rentals San Antonio - Free Delivery | SATX Bounce",
    description:
      "Make your child's birthday party unforgettable with our premium bounce house rentals in San Antonio. Professional water slides, bounce houses, and party equipment with free delivery and setup.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for Birthday Parties
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Birthday Parties",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional birthday party bounce house and party rental service in San Antonio, TX. Specializing in children's birthday parties with inflatable bounce houses, water slides, and party equipment with free delivery.",
  "@id": "https://www.satxbounce.com/birthday-parties",
  url: "https://www.satxbounce.com/birthday-parties",
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

// Custom Hero Section for Birthday Parties
const BirthdayPartyHeroSection: React.FC = () => {
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
          Birthday Party
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Bounce House Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Make your child&apos;s birthday unforgettable with
          <span className="font-bold text-blue-300">
            {" "}
            premium bounce houses{" "}
          </span>
          and
          <span className="font-bold text-purple-300">
            {" "}
            free delivery & setup
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
            View Products
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

export default async function BirthdayPartiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <BirthdayPartyHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Birthday Party Planning Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Perfect Birthday Party Planning Made Easy
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Planning the perfect birthday party for your child has never been
            easier! Our bounce house rentals are designed to create magical
            memories that will last a lifetime. From toddler-friendly bounce
            houses to exciting water slides for older kids, we have the perfect
            entertainment for every age group.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">🎂 Ages 2-12</div>
              <div className="text-sm text-white/80">
                Age-appropriate bounce houses for every birthday child
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎈 Party Packages
              </div>
              <div className="text-sm text-white/80">
                Complete party solutions with extras and add-ons
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📅 Easy Booking
              </div>
              <div className="text-sm text-white/80">
                Simple online booking with flexible scheduling
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
          Get Your Birthday Party Quote
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Popular Birthday Party Venues Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Popular Birthday Party Venues in San Antonio
          </h2>
          <p className="text-lg mb-6">
            Our birthday party bounce house rentals are perfect for celebrations
            at these popular San Antonio venues:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏡</span>
              <span>
                Backyard Birthday Parties - Most popular choice for intimate
                celebrations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏞️</span>
              <span>
                Brackenridge Park - Beautiful outdoor setting for larger parties
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏊</span>
              <span>
                Community Pools - Perfect for summer birthday celebrations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏢</span>
              <span>
                Community Centers - Indoor/outdoor options with facilities
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">⛪</span>
              <span>
                Church Fellowship Halls - Family-friendly environments
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏫</span>
              <span>
                School Playgrounds - Familiar settings for school-age children
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Birthday Party Tips Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Birthday Party Planning Tips
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Make your child's birthday party a huge success with these expert
            tips from our party planning professionals. We've helped thousands
            of families create unforgettable birthday celebrations throughout
            San Antonio.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎯 Age-Appropriate
              </div>
              <div className="text-sm text-white/80">
                Choose bounce houses suitable for your child's age group
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                👥 Guest Count
              </div>
              <div className="text-sm text-white/80">
                Consider the number of children for proper sizing
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌤️ Weather Backup
              </div>
              <div className="text-sm text-white/80">
                Have indoor alternatives for outdoor parties
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">🍕 Food & Fun</div>
              <div className="text-sm text-white/80">
                Plan food service around bounce house activities
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Birthday Party FAQ Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Birthday Party Bounce House FAQ
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Common questions about birthday party bounce house rentals in San
            Antonio. Get the answers you need to plan the perfect celebration.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-left">
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                What size bounce house is best for my child's age?
              </h3>
              <p className="text-sm text-white/80">
                Ages 3-8: Medium Castle (13x13). Ages 5-12: Balloon Bouncer
                (15x15). Ages 8+: Large Castle with Slide (15x25). We help you
                choose based on guest count and ages.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                How many kids can use the bounce house at once?
              </h3>
              <p className="text-sm text-white/80">
                Capacity varies by size: Small units (6 kids), Medium units (8
                kids), Large units (10 kids). We provide clear capacity
                guidelines for safe play.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                Do you provide setup and takedown?
              </h3>
              <p className="text-sm text-white/80">
                Yes! Our professional team handles complete setup before your
                party and takedown after. Setup takes 15-30 minutes, and we
                arrive 1-2 hours before your event.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                What if it rains on the party day?
              </h3>
              <p className="text-sm text-white/80">
                We monitor weather closely and offer flexible rescheduling for
                rain or high winds (15+ mph). Indoor alternatives may be
                available depending on space.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                Can adults use the bounce houses?
              </h3>
              <p className="text-sm text-white/80">
                Most units are designed for children 3-12. Some larger units
                accommodate teens and adults. Ask about weight limits and
                age-appropriate options when booking.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                How far in advance should I book?
              </h3>
              <p className="text-sm text-white/80">
                We recommend 2-4 weeks for birthday parties, especially for
                weekend dates. Popular times (spring/summer) book faster.
                Last-minute bookings may be available.
              </p>
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
            Ready to Plan the Perfect Birthday Party?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Book your birthday party bounce house rental today and create
            magical memories that will last a lifetime!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=birthday-party"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
