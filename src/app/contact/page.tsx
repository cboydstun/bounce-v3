import type { Metadata } from "next";
import ContactForm from "../../components/ContactForm";
import Script from "next/script";

// Contact page structured data
const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact SATX Bounce House Rentals",
  description:
    "Contact us for bounce house rentals in San Antonio. Free delivery within Loop 1604!",
  mainEntity: {
    "@type": "LocalBusiness",
    name: "SATX Bounce House Rentals",
    telephone: "512-210-0194",
    openingHours: "Mo-Su 08:00-20:00",
    areaServed: {
      "@type": "City",
      name: "San Antonio",
      sameAs: "https://en.wikipedia.org/wiki/San_Antonio",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Antonio",
      addressRegion: "TX",
      addressCountry: "US",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contact Us | SATX Bounce House Rentals San Antonio",
    description:
      "Contact SATX Bounce House Rentals for party equipment rentals in San Antonio. Free delivery within Loop 1604! Call us at 512-210-0194 or fill out our contact form.",
    keywords:
      "contact SATX Bounce House, bounce house rental contact, San Antonio party rentals, rental inquiry, free delivery, party equipment contact",
    openGraph: {
      title:
        "Contact SATX Bounce House Rentals | San Antonio Party Equipment Rental",
      description:
        "Contact us for bounce house rentals in San Antonio. Free delivery within Loop 1604! Available 7 days a week from 8am to 8pm.",
      type: "website",
    },
    other: {
      "geo.region": "US-TX",
      "geo.placename": "San Antonio",
      "geo.position": "29.4241;-98.4936",
      ICBM: "29.4241, -98.4936",
    },
  };
}

export default function ContactPage() {
  return (
    <>
      <Script id="contact-schema" type="application/ld+json">
        {JSON.stringify(contactPageSchema)}
      </Script>

      <div className="w-full bg-secondary-blue/5 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-6 text-white">
                Get in{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                  Touch
                </span>
              </h1>
              <p className="text-xl text-white max-w-2xl mx-auto">
                Ready to make your event unforgettable? Let&apos;s start
                planning your perfect party!
              </p>
              <p className="text-lg text-gray-600">
                Don&apos;t hesitate to reach out to us! We&apos;re here to help
                make your event unforgettable.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
              <div className="grid md:grid-cols-2 gap-12 mb-8">
                <div className="space-y-6">
                  <div className="bg-secondary-blue/5 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-primary-purple mb-2">
                      📍 Location
                    </h3>
                    <p className="text-gray-600">San Antonio, TX</p>
                  </div>

                  <div className="bg-secondary-blue/5 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-primary-purple mb-2">
                      📞 Phone
                    </h3>
                    <p className="text-gray-600">
                      <a
                        href="tel:512-210-0194"
                        className="hover:text-primary-blue transition-colors"
                      >
                        512-210-0194
                      </a>
                    </p>
                  </div>

                  <div className="bg-secondary-blue/5 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-primary-purple mb-2">
                      ⏰ Hours
                    </h3>
                    <p className="text-gray-600">Monday - Sunday: 8am - 8pm</p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-400 to-purple-600 text-white p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-2">🎉 Free Delivery</h3>
                    <p>Within Loop 1604 for all rentals!</p>
                  </div>

                  <div className="rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      title="San Antonio Service Area Map"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d222334.34533324622!2d-98.57211767968823!3d29.45876528364436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x865c58af04d00eaf%3A0x856e13b10a016bc!2sSan%20Antonio%2C%20TX!5e0!3m2!1sen!2sus!4v1733607158689!5m2!1sen!2sus"
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>

                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
