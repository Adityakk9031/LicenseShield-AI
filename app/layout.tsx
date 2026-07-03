import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LicenseShield AI — Dependency Security Audit',
  description: 'AI-powered license and vulnerability auditing for your dependencies via the CROO Network.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
