"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePackageDeals } from "../contexts/PackageDealsContext";

interface PackageDealsCTAProps {
  href: string;
  className?: string;
}

const PackageDealsCTA: React.FC<PackageDealsCTAProps> = ({
  href,
  className = "",
}) => {
  const { setVisible } = usePackageDeals();
  
  const handleClick = () => {
    setVisible();
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
    >
      See Package Deals
      <ArrowRight className="w-5 h-5" />
    </Link>
  );
};

export default PackageDealsCTA;
