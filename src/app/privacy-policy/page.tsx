import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | SATX Bounce",
  description: "Privacy Policy | SATX Bounce: How We Protect Your Information",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl bg-white">
      <h1 className="text-4xl font-bold mb-8 text-primary-purple">
        Privacy Policy
      </h1>

      <div className="prose prose-lg max-w-none">
        <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            1. Information We Collect
          </h2>
          <p>
            When you use our services, we may collect the following information:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Name and contact information</li>
            <li>Delivery address</li>
            <li>Payment information</li>
            <li>Rental preferences and history</li>
            <li>Communications with our team</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            2. How We Use Your Information
          </h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Process and fulfill your rental orders</li>
            <li>Communicate about your rental</li>
            <li>Improve our services</li>
            <li>Send promotional materials (with your consent)</li>
            <li>Ensure safety and security</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            3. Information Sharing
          </h2>
          <p>
            We do not sell your personal information to third parties. We may
            share your information with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Delivery partners to fulfill your rental</li>
            <li>Payment processors for secure transactions</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            4. Data Security
          </h2>
          <p>
            We implement appropriate security measures to protect your personal
            information from unauthorized access, alteration, or disclosure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            5. Your Rights
          </h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary-blue">
            6. Contact Us
          </h2>
          <p>
            If you have questions about this privacy policy, please contact us
            at:
          </p>
          <ul className="list-none pl-6 mb-4">
            <li>Email: satxbounce@gmail.com</li>
            <li>Phone: (512) 210-0194</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
