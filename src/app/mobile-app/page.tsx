import type { Metadata } from "next";
import AppHero from "./components/AppHero";
import InstallationGuide from "./components/InstallationGuide";
import DeviceDetector from "./components/DeviceDetector";
import SupportSection from "./components/SupportSection";
import AccessGate from "./components/AccessGate";

export const metadata: Metadata = {
  title: "PartyPad Mobile App - Contractor Access | SATX Bounce",
  description:
    "Private access to the PartyPad mobile app for SATX Bounce contractors. Discover, claim, and manage party setup tasks.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  },
  openGraph: {
    title: "PartyPad Mobile App - Contractor Access",
    description: "Private contractor access to the PartyPad mobile application",
    url: "https://www.satxbounce.com/mobile-app",
    siteName: "SATX Bounce",
    type: "website",
  },
};

export default function MobileAppPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AccessGate>
        <AppHero />
        <InstallationGuide />
        <DeviceDetector />
        <SupportSection />
      </AccessGate>
    </div>
  );
}
