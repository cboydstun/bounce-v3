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
    "Backyard Party Rentals San Antonio - Bounce Houses & Equipment | SATX Bounce",
  description:
    "Transform your backyard into the ultimate party destination! Professional bounce house rentals, water slides, and party equipment for San Antonio backyard celebrations. Free delivery and neighbor-friendly setup.",
  alternates: {
    canonical: "/backyard-parties",
  },
  keywords:
    "backyard party rentals san antonio, residential bounce house rental, backyard bounce house, home party equipment, private party rentals, backyard birthday party, residential event rentals, neighbor friendly bounce house",
  openGraph: {
    title:
      "Backyard Party Rentals San Antonio - Bounce Houses & Equipment | SATX Bounce",
    description:
      "Transform your backyard into the ultimate party destination! Professional bounce house rentals, water slides, and party equipment for San Antonio backyard celebrations. Free delivery and neighbor-friendly setup.",
    type: "website",
    url: "https://www.satxbounce.com/backyard-parties",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Backyard Party Rentals San Antonio - Bounce Houses & Equipment | SATX Bounce",
    description:
      "Transform your backyard into the ultimate party destination! Professional bounce house rentals, water slides, and party equipment for San Antonio backyard celebrations. Free delivery and neighbor-friendly setup.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data for Backyard Parties
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Backyard Parties",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional backyard party rental service in San Antonio, TX. Specializing in residential bounce house rentals, backyard party equipment, and neighbor-friendly entertainment solutions for home celebrations.",
  "@id": "https://www.satxbounce.com/backyard-parties",
  url: "https://www.satxbounce.com/backyard-parties",
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

// Custom Hero Section for Backyard Parties
const BackyardPartiesHeroSection: React.FC = () => {
  return (
    <div className="relative w-full min-h-[800px] flex items-center justify-center bg-cover bg-center bg-fixed overflow-hidden">
      {/* Optimized Background with GPU acceleration */}
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-600 via-blue-600 to-purple-900"
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
          <div className="w-64 h-64 rounded-full bg-gradient-to-r from-green-400/20 to-blue-600/20 blur-3xl"></div>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl md:text-8xl font-extrabold mb-6 text-white animate-fade-in-down drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Backyard Party
          <span className="block mt-2 bg-gradient-to-r from-green-400 to-blue-600 text-transparent bg-clip-text animate-pulse">
            Rentals San Antonio
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Transform your backyard with
          <span className="font-bold text-green-300">
            {" "}
            professional equipment{" "}
          </span>
          and
          <span className="font-bold text-blue-300">
            {" "}
            neighbor-friendly setup
          </span>
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up mb-16 sm:mb-0">
          <a
            href="/order"
            className="group relative px-8 py-4 bg-green-600 text-white text-lg font-bold rounded-xl overflow-hidden transition-all duration-300 hover:bg-green-700 hover:scale-105 hover:shadow-xl"
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

export default async function BackyardPartiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <BackyardPartiesHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Backyard Space Planning Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Perfect Bounce House for Your Backyard Size
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Not sure what size bounce house will fit in your backyard? We help
            San Antonio families choose the perfect equipment for their space.
            Our professional team provides free space consultation and ensures
            safe, proper setup in any residential setting.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white/20 rounded-lg p-6">
              <div className="text-4xl mb-3">🏡</div>
              <h3 className="font-semibold text-white mb-2">Small Backyards</h3>
              <p className="text-sm text-white/80 mb-3">
                13x13 to 15x15 feet units. Perfect for cozy spaces and smaller
                gatherings.
              </p>
              <div className="text-green-300 font-bold">
                Medium Castle • White Bouncer
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-6">
              <div className="text-4xl mb-3">🌳</div>
              <h3 className="font-semibold text-white mb-2">
                Medium Backyards
              </h3>
              <p className="text-sm text-white/80 mb-3">
                15x15 to 20x20 feet units. Great for birthday parties and family
                events.
              </p>
              <div className="text-green-300 font-bold">
                Balloon Bouncer • Pink Castle
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-6">
              <div className="text-4xl mb-3">🏞️</div>
              <h3 className="font-semibold text-white mb-2">Large Backyards</h3>
              <p className="text-sm text-white/80 mb-3">
                20x25+ feet units. Room for slides, combos, and water features.
              </p>
              <div className="text-green-300 font-bold">
                Castle with Slide • Water Slides
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Neighbor-Friendly Setup Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Neighbor-Friendly Backyard Party Solutions
          </h2>
          <p className="text-lg mb-6">
            We understand the importance of maintaining good relationships with
            your neighbors while hosting memorable backyard parties. Our
            professional approach ensures your celebration is fun for guests
            while being respectful to your San Antonio community.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🔇 Quiet Operation
              </h3>
              <p className="text-sm text-gray-600">
                Our blowers are designed for minimal noise. We position
                equipment to reduce sound impact on neighboring properties.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🚗 Respectful Parking
              </h3>
              <p className="text-sm text-gray-600">
                Professional delivery team parks considerately and completes
                setup efficiently to minimize disruption.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                ⏰ Reasonable Hours
              </h3>
              <p className="text-sm text-gray-600">
                We recommend party hours that respect neighborhood quiet times
                and offer guidance on local noise ordinances.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🏡 Property Protection
              </h3>
              <p className="text-sm text-gray-600">
                Careful placement protects your landscaping, sprinkler systems,
                and property boundaries.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backyard Setup Requirements */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Backyard Setup Requirements & Preparation
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Preparing your backyard for party equipment is simple! Our team
            handles the heavy lifting, but here's what you need to know to
            ensure smooth delivery and setup for your San Antonio backyard
            celebration.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📏 Measure Your Space
              </div>
              <div className="text-sm text-white/80">
                Add 5 feet on all sides for safe clearance from fences and
                structures
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌱 Clear the Area
              </div>
              <div className="text-sm text-white/80">
                Remove toys, furniture, and debris from setup area
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🚪 Access Path
              </div>
              <div className="text-sm text-white/80">
                Ensure 4-foot wide path from street to backyard
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                ⚡ Power Source
              </div>
              <div className="text-sm text-white/80">
                Electrical outlet within 100 feet of setup location
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact-form" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Get Your Backyard Party Quote
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Backyard Party Add-ons Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Complete Your Backyard Party Experience
          </h2>
          <p className="text-lg mb-6">
            Transform your backyard into the ultimate party destination with our
            complete selection of party equipment and concessions. Create an
            unforgettable experience that rivals any venue in San Antonio.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left max-w-6xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🍿 Concession Machines
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cotton Candy Machine</li>
                <li>• Popcorn Machine</li>
                <li>• Snow Cone Machine</li>
                <li>• Slush Machines (1-3 tanks)</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                🪑 Tables & Seating
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Adult Tables & Chairs</li>
                <li>• Children's Table Sets</li>
                <li>• Height-Adjustable Options</li>
                <li>• Weather-Resistant Materials</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-primary-purple mb-2">
                ⚡ Power Solutions
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 4500W Generator Rental</li>
                <li>• Multiple Outlet Access</li>
                <li>• Quiet Operation</li>
                <li>• Fuel Efficient</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Backyard Safety Tips */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Backyard Party Safety Tips
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Keep your backyard party safe and fun with these professional tips
            from our experienced San Antonio party rental team. Proper planning
            ensures everyone has a great time while staying safe.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                👥 Adult Supervision
              </div>
              <div className="text-sm text-white/80">
                Always have responsible adults monitoring bounce house activity
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌳 Check Overhead
              </div>
              <div className="text-sm text-white/80">
                Ensure 15+ feet clearance from tree branches and power lines
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🌧️ Weather Monitoring
              </div>
              <div className="text-sm text-white/80">
                Have backup plans for rain or high winds (15+ mph)
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                👟 Proper Footwear
              </div>
              <div className="text-sm text-white/80">
                No shoes, jewelry, or sharp objects in bounce houses
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* San Antonio Neighborhoods Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Serving San Antonio Area Neighborhoods
          </h2>
          <p className="text-lg mb-6">
            We deliver backyard party rentals throughout San Antonio and
            surrounding communities. From historic neighborhoods to new
            developments, we're experienced with the unique characteristics of
            different areas and their specific requirements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏘️</span>
              <span>Stone Oak - Master-planned community</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🌳</span>
              <span>Alamo Heights - Historic neighborhood</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏞️</span>
              <span>Boerne - Hill Country homes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏡</span>
              <span>Schertz - Family neighborhoods</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🌲</span>
              <span>Bulverde - Scenic properties</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏘️</span>
              <span>Hollywood Park - Established area</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏞️</span>
              <span>Seguin - Historic Texas town</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏡</span>
              <span>Converse - Growing community</span>
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
            Ready to Transform Your Backyard?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Book your backyard party rental today and create unforgettable
            memories at home!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=backyard-party"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
