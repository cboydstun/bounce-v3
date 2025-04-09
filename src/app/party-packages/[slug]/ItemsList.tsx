"use client";

import { PackageItem } from "../../../types/partypackage";

interface ItemsListProps {
  items: PackageItem[];
}

export default function ItemsList({ items }: ItemsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-3 bg-secondary-blue/5 p-4 rounded-lg"
        >
          <div className="bg-primary-blue/10 rounded-full w-8 h-8 flex items-center justify-center text-primary-blue font-bold">
            {item.quantity}
          </div>
          <div>
            <p className="font-medium text-gray-800">{item.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
