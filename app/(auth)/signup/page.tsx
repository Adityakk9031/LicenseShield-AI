'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* ── GitHub OAuth ────────────────────────────────────────── */
  async function handleGitHubSignUp() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  /* ── Email / Password ────────────────────────────────────── */
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess('Check your email to confirm your account!');
      setLoading(false);
    }
  }

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="auth-page">
      {/* Animated background blobs */}
      <div className="auth-bg">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🛡️</div>
          <span className="auth-logo-wordmark">LicenseShield</span>
          <span className="auth-logo-ai">AI</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start with 100 free scans per month</p>

        {/* Success */}
        {success && (
          <div className="success-msg" role="status">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-msg" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* Free tier badge */}
        <div className="auth-badge">
          <span className="auth-badge-dot" />
          100 scans free · No credit card required
        </div>

        {/* GitHub button */}
        <button
          type="button"
          className="btn-ghost btn-full btn-flex"
          onClick={handleGitHubSignUp}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483
              0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466
              -.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832
              .092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688
              -.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004
              1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7
              1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338
              -.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          Sign Up with GitHub
        </button>

        <div className="auth-divider"><span>or</span></div>

        {/* Email form */}
        <form onSubmit={handleSignUp} noValidate className="auth-form">
          <div className="auth-field">
            <label htmlFor="signup-email" className="auth-field-label">Email address</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              className="auth-field-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password" className="auth-field-label">Password</label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="auth-field-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="auth-field-hint">6+ characters required</span>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <><span className="auth-spinner" aria-hidden="true" />Creating account...</>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Terms */}
        <p className="auth-terms">
          By creating an account you agree to our{' '}
          <a href="/terms" className="auth-terms-link">Terms</a>{' '}and{' '}
          <a href="/privacy" className="auth-terms-link">Privacy Policy</a>.
        </p>

        <p className="auth-footer">
          Already have an account?{' '}
          <a href="/login" className="auth-footer-link">Sign in</a>
        </p>
      </div>

      <style jsx>{`
        .auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:var(--color-bg,#0a0a0f);position:relative;overflow:hidden;}
        .auth-bg{position:absolute;inset:0;pointer-events:none;z-index:0;}
        .auth-blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.18;animation:blobFloat 12s ease-in-out infinite alternate;}
        .auth-blob-1{width:520px;height:520px;background:radial-gradient(circle,#8b5cf6 0%,transparent 70%);top:-140px;right:-100px;animation-delay:0s;}
        .auth-blob-2{width:380px;height:380px;background:radial-gradient(circle,#6366f1 0%,transparent 70%);bottom:-100px;left:-60px;animation-delay:-5s;}
        .auth-blob-3{width:260px;height:260px;background:radial-gradient(circle,#06b6d4 0%,transparent 70%);top:35%;left:10%;animation-delay:-9s;}
        @keyframes blobFloat{0%{transform:translate(0,0) scale(1);}50%{transform:translate(-25px,20px) scale(1.06);}100%{transform:translate(20px,-25px) scale(.96);}}
        .auth-card{position:relative;z-index:1;width:100%;max-width:420px;padding:40px 36px 36px;border-radius:20px;background:rgba(255,255,255,.04);backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);border:1px solid rgba(255,255,255,.1);box-shadow:0 0 0 1px rgba(139,92,246,.08),0 24px 64px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08);animation:cardIn .55s cubic-bezier(.22,1,.36,1) both;}
        @keyframes cardIn{from{opacity:0;transform:translateY(28px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        .auth-logo{display:flex;align-items:center;gap:8px;margin-bottom:28px;}
        .auth-logo-icon{font-size:26px;line-height:1;animation:shieldPulse 3s ease-in-out infinite;}
        @keyframes shieldPulse{0%,100%{filter:drop-shadow(0 0 8px rgba(99,102,241,.6));}50%{filter:drop-shadow(0 0 18px rgba(139,92,246,.9));}}
        .auth-logo-wordmark{font-size:17px;font-weight:700;color:#e2e8f0;letter-spacing:-.3px;}
        .auth-logo-ai{font-size:11px;font-weight:700;padding:2px 6px;border-radius:6px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;letter-spacing:.5px;}
        .auth-title{font-size:26px;font-weight:700;color:#f1f5f9;margin:0 0 6px;letter-spacing:-.5px;}
        .auth-subtitle{font-size:14px;color:rgba(148,163,184,.9);margin:0 0 20px;}
        .success-msg{display:flex;align-items:center;gap:8px;padding:12px 14px;border-radius:10px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.3);color:#86efac;font-size:13px;margin-bottom:20px;animation:fadeIn .25s ease;}
        .error-msg{display:flex;align-items:center;gap:8px;padding:12px 14px;border-radius:10px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#fca5a5;font-size:13px;margin-bottom:20px;animation:fadeIn .25s ease;}
        .auth-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:20px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);color:#a5b4fc;font-size:12px;font-weight:500;margin-bottom:20px;}
        .auth-badge-dot{width:6px;height:6px;border-radius:50%;background:#6366f1;box-shadow:0 0 6px #6366f1;animation:dotPulse 2s ease-in-out infinite;}
        @keyframes dotPulse{0%,100%{opacity:1;}50%{opacity:.4;}}
        .btn-ghost{padding:11px 20px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#e2e8f0;font-size:14px;font-weight:500;cursor:pointer;transition:background .2s,border-color .2s,transform .15s,box-shadow .2s;}
        .btn-full{width:100%;}
        .btn-flex{display:flex;align-items:center;justify-content:center;gap:10px;}
        .btn-ghost:hover:not(:disabled){background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.35);}
        .btn-ghost:active:not(:disabled){transform:translateY(0);}
        .btn-ghost:disabled{opacity:.5;cursor:not-allowed;}
        .auth-divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:rgba(148,163,184,.5);font-size:12px;letter-spacing:.5px;}
        .auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.08);}
        .auth-form{display:flex;flex-direction:column;gap:16px;}
        .auth-field{display:flex;flex-direction:column;gap:7px;}
        .auth-field-label{font-size:13px;font-weight:500;color:#94a3b8;}
        .auth-field-hint{font-size:11px;color:rgba(148,163,184,.55);margin-top:2px;}
        .auth-field-input{padding:11px 14px;border-radius:11px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#f1f5f9;font-size:14px;outline:none;transition:border-color .2s,background .2s,box-shadow .2s;width:100%;box-sizing:border-box;}
        .auth-field-input::placeholder{color:rgba(148,163,184,.4);}
        .auth-field-input:focus{border-color:rgba(99,102,241,.6);background:rgba(99,102,241,.06);box-shadow:0 0 0 3px rgba(99,102,241,.15);}
        .auth-submit{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 20px;border-radius:12px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border:none;color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s,transform .15s,box-shadow .2s;box-shadow:0 4px 20px rgba(99,102,241,.4);position:relative;overflow:hidden;margin-top:4px;}
        .auth-submit::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12),transparent);pointer-events:none;}
        .auth-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(99,102,241,.55);}
        .auth-submit:active:not(:disabled){transform:translateY(0);}
        .auth-submit:disabled{opacity:.65;cursor:not-allowed;}
        .auth-spinner{display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .auth-terms{margin-top:16px;text-align:center;font-size:11px;color:rgba(148,163,184,.5);}
        .auth-terms-link{color:rgba(148,163,184,.7);text-decoration:underline;transition:color .2s;}
        .auth-terms-link:hover{color:#94a3b8;}
        .auth-footer{margin-top:16px;text-align:center;font-size:13px;color:rgba(148,163,184,.7);}
        .auth-footer-link{color:#818cf8;text-decoration:none;font-weight:500;transition:color .2s;}
        .auth-footer-link:hover{color:#a5b4fc;text-decoration:underline;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}
        @media(max-width:480px){.auth-card{padding:32px 24px 28px;}.auth-title{font-size:22px;}}
      `}</style>
    </div>
  );
}
