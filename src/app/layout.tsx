import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "Fashion and Collection House — Premium Pakistani Clothing",
    template: "%s | Fashion and Collection House",
  },
  description:
    "FCH — premium Pakistani clothing delivered nationwide. Kurtas, lawn suits, formals and luxury pret with nationwide delivery, easy exchange and secure bank transfer.",
  keywords: [
    "Pakistani clothing",
    "luxury pret",
    "lawn suits",
    "men kurta",
    "FCH",
    "Fashion and Collection House",
  ],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Fashion and Collection House",
    description: "Premium Pakistani clothing delivered nationwide.",
    type: "website",
    siteName: "Fashion and Collection House",
  },
};

export const viewport: Viewport = {
  themeColor: "#F8F6F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
