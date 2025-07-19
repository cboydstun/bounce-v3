import React from "react";
import PackageDealsCTA from "../../components/PackageDealsCTA";
import CustomerReviews from "../../components/CustomerReviews";
import ContactForm from "../../components/ContactForm";
import ProductCarousel from "../../components/ProductCarousel";
import InfoSections from "../../components/InfoSections";
import OccasionsSection from "../../components/OccasionsSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bounce House Rentals in Schertz, TX - Free Delivery | SATX Bounce",
  description:
    "Schertz's trusted bounce house rental service. Professional water slides, bounce houses, and party equipment rentals with free delivery to Schertz and surrounding areas.",
  alternates: {
    canonical: "/schertz",
  },
  keywords:
    "bounce house rental schertz, party rentals schertz TX, water slide rentals schertz, schertz inflatable rentals, bounce house delivery schertz, greenshire party rentals",
  openGraph: {
    title: "Bounce House Rentals in Schertz, TX - Free Delivery | SATX Bounce",
    description:
      "Schertz's trusted bounce house rental service. Professional water slides, bounce houses, and party equipment rentals with free delivery to Schertz and surrounding areas.",
    type: "website",
    url: "https://www.satxbounce.com/schertz",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bounce House Rentals in Schertz, TX - Free Delivery | SATX Bounce",
    description:
      "Schertz's trusted bounce house rental service. Professional water slides, bounce houses, and party equipment rentals with free delivery to Schertz and surrounding areas.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "Schertz",
    "geo.position": "29.5530;-98.2689",
    ICBM: "29.5530, -98.2689",
  },
};

// Local business structured data for Schertz
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Schertz",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional bounce house and party rental service serving Schertz, TX with inflatable bounce houses, water slides, and party equipment with free delivery.",
  "@id": "https://www.satxbounce.com/schertz",
  url: "https://www.satxbounce.com/schertz",
  telephone: "(512) 210-0194",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Serving Schertz",
    addressLocality: "Schertz",
    addressRegion: "TX",
    postalCode: "78154",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 29.553,
    longitude: -98.2689,
  },
  areaServed: [
    {
      "@type": "City",
      name: "Schertz",
      "@id": "https://en.wikipedia.org/wiki/Schertz,_Texas",
    },
    {
      "@type": "PostalAddress",
      postalCode: "78154",
    },
    {
      "@type": "PostalAddress",
      postalCode: "78108",
    },
  ],
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

// Custom Hero Section for Schertz
const SchertzHeroSection: React.FC = () => {
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
          Schertz&apos;s Premier
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Bounce House Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Professional bounce house rentals with
          <span className="font-bold text-blue-300">
            {" "}
            free delivery to Schertz{" "}
          </span>
          and
          <span className="font-bold text-purple-300">
            {" "}
            no deposit required
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

export default async function SchertzPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <SchertzHeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Local Service Area Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Serving Schertz and Surrounding Areas
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We proudly deliver to all neighborhoods in Schertz, including
            Greenshire, Savannah, and Crossvine. Located just 16 miles northeast
            of San Antonio, we provide timely delivery and setup for your
            special events in this thriving community.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold text-white">78154</div>
              <div className="text-sm text-white/80">Central Schertz</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold text-white">78108</div>
              <div className="text-sm text-white/80">East Schertz</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold text-white">Greenshire</div>
              <div className="text-sm text-white/80">Neighborhood</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold text-white">Savannah</div>
              <div className="text-sm text-white/80">Community</div>
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
          Get in Touch
        </h2>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Local Venues Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Popular Schertz Venues We Serve
          </h2>
          <p className="text-lg mb-6">
            Our bounce house rentals in Schertz are perfect for events at these
            popular local venues:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏞️</span>
              <span>
                Pickrell Park - Family recreation and community events
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏢</span>
              <span>
                Schertz Community Center - Indoor and outdoor event space
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🌳</span>
              <span>
                Cutoff Park - Beautiful outdoor venue for celebrations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏡</span>
              <span>
                Greenshire Neighborhoods - HOA events and block parties
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">⛪</span>
              <span>
                Local Churches - Fellowship events and youth ministries
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏫</span>
              <span>
                Schertz-Cibolo-Universal City ISD - School events and
                fundraisers
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Local Delivery Info Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Free Delivery Throughout Schertz
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We provide complimentary delivery and setup for all bounce house
            rentals in Schertz. Our team arrives early to ensure your water
            slide rentals and party equipment are ready before your guests
            arrive. From Greenshire to Crossvine, we've got Schertz covered with
            professional inflatable rentals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🚚 Free Delivery
              </div>
              <div className="text-sm text-white/80">
                No hidden fees for Schertz area delivery
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                ⏰ Early Setup
              </div>
              <div className="text-sm text-white/80">
                Ready before your party starts
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🛡️ Insured Service
              </div>
              <div className="text-sm text-white/80">
                Professional and reliable
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
            Ready to Make Your Schertz Event Unforgettable?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Book now and get free delivery to Schertz and surrounding
            neighborhoods!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=schertz"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
