'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';
import { createClient } from '@/lib/supabase-client';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ── GitHub OAuth ────────────────────────────────────────── */
  async function handleGitHubSignUp() {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  /* ── Google OAuth ────────────────────────────────────────── */
  async function handleGoogleSignUp() {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  /* ── Email / Password ────────────────────────────────────── */
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password (min 6 characters).');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020408', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative', overflow: 'hidden' }}>
      {/* Background ambient lighting */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.08) 0%, rgba(0, 242, 254, 0.05) 45%, transparent 70%)' }} />

      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(8, 12, 22, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 24,
          padding: 38,
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(24px)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <BrandLogo size="md" />
          </Link>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 16, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--emerald)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 14 }}>
          <span>●</span>
          <span>1,000 free scans / mo included</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Create your account
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 24 }}>
          Start testing autonomous AI agent guardrails in seconds
        </p>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', fontSize: 12.5, marginBottom: 18, fontFamily: 'var(--font-mono)' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Social Auth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          <button
            type="button"
            onClick={handleGitHubSignUp}
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <span>Sign Up with GitHub</span>
          </button>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <span>Sign Up with Google</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0', color: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          <span style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
          <span>OR SIGN UP WITH EMAIL</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                width: '100%',
                background: '#020408',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#fff',
                fontSize: 13.5,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={{
                width: '100%',
                background: '#020408',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#fff',
                fontSize: 13.5,
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-glow"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, marginTop: 6 }}
          >
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{ marginTop: 22, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
