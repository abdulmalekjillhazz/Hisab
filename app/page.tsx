import Link from 'next/link';
import { redirect } from 'next/navigation';
import { identity } from '@/lib/auth';
import { DemoDashboard } from '@/components/demo-dashboard';

export default async function Home() {
  if (await identity()) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="Hisab home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal text-white shadow-md">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </span>
          <span className="font-heading text-xl font-extrabold tracking-tight">Hisab</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-white sm:px-4">Sign in</Link>
          <Link href="/signup" className="rounded-xl bg-ink px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal sm:px-4">Get started</Link>
        </nav>
      </header>
      <DemoDashboard />
    </main>
  );
}
