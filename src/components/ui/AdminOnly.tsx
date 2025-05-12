"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that only renders its children if the current user is an admin
 * @param children The content to render if the user is an admin
 * @param fallback Optional content to render if the user is not an admin
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <>{fallback}</>;

  return <>{children}</>;
}
