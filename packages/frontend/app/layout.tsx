import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
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
  metadataBase: new URL("https://ceyhunlarplastik.com.tr"),

  title: {
    default: "Ceyhunlar Plastik",
    template: "%s | Ceyhunlar Plastik",
  },

  description:
    "Ceyhunlar Plastik – plastik, bakalit ve metal parçalar için yüksek hassasiyetli üretim çözümleri.",

  openGraph: {
    siteName: "Ceyhunlar Plastik",
    locale: "tr_TR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
