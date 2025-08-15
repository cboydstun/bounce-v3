"use client";

import { useState } from "react";

interface InstallCardProps {
  type: "web" | "native";
  title: string;
  subtitle: string;
  benefits: string[];
  ctaText: string;
  ctaAction: () => void;
  isRecommended?: boolean;
}

function InstallCard({
  type,
  title,
  subtitle,
  benefits,
  ctaText,
  ctaAction,
  isRecommended,
}: InstallCardProps) {
  return (
    <div
      className={`relative bg-white rounded-lg shadow-lg p-6 border-2 ${isRecommended ? "border-blue-500" : "border-gray-200"}`}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Recommended
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start">
            <span className="text-green-500 mr-2 mt-0.5">✓</span>
            <span className="text-gray-700">{benefit}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={ctaAction}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-200 ${
          isRecommended
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-600 text-white hover:bg-gray-700"
        }`}
      >
        {ctaText}
      </button>
    </div>
  );
}

export default function InstallationGuide() {
  const [showWebInstructions, setShowWebInstructions] = useState(false);
  const [showNativeInstructions, setShowNativeInstructions] = useState(false);

  const handleInstallPWA = () => {
    setShowWebInstructions(true);
  };

  const handleRequestInvite = () => {
    setShowNativeInstructions(true);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">
          Choose Your Installation Method
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Get the PartyPad app on your device. Choose the web app for instant
          access or the native app for the best mobile experience.
        </p>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
          <InstallCard
            type="web"
            title="🌐 Web App"
            subtitle="Works on all devices - No app store needed"
            benefits={[
              "Instant access from any browser",
              "Automatic updates",
              "Works on iPhone, Android, Desktop",
              "No app store approval delays",
              "Install directly from browser",
            ]}
            ctaText="Get Installation Instructions"
            ctaAction={handleInstallPWA}
            isRecommended={true}
          />

          <InstallCard
            type="native"
            title="📱 Native Mobile App"
            subtitle="Premium app experience via Firebase"
            benefits={[
              "Native app performance",
              "App store quality experience",
              "Enhanced push notifications",
              "Professional distribution",
              "Automatic updates via Firebase",
            ]}
            ctaText="Request App Invitation"
            ctaAction={handleRequestInvite}
          />
        </div>

        {/* Web App Instructions */}
        {showWebInstructions && (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Web App Installation
              </h3>
              <button
                onClick={() => setShowWebInstructions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">📱</span>
                  iPhone/iPad (Safari)
                </h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex">
                    <span className="font-medium mr-2">1.</span>
                    <span>
                      Open Safari and go to: <strong>app.satxbounce.com</strong>
                    </span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">2.</span>
                    <span>Tap the Share button (square with arrow up)</span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">3.</span>
                    <span>Scroll down and tap "Add to Home Screen"</span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">4.</span>
                    <span>Tap "Add" to install the app</span>
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">🤖</span>
                  Android (Chrome)
                </h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex">
                    <span className="font-medium mr-2">1.</span>
                    <span>
                      Open Chrome and go to: <strong>app.satxbounce.com</strong>
                    </span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">2.</span>
                    <span>Tap the menu (three dots) in the top right</span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">3.</span>
                    <span>Tap "Add to Home screen" or "Install app"</span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">4.</span>
                    <span>Tap "Add" or "Install" to confirm</span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Quick Access Link
              </h4>
              <div className="flex items-center space-x-4">
                <code className="bg-white px-3 py-2 rounded border text-sm flex-1">
                  https://app.satxbounce.com
                </code>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText("https://app.satxbounce.com")
                  }
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Native App Instructions */}
        {showNativeInstructions && (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Native App Access
              </h3>
              <button
                onClick={() => setShowNativeInstructions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  📧 Email Required
                </h4>
                <p className="text-yellow-700 text-sm">
                  To receive the native app invitation, please email us your
                  request with your contractor information.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">
                    Step 1: Request Invitation
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Send an email to get added to our Firebase App Distribution
                    list:
                  </p>
                  <a
                    href="mailto:support@satxbounce.com?subject=PartyPad App Access Request&body=Hi, I'm a SATX Bounce contractor and would like access to the PartyPad mobile app. My contractor ID is: [YOUR ID]"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    📧 Request App Access
                  </a>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">
                    Step 2: Install Firebase App Tester
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Download the Firebase App Tester from your device's app
                    store:
                  </p>
                  <div className="space-y-2">
                    <a
                      href="https://apps.apple.com/app/firebase-app-tester/id1441806372"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-black text-white px-4 py-2 rounded text-center hover:bg-gray-800"
                    >
                      📱 Download for iOS
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.google.firebase.appdistribution"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-green-600 text-white px-4 py-2 rounded text-center hover:bg-green-700"
                    >
                      🤖 Download for Android
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">
                  Step 3: Accept Invitation & Install
                </h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex">
                    <span className="font-medium mr-2">1.</span>
                    <span>
                      Check your email for the Firebase App Distribution
                      invitation
                    </span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">2.</span>
                    <span>Tap "Accept invitation" in the email</span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">3.</span>
                    <span>Open Firebase App Tester app</span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">4.</span>
                    <span>Find "PartyPad (Alpha)" and tap "Download"</span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">5.</span>
                    <span>Install and enjoy the app!</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
