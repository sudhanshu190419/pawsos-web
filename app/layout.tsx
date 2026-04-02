import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav"; // 🔥 Add this

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnimalSathi | Community-Powered Animal Rescue",
  description:
    "AnimalSathi (PawSOS) helps report animal emergencies and connect volunteers, NGOs, and rescuers.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1", // Prevent auto-zoom on mobile inputs
  icons: {
    icon: "/logo.png", // Sets your logo as the browser tab icon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        {/* Added min-h-screen to ensure footer stays at bottom on short pages */}
        <main className="relative z-10 min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <Footer />

        {/* 🔥 Mobile Bottom Navigation */}
        {/* This will only show on mobile devices (md:hidden is inside the component) */}
        <BottomNav />
      </body>
    </html>
  );
}