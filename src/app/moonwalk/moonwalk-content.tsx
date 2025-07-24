"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CustomerReviews from "../../components/CustomerReviews";
import ContactForm from "../../components/ContactForm";
import ProductCarousel from "../../components/ProductCarousel";
import InfoSections from "../../components/InfoSections";
import PackageDealsCTA from "../../components/PackageDealsCTA";

// Moonwalk-specific Hero Section
function MoonwalkHero() {
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
          San Antonio&apos;s Premier
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text animate-pulse">
            Moonwalk Rentals
          </span>
        </h1>

        <p className="text-2xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-fade-in-up">
          Professional and timely moonwalk rentals with
          <span className="font-bold text-blue-300"> free delivery </span>
          and
          <span className="font-bold text-purple-300">
            {" "}
            no deposit required
          </span>
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up mb-16 sm:mb-0">
          <Link
            href="/order"
            className="group relative px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl overflow-hidden transition-all duration-300 hover:bg-blue-700 hover:scale-105 hover:shadow-xl"
          >
            BOOK MOONWALK NOW
          </Link>

          <Link
            href="/products"
            className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-bold rounded-xl border-2 border-white/30 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-xl hover:border-white/50 flex items-center justify-center"
          >
            View Moonwalks
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
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
}

// Moonwalk Benefits Section
function MoonwalkBenefits() {
  const benefits = [
    {
      title: "Professional Moonwalk Setup",
      description:
        "Our experienced team handles all moonwalk installation and safety checks for worry-free entertainment.",
      icon: "🏗️",
    },
    {
      title: "Free Moonwalk Delivery",
      description:
        "Complimentary moonwalk delivery and pickup throughout San Antonio within Loop 1604.",
      icon: "🚚",
    },
    {
      title: "Safe & Clean Moonwalks",
      description:
        "All moonwalks are thoroughly sanitized and inspected before each rental for maximum safety.",
      icon: "✨",
    },
    {
      title: "No Deposit Required",
      description:
        "Book your moonwalk rental with confidence - no upfront deposit needed for our services.",
      icon: "💳",
    },
  ];

  return (
    <div className="w-full bg-white py-16 mt-4">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-primary-blue">
          Why Choose Our Moonwalk Rentals?
        </h2>
        <p className="text-xl text-center mb-12 text-gray-600 max-w-3xl mx-auto">
          SATX Bounce is San Antonio's trusted moonwalk rental service,
          providing safe, clean, and professionally managed moonwalk experiences
          for all your special events.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl bg-secondary-blue/5 hover:bg-secondary-blue/10 transition-colors"
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-primary-blue">
                {benefit.title}
              </h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Moonwalk Service Areas Section
function MoonwalkServiceAreas() {
  const serviceAreas = [
    "Downtown San Antonio",
    "Stone Oak",
    "Alamo Heights",
    "Westside",
    "Southside",
    "Northeast San Antonio",
    "Northwest San Antonio",
    "Schertz",
    "Cibolo",
    "Universal City",
    "Converse",
    "Live Oak",
    "Selma",
    "Windcrest",
  ];

  return (
    <div className="w-full bg-secondary-blue/5 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-primary-blue">
          Moonwalk Delivery Throughout San Antonio
        </h2>
        <p className="text-xl text-center mb-12 text-white max-w-3xl mx-auto">
          We provide professional moonwalk rental services with free delivery to
          communities throughout the San Antonio metropolitan area within Loop
          1604.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {serviceAreas.map((area, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-primary-blue font-medium">{area}</span>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-white">
            Don't see your area?{" "}
            <Link href="/contact" className="text-primary-blue hover:underline">
              Contact us
            </Link>{" "}
            to check if we service your location for moonwalk rentals.
          </p>
        </div>
      </div>
    </div>
  );
}

// Moonwalk FAQ Section
function MoonwalkFAQ() {
  const faqs = [
    {
      question: "What is the difference between a moonwalk and bounce house?",
      answer:
        "Moonwalk and bounce house are different terms for the same inflatable entertainment structure. 'Moonwalk' is a popular regional term, especially common in certain areas, while 'bounce house' is more widely used. Our moonwalk rentals offer the same safe, fun experience regardless of what you call them!",
    },
    {
      question: "How far in advance should I book a moonwalk rental?",
      answer:
        "We recommend booking your moonwalk rental at least 1-2 weeks in advance, especially during peak party seasons (spring and summer). However, we often have moonwalks available for last-minute bookings - just give us a call!",
    },
    {
      question: "What's included with my moonwalk rental?",
      answer:
        "Every moonwalk rental includes free delivery within Loop 1604, professional setup and takedown, safety stakes and sandbags, and a thorough cleaning before your event. We handle everything so you can focus on enjoying your party!",
    },
    {
      question: "Are your moonwalks safe for children?",
      answer:
        "Absolutely! All our moonwalks are regularly inspected, properly maintained, and meet safety standards. We provide safety guidelines and our professional team ensures proper installation with secure anchoring for safe bouncing fun.",
    },
    {
      question: "Do you offer moonwalk rentals for adult parties?",
      answer:
        "Yes! Our moonwalks are perfect for all ages. We have larger moonwalks that can accommodate adults and mixed-age groups. Whether it's a birthday party, corporate event, or family gathering, our moonwalk rentals add fun for everyone.",
    },
    {
      question: "What happens if it rains on my moonwalk rental day?",
      answer:
        "Safety is our priority. If there's rain or severe weather, we'll work with you to reschedule your moonwalk rental at no additional charge. We monitor weather conditions closely and will contact you if conditions aren't safe for moonwalk setup.",
    },
  ];

  return (
    <div className="w-full bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-primary-blue">
          Moonwalk Rental FAQ
        </h2>

        <div className="max-w-4xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-secondary-blue/5 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3 text-primary-blue">
                {faq.question}
              </h3>
              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MoonwalkContent() {
  return (
    <>
      {/* Moonwalk Hero Section */}
      <MoonwalkHero />

      {/* Customer Reviews */}
      <div className="animate-fade-in-up">
        <CustomerReviews />
      </div>

      {/* Moonwalk Benefits */}
      <MoonwalkBenefits />

      {/* Product Carousel - Same products but moonwalk context */}
      <ProductCarousel />

      {/* Moonwalk Service Areas */}
      <MoonwalkServiceAreas />

      {/* Moonwalk FAQ */}
      <MoonwalkFAQ />

      {/* Contact Form Section */}
      <div id="contact-form" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4 text-white">
          Ready to Book Your Moonwalk?
        </h2>
        <p className="text-xl text-center mb-12 text-white/90 max-w-3xl mx-auto">
          Get in touch for your San Antonio moonwalk rental. Free delivery,
          professional setup, and no deposit required!
        </p>
        <div className="max-w-[1000px] mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* Info Sections */}
      <InfoSections />

      {/* CTA Section */}
      <div className="flex justify-center items-center py-4 my-4">
        <div className="w-full max-w-[80%] bg-[#f8f5fa] rounded-xl px-8 py-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-primary-purple">
            Ready to Make Your Event Unforgettable with a Moonwalk?
          </h2>
          <p className="text-xl mb-8 text-primary-blue">
            Book your moonwalk rental now and get free delivery within Loop
            1604!
          </p>
          <PackageDealsCTA
            href="/coupon-form?promo=moonwalk"
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-purple hover:text-white transition inline-flex items-center gap-2"
          />
        </div>
      </div>
    </>
  );
}
