import type { Metadata } from "next";
import { faqs } from "./data";
import FaqContent from "@/components/FaqContent";

export const generateMetadata = async (): Promise<Metadata> => {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return {
    title: "Frequently Asked Questions | SATX Bounce House Rentals",
    description: "Find answers to common questions about bounce house rentals in San Antonio, TX. Learn about delivery times, safety measures, pricing, and more.",
    keywords: "bounce house rentals FAQ, San Antonio bounce house questions, party rental FAQ, waterslide rental questions, bounce house safety, rental pricing, delivery information",
    openGraph: {
      title: "Frequently Asked Questions | SATX Bounce House Rentals",
      description: "Find answers to common questions about bounce house rentals in San Antonio, TX. Learn about delivery times, safety measures, pricing, and more.",
      type: "website",
    },
    alternates: {
      canonical: new URL("/faq", process.env.NEXT_PUBLIC_SITE_URL || "https://satxbouncehouse.com"),
    },
    other: {
      "script:ld+json": JSON.stringify(faqStructuredData),
    },
  };
};

export default function FaqPage() {
  return <FaqContent />;
}
