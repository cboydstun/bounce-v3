import { Metadata } from 'next';
import Script from 'next/script';

// Create blog listing structured data
const createBlogListingSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "SATX Bounce House Rentals Blog",
    description:
      "Latest news, tips, and insights about bounce house rentals and party planning in San Antonio",
  };
};

export const metadata: Metadata = {
  title: 'Blog | Party Planning Tips & News | SATX Bounce House Rentals',
  description: 'Read our latest blog posts about party planning tips, bounce house safety, event ideas, and more. Stay updated with SATX Bounce House Rentals in San Antonio.',
  keywords: 'party planning blog, bounce house tips, event ideas, San Antonio parties, party safety tips, event planning guide',
  openGraph: {
    title: 'Blog | Party Planning Tips & News | SATX Bounce House Rentals',
    description: 'Read our latest blog posts about party planning tips, bounce house safety, event ideas, and more. Stay updated with SATX Bounce House Rentals in San Antonio.',
    type: 'website',
  },
  other: {
    'geo.region': 'US-TX',
    'geo.placename': 'San Antonio',
    'geo.position': '29.4241;-98.4936',
    'ICBM': '29.4241, -98.4936',
  },
};

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script id="blog-schema" type="application/ld+json">
        {JSON.stringify(createBlogListingSchema())}
      </Script>
      {children}
    </>
  );
}
