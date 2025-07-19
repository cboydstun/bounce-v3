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
    "Bounce House Rentals in Alamo Heights, TX - Free Delivery | SATX Bounce",
  description:
    "Alamo Heights' trusted bounce house rental service. Professional water slides, bounce houses, and party equipment rentals with free delivery to Alamo Heights and surrounding areas.",
  alternates: {
    canonical: "/alamo-heights",
  },
  keywords:
    "bounce house rental alamo heights, party rentals alamo heights TX, water slide rentals alamo heights, alamo heights inflatable rentals, bounce house delivery alamo heights, lincoln heights party rentals",
  openGraph: {
    title:
      "Bounce House Rentals in Alamo Heights, TX - Free Delivery | SATX Bounce",
    description:
      "Alamo Heights' trusted bounce house rental service. Professional water slides, bounce houses, and party equipment rentals with free delivery to Alamo Heights and surrounding areas.",
    type: "website",
    url: "https://www.satxbounce.com/alamo-heights",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Bounce House Rentals in Alamo Heights, TX - Free Delivery | SATX Bounce",
    description:
      "Alamo Heights' trusted bounce house rental service. Professional water slides, bounce houses, and party equipment rentals with free delivery to Alamo Heights and surrounding areas.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "Alamo Heights",
    "geo.position": "29.4816;-98.4681",
    ICBM: "29.4816, -98.4681",
  },
};

// Local business structured data for Alamo Heights
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals - Alamo Heights",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "Professional bounce house and party rental service serving Alamo Heights, TX with inflatable bounce houses, water slides, and party equipment with free delivery.",
  "@id": "https://www.satxbounce.com/alamo-heights",
  url: "https://www.satxbounce.com/alamo-heights",
  telephone: "(512) 210-0194",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Serving Alamo Heights",
    addressLocality: "Alamo Heights",
    addressRegion: "TX",
    postalCode: "78209",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 29.4816,
    longitude: -98.4681,
  },
  areaServed: [
    {
      "@type": "City",
      name: "Alamo Heights",
      "@id": "https://en.wikipedia.org/wiki/Alamo_Heights,_Texas",
    },
    {
      "@type": "City",
      name: "Lincoln Heights",
    },
    {
      "@type": "City",
      name: "Terrell Hills",
    },
    {
      "@type": "City",
      name: "Olmos Park",
    },
    {
      "@type": "PostalAddress",
      postalCode: "78209",
    },
    {
      "@type": "PostalAddress",
      postalCode: "78212",
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

// Custom Hero Section for Alamo Heights
const AlamoHeightsHeroSection: React.FC = () => {
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
          Alamo Heights&apos; Premier
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Bounce House Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Professional bounce house rentals with
          <span className="font-bold text-blue-300">
            {" "}
            free delivery to Alamo Heights{" "}
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

export default async function AlamoHeightsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <AlamoHeightsHeroSection />

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
            Serving Alamo Heights and Surrounding Areas
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We proudly deliver to all neighborhoods in Alamo Heights, including
            Lincoln Heights, Terrell Hills, and Olmos Park. Located just 5 miles
            north of downtown San Antonio, we provide timely delivery and setup
            for your special events in this prestigious community.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold text-white">78209</div>
              <div className="text-sm text-white/80">Central Alamo Heights</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold text-white">78212</div>
              <div className="text-sm text-white/80">Lincoln Heights</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold text-white">Terrell Hills</div>
              <div className="text-sm text-white/80">Community</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold text-white">Olmos Park</div>
              <div className="text-sm text-white/80">Neighborhood</div>
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
            Popular Alamo Heights Venues We Serve
          </h2>
          <p className="text-lg mb-6">
            Our bounce house rentals in Alamo Heights are perfect for events at
            these popular local venues:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏊</span>
              <span>
                Alamo Heights Pool - Summer parties and aquatic center events
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏫</span>
              <span>
                Robbins Academy - Private school events and celebrations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🌳</span>
              <span>
                Nature Trails Park - Beautiful outdoor venue for family
                gatherings
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🏡</span>
              <span>
                Lincoln Heights Residences - Upscale neighborhood parties
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">⛪</span>
              <span>
                Local Churches - Fellowship events and community celebrations
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-blue">🎓</span>
              <span>
                Alamo Heights ISD - School district events and fundraisers
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Local Delivery Info Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Free Delivery Throughout Alamo Heights
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We provide complimentary delivery and setup for all bounce house
            rentals in Alamo Heights. Our team arrives early to ensure your
            water slide rentals and party equipment are ready before your guests
            arrive. From Lincoln Heights to Olmos Park, we've got this
            prestigious San Antonio community covered with professional
            inflatable rentals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🚚 Free Delivery
              </div>
              <div className="text-sm text-white/80">
                No hidden fees for Alamo Heights area delivery
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
            Ready to Make Your Alamo Heights Event Unforgettable?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Book now and get free delivery to Alamo Heights and surrounding
            areas!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=alamo-heights"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
