import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";
import { NomiRuntimeInit } from "@/components/auth/NomiRuntimeInit";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Nomi — Create. Post. Remix.",
    template: "%s · Nomi",
  },
  description:
    "AI-native social for creators. Short-form generations, remix culture, prompt craft, and creative identity.",
};

export const viewport: Viewport = {
  themeColor: "#050508",
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
    <html lang="en" className={`dark ${dmSans.variable} ${syne.variable}`}>
      <body className="min-h-dvh antialiased font-sans">
        <NomiRuntimeInit>{children}</NomiRuntimeInit>
      </body>
    </html>
  );
}
