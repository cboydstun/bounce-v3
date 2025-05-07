import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rental Checkout | Bounce House Rentals",
  description: "Complete your bounce house rental order and payment",
  alternates: {
    canonical: "/order",
  },
};

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
