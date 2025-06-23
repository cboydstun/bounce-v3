"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductWithId, Specification } from "../types/product";
import { getProducts } from "../utils/api";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface RelatedProductsProps {
  currentProduct: ProductWithId;
  maxProducts?: number;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProduct,
  maxProducts = 4,
}) => {
  const [relatedProducts, setRelatedProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const data = await getProducts();
        const allProducts = data.products || [];

        // Get current product's type
        const currentType = currentProduct.specifications.find(
          (spec: Specification) => spec.name === "Type",
        )?.value;

        // Filter products by same type, excluding current product
        let related = allProducts.filter((product: ProductWithId) => {
          if (product._id === currentProduct._id) return false;

          const productType = product.specifications.find(
            (spec: Specification) => spec.name === "Type",
          )?.value;

          // Handle both string and array values for type
          if (Array.isArray(currentType) && Array.isArray(productType)) {
            return currentType.some((type) => productType.includes(type));
          } else if (Array.isArray(currentType)) {
            return currentType.includes(productType as string);
          } else if (Array.isArray(productType)) {
            return productType.includes(currentType as string);
          } else {
            return currentType === productType;
          }
        });

        // If we don't have enough products of the same type, add products from similar price range
        if (related.length < maxProducts) {
          const priceRange = currentProduct.price.base;
          const priceThreshold = priceRange * 0.3; // 30% price difference

          const similarPriceProducts = allProducts.filter(
            (product: ProductWithId) => {
              if (product._id === currentProduct._id) return false;
              if (related.some((p: ProductWithId) => p._id === product._id))
                return false;

              const priceDiff = Math.abs(product.price.base - priceRange);
              return priceDiff <= priceThreshold;
            },
          );

          related = [...related, ...similarPriceProducts];
        }

        // If still not enough, add random products
        if (related.length < maxProducts) {
          const remainingProducts = allProducts.filter(
            (product: ProductWithId) => {
              if (product._id === currentProduct._id) return false;
              return !related.some((p: ProductWithId) => p._id === product._id);
            },
          );

          related = [...related, ...remainingProducts];
        }

        // Sort by price (similar to current product first) and limit
        related.sort((a: ProductWithId, b: ProductWithId) => {
          const aDiff = Math.abs(a.price.base - currentProduct.price.base);
          const bDiff = Math.abs(b.price.base - currentProduct.price.base);
          return aDiff - bDiff;
        });

        setRelatedProducts(related.slice(0, maxProducts));
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [currentProduct, maxProducts]);

  if (loading) {
    return (
      <div className="w-full py-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-center text-primary-purple mb-8">
        You Might Also Like
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <Link
            key={product._id}
            href={`/products/${product.slug}`}
            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border-2 border-transparent hover:border-secondary-blue/20"
          >
            <div className="aspect-square relative overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  width={300}
                  height={300}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full bg-secondary-blue/10 flex items-center justify-center text-primary-blue font-medium">
                  No Image
                </div>
              )}
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

              <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                ${product.price.base.toFixed(2)}
              </p>

              <div className="mt-3 text-center">
                <span className="inline-block bg-primary-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  View Details
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

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
    </div>
  );
};

export default RelatedProducts;
