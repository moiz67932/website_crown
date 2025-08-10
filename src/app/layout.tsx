import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import Layout from "@/components/layout";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crown Coastal Homes - Premium California Real Estate",
  description:
    "Discover luxury coastal properties and homes throughout California. Buy, rent, and invest in premium real estate with Crown Coastal Homes.",
  icons: {
    icon: [
      { url: "/logo.svg", sizes: "16x16" },
      { url: "/logo.svg", sizes: "32x32" },
    ],
    apple: { url: "/logo.svg", sizes: "180x180" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <Layout>
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  );
}
