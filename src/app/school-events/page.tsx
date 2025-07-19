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
    "School Event Bounce House Rentals San Antonio - PTA Fundraisers | SATX Bounce",
  description:
    "Professional bounce house rentals for school events, PTA fundraisers, school carnivals, and educational celebrations in San Antonio. Safe, clean, and reliable party equipment with free delivery and setup.",
  alternates: {
    canonical: "/school-events",
  },
  keywords:
    "school event bounce house rental san antonio, PTA fundraiser rentals, school carnival bounce house, elementary school party rentals, school festival equipment, educational event rentals, school fundraising ideas",
  openGraph: {
    title:
      "School Event Bounce House Rentals San Antonio - PTA Fundraisers | SATX Bounce",
    description:
      "Professional bounce house rentals for school events, PTA fundraisers, school carnivals, and educational celebrations in San Antonio. Safe, clean, and reliable party equipment with free delivery and setup.",
    type: "website",
    url: "https://www.satxbounce.com/school-events",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "School Event Bounce House Rentals San Antonio - PTA Fundraisers | SATX Bounce",
    description:
      "Professional bounce house rentals for school events, PTA fundraisers, school carnivals, and educational celebrations in San Antonio. Safe, clean, and reliable party equipment with free delivery and setup.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for School Events
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - School Events",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional school event bounce house and party rental service in San Antonio, TX. Specializing in PTA fundraisers, school carnivals, and educational celebrations with safe, clean inflatable equipment.",
  "@id": "https://www.satxbounce.com/school-events",
  url: "https://www.satxbounce.com/school-events",
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

// Custom Hero Section for School Events
const SchoolEventsHeroSection: React.FC = () => {
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
          School Event
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Bounce House Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Professional rentals for
          <span className="font-bold text-blue-300"> PTA fundraisers </span>
          and
          <span className="font-bold text-purple-300"> school carnivals</span>
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

export default async function SchoolEventsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <SchoolEventsHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* School Event Benefits Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Why Schools Choose SATX Bounce for Their Events
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We understand the unique needs of school events and PTA fundraisers.
            Our professional-grade equipment, safety protocols, and reliable
            service make us the preferred choice for educational institutions
            throughout San Antonio.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🛡️ Safety First
              </div>
              <div className="text-sm text-white/80">
                Fully insured with safety protocols for school events
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📋 Easy Planning
              </div>
              <div className="text-sm text-white/80">
                Simple booking process with dedicated event coordinators
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                💰 Fundraising Focus
              </div>
              <div className="text-sm text-white/80">
                Competitive pricing to maximize your fundraising goals
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🎓 Educational Value
              </div>
              <div className="text-sm text-white/80">
                Fun activities that promote physical activity and social
                interaction
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
          Get Your School Event Quote
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* School Event Types Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Perfect for All Types of School Events
          </h2>
          <p className="text-lg mb-6">
            Our bounce house rentals and party equipment are ideal for various
            school events and educational celebrations:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎪</span>
              <span>
                PTA Fundraisers - Boost attendance and revenue with exciting
                attractions
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎠</span>
              <span>
                School Carnivals - Create memorable experiences for students and
                families
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏆</span>
              <span>
                Field Day Events - Add excitement to athletic competitions
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎓</span>
              <span>
                End of Year Celebrations - Reward students for their
                achievements
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">📚</span>
              <span>
                Reading Incentive Parties - Celebrate literacy milestones
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🌟</span>
              <span>
                Student Achievement Awards - Honor academic and behavioral
                excellence
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* School Districts We Serve Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Serving San Antonio Area School Districts
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We proudly serve schools throughout the San Antonio metropolitan
            area, providing safe and reliable entertainment for educational
            events and fundraisers across multiple school districts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">🏫 SAISD</div>
              <div className="text-sm text-white/80">
                San Antonio Independent School District
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">🏫 NEISD</div>
              <div className="text-sm text-white/80">
                North East Independent School District
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">🏫 NISD</div>
              <div className="text-sm text-white/80">
                Northside Independent School District
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🏫 Private Schools
              </div>
              <div className="text-sm text-white/80">
                Catholic and Independent Schools
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fundraising Success Tips Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Maximize Your Fundraising Success
          </h2>
          <p className="text-lg mb-6">
            Based on our experience with hundreds of school events, here are
            proven strategies to make your fundraiser a huge success:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                📢 Promote Early & Often
              </h3>
              <p className="text-sm text-gray-600">
                Start promoting your event 3-4 weeks in advance through
                newsletters, social media, and flyers home.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🎟️ Pre-sell Tickets
              </h3>
              <p className="text-sm text-gray-600">
                Offer discounted advance tickets to guarantee attendance and
                improve cash flow planning.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🍕 Food & Fun Combo
              </h3>
              <p className="text-sm text-gray-600">
                Combine bounce houses with food sales for maximum revenue per
                family.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                👨‍👩‍👧‍👦 Family-Friendly Timing
              </h3>
              <p className="text-sm text-gray-600">
                Schedule events on weekends or early evenings when whole
                families can attend.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* School Events FAQ Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            School Event Bounce House FAQ
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Common questions about school event bounce house rentals in San
            Antonio. Get the information you need for successful PTA events and
            school celebrations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-left">
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                Do you offer discounts for school events?
              </h3>
              <p className="text-sm text-white/80">
                Yes! We provide special pricing for schools, PTAs, and
                educational nonprofits. Contact us with your school information
                for discounted rates on bounce house rentals.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                What insurance do you carry for school properties?
              </h3>
              <p className="text-sm text-white/80">
                We carry comprehensive liability insurance and can provide
                certificates of insurance to schools. Our coverage meets most
                school district requirements.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                How far in advance should schools book?
              </h3>
              <p className="text-sm text-white/80">
                We recommend 4-6 weeks for school events, especially for popular
                dates like spring carnivals. Early booking ensures availability
                and better pricing.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                Can you set up on school grounds?
              </h3>
              <p className="text-sm text-white/80">
                Yes! We're experienced with school property requirements
                including grass areas, power access, and safety clearances. We
                coordinate with school administrators for smooth setup.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                What payment methods do you accept for schools?
              </h3>
              <p className="text-sm text-white/80">
                We accept school purchase orders, checks, and credit cards. We
                can work with school accounting departments for proper invoicing
                and payment processing.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">
                Do you provide attendants for school events?
              </h3>
              <p className="text-sm text-white/80">
                Professional attendants are available for an additional fee.
                They help monitor equipment, ensure safety, and assist with
                crowd management during busy school events.
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
            Ready to Plan Your School Event?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Contact us today for special school pricing and event planning
            assistance!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=school-event"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
