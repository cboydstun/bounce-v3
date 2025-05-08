import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | SATX Bounce House Rentals",
  description:
    "Secure login portal for SATX Bounce House Rentals administrators and staff members.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Login | SATX Bounce House Rentals",
    description:
      "Secure login portal for SATX Bounce House Rentals administrators and staff members.",
    type: "website",
    url: "https://satxbounce.com/login",
    images: ["/og-image.jpg"],
  },
};
