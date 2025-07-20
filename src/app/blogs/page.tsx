import { Metadata } from "next";
import { BlogsContent } from "./blogs-content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Blog Posts | SATX Bounce House Rentals",
    description:
      "Stay updated with the latest news, tips, and insights about party rentals, event planning, and bounce house safety in San Antonio.",
    alternates: {
      canonical: "/blogs", // Always canonical to base blogs page regardless of query params
    },
    keywords:
      "bounce house blog, party planning tips, event rental guides, San Antonio events, party safety tips, bounce house safety",
    openGraph: {
      title: "Blog Posts | SATX Bounce House Rentals",
      description:
        "Stay updated with the latest news, tips, and insights about party rentals, event planning, and bounce house safety in San Antonio.",
      type: "website",
      url: "https://www.satxbounce.com/blogs",
      images: ["/og-image.jpg"],
    },
  };
}

export default function BlogsPage() {
  return <BlogsContent />;
}
