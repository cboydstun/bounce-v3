"use client";

import Link from "next/link";
import { usePackageDeals } from "../contexts/PackageDealsContext";

interface ConditionalPackageLinkProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * A component that conditionally links to either the party packages page or the coupon form
 * based on whether the user has completed the form.
 */
export default function ConditionalPackageLink({
  children,
  className,
  onClick,
}: ConditionalPackageLinkProps) {
  const { hasCompletedForm } = usePackageDeals();

  // Determine target URL based on form completion status
  const targetUrl = hasCompletedForm ? "/party-packages" : "/coupon-form";

  return (
    <Link href={targetUrl} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
