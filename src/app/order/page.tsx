"use client";

import { useEffect } from "react";
import CheckoutWizard from "@/components/checkout/CheckoutWizard";

export default function OrderPage() {
  // Track page view
  useEffect(() => {
    // Add any analytics tracking here if needed
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "page_view", {
        page_title: "Rental Checkout",
        page_path: "/order",
      });
    }
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">
        Rental Checkout
      </h1>
      <CheckoutWizard />
    </div>
  );
}
