import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TapVern - IoT School Attendance System",
  description:
    "Sistem absensi sekolah terintegrasi IoT dan Real-time Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${fontSans.variable} font-sans antialiased bg-cream text-primary`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
