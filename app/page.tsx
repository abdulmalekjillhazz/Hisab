import Link from 'next/link';
import { redirect } from 'next/navigation';
import { identity } from '@/lib/auth';
import { DemoDashboard } from '@/components/demo-dashboard';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function Home() {
  if (await identity()) redirect('/dashboard');

  return (
    <main className="landing-page min-h-screen bg-[#F5F8FF] text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#F5F8FF]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-6 py-4 sm:px-10 lg:px-14">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3" aria-label="Hisab home">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(79,70,229,0.28)]">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </span>
            <div>
              <b className="block font-heading text-xl font-extrabold tracking-tight text-slate-900">
                Hisab
              </b>
              <small className="block text-[11px] font-medium text-slate-400 -mt-0.5">
                Shop manager
              </small>
            </div>
          </Link>

          {/* Right Actions */}
          <nav className="flex items-center gap-2.5 sm:gap-4" aria-label="Account">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#0B1527] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-12 pt-6 sm:pb-16 sm:pt-10 lg:pb-20 lg:pt-12">
        <div className="mx-auto grid max-w-[1360px] items-center gap-10 px-6 sm:px-10 lg:grid-cols-[1fr_1.25fr] lg:gap-14 lg:px-14">
          {/* Left Column: Headline & Action Buttons */}
          <div className="max-w-xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600 shadow-[0_2px_8px_rgba(79,70,229,0.06)] border border-indigo-50/80">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              MADE FOR YOUR EVERYDAY BUSINESS
            </div>

            {/* Giant Title */}
            <h1 className="mt-6 font-heading text-[3.25rem] font-black leading-[1.05] tracking-[-0.04em] text-[#0F172A] sm:text-[4rem] lg:text-[4.65rem]">
              Your shop, <span className="text-[#4338CA]">in</span>
              <br />
              <span className="text-[#4338CA]">good order.</span>
            </h1>

            {/* Description Paragraph */}
            <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-[1.05rem] max-w-lg">
              Keep products, sales and customer accounts organized in one simple place. Take a look
              around, then sign in when you are ready to manage your shop.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 min-[440px]:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-[#4338CA] px-7 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(67,56,202,0.32)] transition hover:bg-[#3730A3] active:scale-[0.99]"
              >
                Create your workspace
              </Link>
              <Link
                href="/login"
                className="inline-flex h-[52px] items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-6 text-[15px] font-bold text-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition hover:border-slate-300 hover:bg-slate-50/60"
              >
                I already have an account
              </Link>
            </div>

            {/* Trust badge */}
            <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-400">
              <svg
                className="h-4 w-4 text-emerald-500 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Your shop data stays private to your account.</span>
            </div>
          </div>

          {/* Right Column: Live Mockup Card */}
          <div className="w-full">
            <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(0,0,0,0.03)] sm:p-8">
              <DemoDashboard />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
