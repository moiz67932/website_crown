import type { Metadata } from "next";
import "@/styles/globals.css";
import Layout from "@/components/layout";
import Providers from "@/components/providers";

// Avoid using next/font/google to prevent Turbopack internal font loader errors in dev.
// Provide sensible CSS variable fallbacks to common system/local fonts instead.
const FONT_VARS = {
  // Geist / Inter-like sans stack
  ['--font-geist-sans' as any]: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  // Mono stack
  ['--font-geist-mono' as any]: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace",
  // Inter alias
  ['--font-inter' as any]: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto",
  // Playfair-like serif fallback
  ['--font-playfair' as any]: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
}

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
        className={`antialiased`}
        style={FONT_VARS}
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
