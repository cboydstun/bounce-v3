"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: "#fff",
          color: "#333",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          padding: "12px 16px",
        },
        success: {
          style: {
            background: "#ECFDF5",
            color: "#065F46",
            border: "1px solid #D1FAE5",
          },
          iconTheme: {
            primary: "#10B981",
            secondary: "#ECFDF5",
          },
        },
        error: {
          style: {
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FEE2E2",
          },
          iconTheme: {
            primary: "#EF4444",
            secondary: "#FEF2F2",
          },
        },
      }}
    />
  );
}
