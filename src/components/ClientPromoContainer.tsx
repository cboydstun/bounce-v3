"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Holiday } from "../types/promo";

// Dynamically import with no SSR
const ClientPromoWrapper = dynamic(
  () => import("./ClientPromoWrapper"),
  { ssr: false }
);

interface ClientPromoContainerProps {
  holidays: Holiday[];
}

export default function ClientPromoContainer({ holidays }: ClientPromoContainerProps) {
  return <ClientPromoWrapper holidays={holidays} />;
}
