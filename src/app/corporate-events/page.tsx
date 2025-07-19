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
    "Corporate Event Bounce House Rentals San Antonio - Company Picnics | SATX Bounce",
  description:
    "Professional bounce house rentals for corporate events, company picnics, employee appreciation days, and team building activities in San Antonio. Premium service for business events with reliable delivery and setup.",
  alternates: {
    canonical: "/corporate-events",
  },
  keywords:
    "corporate event bounce house rental san antonio, company picnic rentals, employee appreciation bounce house, team building activities, business event equipment, corporate party rentals, office celebration equipment",
  openGraph: {
    title:
      "Corporate Event Bounce House Rentals San Antonio - Company Picnics | SATX Bounce",
    description:
      "Professional bounce house rentals for corporate events, company picnics, employee appreciation days, and team building activities in San Antonio. Premium service for business events with reliable delivery and setup.",
    type: "website",
    url: "https://www.satxbounce.com/corporate-events",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Corporate Event Bounce House Rentals San Antonio - Company Picnics | SATX Bounce",
    description:
      "Professional bounce house rentals for corporate events, company picnics, employee appreciation days, and team building activities in San Antonio. Premium service for business events with reliable delivery and setup.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for Corporate Events
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Corporate Events",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional corporate event bounce house and party rental service in San Antonio, TX. Specializing in company picnics, employee appreciation events, and team building activities with premium business-focused service.",
  "@id": "https://www.satxbounce.com/corporate-events",
  url: "https://www.satxbounce.com/corporate-events",
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

// Custom Hero Section for Corporate Events
const CorporateEventsHeroSection: React.FC = () => {
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
          Corporate Event
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Bounce House Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Premium entertainment for
          <span className="font-bold text-blue-300"> company picnics </span>
          and
          <span className="font-bold text-purple-300">
            {" "}
            employee appreciation
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

export default async function CorporateEventsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <CorporateEventsHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Corporate Event Benefits Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Why Businesses Choose SATX Bounce for Corporate Events
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We understand the unique requirements of corporate events and
            business functions. Our professional service, reliable equipment,
            and attention to detail ensure your company event reflects
            positively on your organization while creating memorable experiences
            for employees and their families.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏢 Professional Service
              </div>
              <div className="text-sm text-white/80">
                Business-focused approach with corporate invoicing
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📋 Event Coordination
              </div>
              <div className="text-sm text-white/80">
                Dedicated event managers for seamless planning
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                ⏰ Reliable Timing
              </div>
              <div className="text-sm text-white/80">
                On-time delivery and setup for business schedules
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🛡️ Fully Insured
              </div>
              <div className="text-sm text-white/80">
                Comprehensive liability coverage for corporate events
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
          Get Your Corporate Event Quote
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Corporate Event Types Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Perfect for All Types of Corporate Events
          </h2>
          <p className="text-lg mb-6">
            Our bounce house rentals and party equipment create engaging
            experiences for various corporate events and business celebrations:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏢</span>
              <span>
                Company Picnics - Annual celebrations that build team morale
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎉</span>
              <span>
                Employee Appreciation Days - Recognize and reward your team
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🤝</span>
              <span>
                Team Building Events - Foster collaboration and communication
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏆</span>
              <span>
                Achievement Celebrations - Honor milestones and successes
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎪</span>
              <span>Corporate Festivals - Large-scale company-wide events</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">👨‍👩‍👧‍👦</span>
              <span>
                Family Fun Days - Include employees' families in celebrations
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Corporate Venue Information Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Serving San Antonio's Business Community
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We work with companies of all sizes throughout the San Antonio
            metropolitan area, providing professional entertainment for
            corporate events at various business venues and corporate
            facilities.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏢 Corporate Campuses
              </div>
              <div className="text-sm text-white/80">
                On-site events at business facilities
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏞️ Parks & Recreation
              </div>
              <div className="text-sm text-white/80">
                Outdoor venues for large company picnics
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏨 Event Centers
              </div>
              <div className="text-sm text-white/80">
                Professional venues for corporate celebrations
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌆 Downtown SA
              </div>
              <div className="text-sm text-white/80">
                Central business district events
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Event Planning Tips Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Corporate Event Planning Best Practices
          </h2>
          <p className="text-lg mb-6">
            Based on our experience with hundreds of corporate events, here are
            proven strategies to ensure your business event is a success:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📅 Plan Early
              </h3>
              <p className="text-sm text-gray-600">
                Book 4-6 weeks in advance to ensure availability and allow
                proper planning time for your corporate event.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                👨‍👩‍👧‍👦 Include Families
              </h3>
              <p className="text-sm text-gray-600">
                Family-friendly events boost attendance and create stronger
                employee engagement and loyalty.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🎯 Set Clear Objectives
              </h3>
              <p className="text-sm text-gray-600">
                Define goals for your event - team building, appreciation,
                celebration - to guide planning decisions.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📊 Measure Success
              </h3>
              <p className="text-sm text-gray-600">
                Gather feedback from employees to improve future events and
                demonstrate ROI to leadership.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Events FAQ Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Corporate Event Bounce House FAQ
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Common questions about corporate event bounce house rentals in San
            Antonio. Get the information you need for successful company events
            and employee celebrations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-left">
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                Do you provide corporate invoicing?
              </h3>
              <p className="text-sm text-white/80">
                Yes! We provide professional invoicing with NET 30 terms for
                established businesses. We can work with your accounting
                department for purchase orders and proper documentation.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                What's included in corporate event packages?
              </h3>
              <p className="text-sm text-white/80">
                Our corporate packages include delivery, setup, takedown, and
                professional attendants. We can also provide tables, chairs,
                generators, and concession machines for complete events.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                Can you accommodate large employee events?
              </h3>
              <p className="text-sm text-white/80">
                Absolutely! We have multiple units available and can coordinate
                large-scale events with several bounce houses, water slides, and
                entertainment options for hundreds of employees and families.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                Do you offer multi-day rentals for corporate retreats?
              </h3>
              <p className="text-sm text-white/80">
                Yes! We offer special pricing for multi-day corporate events,
                retreats, and conferences. Equipment can stay on-site for the
                duration of your event with daily maintenance checks.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                What are your cancellation policies for business events?
              </h3>
              <p className="text-sm text-white/80">
                We understand business needs change. We offer flexible
                cancellation policies for corporate clients with advance notice.
                Weather-related cancellations are always accommodated.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                Can you set up at office complexes and business parks?
              </h3>
              <p className="text-sm text-white/80">
                Yes! We're experienced with corporate property requirements,
                parking restrictions, and building management coordination. We
                handle all logistics for smooth business event setup.
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
            Ready to Elevate Your Corporate Event?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Contact us today for professional corporate event planning and
            premium bounce house rentals!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=corporate-event"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
