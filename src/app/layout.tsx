import type { Metadata } from "next";
import { Instrument_Sans, Geist_Mono } from "next/font/google";
import { StorageBanner } from "@/components/ui/StorageBanner";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kissboard",
  description: "Local-first kanban task management with KISS philosophy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <StorageBanner />
        {children}
      </body>
    </html>
  );
}
