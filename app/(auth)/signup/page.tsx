'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/password-input';

export default function Signup() {
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    let accountCreated = false;
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shopName, email, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(j.error || `Could not create account (${r.status})`);
        return;
      }
      accountCreated = true;
      const login = await signIn('credentials', { email, password, redirect: false });
      if (login?.error) {
        toast.error('Account created; sign in to continue');
        router.replace('/login');
        return;
      }
      router.replace('/dashboard');
    } catch {
      toast.error(accountCreated
        ? 'Account created, but automatic sign-in failed. Please sign in to continue.'
        : 'Could not reach the signup service. Please try again.');
      if (accountCreated) router.replace('/login');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-[460px] space-y-4 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(30,41,59,.1)] sm:p-8"
    >
      <div className="text-center mb-5">
        <span className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-[0_5px_12px_rgba(79,70,229,.25)]">
          <svg
            className="h-7 w-7 text-white"
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
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Set up your shop</h1>
        <p className="mt-1 text-sm text-muted">Create your private owner account</p>
      </div>

      {[
        ['Owner name', name, setName],
        ['Shop name', shopName, setShopName],
        ['Email', email, setEmail],
        ['Password', password, setPassword],
      ].map(([label, value, set]: any) => (
        <label key={label} className="block text-sm font-semibold text-slate-700">
          {label}
          {label === 'Password' ? (
            <PasswordInput className="field mt-1.5 w-full" required minLength={10} value={value} onChange={(e) => set(e.target.value)} />
          ) : (
            <input
              className="field mt-1.5"
              required
              type={label === 'Email' ? 'email' : 'text'}
              minLength={2}
              value={value}
              onChange={(e) => set(e.target.value)}
            />
          )}
        </label>
      ))}

      <button disabled={busy} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(79,70,229,.2)] transition hover:bg-indigo-700 disabled:opacity-50">
        {busy ? 'Creating…' : 'Create Store Account'}
      </button>

      <p className="border-t border-slate-100 pt-3 text-center text-xs text-slate-500 sm:text-sm">
        Already registered?{' '}
        <Link className="font-bold text-indigo-600 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
