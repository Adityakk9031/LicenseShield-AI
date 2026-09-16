'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LicenseShieldScrubber from '@/components/LicenseShieldScrubber';
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
