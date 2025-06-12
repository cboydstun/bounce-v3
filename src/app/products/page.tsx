import { Metadata } from "next";
import { ProductsContent } from "./products-content";

export const metadata: Metadata = {
  title:
    "Browse San Antonio Bounce House Rentals - Water Slides & More | SATX Bounce",
  description:
    "Browse our selection of bounce houses, water slides, and party equipment for rent in San Antonio. Filter by type, size, and price. Free delivery within Loop 1604!",
  alternates: {
    canonical: "/products",
  },
  keywords:
    "bounce house rental, water slides, party equipment, San Antonio rentals, inflatable rentals, party supplies, event rentals",
  openGraph: {
    title:
      "Browse San Antonio Bounce House Rentals - Water Slides & More | SATX Bounce",
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
