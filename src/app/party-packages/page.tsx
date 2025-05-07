import { Metadata } from "next";
import { PartyPackagesContent } from "./party-packages-content";

export const metadata: Metadata = {
  title: "Party Packages | SATX Bounce",
  description:
    "Browse our pre-configured party packages with multiple bounce houses, water slides, and party equipment. Save with our bundle deals!",
  alternates: {
    canonical: "/party-packages",
  },
  keywords:
    "party packages, bounce house packages, water slide packages, party bundle, San Antonio party rentals, event packages",
  openGraph: {
    title: "Party Packages | SATX Bounce",
    description:
      "Browse our pre-configured party packages with multiple bounce houses, water slides, and party equipment. Save with our bundle deals!",
    type: "website",
    url: "https://satxbounce.com/party-packages",
    images: ["/og-image.jpg"],
  },
};

export default function PartyPackagesPage() {
  return <PartyPackagesContent />;
}
