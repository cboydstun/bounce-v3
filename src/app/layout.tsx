import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import JsonLd from "../components/JsonLd";
import GoogleAnalytics from "../components/GoogleAnalytics";
import { GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#800080' },
    { media: '(prefers-color-scheme: dark)', color: '#663399' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://satxbounce.com'),
  title: "SATX Bounce | San Antonio Bounce House Rentals",
  description: "Making your events memorable with safe and clean bounce house rentals in San Antonio. Professional, insured party equipment rentals for birthdays, corporate events, and special occasions.",
  keywords: ["bounce house rentals", "San Antonio party rentals", "inflatable rentals", "party equipment", "SATX events", "kids party rentals", "bounce house San Antonio"],
  authors: [{ name: 'SATX Bounce' }],
  creator: 'SATX Bounce',
  publisher: 'SATX Bounce',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'SATX Bounce | San Antonio Bounce House Rentals',
    description: 'Making your events memorable with safe and clean bounce house rentals in San Antonio. Professional, insured party equipment rentals.',
    url: 'https://satxbounce.com',
    siteName: 'SATX Bounce',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://satxbounce.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SATX Bounce House Rentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SATX Bounce | San Antonio Bounce House Rentals',
    description: 'Professional bounce house and party equipment rentals in San Antonio.',
    images: ['https://satxbounce.com/twitter-image.jpg'],
    creator: '@satxbounce',
    site: '@satxbounce',
  },
  verification: {
    google: 'your-google-verification-code' // You'll need to add your actual Google verification code
  },
  appleWebApp: {
    title: 'SATX Bounce',
    statusBarStyle: 'black-translucent',
    startupImage: [
      {
        url: '/apple-touch-icon.png',
        media: '(device-width: 768px) and (device-height: 1024px)',
      },
    ],
  },
  applicationName: 'SATX Bounce',
  category: 'business',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'mask-icon',
      url: '/favicon.ico',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <GoogleAnalytics />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-[#663399]`}
      >
        <JsonLd
          organizationData={{
            name: "SATX Bounce",
            url: "https://satxbounce.com",
            logo: "https://satxbounce.com/logo.png",
            description: "Professional bounce house and party equipment rentals in San Antonio, TX. Making your events memorable with safe and clean bounce house rentals.",
            address: {
              streetAddress: "123 Main St",
              addressLocality: "San Antonio",
              addressRegion: "TX",
              postalCode: "78201",
              addressCountry: "US"
            },
            contactPoint: {
              telephone: "+1-210-555-0123",
              contactType: "customer service"
            }
          }}
        />
        <Navigation />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
      <GoogleTagManager gtmId={process.env.NEXT_GTM_ID!} />
    </html>
  );
}
