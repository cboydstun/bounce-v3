"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PartyPackageWithId } from "../../types/partypackage";
import { getPartyPackages } from "../../utils/api";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

function PackageGrid({ packages }: { packages: PartyPackageWithId[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <a
          key={pkg._id}
          href={`/party-packages/${pkg.id}`}
          aria-label={`View details for ${pkg.name} - $${pkg.packagePrice.toFixed(2)}`}
          className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-2 border-transparent hover:border-secondary-blue/20"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-primary-blue mb-2">
              {pkg.name}
            </h2>
            <p className="text-gray-600 mb-4 line-clamp-2">{pkg.description}</p>
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
      ))}
    </div>
  );
}

export function PartyPackagesContent() {
  const [packages, setPackages] = useState<PartyPackageWithId[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch party packages on mount
  useEffect(() => {
    async function fetchPackages() {
      try {
        const data = await getPartyPackages();
        // Extract packages array from the response
        const packages = data.packages || [];
        setPackages(packages);
      } catch (error) {
        console.error("Failed to fetch party packages:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
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

        {/* Packages Grid */}
        <PackageGrid packages={packages} />
      </div>
    </div>
  );
}
