"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { isPackageDealsVisible } from "../../utils/cookieUtils";

// Static package data
interface StaticPackage {
  id: string;
  name: string;
  description: string;
  value: string;
  savings: string;
  image: string;
  badge?: string;
  highlight: string;
}

const staticPackages: StaticPackage[] = [
  {
    id: "save-25",
    name: "$25 Off Your Order",
    description:
      "Get $25 off any order of $200 or more. Perfect for larger parties and events.",
    value: "$25",
    savings: "Instant Savings",
    image:
      "https://assets-v2.lottiefiles.com/a/b99ec3bc-1162-11ee-bc16-b7819335a2c8/27MvVARwvR.gif",
    highlight: "No minimum guest count required",
  },
  {
    id: "free-cooler",
    name: "FREE Evaporative Cooler Rental",
    description:
      "Beat the heat with a complimentary evaporative cooler rental to keep your party cool and comfortable.",
    value: "$50",
    savings: "FREE Rental",
    image: "/swamp-cooler.jpg",
    badge: "While supplies last - First come, first serve",
    highlight: "Perfect for hot summer days",
  },
  {
    id: "slushy-deal",
    name: "50% Off Slushy Machine + FREE Overnight",
    description:
      "Half-price slushy machine rental plus complimentary overnight service with an inflatable bounce house rental.",
    value: "$125",
    savings: "Total Value",
    image: "/slushy-machine.jpg",
    badge: "While supplies last - First come, first serve",
    highlight: "$75 discount + $50 overnight value",
  },
];

function PackageGrid({ packages }: { packages: StaticPackage[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-2 border-transparent hover:border-secondary-blue/20"
        >
          {/* Image section */}
          <div className="relative overflow-hidden h-100 bg-gray-100">
            <img
              src={pkg.image}
              alt={pkg.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            {pkg.badge && (
              <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                Limited Time
              </div>
            )}
          </div>

          <div className="p-6">
            <h2 className="text-xl font-bold text-primary-blue mb-2">
              {pkg.name}
            </h2>
            <p className="text-gray-600 mb-4 line-clamp-3">{pkg.description}</p>

            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                  {pkg.value} Value
                </p>
                <p className="text-sm text-gray-600">{pkg.savings}</p>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Special Offer
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-primary-purple font-medium mb-2">
                {pkg.highlight}
              </p>
              {pkg.badge && (
                <p className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                  {pkg.badge}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PartyPackagesContent() {
  const [hasCompletedForm, setHasCompletedForm] = useState(false);

  // Check if user has completed the coupon form
  useEffect(() => {
    setHasCompletedForm(isPackageDealsVisible());
  }, []);

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
        <PackageGrid packages={staticPackages} />
      </div>
    </div>
  );
}
