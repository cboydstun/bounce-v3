"use client";

import { useEffect, useState, useMemo } from "react";
import { ProductWithId, Specification } from "../types/product";
import { getProducts } from "../utils/api";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import ProductSlider from "./ProductSlider";

// Helper function to filter products by type
const filterProductsByType = (
  products: ProductWithId[],
  type: string,
): ProductWithId[] => {
  return products
    .filter((product: ProductWithId) =>
      product.specifications.some((spec: Specification) => {
        if (spec.name !== "Type") return false;
        return Array.isArray(spec.value)
          ? spec.value.includes(type)
          : spec.value === type;
      }),
    )
    .sort((a: ProductWithId, b: ProductWithId) => b.price.base - a.price.base);
};

const ProductCarousel = () => {
  const [allProducts, setAllProducts] = useState<ProductWithId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setAllProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products by type
  const dryProducts = useMemo(
    () => filterProductsByType(allProducts, "DRY"),
    [allProducts],
  );

  const wetProducts = useMemo(
    () => filterProductsByType(allProducts, "WET"),
    [allProducts],
  );

  const extraProducts = useMemo(
    () => filterProductsByType(allProducts, "EXTRA"),
    [allProducts],
  );

  if (loading)
    return (
      <div className="w-full py-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center font-semibold">{error}</div>
    );

  if (!allProducts.length)
    return (
      <div className="text-center text-primary-blue font-semibold">
        No products available
      </div>
    );

  return (
    <div className="product-carousels-container">
      {/* All three sliders stacked vertically */}
      <ProductSlider products={dryProducts} title="🎈 Dry Bounce Houses 🏰" />

      <ProductSlider products={wetProducts} title="💦 Wet Waterslides 🛝" />

      <ProductSlider products={extraProducts} title="🍹 Extras 🍿" />
    </div>
  );
};

export default ProductCarousel;
