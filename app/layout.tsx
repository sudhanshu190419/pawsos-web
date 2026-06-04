import type { Metadata, Viewport } from "next";
import { Geist_Mono, Manrope, Newsreader } from "next/font/google";
import "./globals.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { GlobalToastHost } from "./components/ui/GlobalToastHost";
import BottomNav from "./components/BottomNav";
import { LocationProvider } from "./lib/LocationContext";
import { AuthProvider } from "./lib/AuthContext";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: "italic",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AnimalSathi | Community-Powered Animal Rescue",
    template: "%s | AnimalSathi"
  },
  description: "AnimalSathi (PawSOS) connects citizens, volunteers, and NGOs for urgent animal rescue, coordinated triage, and pet care across India.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AnimalSathi",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "AnimalSathi",
    title: "AnimalSathi | Community-Powered Animal Rescue",
    description: "Connecting citizens, volunteers, and NGOs for urgent animal rescue in India.",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "AnimalSathi - Saving lives together",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimalSathi | Community-Powered Animal Rescue",
    description: "Connecting citizens, volunteers, and NGOs for urgent animal rescue in India.",
    images: ["/banner.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#9c3e23",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${manrope.variable} ${newsreader.variable} ${geistMono.variable} font-sans antialiased bg-surface text-on-surface`}
      >
        {/* Skip to content â€” accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[99999] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:font-bold focus:text-sm focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Material Symbols - icon font used across the app */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />

        <AuthProvider>
          <LocationProvider>
            <GlobalToastHost />

            {/* Navbar */}
            <Navbar />

            {/* Page Content */}
            <main id="main-content" className="relative z-10 min-h-[100dvh]">
              {children}
            </main>

            {/* Footer */}
            <Footer />

            {/* ðŸ”¥ Mobile Bottom Navigation */}
            {/* This will only show on mobile devices (md:hidden is inside the component) */}
            <BottomNav />
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
