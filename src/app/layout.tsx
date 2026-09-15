import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TapVern - Sistem Absensi Digital & Manajemen Sekolah Real-Time",
    template: "%s | TapVern",
  },
  description: "Platform e-absensi siswa berbasis IoT dan web terpadu. Pantau kehadiran real-time, manajemen data siswa, dan portal orang tua dengan mudah dan akurat.",
  keywords: [
    "absensi sekolah",
    "e-absensi",
    "absensi rfid",
    "sistem absensi digital",
    "tapvern",
    "portal orang tua",
    "manajemen siswa smk",
  ],
  authors: [{ name: "TapVern Team" }],
  creator: "TapVern",
  publisher: "TapVern",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://tapvern.vercel.app",
    title: "TapVern - Sistem Absensi Digital & Manajemen Sekolah Real-Time",
    description: "Platform e-absensi siswa berbasis IoT dan web terpadu untuk sekolah modern.",
    siteName: "TapVern",
  },
  twitter: {
    card: "summary_large_image",
    title: "TapVern - Sistem Absensi Digital",
    description: "Platform e-absensi siswa berbasis IoT dan web terpadu.",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}