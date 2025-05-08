import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You for Contacting Us | SATX Bounce House Rentals",
  description:
    "Thank you for reaching out to SATX Bounce House Rentals. We've received your inquiry and will be in touch shortly to discuss your party rental needs.",
  alternates: {
    canonical: "/contact-form-success",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Thank You for Contacting Us | SATX Bounce House Rentals",
    description:
      "Thank you for reaching out to SATX Bounce House Rentals. We've received your inquiry and will be in touch shortly to discuss your party rental needs.",
    type: "website",
    url: "https://satxbounce.com/contact-form-success",
    images: ["/og-image.jpg"],
  },
};
