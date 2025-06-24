"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  type: string;
  available: boolean;
  unavailabilityReason?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  discountBadge?: string;
  showAvailability?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
  type,
  available,
  unavailabilityReason,
  isSelected,
  onSelect,
  discountBadge,
  showAvailability = false,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
        !available
          ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
          : isSelected
            ? "border-primary-purple bg-primary-purple/5 shadow-lg"
            : "border-gray-200 hover:border-primary-purple/50 hover:shadow-md"
      }`}
      onClick={() => available && onSelect(id)}
    >
      {/* Availability Badge */}
      {!available && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
          Unavailable
        </div>
      )}

      {/* Discount Badge */}
      {discountBadge && available && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
          {discountBadge}
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 bg-primary-purple text-white rounded-full w-6 h-6 flex items-center justify-center z-10">
          ✓
        </div>
      )}

      {/* Product Image */}
      <div className="aspect-video w-full mb-3 rounded-lg overflow-hidden bg-gray-100">
        {image && !imageError ? (
          <Image
            src={image}
            alt={name}
            width={300}
            height={200}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">🎪</div>
              <div className="text-sm">No Image</div>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3
          className={`font-semibold text-sm ${!available ? "text-gray-500" : "text-gray-800"}`}
        >
          {name}
        </h3>

        <div className="flex items-center justify-between">
          <span
            className={`text-xs px-2 py-1 rounded ${
              type === "WET"
                ? "bg-blue-100 text-blue-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {type}
          </span>

          <div className="text-right">
            <div
              className={`font-bold ${!available ? "text-gray-500" : "text-green-600"}`}
            >
              ${price.toFixed(2)}
            </div>
            {showAvailability && available && (
              <div className="text-xs text-green-600">Available</div>
            )}
          </div>
        </div>

        {/* Unavailability Reason */}
        {!available && unavailabilityReason && (
          <div className="text-xs text-red-600 mt-1">
            {unavailabilityReason}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
