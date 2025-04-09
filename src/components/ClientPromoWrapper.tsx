"use client";

import React from "react";
import PromoModalWrapper from "./PromoModalWrapper";
import { Holiday } from "../types/promo";

interface ClientPromoWrapperProps {
  holidays: Holiday[];
}

export default function ClientPromoWrapper({
  holidays,
}: ClientPromoWrapperProps) {
  return (
    <PromoModalWrapper
      holidays={holidays}
      delayInSeconds={3}
      persistenceDays={0}
    />
  );
}
