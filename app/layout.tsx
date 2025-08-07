import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  authors: [{ name: "Bus Route Finder", url: "https://dhakabusroute.vercel.app" }],
  openGraph: {
    title: "Dhaka Bus Route Finder | Bangladesh Bus Routes & Schedules",
    description: "Find the perfect bus route in Dhaka, Bangladesh. Search bus routes by from and to locations.",
    url: "https://dhakabusroute.vercel.app/dhaka",
    siteName: "Dhaka Bus Route Finder",
    images: [
      {
        url: "https://dhakabusroute.vercel.app/og-image.png",
        width: 1200,
        height: 630,
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhaka Bus Route Finder",
    description: "Find bus routes in Dhaka city with real-time information and schedules",
    images: ["https://dhakabusroute.vercel.app/twitter-image.png"],
  },
  metadataBase: new URL("https://dhakabusroute.vercel.app"),
  alternates: {
    canonical: "/dhaka",
  },
  themeColor: "#1e40af",
  category: "transportation",
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
       
      </body>
    </html>
  );
}
