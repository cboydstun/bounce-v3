"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Modal from "./ui/Modal";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { getCurrentPromotion } from "../utils/promoUtils";
import { usePackageDeals } from "../contexts/PackageDealsContext";
import { Holiday } from "../types/promo";
import {
  trackPromoModalDisplayed,
  trackPromoModalClosed,
  trackPromoModalConversion,
  trackPromoModalMetrics,
} from "../utils/promoTracking";

interface PromoModalProps {
  holidays: Holiday[];
  delayInSeconds?: number;
  // How long (in days) before showing the modal again after it's been closed
  persistenceDays?: number;
}

// Helper function to determine promo type
const determinePromoType = (promoName: string): string => {
  const name = promoName.toLowerCase();
  if (
    name.includes("holiday") ||
    name.includes("christmas") ||
    name.includes("halloween")
  )
    return "holiday";
  if (
    name.includes("summer") ||
    name.includes("spring") ||
    name.includes("fall") ||
    name.includes("winter")
  )
    return "seasonal";
  if (name.includes("discount") || name.includes("off") || name.includes("%"))
    return "discount";
  if (
    name.includes("package") ||
    name.includes("deal") ||
    name.includes("bundle")
  )
    return "package_deal";
  if (name.includes("first") || name.includes("new")) return "first_time";
  return "general";
};

const PromoModal: React.FC<PromoModalProps> = ({
  holidays,
  delayInSeconds = 5,
  persistenceDays = 1,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentPromo, setCurrentPromo] = useState<Holiday | null>(null);
  const [isClient, setIsClient] = useState<boolean>(false);
  const modalDisplayTime = useRef<number>(0);
  const modalStartTime = useRef<number>(0);

  // Handle client-side only code
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { hasCompletedForm: packageDealsVisible } = usePackageDeals();

  useEffect(() => {
    if (!isClient) return; // Only run on client

    // If package deals are already visible, don't show the modal
    if (packageDealsVisible) return;

    // Find the current promotion based on today's date
    const promo = getCurrentPromotion(holidays);
    setCurrentPromo(promo);

    if (!promo) return;

    // Check if the modal has been dismissed recently
    const shouldShowModal = () => {
      // Create a storage key specific to this promotion
      const storageKey = `promo_modal_${promo.name
        .replace(/\s+/g, "_")
        .toLowerCase()}`;

      // Check if there's a stored timestamp for this promo
      const storedTimestamp = localStorage.getItem(storageKey);

      if (!storedTimestamp) {
        return true; // No record of dismissal, show the modal
      }

      // Calculate if enough time has passed since last dismissal
      const lastDismissed = new Date(parseInt(storedTimestamp, 10));
      const now = new Date();
      const daysSinceLastDismissed =
        (now.getTime() - lastDismissed.getTime()) / (1000 * 60 * 60 * 24);

      return daysSinceLastDismissed >= persistenceDays;
    };

    // Only show the modal if it hasn't been dismissed recently
    if (shouldShowModal()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        modalStartTime.current = Date.now();

        // Track modal display
        trackPromoModalDisplayed({
          promoName: promo.name,
          promoType: determinePromoType(promo.name),
          promoTitle: promo.promoTitle,
          promoDescription: promo.promoDescription,
          promoImage: promo.promoImage,
          displayDelay: delayInSeconds,
          persistenceDays: persistenceDays,
          currentPage: window.location.pathname,
        });
      }, delayInSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [holidays, delayInSeconds, persistenceDays, isClient]);

  const handleClose = () => {
    if (isClient && currentPromo && modalStartTime.current > 0) {
      const viewDuration = (Date.now() - modalStartTime.current) / 1000;

      // Track modal close
      trackPromoModalClosed({
        promoName: currentPromo.name,
        promoType: determinePromoType(currentPromo.name),
        promoTitle: currentPromo.promoTitle,
        promoDescription: currentPromo.promoDescription,
        displayDelay: delayInSeconds,
        persistenceDays: persistenceDays,
        currentPage: window.location.pathname,
        closeMethod: "x_button",
        viewDuration: viewDuration,
      });

      // Store the current timestamp when the modal is closed
      const storageKey = `promo_modal_${currentPromo.name
        .replace(/\s+/g, "_")
        .toLowerCase()}`;
      localStorage.setItem(storageKey, Date.now().toString());
    }
    setIsOpen(false);
  };

  const handleGetCoupon = () => {
    if (isClient && currentPromo && modalStartTime.current > 0) {
      const viewDuration = (Date.now() - modalStartTime.current) / 1000;

      // Track conversion
      trackPromoModalConversion({
        promoName: currentPromo.name,
        promoType: determinePromoType(currentPromo.name),
        promoTitle: currentPromo.promoTitle,
        promoDescription: currentPromo.promoDescription,
        displayDelay: delayInSeconds,
        persistenceDays: persistenceDays,
        currentPage: window.location.pathname,
        conversionType: "coupon_form",
        nextPage: "/coupon-form",
        viewDuration: viewDuration,
        conversionValue: 75, // Estimated value for promo conversion
      });

      // Store the timestamp as we do in handleClose
      const storageKey = `promo_modal_${currentPromo.name
        .replace(/\s+/g, "_")
        .toLowerCase()}`;
      localStorage.setItem(storageKey, Date.now().toString());
    }

    // Close the modal
    setIsOpen(false);

    // Navigate to the coupon form page with the promo name as a query parameter
    router.push(
      `/coupon-form?promo=${encodeURIComponent(currentPromo?.name || "")}`,
    );
  };

  if (!isClient || !currentPromo) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="w-full max-w-md md:max-w-2xl"
      position="follow-scroll"
    >
      <Card className="border-0 shadow-none relative">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Responsive layout container */}
        <div className="flex flex-col md:flex-row md:items-stretch">
          {/* Image container - full width on mobile, left side on desktop */}
          <div className="relative w-full h-48 md:h-auto md:w-2/5 md:min-h-[300px] overflow-hidden md:rounded-l-lg">
            <Image
              src={currentPromo.promoImage}
              alt={currentPromo.promoTitle}
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>

          {/* Content container - full width on mobile, right side on desktop */}
          <div className="md:w-3/5 md:p-6">
            <CardHeader className="pb-2 md:pt-4">
              <CardTitle className="text-primary-purple text-2xl md:text-3xl">
                {currentPromo.promoTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-3">{currentPromo.message}</p>
              <p className="text-gray-800 font-medium mb-6">
                {currentPromo.promoDescription}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={handleGetCoupon}
                  className="bg-primary-blue text-white px-5 py-2 rounded-lg font-semibold hover:bg-primary-purple transition-colors duration-300"
                >
                  See Package Deals
                </button>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </Modal>
  );
};

export default PromoModal;
