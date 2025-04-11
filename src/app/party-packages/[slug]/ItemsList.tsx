"use client";

import { PackageItem } from "../../../types/partypackage";
import Image from "next/image";

interface ItemsListProps {
  items: PackageItem[];
  productImages: Record<string, string>; // Map of product ID to image URL
}

export default function ItemsList({ items, productImages }: ItemsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((item, index) => {
        // Get image URL for this item, or use default
        const imageUrl =
          productImages[item.id] ||
          "/satx-bounce-house-rental-san-antonio-dry-xl.png";

        return (
          <div
            key={index}
            className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
          >
            {/* Product Image */}
            <div className="aspect-w-4 aspect-h-3 relative h-16">
              <Image
                src={imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                width={300}
                height={200}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            {/* Product Details */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-primary-blue">{item.name}</h3>
                <div className="bg-primary-blue/10 rounded-full w-8 h-8 flex items-center justify-center text-primary-blue font-bold">
                  {item.quantity}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
