"use client";

import ProductAvailabilityCalendar from "@/components/ProductAvailabilityCalendar";

interface ProductAvailabilitySectionProps {
  productSlug: string;
  productName: string;
}

export default function ProductAvailabilitySection({
  productSlug,
  productName,
}: ProductAvailabilitySectionProps) {
  return (
    <ProductAvailabilityCalendar
      productSlug={productSlug}
      productName={productName}
    />
  );
}
