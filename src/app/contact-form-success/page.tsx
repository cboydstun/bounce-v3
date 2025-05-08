"use client";

import { metadata } from "./metadata";
import React from "react";

export { metadata };
import Link from "next/link";
import { useEffect } from "react";
import { trackContactForm } from "@/utils/trackConversion";
import { trackSuccessPageEngagement } from "@/utils/formEngagementTracking";

export default function ContactFormSuccessPage() {
  useEffect(() => {
    // Track conversion event for analytics
    trackContactForm();

    // Track success page view for engagement scoring
    trackSuccessPageEngagement("success_page_view");
  }, []);

  // Track CTA clicks
  const handleCTAClick = (ctaType: string) => {
    trackSuccessPageEngagement("success_page_cta_click", { ctaType });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="w-full max-w-[800px] mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-secondary-blue/20 shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-purple mb-6">
            Thank You for Contacting Us!
          </h1>

          <div className="bg-green-100 text-green-700 p-6 rounded-xl text-center text-lg animate-fade-in mb-8">
            <p className="text-2xl mb-4">
              🎊 Woohoo! Your message is on its way! 🌟
            </p>
            <p>
              We&apos;ll be in touch super soon to help make your party amazing!
            </p>
          </div>

          <p className="mb-6 text-gray-700">
            One of our party specialists will contact you shortly to discuss
            your event details.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link
              href="/products"
              onClick={() => handleCTAClick("products")}
              className="py-3 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 bg-gradient-to-r from-blue-400 to-purple-600 text-white hover:from-blue-500 hover:to-purple-700 shadow-md hover:shadow-lg"
            >
              Browse Bouncers 🎪
            </Link>

            <Link
              href="/party-packages"
              onClick={() => handleCTAClick("party-packages")}
              className="py-3 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 bg-gradient-to-r from-purple-400 to-pink-600 text-white hover:from-purple-500 hover:to-pink-700 shadow-md hover:shadow-lg"
            >
              View Party Packages 🎁
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
