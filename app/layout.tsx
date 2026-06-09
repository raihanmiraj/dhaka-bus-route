import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dhakabusroute.vercel.app"),
  applicationName: "Dhaka Bus Route Finder",
  title: "Dhaka Bus Route Finder | Bangladesh Bus Routes & Schedules",
  description: "Find the perfect bus route in Dhaka, Bangladesh. Search bus routes by from and to locations. Get bus schedules, stops, and service information for all Dhaka city buses.",
  keywords: [
    "dhaka bus route",
    "bangladesh bus routes",
    "bus route finder",
    "dhaka bus schedule",
    "bus routes in dhaka",
    "bus service dhaka",
    "public transport dhaka",
    "dhaka city bus",
    "bus finder bangladesh",
    "transportation dhaka"
  ],
  authors: [{ name: "Dhaka Bus Route Finder", url: "https://dhakabusroute.vercel.app" }],
  creator: "Dhaka Bus Route Finder",
  publisher: "Dhaka Bus Route Finder",
  verification: {
    google: "PHLU7GM99zhqx63oN5oeEJPoexoPvkDdGMbpL3un1V4",
  },
  icons: {
    icon: [
      { url: "/images/favicon-transparent-blue-header.ico" },
      { url: "/images/dhaka-bus-route-icon-transparent-blue-header-32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/dhaka-bus-route-icon-transparent-blue-header-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/images/favicon-transparent-blue-header.ico",
    apple: "/images/dhaka-bus-route-icon-transparent-blue-header-180.png",
  },
  openGraph: {
    title: "Dhaka Bus Route Finder | Bangladesh Bus Routes & Schedules",
    description: "Find the perfect bus route in Dhaka, Bangladesh. Search bus routes by from and to locations.",
    url: "/",
    siteName: "Dhaka Bus Route Finder",
    images: [
      {
        url: "/images/featured-image.png",
        width: 1672,
        height: 941,
        alt: "Dhaka Bus Route Finder featured image",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhaka Bus Route Finder",
    description: "Find bus routes in Dhaka city with real-time information and schedules",
    images: ["/images/featured-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  category: "transportation",
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <GoogleAnalytics gaId="G-JJNBD39SEE" />
      </body>
    </html>
  );
}
