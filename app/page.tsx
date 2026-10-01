'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LicenseShieldScrubber from '@/components/LicenseShieldScrubber';
import RisoDither from '@/components/ui/RisoDither';
import OverlayHero from '@/components/ui/OverlayHero';
import AgentPlayground from '@/components/AgentPlayground';
import OverlayMetrics from '@/components/ui/OverlayMetrics';
import OverlayDrawer from '@/components/ui/OverlayDrawer';
import HybridPricing from '@/components/HybridPricing';
import AuthModal from '@/components/ui/AuthModal';
import { useClerk } from '@clerk/nextjs';

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'apikey' | 'web3'>('apikey');
  const clerk = useClerk();

  const openAuth = (tab: 'signin' | 'signup' | 'apikey' | 'web3' = 'signin') => {
    if (tab === 'signin') {
      clerk.openSignIn();
    } else if (tab === 'signup') {
      clerk.openSignUp();
    } else {
      setAuthDefaultTab(tab as 'apikey' | 'web3');
      setAuthModalOpen(true);
    }
  };

  const scrollToConsole = () => {
    const el = document.getElementById('console-drawer');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSandbox = () => {
    const el = document.getElementById('agent-sandbox');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-transparent text-white">
      {/* Riso Dither flow-field — hero backdrop, dissolves into the scrub animation */}
      <RisoDither
        palette={['#070614', '#1E1B4E', '#4A3FB8', '#7C6FE8', '#B7A6F4', '#E8A0C8']}
        bg="#050410"
        bgAlpha={1}
        speed={0.24}
        pixelSize={6}
        levels={6}
        scale={1.15}
        contrast={1.9}
        flowAngle={32}
        detail={0.3}
        glow={0.32}
        matrix={8}
      />

      {/* Top Fixed Navbar with Supabase Auth session & Sign In/Sign Up */}
      <Navbar onOpenAuth={(tab) => openAuth(tab || 'signin')} />

      {/* 60 FPS Canvas Frame Scrubber Container */}
      <LicenseShieldScrubber
        totalFrames={240}
        framePathPattern={(i) => `/frames/ezgif-frame-${String(i).padStart(3, '0')}.jpg`}
      >
        {/* Layer 1: Hero Section */}
        <OverlayHero
          onScrollToConsole={scrollToConsole}
          onScrollToSandbox={scrollToSandbox}
          onOpenKeyModal={() => openAuth('apikey')}
        />

        {/* Layer 2: Core USP: AI Coding Agent Verification Sandbox */}
        <AgentPlayground />

        {/* Layer 3: Metrics & Live Telemetry Section */}
        <div id="metrics">
          <OverlayMetrics />
        </div>

        {/* Layer 4: Interactive Live Backend Console & Drawer */}
        <OverlayDrawer />

        {/* Layer 5: Hybrid B2B Pricing & Micropayment Settlement */}
        <HybridPricing />

        {/* Layer 6: Transparent Glass Footer */}
        <Footer />
      </LicenseShieldScrubber>

      {/* Web2 Supabase Auth & API Key Drawer Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authDefaultTab}
      />
    </div>
  );
}
