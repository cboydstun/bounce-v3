'use client';

type Props = {
  organizationData: {
    name: string;
    url: string;
    logo: string;
    description: string;
    address: {
      streetAddress: string;
      addressLocality: string;
      addressRegion: string;
      postalCode: string;
      addressCountry: string;
    };
    contactPoint: {
      telephone: string;
      contactType: string;
    };
  };
};

export default function JsonLd({ organizationData }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': organizationData.url,
          name: organizationData.name,
          url: organizationData.url,
          logo: organizationData.logo,
          description: organizationData.description,
          address: {
            '@type': 'PostalAddress',
            ...organizationData.address,
          },
          contactPoint: {
            '@type': 'ContactPoint',
            ...organizationData.contactPoint,
          },
          sameAs: [
            'https://www.facebook.com/satxbounce',
            'https://www.instagram.com/satxbounce',
          ],
          openingHours: ['Mo-Su 08:00-20:00'],
          priceRange: '$$',
          paymentAccepted: ['Cash', 'Credit Card'],
          areaServed: {
            '@type': 'GeoCircle',
            geoMidpoint: {
              '@type': 'GeoCoordinates',
              latitude: 29.4241,
              longitude: -98.4936,
            },
            geoRadius: '50 mi',
          },
        }),
      }}
    />
  );
}
