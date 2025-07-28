import { Metadata } from "next";
import { ProductsContent } from "./products-content";
import dbConnect from "@/lib/db/mongoose";
import Product from "@/models/Product";
import { ProductWithId } from "@/types/product";
import StructuredData from "@/components/StructuredData";
import { serializeProducts } from "@/utils/serialization";

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

// Server-side data fetching
async function getProducts(): Promise<ProductWithId[]> {
  try {
    await dbConnect();

    // Fetch products excluding retired ones, sorted by creation date
    const products = await Product.find({
      availability: { $ne: "retired" },
    })
      .sort({ "price.base": -1 })
      .lean()
      .exec();

    // Serialize products to ensure they're safe for client components
    return serializeProducts(products);
  } catch (error) {
    console.error("Error fetching products server-side:", error);
    // Return empty array as fallback - page will still render with meaningful content
    return [];
  }
}

export default async function ProductsPage() {
  // Fetch products server-side
  const initialProducts = await getProducts();

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Bounce House Rentals - San Antonio",
    description:
      "Browse our selection of bounce houses, water slides, and party equipment for rent in San Antonio. Free delivery within Loop 1604!",
    url: "https://satxbounce.com/products",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: initialProducts.length,
      itemListElement: initialProducts.slice(0, 10).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          description: product.description,
          url: `https://satxbounce.com/products/${product.slug}`,
          image: product.images?.[0]?.url || "/og-image.jpg",
          offers: {
            "@type": "Offer",
            price: product.price.base,
            priceCurrency: product.price.currency || "USD",
            availability:
              product.availability === "available"
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        },
      })),
    },
    provider: {
      "@type": "Organization",
      name: "SATX Bounce",
      url: "https://satxbounce.com",
    },
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <ProductsContent initialProducts={initialProducts} />
    </>
  );
}
