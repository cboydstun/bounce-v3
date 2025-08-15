"use client";

import { useState, useEffect } from "react";

interface DeviceInfo {
  type: "ios" | "android" | "desktop";
  browser: string;
  os: string;
}

function QRCodeSection() {
  return (
    <div className="text-center mt-12">
      <h3 className="text-xl font-semibold mb-4">Quick Mobile Access</h3>
      <div className="inline-block p-4 bg-white rounded-lg shadow-md">
        {/* Simple QR code placeholder - in production, you'd use a QR code library */}
        <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01"
              />
            </svg>
            <p className="text-sm text-gray-500">QR Code</p>
            <p className="text-xs text-gray-400">app.satxbounce.com</p>
          </div>
        </div>
      </div>
      <p className="text-gray-600 mt-4">
        Scan with your phone camera to access the app
      </p>
    </div>
  );
}

function IOSInstallGuide() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-3">📱</span>
        Installation Guide for Your iPhone/iPad
      </h3>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            🎯 Optimized for Safari
          </h4>
          <p className="text-blue-800 text-sm">
            We've detected you're using an iOS device. Follow these steps for
            the best installation experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-4">
              Step-by-Step Instructions
            </h4>
            <ol className="space-y-3">
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-medium">Open Safari</p>
                  <p className="text-sm text-gray-600">
                    Make sure you're using Safari browser (not Chrome or other
                    browsers)
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-medium">Navigate to the app</p>
                  <p className="text-sm text-gray-600">
                    Go to: <strong>app.satxbounce.com</strong>
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-medium">Tap the Share button</p>
                  <p className="text-sm text-gray-600">
                    Look for the square with arrow up icon at the bottom
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-medium">Add to Home Screen</p>
                  <p className="text-sm text-gray-600">
                    Scroll down and tap "Add to Home Screen"
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  5
                </span>
                <div>
                  <p className="font-medium">Confirm installation</p>
                  <p className="text-sm text-gray-600">
                    Tap "Add" to install PartyPad to your home screen
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">What You'll Get</h4>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span>App icon on your home screen</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span>Full-screen app experience</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span>Push notifications</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span>Offline functionality</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span>Automatic updates</span>
              </li>
            </ul>

            <div className="mt-6">
              <a
                href="https://app.satxbounce.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                🚀 Open PartyPad App
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AndroidInstallGuide() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-3">🤖</span>
        Installation Guide for Your Android Device
      </h3>

      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">
            🎯 Optimized for Chrome
          </h4>
          <p className="text-green-800 text-sm">
            We've detected you're using an Android device. Chrome provides the
            best installation experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-4">
              Step-by-Step Instructions
            </h4>
            <ol className="space-y-3">
              <li className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-medium">Open Chrome</p>
                  <p className="text-sm text-gray-600">
                    Use Chrome browser for the best experience
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-medium">Navigate to the app</p>
                  <p className="text-sm text-gray-600">
                    Go to: <strong>app.satxbounce.com</strong>
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-medium">Look for install prompt</p>
                  <p className="text-sm text-gray-600">
                    Chrome may show an "Install" banner automatically
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-medium">Or use menu option</p>
                  <p className="text-sm text-gray-600">
                    Tap menu (⋮) → "Add to Home screen" or "Install app"
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  5
                </span>
                <div>
                  <p className="font-medium">Confirm installation</p>
                  <p className="text-sm text-gray-600">
                    Tap "Add" or "Install" to add PartyPad to your device
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">What You'll Get</h4>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span>App icon in your app drawer</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span>Native app experience</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span>Push notifications</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span>Background sync</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span>Offline functionality</span>
              </li>
            </ul>

            <div className="mt-6">
              <a
                href="https://app.satxbounce.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200"
              >
                🚀 Open PartyPad App
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopInstallGuide() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-3">💻</span>
        Desktop Installation Guide
      </h3>

      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2">
            🖥️ Desktop Access Available
          </h4>
          <p className="text-purple-800 text-sm">
            While PartyPad is optimized for mobile, you can also access it from
            your desktop for management tasks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-4">Browser Installation</h4>
            <ol className="space-y-3">
              <li className="flex items-start">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-medium">Open Chrome or Edge</p>
                  <p className="text-sm text-gray-600">
                    Use a modern browser that supports PWAs
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-medium">Navigate to the app</p>
                  <p className="text-sm text-gray-600">
                    Go to: <strong>app.satxbounce.com</strong>
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-medium">Look for install icon</p>
                  <p className="text-sm text-gray-600">
                    Check the address bar for an install icon (⊕)
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-medium">Install the app</p>
                  <p className="text-sm text-gray-600">
                    Click the install icon or use browser menu
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Desktop Features</h4>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-purple-500 mr-3">✓</span>
                <span>Task management dashboard</span>
              </li>
              <li className="flex items-center">
                <span className="text-purple-500 mr-3">✓</span>
                <span>Contractor profile management</span>
              </li>
              <li className="flex items-center">
                <span className="text-purple-500 mr-3">✓</span>
                <span>QuickBooks integration</span>
              </li>
              <li className="flex items-center">
                <span className="text-purple-500 mr-3">✓</span>
                <span>Notification center</span>
              </li>
              <li className="flex items-center">
                <span className="text-purple-500 mr-3">✓</span>
                <span>Reporting and analytics</span>
              </li>
            </ul>

            <div className="mt-6 space-y-3">
              <a
                href="https://app.satxbounce.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-purple-600 text-white text-center py-3 px-4 rounded-lg hover:bg-purple-700 transition duration-200"
              >
                🚀 Open PartyPad App
              </a>
              <p className="text-sm text-gray-600 text-center">
                💡 For the best experience, use PartyPad on your mobile device
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeviceDetector() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      let type: DeviceInfo["type"] = "desktop";
      let browser = "unknown";
      let os = "unknown";

      // Detect OS and device type
      if (/iphone|ipad|ipod/.test(userAgent)) {
        type = "ios";
        os = "iOS";
      } else if (/android/.test(userAgent)) {
        type = "android";
        os = "Android";
      } else {
        type = "desktop";
        if (/windows/.test(userAgent)) os = "Windows";
        else if (/macintosh|mac os x/.test(userAgent)) os = "macOS";
        else if (/linux/.test(userAgent)) os = "Linux";
      }

      // Detect browser
      if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) {
        browser = "Chrome";
      } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
        browser = "Safari";
      } else if (/firefox/.test(userAgent)) {
        browser = "Firefox";
      } else if (/edge/.test(userAgent)) {
        browser = "Edge";
      }

      setDeviceInfo({ type, browser, os });
    };

    detectDevice();
  }, []);

  if (!deviceInfo) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">
          Installation Guide for Your Device
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          We've detected you're using <strong>{deviceInfo.os}</strong> with{" "}
          <strong>{deviceInfo.browser}</strong>. Here's the optimized
          installation guide for your device.
        </p>

        {deviceInfo.type === "ios" && <IOSInstallGuide />}
        {deviceInfo.type === "android" && <AndroidInstallGuide />}
        {deviceInfo.type === "desktop" && <DesktopInstallGuide />}

        <QRCodeSection />
      </div>
    </section>
  );
}
