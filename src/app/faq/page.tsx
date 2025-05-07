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
    title: "FAQ | SATX Bounce Common Questions About Our Party Rentals",
    description:
      "Find answers to common questions about bounce house rentals in San Antonio, TX. Learn about delivery times, safety measures, pricing, and more.",
    alternates: {
      canonical: "/faq",
    },
    keywords:
      "bounce house rentals FAQ, San Antonio bounce house questions, party rental FAQ, waterslide rental questions, bounce house safety, rental pricing, delivery information",
    openGraph: {
      title: "FAQ | SATX Bounce Common Questions About Our Party Rentals",
      description:
        "Find answers to common questions about bounce house rentals in San Antonio, TX. Learn about delivery times, safety measures, pricing, and more.",
      type: "website",
    },
    other: {
      "script:ld+json": JSON.stringify(faqStructuredData),
    },
  };
};

export default function FaqPage() {
  return <FaqContent />;
}
