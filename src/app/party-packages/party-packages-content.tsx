"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PartyPackageWithId } from "../../types/partypackage";
import { ProductWithId } from "../../types/product";
import { getPartyPackages, getProducts } from "../../utils/api";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { isPackageDealsVisible } from "../../utils/cookieUtils";

// Create a type for the product ID to image mapping
type ProductImageMap = {
  [productId: string]: string;
};

function PackageGrid({
  packages,
  productImages,
}: {
  packages: PartyPackageWithId[];
  productImages: ProductImageMap;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg) => {
        // Get the first item's ID
        const firstItemId = pkg.items[0]?.id;
        // Get the image URL for the first item, or use a default
        const imageUrl =
          firstItemId && productImages[firstItemId]
            ? productImages[firstItemId]
            : "/satx-bounce-house-rental-san-antonio-dry-xl.png";

        return (
          <a
            key={pkg._id}
            href={`/party-packages/${pkg.id}`}
            aria-label={`View details for ${pkg.name} - $${pkg.packagePrice.toFixed(2)}`}
            className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-2 border-transparent hover:border-secondary-blue/20"
          >
            {/* Image section */}
            <div className="aspect-w-16 aspect-h-16 relative overflow-hidden">
              <Image
                src={imageUrl}
                alt={pkg.name}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                width={400}
                height={400}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={false}
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-primary-blue mb-2">
                {pkg.name}
              </h2>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {pkg.description}
              </p>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-lg line-through text-gray-500">
                    ${pkg.totalRetailPrice.toFixed(2)}
                  </p>
                  <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                    ${pkg.packagePrice.toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Save {pkg.savingsPercentage}%
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Includes:</span>{" "}
                  {pkg.items.length} items
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Recommended for:</span>{" "}
                  {pkg.recommendedPartySize.min}-{pkg.recommendedPartySize.max}{" "}
                  people
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ages:</span> {pkg.ageRange.min}+
                  years
                </p>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function PartyPackagesContent() {
  const [packages, setPackages] = useState<PartyPackageWithId[]>([]);
  const [productImages, setProductImages] = useState<ProductImageMap>({});
  const [loading, setLoading] = useState(true);
  const [hasCompletedForm, setHasCompletedForm] = useState(false);

  // Check if user has completed the coupon form
  useEffect(() => {
    setHasCompletedForm(isPackageDealsVisible());
  }, []);

  // Fetch party packages and products on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch party packages
        const packagesData = await getPartyPackages();
        const packages = packagesData.packages || [];
        setPackages(packages);

        // Fetch all products to get their images
        const productsData = await getProducts();
        const products = productsData.products || [];

        // Create mappings of product IDs and slugs to their primary image URLs
        const imageMap: ProductImageMap = {};
        products.forEach((product: ProductWithId) => {
          if (product.images && product.images.length > 0) {
            // Use both _id and slug as keys in the mapping to increase chances of a match
            imageMap[product._id] = product.images[0].url;
            imageMap[product.slug] = product.images[0].url;
            // Also try using the product name as a key (converted to lowercase and spaces replaced with hyphens)
            const nameAsId = product.name.toLowerCase().replace(/\s+/g, "-");
            imageMap[nameAsId] = product.images[0].url;
          }
        });

        setProductImages(imageMap);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
            <h1 className="text-3xl font-bold text-white">Party Packages</h1>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-2">
              Bundle and Save!
            </h2>
            <p className="text-white/80">
              Our party packages combine multiple products at discounted rates.
              Perfect for larger events or when you want a complete party
              solution.
            </p>
          </div>
        </div>

        {/* Special Offer Banner for users who haven't completed the form */}
        {!hasCompletedForm && (
          <div className="mb-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">
                  🎉 Unlock Exclusive Package Deals!
                </h3>
                <p className="text-white/90">
                  Get access to special discounts and exclusive party package
                  offers by completing our quick form.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href="/coupon-form"
                  className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors duration-200 inline-block"
                >
                  Get Special Offers
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Packages Grid */}
        <PackageGrid packages={packages} productImages={productImages} />
      </div>
    </div>
  );
}
