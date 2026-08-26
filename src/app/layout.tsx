import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { StoreChrome } from "@/components/layout/StoreChrome";
import { Analytics } from "@/components/Analytics";
import { baseMetadata, jsonLdScript, localBusinessJsonLd, webSiteJsonLd } from "@/lib/seo";

const serif = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = baseMetadata;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-KE"
      data-scroll-behavior="smooth"
      className={`${serif.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(localBusinessJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(webSiteJsonLd()) }}
        />
        <StoreChrome
          header={<Header />}
          footer={<Footer />}
          float={<WhatsAppFloat />}
          drawer={<CartDrawer />}
        >
          {children}
        </StoreChrome>
        <Analytics />
      </body>
    </html>
  );
}
