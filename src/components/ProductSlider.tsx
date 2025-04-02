"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { ProductWithId } from "../types/product";

interface ProductSliderProps {
  products: ProductWithId[];
  title: string;
  testItemsPerPage?: number; // For testing purposes
}

const ProductSlider: React.FC<ProductSliderProps> = ({
  products,
  title,
  testItemsPerPage,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(testItemsPerPage || 1);

  useEffect(() => {
    // Skip resize handling if testItemsPerPage is provided (for testing)
    if (testItemsPerPage !== undefined) return;

    // Update items per page based on window width
    const handleResize = () => {
      if (window.innerWidth >= 1024)
        setItemsPerPage(4); // lg - show more items
      else if (window.innerWidth >= 768)
        setItemsPerPage(3); // md - show more items
      else setItemsPerPage(2); // mobile - show more items
      setCurrentPage(0); // Reset to first page on resize
    };

    // Initial check after component mount
    handleResize();

    // Update on window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [testItemsPerPage]);

  if (!products.length) {
    return null; // Don't render anything if no products
  }

  const pageCount = Math.ceil(products.length / itemsPerPage);
  const visibleProducts = products.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage,
  );

  // Configure swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentPage < pageCount - 1) {
        setCurrentPage((prev) => prev + 1);
      }
    },
    onSwipedRight: () => {
      if (currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      }
    },
    // Prevent scrolling while swiping
    preventScrollOnSwipe: true,
    // Only activate for horizontal swipes
    trackMouse: false,
  });

  return (
    <div className="w-full py-6 mb-6 bg-[#663399] rounded-lg">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">
          {title}
        </h2>

        <div className="relative" {...swipeHandlers}>
          {/* Navigation Buttons */}
          {pageCount > 1 && (
            <>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 text-primary-blue p-1 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))
                }
                disabled={currentPage === pageCount - 1}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 text-primary-blue p-1 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next products"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Products Grid - more columns, smaller cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-all duration-300"
              >
                {/* 1:1 aspect ratio image container */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={product.images[0]?.url}
                    alt={product.images[0]?.alt || product.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    draggable="false"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-primary-blue truncate">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-xs">
                    ${product.price.base}/{product.rentalDuration}
                  </p>
                  <p className="text-gray-600 text-xs mb-2">
                    {product?.dimensions?.length}x{product?.dimensions?.width}x
                    {product?.dimensions?.height} {product?.dimensions?.unit}
                  </p>
                  <div className="flex gap-1 text-xs">
                    <Link
                      href={`/products/${product.slug}`}
                      className="flex-1 bg-primary-blue text-white text-center py-1 px-2 rounded font-medium hover:bg-blue-600 transition-colors"
                    >
                      Info
                    </Link>
                    <Link
                      href="/contact"
                      className="flex-1 bg-gradient-to-r from-blue-400 to-purple-600 text-white text-center py-1 px-2 rounded font-medium hover:from-blue-500 hover:to-purple-700 transition-all"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Page Dots - smaller and more compact */}
          {pageCount > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(pageCount)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`w-6 h-6 flex items-center justify-center transition-all rounded-full ${
                    index === currentPage ? "bg-white/10" : ""
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentPage ? "bg-white w-2.5" : "bg-white/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSlider;
