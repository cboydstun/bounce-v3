import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | SATX Bounce Rental Policies & Conditions",
  description: "Terms of service for SATX Bounce house rentals in San Antonio",
  alternates: {
    canonical: "/tos",
  },
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl bg-white">
      <h1 className="text-4xl font-bold mb-8 text-primary-purple">
        Terms of Service
      </h1>

      <div className="prose prose-lg max-w-none">
        <p className="mb-6">Last updated: 7/3/2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            1. Rental Agreement
          </h2>
          <p>By renting equipment from SATX Bounce, you agree to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate rental information</li>
            <li>Use equipment responsibly and safely</li>
            <li>Follow all safety guidelines provided</li>
            <li>Return equipment in the same condition</li>
            <li>Pay for any damages caused during rental period</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            2. Safety Requirements
          </h2>
          <p>For the safety of all participants, you must:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide adult supervision at all times</li>
            <li>Follow weight and capacity limits</li>
            <li>Keep equipment away from water sources</li>
            <li>Not allow food or drinks inside equipment</li>
            <li>Stop use in adverse weather conditions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            3. Rental Period
          </h2>
          <p>Standard rental periods are:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>4-hour minimum rental period</li>
            <li>Setup time included in rental period</li>
            <li>Additional fees for late returns</li>
            <li>24-hour notice required for cancellations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            4. Payment and Fees
          </h2>
          <p>Our payment terms include:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>NO deposit required at booking</li>
            <li>NO refunds for cancellations</li>
            <li>Full payment due at delivery</li>
            <li>Additional charges for damages</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            5. Liability
          </h2>
          <p>SATX Bounce is not responsible for:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Injuries resulting from equipment misuse</li>
            <li>Damage to property during setup/use</li>
            <li>Lost or stolen personal items</li>
            <li>Weather-related incidents</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            6. Modifications
          </h2>
          <p>
            We reserve the right to modify these terms at any time. Continued
            use of our services constitutes acceptance of updated terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            7. Contact
          </h2>
          <p>For questions about these terms, please contact us at:</p>
          <ul className="list-none pl-6 mb-4">
            <li>Email: satxbounce@gmail.com</li>
            <li>Phone: (512) 210-0194</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
