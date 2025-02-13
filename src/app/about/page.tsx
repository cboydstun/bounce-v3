import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Clock,
  Truck,
  Heart,
  Star,
  Phone,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About SATX Bounce | Your Trusted Party Rental Experts in San Antonio",
  description:
    "Learn about SATX Bounce House Rentals, San Antonio's trusted provider of bounce houses, water slides, and party equipment. Discover our story, values, and commitment to safety and customer satisfaction.",
  keywords:
    "about SATX Bounce House, San Antonio party rentals, bounce house company, inflatable rentals history, party equipment provider, customer service, safety commitment",
  openGraph: {
    title:
      "About SATX Bounce | Your Trusted Party Rental Experts in San Antonio",
    description:
      "Learn about SATX Bounce House Rentals, San Antonio's trusted provider of bounce houses, water slides, and party equipment. Discover our story, values, and commitment to safety and customer satisfaction.",
    type: "website",
  },
  other: {
    "geo.region": "US-TX",
    "geo.placename": "San Antonio",
    "geo.position": "29.4241;-98.4936",
    ICBM: "29.4241, -98.4936",
  },
};

// Organization structured data
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SATX Bounce House Rentals",
  description:
    "Premier bounce house and party rental service in San Antonio, TX, offering inflatable bounce houses, water slides, and party equipment with free delivery.",
  url: "https://satxbounce.com",
  areaServed: {
    "@type": "City",
    name: "San Antonio",
    sameAs: "https://en.wikipedia.org/wiki/San_Antonio",
  },
  telephone: "(512) 210-0194",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "San Antonio",
    addressRegion: "TX",
    addressCountry: "US",
  },
};

export default function AboutPage() {
  return (
    <div className="w-full bg-gradient-to-b from-primary-blue/10 to-transparent py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-16 text-white animate-fade-in-up">
            About{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
              SATX Bounce House Rentals
            </span>
          </h1>

          {/* Story Section */}
          <div className="bg-white backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-16 transform transition-all duration-300">
            <h2 className="text-3xl font-bold text-primary-purple mb-6">
              Our Story
            </h2>
            <div className="space-y-4 text-primary-blue text-lg">
              <p>
                We began our journey with a clear vision: to elevate every San
                Antonio event with fun and engaging bounce houses and water
                slide rentals.
              </p>
              <p>
                At SATX Bounce, we quickly became synonymous with unparalleled
                service and an expansive inventory.
              </p>
              <p>
                From wet inflatables to dry slides, combo units, and even unique
                party additions like popcorn makers and petting zoos, SATX
                Bounce House Rentals always seeks to surpass expectations.
              </p>
            </div>
          </div>

          {/* Why Choose Us Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Why Choose SATX?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white backdrop-blur-sm rounded-2xl p-6 transform transition-all duration-300">
                <Shield className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-primary-purple mb-3">
                  Safety First
                </h3>
                <p className="text-primary-blue">
                  We prioritize safety with meticulously maintained equipment
                  and strict protocols for worry-free fun.
                </p>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-6 transform transition-all duration-300">
                <Clock className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-primary-purple mb-3">
                  Reliable Service
                </h3>
                <p className="text-primary-blue">
                  Count on us for punctual delivery and setup, ensuring your
                  event starts right on time.
                </p>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-6 transform transition-all duration-300">
                <Truck className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-primary-purple mb-3">
                  Free Delivery
                </h3>
                <p className="text-primary-blue">
                  Enjoy complimentary delivery within Loop 1604, making party
                  planning easier and more affordable.
                </p>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-6 transform transition-all duration-300">
                <Heart className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-primary-purple mb-3">
                  Customer Care
                </h3>
                <p className="text-primary-blue">
                  We treat every customer like family, providing personalized
                  attention and support.
                </p>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-6 transform transition-all duration-300">
                <Star className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-primary-purple mb-3">
                  Quality Equipment
                </h3>
                <p className="text-primary-blue">
                  Premium, well-maintained inflatables and party equipment for
                  the best experience.
                </p>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-6 transform transition-all duration-300">
                <Phone className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-primary-purple mb-3">
                  24/7 Support
                </h3>
                <p className="text-primary-blue">
                  Always here when you need us, providing round-the-clock
                  assistance for your peace of mind.
                </p>
              </div>
            </div>
          </div>

          {/* Values Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Our Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white backdrop-blur-sm rounded-2xl p-8 transform transition-all duration-300">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text mb-4">
                  Customer Satisfaction
                </h3>
                <div className="space-y-4 text-primary-blue">
                  <p>
                    Our customers are the essence of everything we do.
                    We&apos;re unwavering in our mission to offer the peak of
                    service, from initial booking to event day.
                  </p>
                </div>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-8 transform transition-all duration-300">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text mb-4">
                  Transparency
                </h3>
                <div className="space-y-4 text-primary-blue">
                  <p>
                    No hidden fees or surprises. Our transparent pricing means
                    you&apos;ll always know exactly what you&apos;re getting.
                  </p>
                </div>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-8 transform transition-all duration-300">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text mb-4">
                  Community Focus
                </h3>
                <div className="space-y-4 text-primary-blue">
                  <p>
                    We&apos;re proud to serve San Antonio and surrounding areas,
                    contributing to countless memorable celebrations in our
                    community.
                  </p>
                </div>
              </div>

              <div className="bg-white backdrop-blur-sm rounded-2xl p-8 transform transition-all duration-300">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text mb-4">
                  Continuous Improvement
                </h3>
                <div className="space-y-4 text-primary-blue">
                  <p>
                    We constantly update our inventory and improve our services
                    based on customer feedback and industry trends.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="w-full max-w-[90%] mx-auto bg-gradient-to-r from-blue-400 to-purple-600 rounded-2xl px-8 py-8 text-center transform transition-all duration-300 hover:scale-[1.02]">
            <h2 className="text-3xl font-bold mb-6 text-white">
              Ready to Create Memories?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Let&apos;s make your next event unforgettable!
            </p>
            <Link
              href="/contact"
              className="bg-white text-primary-blue px-8 py-3 rounded-lg font-semibold hover:bg-primary-blue hover:text-white transition-all duration-300 inline-flex items-center gap-2"
            >
              Contact Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </div>
  );
}
