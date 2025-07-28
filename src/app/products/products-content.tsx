"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ProductWithId } from "../../types/product";
import { getProducts } from "../../utils/api";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ProductFilters } from "../../components/ProductFilters";

function ProductGrid({ products }: { products: ProductWithId[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <a
          key={product._id}
          href={`/products/${product.slug}`}
          aria-label={`View details for ${product.name} - $${product.price.base.toFixed(2)}`}
          className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-2 border-transparent hover:border-secondary-blue/20"
        >
          <div className="aspect-w-16 aspect-h-16 relative overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                width={400}
                height={400}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={false}
              />
            ) : (
              <div className="w-full h-full bg-secondary-blue/10 flex items-center justify-center text-primary-blue font-medium">
                No Image
              </div>
            )}
          </div>
          <div className="p-6">
            <h2 className="text-xl font-bold text-primary-blue mb-2">
              {product.name}
            </h2>
            {product.dimensions && (
              <p className="text-gray-600 mb-4">
                {product.dimensions.length} W x {product.dimensions.width} L x{" "}
                {product.dimensions.height} H {product.dimensions.unit}
              </p>
            )}
            <p className="text-gray-600 mb-4 line-clamp-2">
              {product.description}
            </p>
            <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
              ${product.price.base.toFixed(2)}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

interface ProductsContentProps {
  initialProducts: ProductWithId[];
}

export function ProductsContent({ initialProducts }: ProductsContentProps) {
  const [filteredProducts, setFilteredProducts] =
    useState<ProductWithId[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  // Set initial products when prop changes
  useEffect(() => {
    setFilteredProducts(initialProducts);
  }, [initialProducts]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full bg-secondary-blue/5 py-12">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col gap-6 mb-12">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-white">
              Browse San Antonio Bounce House Rentals
            </h1>
          </div>

          {/* Moonbounce Cross-Reference */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-white/90 text-lg">
              Looking for{" "}
              <strong className="text-blue-300">moonbounce rentals</strong> in
              San Antonio? Our bounce houses are also known as moonbounces!
              <a
                href="/moonbounce"
                className="text-blue-300 hover:text-blue-200 underline ml-2 font-semibold"
              >
                Visit our dedicated moonbounce page →
              </a>
            </p>
          </div>

          <ProductFilters
            products={initialProducts}
            onFilteredProducts={setFilteredProducts}
          />
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} />
        ) : (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                No Products Found
              </h2>
              <p className="text-white/80 mb-6">
                We're currently updating our inventory. Please check back soon
                or contact us directly for availability.
              </p>
              <div className="space-y-4">
                <p className="text-white/90">
                  <strong>Popular Categories:</strong>
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a
                    href="/moonbounce"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Moonbounces
                  </a>
                  <a
                    href="/water-slides"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Water Slides
                  </a>
                  <a
                    href="/contact"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
