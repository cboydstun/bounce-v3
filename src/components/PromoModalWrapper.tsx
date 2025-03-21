"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Holiday } from "../types/promo";

// Dynamically import the PromoModal component with no SSR
const PromoModal = dynamic(() => import("./PromoModal"), {
  ssr: false,
});

interface PromoModalWrapperProps {
  holidays: Holiday[];
  delayInSeconds?: number;
  persistenceDays?: number;
}

const PromoModalWrapper: React.FC<PromoModalWrapperProps> = ({
  holidays,
  delayInSeconds = 5,
  persistenceDays = 1,
}) => {
  return (
    <PromoModal
      holidays={holidays}
      delayInSeconds={delayInSeconds}
      persistenceDays={persistenceDays}
    />
  );
};

export default PromoModalWrapper;
