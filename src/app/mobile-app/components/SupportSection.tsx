"use client";

interface SupportCardProps {
  icon: string;
  title: string;
  content: string;
  action: string;
  description?: string;
}

function SupportCard({
  icon,
  title,
  content,
  action,
  description,
}: SupportCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition duration-200">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{content}</p>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      <a
        href={action}
        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
      >
        Contact Now
      </a>
    </div>
  );
}

export default function SupportSection() {
  return (
    <section className="py-16 bg-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our support team is here to help you get started with PartyPad.
            Choose your preferred way to get assistance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          <SupportCard
            icon="📧"
            title="Email Support"
            content="support@satxbounce.com"
            action="mailto:support@satxbounce.com?subject=PartyPad Mobile App Support"
            description="Get detailed help via email"
          />
          <SupportCard
            icon="📞"
            title="Phone Support"
            content="(210) 555-1234"
            action="tel:+12105551234"
            description="Speak directly with our team"
          />
          <SupportCard
            icon="💬"
            title="Text Support"
            content="Text us anytime"
            action="sms:+12105551234?body=Hi, I need help with the PartyPad mobile app"
            description="Quick questions via text message"
          />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              App Information
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Current Version
                </h4>
                <p className="text-gray-600">1.0.0-alpha.2</p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-9 0h10v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Last Updated
                </h4>
                <p className="text-gray-600">January 13, 2025</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Platforms</h4>
                <p className="text-gray-600">iOS, Android, Web</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  System Requirements
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>
                      <strong>iOS:</strong> iOS 12.0 or later
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>
                      <strong>Android:</strong> Android 8.0 (API level 26) or
                      later
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>
                      <strong>Web:</strong> Modern browser with PWA support
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>
                      <strong>Storage:</strong> ~15MB download, 50MB installed
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>
                      <strong>Network:</strong> Internet connection required
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Features
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">🎯</span>
                    <span>Location-based task discovery</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">⚡</span>
                    <span>Real-time notifications</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">📸</span>
                    <span>Photo upload and reporting</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">💰</span>
                    <span>QuickBooks integration</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">🔒</span>
                    <span>Secure contractor authentication</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>

            <div className="space-y-4 text-left">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Q: Do I need to pay for the app?
                </h4>
                <p className="text-gray-600 text-sm">
                  A: No, PartyPad is completely free for all SATX Bounce
                  contractors.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Q: Can I use the app offline?
                </h4>
                <p className="text-gray-600 text-sm">
                  A: Yes, the app works offline and syncs your data when you're
                  back online.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Q: How do I get updates?
                </h4>
                <p className="text-gray-600 text-sm">
                  A: Updates are automatic for web app users. Native app users
                  get updates through Firebase App Distribution.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Q: Is my data secure?
                </h4>
                <p className="text-gray-600 text-sm">
                  A: Yes, all data is encrypted and securely stored. We follow
                  industry-standard security practices.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                More questions? Contact our support team using any of the
                methods above.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join other SATX Bounce contractors who are already using PartyPad
              to streamline their work and increase their earnings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://app.satxbounce.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200"
              >
                🚀 Launch PartyPad App
              </a>
              <a
                href="mailto:support@satxbounce.com?subject=PartyPad App Support"
                className="bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 transition duration-200"
              >
                📧 Get Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
