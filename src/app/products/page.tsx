import { Metadata } from "next";
import { ProductsContent } from "./products-content";
import { API_ROUTES } from "../../config/constants";
import { Product } from "../../types/product";

export const metadata: Metadata = {
  title: "Bounce Houses & Party Rentals | SATX Bounce",
  description:
    "Browse our selection of bounce houses, water slides, and party equipment for rent in San Antonio. Filter by type, size, and price. Free delivery within Loop 1604!",
  keywords:
    "bounce house rental, water slides, party equipment, San Antonio rentals, inflatable rentals, party supplies, event rentals",
  openGraph: {
    title: "Bounce Houses & Party Rentals | SATX Bounce",
    description:
      "Browse our selection of bounce houses, water slides, and party equipment for rent in San Antonio. Free delivery within Loop 1604!",
    type: "website",
    url: "https://satxbounce.com/products",
    images: ["/og-image.jpg"],
  },
};

// Server-side data fetching function
async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${API_ROUTES.PRODUCTS}`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return []; // Return empty array on error
  }
}

export default async function ProductsPage() {
  // Fetch products on the server
  const products = await getProducts();

  // Pass pre-fetched products to the client component
  return <ProductsContent initialProducts={products} />;
}
