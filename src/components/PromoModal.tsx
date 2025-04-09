"use client";

import React, { useState, useEffect } from "react";
import Modal from "./ui/Modal";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { getCurrentPromotion } from "../utils/promoUtils";
import { Holiday } from "../types/promo";

interface PromoModalProps {
  holidays: Holiday[];
  delayInSeconds?: number;
  // How long (in days) before showing the modal again after it's been closed
  persistenceDays?: number;
}

const PromoModal: React.FC<PromoModalProps> = ({
  holidays,
  delayInSeconds = 10,
  persistenceDays = 1,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentPromo, setCurrentPromo] = useState<Holiday | null>(null);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Handle client-side only code
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return; // Only run on client

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
      }, delayInSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [holidays, delayInSeconds, persistenceDays, isClient]);

  const handleClose = () => {
    if (isClient && currentPromo) {
      // Store the current timestamp when the modal is closed
      const storageKey = `promo_modal_${currentPromo.name
        .replace(/\s+/g, "_")
        .toLowerCase()}`;
      localStorage.setItem(storageKey, Date.now().toString());
    }
    setIsOpen(false);
  };

  if (!isClient || !currentPromo) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-md" position="bottom-left">
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary-purple text-2xl">
            {currentPromo.name} Special!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-6">{currentPromo.message}</p>
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="bg-primary-blue text-white px-5 py-2 rounded-lg font-semibold hover:bg-primary-purple transition-colors duration-300"
            >
              Got it!
            </button>
          </div>
        </CardContent>
      </Card>
    </Modal>
  );
};

export default PromoModal;
