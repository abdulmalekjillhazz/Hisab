'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    if (r?.error) return toast.error('Email or password is incorrect');
    router.push('/dashboard');
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetBusy(true);
    const r = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail, securityPin, newPassword }),
    });
    const j = await r.json();
    setResetBusy(false);
    if (!r.ok) return toast.error(j.error);
    toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
    setEmail(resetEmail);
    setPassword(newPassword);
    setShowForgot(false);
  }

  return (
    <div className="w-full max-w-md">
      {!showForgot ? (
        <form
          onSubmit={submit}
          className="w-full space-y-4 rounded-3xl border border-line bg-white p-7 sm:p-8 shadow-card"
        >
          <div className="mb-5 text-center">
            <span className="mx-auto mb-3 grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br from-teal to-blue shadow-md">
              <svg
                className="h-6 w-6 text-sand"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted">Sign in to Ashik Electric workspace</p>
          </div>

          <label className="block text-xs sm:text-sm font-semibold text-ink">
            Email
            <input
              className="field mt-1"
              type="email"
              required
              placeholder="admin@ashikelectric.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block text-xs sm:text-sm font-semibold text-ink">
            <div className="flex items-center justify-between">
              <span>Password</span>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setShowForgot(true);
                }}
                className="text-xs font-semibold text-blue hover:underline"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
            <input
              className="field mt-1"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button disabled={busy} className="btn-primary w-full py-2.5 sm:py-3 text-xs sm:text-sm mt-1">
            {busy ? 'Signing in…' : 'Sign in to Store'}
          </button>

          <p className="text-center text-xs sm:text-sm text-muted pt-2 border-t border-line/60">
            New shop?{' '}
            <Link className="font-bold text-teal hover:underline" href="/signup">
              Create owner account
            </Link>
          </p>
        </form>
      ) : (
        /* Instant Reset with Security PIN */
        <form
          onSubmit={handleResetPassword}
          className="w-full space-y-3.5 rounded-3xl border border-line bg-white p-7 sm:p-8 shadow-card"
        >
          <div className="mb-4 text-center">
            <span className="mx-auto mb-2.5 grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700 text-lg font-bold">
              🔑
            </span>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-ink">পাসওয়ার্ড রিসেট</h2>
            <p className="text-xs text-muted mt-0.5">
              সিকিউরিটি পিন (Security PIN) দিয়ে নতুন পাসওয়ার্ড সেট করুন
            </p>
          </div>

          <label className="block text-xs font-semibold text-ink">
            অ্যাকাউন্ট ইমেইল (Email)
            <input
              className="field mt-1 text-xs"
              type="email"
              required
              placeholder="registered email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </label>

          <label className="block text-xs font-semibold text-ink">
            মাস্টার সিকিউরিটি পিন (Default: 1234)
            <input
              className="field mt-1 text-xs font-mono tracking-widest"
              type="text"
              required
              placeholder="e.g. 1234"
              value={securityPin}
              onChange={(e) => setSecurityPin(e.target.value)}
            />
          </label>

          <label className="block text-xs font-semibold text-ink">
            নতুন পাসওয়ার্ড (New Password)
            <input
              className="field mt-1 text-xs"
              type="password"
              minLength={6}
              required
              placeholder="কমপক্ষে ৬ অক্ষর"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              className="btn-soft flex-1 py-2 text-xs"
              onClick={() => setShowForgot(false)}
            >
              ফিরে যান
            </button>
            <button
              disabled={resetBusy}
              className="btn-primary flex-1 py-2 text-xs font-bold"
            >
              {resetBusy ? 'রিসেট হচ্ছে…' : '✓ পাসওয়ার্ড রিসেট'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
