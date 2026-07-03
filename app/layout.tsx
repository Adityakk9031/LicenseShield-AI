import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LicenseShield AI',
  description: 'AI-powered license & vulnerability audit agent via CROO',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <h1>LicenseShield AI</h1>
            <p style={{ color: 'var(--text-muted)' }}>Powered by CROO Agent Protocol</p>
          </header>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
