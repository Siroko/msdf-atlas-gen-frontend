import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: 'MSDF ARFont Generator',
  description: 'A tool to generate MSDF Artery fonts from TTF/OTF files, optimized for WebGPU rendering in the Kansei engine.',
  keywords: 'MSDF, font generator, WebGPU, Kansei, Artery, typography, font tools',
  openGraph: {
    title: 'MSDF ARFont Generator',
    description: 'Generate optimized MSDF fonts for GPU rendering',
    type: 'website',
    images: [
      {
        url: '/kansei-social-thumb.png',
        width: 1200,
        height: 630,
        alt: 'MSDF ARFont Generator'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MSDF ARFont Generator',
    description: 'Generate optimized MSDF fonts for GPU rendering',
    images: ['/kansei-social-thumb.png'],
  },
  icons: {
    icon: '/kansei-social-thumb.png',
    apple: '/kansei-social-thumb.png',
  }
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
      >
        {children}
      </body>
    </html>
  );
}
