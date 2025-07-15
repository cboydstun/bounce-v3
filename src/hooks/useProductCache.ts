import { useState, useEffect } from "react";
import { ProductWithId } from "@/types/product";
import { getProducts } from "@/utils/api";

interface CachedProducts {
  products: ProductWithId[];
  timestamp: number;
  expiry: number;
}

const CACHE_KEY = "admin_products_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for caching products with localStorage
 * @returns Object with products, loading state, error, and refresh function
 */
export function useProductCache() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCachedProducts = (): CachedProducts | null => {
    if (typeof window === "undefined") return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedProducts = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now < parsedCache.expiry) {
        return parsedCache;
      }

      // Cache expired, remove it
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (error) {
      console.error("Error reading products cache:", error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  const setCachedProducts = (products: ProductWithId[]) => {
    if (typeof window === "undefined") return;

    try {
      const cacheData: CachedProducts = {
        products,
        timestamp: Date.now(),
        expiry: Date.now() + CACHE_DURATION,
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error caching products:", error);
    }
  };

  const fetchProducts = async (forceRefresh = false) => {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = getCachedProducts();
      if (cached) {
        setProducts(cached.products);
        return cached.products;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getProducts({ availability: "available" });

      // Filter to only show bouncer-type products
      const categoryToBouncerMapping: Record<string, boolean> = {
        "bounce-house": true,
        bouncer: true,
        "water-slide": true,
        combo: true,
        inflatable: true,
        table: false,
        chair: false,
        generator: false,
        concession: false,
        "add-on": false,
        addon: false,
        extra: false,
      };

      const bouncerProducts = (response.products || []).filter(
        (product: ProductWithId) => {
          const normalizedCategory = product.category
            .toLowerCase()
            .replace(/\s+/g, "-");
          return categoryToBouncerMapping[normalizedCategory] === true;
        },
      );

      // If no bouncer products found, show all products for debugging
      const finalProducts =
        bouncerProducts.length > 0 ? bouncerProducts : response.products || [];

      setProducts(finalProducts);
      setCachedProducts(finalProducts);

      return finalProducts;
    } catch (error) {
      const errorMessage =
        "Failed to load products. You can still enter a custom bouncer name.";
      setError(errorMessage);
      console.error("Error fetching products:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProducts = () => fetchProducts(true);

  const clearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY);
    }
  };

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    isLoading,
    error,
    refreshProducts,
    clearCache,
  };
}
