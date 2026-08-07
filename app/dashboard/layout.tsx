'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

/* ─────────────────────────────────────────────
   Nav item definitions
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Overview',   href: '/dashboard',      icon: '📊' },
  { label: 'API Keys',   href: '/dashboard/keys', icon: '🔑' },
  { label: 'Audit Logs', href: '/dashboard/logs', icon: '📜' },
  { label: 'Billing',    href: '/billing',         icon: '💎' },
] as const;

/* ─────────────────────────────────────────────
   Helper: derive readable page label from pathname
───────────────────────────────────────────── */
function getPageLabel(pathname: string): string {
  const match = NAV_ITEMS.find((item) => item.href === pathname);
  if (match) return match.label;
  const segment = pathname.split('/').filter(Boolean).pop() ?? 'Dashboard';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

/* ─────────────────────────────────────────────
   DashboardLayout
───────────────────────────────────────────── */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const [userEmail,  setUserEmail]  = useState<string>('dev@licenseshield.ai');
  const [signingOut, setSigningOut] = useState(false);
  const [mounted,    setMounted]    = useState(false);

  /* ── Fetch real session ── */
  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    } catch {
      /* fallback stays as 'dev@licenseshield.ai' */
    }
  };

  useEffect(() => {
    setMounted(true);
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Sign-out handler ── */
  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch {
      setSigningOut(false);
    }
  };

  /* ── Derived display values ── */
  const avatarChars = userEmail.slice(0, 2).toUpperCase();
  const pageLabel   = getPageLabel(pathname);

  /* Prevent hydration mismatch */
  if (!mounted) return null;

  return (
    <div className="dash-layout">

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside className="dash-sidebar">

        {/* ── Logo ── */}
        <div className="dash-sidebar-logo">
          <div className="dash-sidebar-logo-icon">🛡️</div>
          <div className="dash-sidebar-logo-text">
            <span className="dash-sidebar-brand">LicenseShield</span>
            <span className="dash-sidebar-sub">AI Platform</span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="dash-nav">
          <span className="dash-nav-section-label">Main</span>

          {NAV_ITEMS.map((item) => {
            /* /dashboard must be exact; others use startsWith */
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-nav-item${isActive ? ' active' : ''}`}
              >
                <div className="dash-nav-icon">{item.icon}</div>
                <span>{item.label}</span>
                {isActive && <div className="dash-nav-active-bar" />}
              </Link>
            );
          })}
        </nav>

        {/* ── Sidebar Footer ── */}
        <div className="dash-sidebar-footer">

          {/* User card */}
          <div className="dash-user-card">
            <div className="dash-user-avatar" aria-hidden="true">
              {avatarChars}
            </div>
            <div className="dash-user-info">
              <span className="dash-user-email" title={userEmail}>
                {userEmail.length > 22
                  ? `${userEmail.slice(0, 20)}…`
                  : userEmail}
              </span>
              <span className="dash-status-badge">
                <span className="dash-status-dot" />
                Active
              </span>
            </div>
          </div>

          {/* Sign-out button */}
          <button
            className="dash-signout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
          >
            {signingOut ? (
              <>
                <span className="dash-signout-spinner" />
                Signing out…
              </>
            ) : (
              <>
                <span className="dash-signout-icon">↩</span>
                Sign Out
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN AREA
      ══════════════════════════════════════════ */}
      <div className="dash-main">

        {/* ── Top Bar ── */}
        <header className="dash-topbar">

          {/* Breadcrumb */}
          <div className="dash-breadcrumb">
            <span className="dash-breadcrumb-root">Developer Portal</span>
            <span className="dash-breadcrumb-sep">/</span>
            <span className="dash-breadcrumb-current">{pageLabel}</span>
          </div>

          {/* Right-side actions */}
          <div className="dash-topbar-actions">
            <div className="dash-api-badge">
              <span className="dash-api-dot">●</span>
              API Live
            </div>
            <Link href="/billing" className="btn-ghost">
              ✦ Upgrade Plan
            </Link>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="dash-content">
          {children}
        </main>
      </div>
    </div>
  );
}
