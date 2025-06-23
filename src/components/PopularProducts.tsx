"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductWithId } from "../types/product";
import { getProducts } from "../utils/api";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface PopularProductsProps {
  maxProducts?: number;
  title?: string;
  showViewAll?: boolean;
}

const PopularProducts: React.FC<PopularProductsProps> = ({
  maxProducts = 6,
  title = "Popular Rentals",
  showViewAll = true,
}) => {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const data = await getProducts();
        const allProducts = data.products || [];

        // Sort by price (higher priced items are often more popular/premium)
        // and mix in some variety by alternating high and mid-range products
        const sortedProducts = allProducts
          .sort(
            (a: ProductWithId, b: ProductWithId) => b.price.base - a.price.base,
          )
          .slice(0, maxProducts);

        setProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching popular products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, [maxProducts]);

  if (loading) {
    return (
      <div className="w-full py-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-primary-purple mb-2">{title}</h2>
        <p className="text-gray-600">
          Check out our most requested bounce houses and party equipment
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/products/${product.slug}`}
            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border-2 border-transparent hover:border-secondary-blue/20"
          >
            <div className="aspect-video relative overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  width={400}
                  height={225}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full bg-secondary-blue/10 flex items-center justify-center text-primary-blue font-medium">
                  No Image
                </div>
              )}

              {/* Popular badge */}
              <div className="absolute top-3 left-3">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  ⭐ Popular
                </span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-bold text-primary-blue mb-2 line-clamp-2">
                {product.name}
              </h3>

              {product.dimensions && (
                <p className="text-gray-600 text-sm mb-2">
                  {product.dimensions.length} x {product.dimensions.width} x{" "}
                  {product.dimensions.height} {product.dimensions.unit}
                </p>
              )}

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                  ${product.price.base.toFixed(2)}
                </p>

                <span className="inline-block bg-primary-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  View Details
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showViewAll && (
        <div className="text-center mt-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-500 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            View All Products
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};

export default PopularProducts;
