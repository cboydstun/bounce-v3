"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ProductForm from "../../ProductForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { ProductFormData } from "../../ProductForm";
import { getProductBySlug, updateProduct } from "@/utils/api";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[PRODUCT EDIT PAGE DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

interface Product extends ProductFormData {
  slug: string;
  _id: string;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication using NextAuth.js
  useEffect(() => {
    if (status === "loading") {
      // Still loading session, wait
      return;
    }

    if (status === "unauthenticated") {
      setError("Authentication required. Please log in.");
      // We'll let the error UI handle the redirect
    }
  }, [status, session]);

  useEffect(() => {
    // Only fetch product if authenticated or still loading
    if (status === "unauthenticated") return;

    const fetchProduct = async () => {
      try {
        debugLog("Fetching product", { slug: unwrappedParams.id });
        setIsLoading(true);
        setError(null);

        const productData = await getProductBySlug(unwrappedParams.id);
        setProduct(productData);
      } catch (err) {
        console.error("Fetch error:", err);

        // Handle authentication errors
        if (
          err instanceof Error &&
          err.message.includes("Authentication failed")
        ) {
          setError("Authentication failed. Please log in again.");
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "An error occurred while fetching the product",
          );
        }

        debugLog("Error fetching product", { error: err });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [unwrappedParams.id, status]);

  const handleSubmit = async (formData: ProductFormData) => {
    try {
      // Check if authenticated
      if (status !== "authenticated") {
        setError("Authentication required. Please log in.");
        return;
      }
      setIsLoading(true);
      setError(null);

      if (!product?.slug) {
        setError("Product slug is missing");
        return;
      }

      await updateProduct(product.slug, {
        ...formData,
        slug: product.slug, // Preserve the slug from the original product
      });

      debugLog("Product updated successfully");
      router.push("/admin/products");
    } catch (err) {
      console.error("Submit error:", err);

      // Handle authentication errors
      if (
        err instanceof Error &&
        err.message.includes("Authentication failed")
      ) {
        setError("Authentication failed. Please log in again.");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to update product",
        );
      }

      debugLog("Error updating product", { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            {error.toLowerCase().includes("log in") && (
              <div className="mt-2">
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm font-medium text-red-800 underline hover:text-red-600"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading" || isLoading || !product) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  const { ...formData } = product;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Edit Product
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Update the product by modifying the form below.
        </p>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <ProductForm
            initialData={formData}
            onSubmit={handleSubmit}
            isEdit={true}
          />
        </div>
      </div>
    </div>
  );
}
