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
    <html lang="en" className="dark">
      <head>
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          .glass-panel {
              background: rgba(23, 31, 51, 0.7);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              position: relative;
              overflow: hidden;
          }
          .glass-panel::before {
              content: "";
              position: absolute;
              inset: 0;
              background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 50%);
              pointer-events: none;
          }
          .glow-red { box-shadow: 0 0 40px -10px rgba(255, 84, 81, 0.3); }
          .glow-violet { box-shadow: 0 0 30px -5px rgba(208, 188, 255, 0.2); }
          .status-chip {
              font-family: 'JetBrains Mono', monospace;
              text-transform: uppercase;
              letter-spacing: 0.05em;
          }
          body {
              background-color: #0b1326;
              color: #dae2fd;
          }
          .material-symbols-outlined {
              font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            darkMode: "class",
            theme: {
              extend: {
                colors: {
                  "surface-container": "#171f33",
                  "on-primary-container": "#340080",
                  "on-surface-variant": "#cbc3d7",
                  "surface-container-high": "#222a3d",
                  "on-secondary": "#003824",
                  "surface": "#0b1326",
                  "on-error": "#690005",
                  "secondary": "#4edea3",
                  "background": "#0b1326",
                  "primary-fixed-dim": "#d0bcff",
                  "on-primary-fixed": "#23005c",
                  "tertiary": "#ffb3ad",
                  "error": "#ffb4ab",
                  "primary": "#d0bcff",
                  "surface-container-highest": "#2d3449",
                  "on-background": "#dae2fd",
                  "surface-tint": "#d0bcff",
                  "inverse-primary": "#6d3bd7",
                  "surface-variant": "#2d3449",
                  "error-container": "#93000a",
                  "tertiary-container": "#ff5451"
                },
                fontFamily: {
                  "body-lg": ["Inter"],
                  "headline-lg": ["Inter"],
                  "label-mono": ["JetBrains Mono"],
                  "body-md": ["Inter"],
                  "headline-md": ["Inter"],
                  "display-lg": ["Inter"]
                }
              }
            }
          }
        `}} />
      </head>
      <body className="bg-background min-h-screen font-body-md text-on-surface">
        {/* Background Elements */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[100px]"></div>
        </div>

        {/* Top Navigation Bar */}
        <header className="bg-surface/80 backdrop-blur-xl border-b border-white/10 fixed top-0 w-full z-50 shadow-lg shadow-primary/5">
            <div className="flex justify-between items-center h-20 px-4 md:px-10 max-w-[1440px] mx-auto">
                <div className="flex items-center gap-3">
                    <img alt="LicenseShield Logo" className="h-10 w-10" src="https://lh3.googleusercontent.com/aida/AP1WRLt-VQ3vLtY5lJ6V-plPC1x6yX70Y7olCRsAeNH2aulDxDON0_iJ0HvvnsUr6WF0WuafIOlDHrarOpi3tYZuOo1QR5dPMLQFqUnkURklgGrw4XmBiQLMmxVLUycZGePzrJs3qjjx3OMNNRVMyQOT_SOXO7_Vxph7aBcml5vyG-fm6AJAg1DD3mtU6s-9L3mwUvYySgZmrSN_d59sb9i8vmSho3YO8usFOuiHx4pqnvC2Dagga0Oqadr2jomm"/>
                    <span className="text-2xl font-bold text-primary tracking-tight">LicenseShield AI</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <nav className="flex gap-6">
                        <a className="text-primary border-b-2 border-primary pb-1 font-medium" href="#">Audit Center</a>
                    </nav>
                </div>
            </div>
        </header>

        <main className="pt-32 pb-16 px-4 md:px-10 max-w-[1440px] mx-auto">
            {children}
        </main>
      </body>
    </html>
  );
}
