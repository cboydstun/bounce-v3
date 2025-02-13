import { Metadata } from "next";
import { ProductsContent } from "./products-content";

export const metadata: Metadata = {
  title: "Bounce Houses & Party Rentals | SATX Bounce",
  description:
    "Browse our selection of bounce houses, water slides, and party equipment for rent in San Antonio. Filter by type, size, and price. Free delivery within Loop 1604!",
  keywords:
    "bounce house rental, water slides, party equipment, San Antonio rentals, inflatable rentals, party supplies, event rentals",
  alternates: {
    canonical: "https://satxbounce.com/products",
  },
  openGraph: {
    title: "Bounce Houses & Party Rentals | SATX Bounce",
    description:
      "Browse our selection of bounce houses, water slides, and party equipment for rent in San Antonio. Free delivery within Loop 1604!",
    type: "website",
    url: "https://satxbounce.com/products",
    images: ["/og-image.jpg"],
  },
};

export default function ProductsPage() {
  return <ProductsContent />;
}
