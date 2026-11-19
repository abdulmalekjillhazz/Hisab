'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/password-input';

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
    try {
      const r = await signIn('credentials', { email, password, redirect: false });
      if (r?.error) return toast.error('Email or password is incorrect');
      router.replace('/dashboard');
    } catch {
      toast.error('Could not reach the sign-in service. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetBusy(true);
    try {
    const r = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail, securityPin, newPassword }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return toast.error(j.error);
    toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
    setEmail(resetEmail);
    setPassword(newPassword);
    setShowForgot(false);
    } catch {
      toast.error('Could not reach the password reset service. Please try again.');
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      {!showForgot ? (
        <form
          onSubmit={submit}
          className="w-full space-y-4 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(30,41,59,.1)] sm:p-8"
        >
          <div className="mb-5 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-[0_5px_12px_rgba(79,70,229,.25)]">
              <svg
                className="h-6 w-6 text-white"
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
            <h1 className="font-heading text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Welcome back</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted">Sign in to Ashik Electric workspace</p>
          </div>

          <label className="block text-xs font-semibold text-slate-700 sm:text-sm">
            Email
            <input
              className="field mt-1"
              type="email"
              required
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block text-xs font-semibold text-slate-700 sm:text-sm">
            <div className="flex items-center justify-between">
              <span>Password</span>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setShowForgot(true);
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
            <PasswordInput
              className="field w-full"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button disabled={busy} className="mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_10px_rgba(79,70,229,.2)] transition hover:bg-indigo-700 disabled:opacity-50 sm:py-3 sm:text-sm">
            {busy ? 'Signing in…' : 'Sign in to Store'}
          </button>

          <p className="border-t border-slate-100 pt-3 text-center text-xs text-slate-500 sm:text-sm">
            New shop?{' '}
            <Link className="font-bold text-indigo-600 hover:underline" href="/signup">
              Create owner account
            </Link>
          </p>
        </form>
      ) : (
        /* Instant Reset with Security PIN */
        <form
          onSubmit={handleResetPassword}
          className="w-full space-y-3.5 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(30,41,59,.1)] sm:p-8"
        >
          <div className="mb-4 text-center">
            <span className="mx-auto mb-2.5 grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 text-lg font-bold">
              🔑
            </span>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-ink">পাসওয়ার্ড রিসেট</h2>
            <p className="text-xs text-muted mt-0.5">
              সিকিউরিটি পিন (Security PIN) দিয়ে নতুন পাসওয়ার্ড সেট করুন
            </p>
          </div>

          <label className="block text-xs font-semibold text-slate-700">
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

          <label className="block text-xs font-semibold text-slate-700">
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

          <label className="block text-xs font-semibold text-slate-700">
            নতুন পাসওয়ার্ড (New Password)
            <PasswordInput
              className="field w-full text-xs"
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
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              onClick={() => setShowForgot(false)}
            >
              ফিরে যান
            </button>
            <button
              disabled={resetBusy}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {resetBusy ? 'রিসেট হচ্ছে…' : '✓ পাসওয়ার্ড রিসেট'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
