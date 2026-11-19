'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

export default function Signup() {
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('Ashik Electric');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, shopName, email, password }),
    });
    const j = await r.json();
    if (!r.ok) {
      setBusy(false);
      return toast.error(j.error);
    }
    const login = await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    if (login?.error) return toast.error('Account created; sign in to continue');
    router.push('/dashboard');
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-md space-y-4 rounded-3xl border border-line bg-white p-8 shadow-card"
    >
      <div className="text-center mb-5">
        <span className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal to-blue shadow-md">
          <svg
            className="h-7 w-7 text-sand"
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
        <h1 className="font-heading text-2xl font-bold tracking-tight text-ink">Set up your shop</h1>
        <p className="mt-1 text-sm text-muted">Create your private owner account</p>
      </div>

      {[
        ['Owner name', name, setName],
        ['Shop name', shopName, setShopName],
        ['Email', email, setEmail],
        ['Password', password, setPassword],
      ].map(([label, value, set]: any) => (
        <label key={label} className="block text-sm font-semibold text-ink">
          {label}
          <input
            className="field mt-1.5"
            required
            type={label === 'Password' ? 'password' : label === 'Email' ? 'email' : 'text'}
            minLength={label === 'Password' ? 10 : undefined}
            value={value}
            onChange={(e) => set(e.target.value)}
          />
        </label>
      ))}

      <button disabled={busy} className="btn-primary w-full py-3 text-sm mt-3">
        {busy ? 'Creating…' : 'Create Store Account'}
      </button>

      <p className="text-center text-sm text-muted pt-2">
        Already registered?{' '}
        <Link className="font-bold text-teal hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
