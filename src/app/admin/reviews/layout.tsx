import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews Management | SATX Bounce House Rentals Admin",
  description: "Manage customer reviews and ratings",
};

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
