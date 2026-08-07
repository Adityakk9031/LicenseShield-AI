import './globals.css';
import type { Metadata } from 'next';
import CursorFX from '@/components/CursorFX';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'LicenseShield AI — Autonomous License & CVE Security Audit Engine',
  description: 'Audit npm dependency trees for license compatibility and known vulnerabilities in real-time, powered by Gemini AI and settled on Base Sepolia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CursorFX />
        <Navbar />
        <main className="main-content-wrap">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
