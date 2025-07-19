import React from "react";
import PackageDealsCTA from "../components/PackageDealsCTA";
import CustomerReviews from "../components/CustomerReviews";
import ContactForm from "../components/ContactForm";
import ProductCarousel from "../components/ProductCarousel";
import InfoSections from "../components/InfoSections";
import OccasionsSection from "../components/OccasionsSection";
import HeroSection from "../components/HeroSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "San Antonio Bounce House Rentals - Free Delivery & Setup | SATX Bounce",
  description:
    "San Antonio's premier bounce house rental service serving Boerne, Schertz, Seguin, Converse, Alamo Heights, Stone Oak, Hollywood Park, and Bulverde. Professional bounce house rentals with free delivery and no deposit required. Water slides, party equipment, and more!",
  alternates: {
    canonical: "/",
  },
  keywords:
    "bounce house rental, San Antonio party rentals, water slides, inflatable rentals, party equipment, event rentals, free delivery, birthday party bounce house, school event rentals, church event bounce house, Boerne bounce house, Schertz party rentals, Seguin bounce house rental, Converse inflatable rentals, Alamo Heights party equipment, Stone Oak bounce house, Hollywood Park rentals, Bulverde party rentals",
  openGraph: {
    title:
      "San Antonio Bounce House Rentals - Free Delivery & Setup | SATX Bounce",
    description:
      "San Antonio's premier bounce house rental service. Professional and timely bounce house rentals with free delivery and no deposit required.",
    type: "website",
    url: "https://www.satxbounce.com",
    images: [
      {
        url: "https://www.satxbounce.com/og-image.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "San Antonio Bounce House Rentals - Free Delivery & Setup | SATX Bounce",
    description:
      "San Antonio's premier bounce house rental service. Professional and timely bounce house rentals with free delivery and no deposit required.",
    images: ["https://www.satxbounce.com/og-image.jpg"],
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Local business structured data
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SATX Bounce House Rentals",
  image: "https://www.satxbounce.com/og-image.jpg",
  description:
    "San Antonio's premier bounce house and party rental service offering inflatable bounce houses, water slides, and party equipment with free delivery.",
  "@id": "https://www.satxbounce.com",
  url: "https://www.satxbounce.com",
  telephone: "(512) 210-0194",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "San Antonio",
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
  areaServed: [
    {
      "@type": "City",
      name: "San Antonio",
      "@id": "https://en.wikipedia.org/wiki/San_Antonio",
    },
    {
      "@type": "City",
      name: "Boerne",
      "@id": "https://en.wikipedia.org/wiki/Boerne,_Texas",
    },
    {
      "@type": "City",
      name: "Schertz",
      "@id": "https://en.wikipedia.org/wiki/Schertz,_Texas",
    },
    {
      "@type": "City",
      name: "Seguin",
      "@id": "https://en.wikipedia.org/wiki/Seguin,_Texas",
    },
    {
      "@type": "City",
      name: "Converse",
      "@id": "https://en.wikipedia.org/wiki/Converse,_Texas",
    },
    {
      "@type": "City",
      name: "Alamo Heights",
      "@id": "https://en.wikipedia.org/wiki/Alamo_Heights,_Texas",
    },
    {
      "@type": "City",
      name: "Stone Oak",
    },
    {
      "@type": "City",
      name: "Hollywood Park",
      "@id": "https://en.wikipedia.org/wiki/Hollywood_Park,_Texas",
    },
    {
      "@type": "City",
      name: "Bulverde",
      "@id": "https://en.wikipedia.org/wiki/Bulverde,_Texas",
    },
    {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: 29.4241,
        longitude: -98.4936,
      },
      geoRadius: "30000",
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

export default async function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Product Carousel */}
      <ProductCarousel />

      {/* Product Categories Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Browse by Product Category
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Find the perfect entertainment for your event. From cooling water
            slides to backyard-friendly bounce houses, we have specialized
            options for every celebration and venue type.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <a
              href="/water-slides"
              className="bg-white/20 rounded-lg p-6 hover:bg-white/30 transition-colors group"
            >
              <div className="text-4xl mb-3">🌊</div>
              <h3 className="font-semibold text-white mb-2 group-hover:text-cyan-300">
                Water Slide Rentals
              </h3>
              <p className="text-sm text-white/80">
                Beat the Texas heat with premium water slides, tropical themes,
                and splash pools. Perfect for summer parties.
              </p>
              <div className="text-cyan-300 font-bold mt-2">
                Starting at $199.95
              </div>
            </a>
            <a
              href="/backyard-parties"
              className="bg-white/20 rounded-lg p-6 hover:bg-white/30 transition-colors group"
            >
              <div className="text-4xl mb-3">🏡</div>
              <h3 className="font-semibold text-white mb-2 group-hover:text-green-300">
                Backyard Party Rentals
              </h3>
              <p className="text-sm text-white/80">
                Transform your backyard with neighbor-friendly equipment and
                professional setup. Space planning included.
              </p>
              <div className="text-green-300 font-bold mt-2">
                Starting at $149.95
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Service Areas Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Serving San Antonio and Surrounding Communities
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We proudly provide bounce house rentals and party equipment delivery
            throughout the greater San Antonio area, including the Texas Hill
            Country communities. Professional setup and free delivery to all
            locations.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <a
              href="/boerne"
              className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors group"
            >
              <div className="font-semibold text-white group-hover:text-blue-300">
                Boerne
              </div>
              <div className="text-sm text-white/80">Hill Country</div>
            </a>
            <a
              href="/schertz"
              className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors group"
            >
              <div className="font-semibold text-white group-hover:text-blue-300">
                Schertz
              </div>
              <div className="text-sm text-white/80">Northeast SA</div>
            </a>
            <a
              href="/seguin"
              className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors group"
            >
              <div className="font-semibold text-white group-hover:text-blue-300">
                Seguin
              </div>
              <div className="text-sm text-white/80">Historic Texas</div>
            </a>
            <a
              href="/converse"
              className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors group"
            >
              <div className="font-semibold text-white group-hover:text-blue-300">
                Converse
              </div>
              <div className="text-sm text-white/80">Growing Community</div>
            </a>
            <a
              href="/alamo-heights"
              className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors group"
            >
              <div className="font-semibold text-white group-hover:text-blue-300">
                Alamo Heights
              </div>
              <div className="text-sm text-white/80">Prestigious Area</div>
            </a>
            <a
              href="/stone-oak"
              className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors group"
            >
              <div className="font-semibold text-white group-hover:text-blue-300">
                Stone Oak
              </div>
              <div className="text-sm text-white/80">Master Planned</div>
            </a>
            <a
              href="/hollywood-park"
              className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors group"
            >
              <div className="font-semibold text-white group-hover:text-blue-300">
                Hollywood Park
              </div>
              <div className="text-sm text-white/80">Hill Country Village</div>
            </a>
            <a
              href="/bulverde"
              className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors group"
            >
              <div className="font-semibold text-white group-hover:text-blue-300">
                Bulverde
              </div>
              <div className="text-sm text-white/80">Scenic Community</div>
            </a>
          </div>
        </div>
      </div>

      {/* Perfect for Any Occasion Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Perfect for Any Occasion
          </h2>
          <p className="text-lg mb-6">
            From intimate birthday parties to large community events, our bounce
            house rentals create unforgettable memories for every celebration:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <a
              href="/birthday-parties"
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl mb-3">🎂</div>
              <h3 className="font-semibold text-primary-purple mb-2 group-hover:text-primary-blue">
                Birthday Parties
              </h3>
              <p className="text-sm text-gray-600">
                Make your child's special day magical with age-appropriate
                bounce houses and party equipment.
              </p>
            </a>
            <a
              href="/school-events"
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl mb-3">🏫</div>
              <h3 className="font-semibold text-primary-purple mb-2 group-hover:text-primary-blue">
                School Events
              </h3>
              <p className="text-sm text-gray-600">
                Professional rentals for PTA fundraisers, school carnivals, and
                educational celebrations.
              </p>
            </a>
            <a
              href="/church-events"
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl mb-3">⛪</div>
              <h3 className="font-semibold text-primary-purple mb-2 group-hover:text-primary-blue">
                Church Events
              </h3>
              <p className="text-sm text-gray-600">
                Family-friendly entertainment for VBS, fellowship gatherings,
                and ministry activities.
              </p>
            </a>
            <a
              href="/corporate-events"
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="font-semibold text-primary-purple mb-2 group-hover:text-primary-blue">
                Corporate Events
              </h3>
              <p className="text-sm text-gray-600">
                Premium entertainment for company picnics, employee
                appreciation, and team building activities.
              </p>
            </a>
            <a
              href="/fundraisers"
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl mb-3">💝</div>
              <h3 className="font-semibold text-primary-purple mb-2 group-hover:text-primary-blue">
                Fundraisers
              </h3>
              <p className="text-sm text-gray-600">
                Special pricing for charity events, nonprofit fundraisers, and
                community cause celebrations.
              </p>
            </a>
            <a
              href="/holiday-parties"
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl mb-3">🎄</div>
              <h3 className="font-semibold text-primary-purple mb-2 group-hover:text-primary-blue">
                Holiday Parties
              </h3>
              <p className="text-sm text-gray-600">
                Festive entertainment for Christmas, Halloween, and seasonal
                celebrations throughout the year.
              </p>
            </a>
            <a
              href="/community-gatherings"
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl mb-3">🏘️</div>
              <h3 className="font-semibold text-primary-purple mb-2 group-hover:text-primary-blue">
                Community Gatherings
              </h3>
              <p className="text-sm text-gray-600">
                Build stronger neighborhoods with HOA events, block parties, and
                community celebrations.
              </p>
            </a>
            <a
              href="/graduation-parties"
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-semibold text-primary-purple mb-2 group-hover:text-primary-blue">
                Graduation Parties
              </h3>
              <p className="text-sm text-gray-600">
                Celebrate achievements with memorable entertainment for high
                school, college, and milestone graduations.
              </p>
            </a>
          </div>
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

      {/* Popular Venues Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-purple">
            Popular San Antonio Area Venues We Serve
          </h2>
          <p className="text-lg mb-6">
            Our bounce house rentals are perfect for events at these popular
            venues throughout the San Antonio metropolitan area:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏞️</span>
              <span>Brackenridge Park - San Antonio's premier park venue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏊</span>
              <span>Alamo Heights Pool - Summer party destination</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🌳</span>
              <span>Stone Oak Park - Master-planned community events</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏞️</span>
              <span>Boerne City Park - Hill Country celebrations</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">⚽</span>
              <span>Schertz Sports Complex - Athletic events</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🎪</span>
              <span>Seguin Events Complex - Large gatherings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏡</span>
              <span>Neighborhood HOA Events - Community celebrations</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">⛪</span>
              <span>Local Churches - Fellowship and ministry events</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-blue">🏫</span>
              <span>School Districts - PTA events and fundraisers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Information Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Free Delivery Throughout Greater San Antonio
          </h2>
          <p className="text-lg mb-6 text-white/90">
            We provide complimentary delivery and setup for all bounce house
            rentals throughout San Antonio and surrounding communities. Our
            professional team arrives early to ensure your party equipment is
            ready before your guests arrive.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                🚚 Free Delivery
              </div>
              <div className="text-sm text-white/80">
                No hidden fees within our service area
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
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-semibold text-white mb-2">
                📍 Wide Coverage
              </div>
              <div className="text-sm text-white/80">
                San Antonio metro area
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Moonbounce Cross-Reference Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Also Known as Moonbounce Rentals
          </h2>
          <p className="text-lg mb-6 text-white/90">
            Our bounce houses are also called moonbounces! If you're searching
            for
            <strong className="text-blue-300">
              {" "}
              moonbounce rentals in San Antonio
            </strong>
            , you've come to the right place.
          </p>
          <a
            href="/moonbounce"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Explore Moonbounce Rentals →
          </a>
        </div>
      </div>

      {/* Info Sections */}
      <InfoSections />

      {/* Map Section */}
      {/* <MapSection /> */}

      {/* CTA Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-primary-purple">
            Ready to Make Your San Antonio Event Unforgettable?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Book now and get free delivery throughout San Antonio, Boerne,
            Schertz, Seguin, and surrounding areas!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=homepage"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
