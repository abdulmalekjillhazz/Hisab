'use client';

import { Sidebar } from '@/components/sidebar';
import { useSession } from 'next-auth/react';
import { useUIStore } from '@/store/use-ui-store';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const PAGE_TITLES: Record<string, { en: string; bn: string }> = {
  '/dashboard': { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  '/sales': { en: 'Sales & POS', bn: 'বিক্রি ও বিলিং' },
  '/products': { en: 'Products & Stock', bn: 'পণ্য ও স্টক' },
  '/customers': { en: 'Customer Ledger', bn: 'গ্রাহক খাতা' },
  '/reports': { en: 'Reports', bn: 'রিপোর্ট' },
  '/profile': { en: 'Settings', bn: 'সেটিংস' },
};

function NavIcon({ type, active }: { type: string; active: boolean }) {
  if (type === 'home') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
          fill={active ? 'currentColor' : '#94A3B8'}
          stroke={active ? 'currentColor' : '#64748B'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === 'pos') {
    return (
      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'products') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L3 7L12 12L21 7L12 2Z"
          fill={active ? 'currentColor' : '#94A3B8'}
          stroke={active ? 'currentColor' : '#64748B'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M3 12L12 17L21 12"
          stroke={active ? 'currentColor' : '#64748B'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 17L12 22L21 17"
          stroke={active ? 'currentColor' : '#64748B'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === 'customers') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M16 21V19C16 16.7909 14.2091 15 12 15H6C3.79086 15 2 16.7909 2 19V21"
          stroke={active ? 'currentColor' : '#64748B'}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle
          cx="9"
          cy="7"
          r="4"
          fill={active ? 'currentColor' : '#94A3B8'}
          stroke={active ? 'currentColor' : '#64748B'}
          strokeWidth="1.8"
        />
        <path
          d="M22 21V19C21.9984 17.177 20.7302 15.5857 18.96 15.19"
          stroke={active ? 'currentColor' : '#64748B'}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M18 20V10" stroke={active ? 'currentColor' : '#64748B'} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 20V4" stroke={active ? 'currentColor' : '#64748B'} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6 20V14" stroke={active ? 'currentColor' : '#64748B'} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

const bottomNavItems = [
  { href: '/dashboard', type: 'home', en: 'Home', bn: 'হোম' },
  { href: '/products', type: 'products', en: 'Stock', bn: 'স্টক' },
  { href: '/sales', type: 'pos', en: 'POS', bn: 'বিক্রি', isHero: true },
  { href: '/customers', type: 'customers', en: 'Due', bn: 'বাকি' },
  { href: '/reports', type: 'reports', en: 'Reports', bn: 'রিপোর্ট' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const pathname = usePathname();
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    const v = localStorage.getItem('ae-locale');
    if (v === 'bn' || v === 'en') setLocale(v);
  }, [setLocale]);

  useEffect(() => {
    const loadAvatar = () => {
      fetch('/api/profile')
        .then((r) => r.json())
        .then((x) => setAvatar(x.data?.avatar || ''))
        .catch(() => setAvatar(''));
    };
    loadAvatar();
    window.addEventListener('profile-updated', loadAvatar);
    return () => window.removeEventListener('profile-updated', loadAvatar);
  }, []);

  const currentTitle = PAGE_TITLES[pathname] || { en: 'Ashik Electric', bn: 'আশিক ইলেকট্রিক' };

  return (
    <div className="app-shell bg-bg text-ink">
      {/* Desktop/Tablet Sidebar (Strictly hidden on screens < 768px) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area: Zero margin on mobile, margin only on desktop */}
      <main className="min-h-screen px-3 py-3 safe-top pb-24 md:pb-6 md:ml-[250px] sm:px-6 sm:py-6">
        {/* Top Header */}
        <header className="mb-3 sm:mb-5 flex items-center justify-between border-b border-line/70 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white text-xs font-bold text-slate-600 shadow-sm active:scale-95 transition md:hidden"
              title="Profile settings"
            >
              {avatar ? (
                <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span>{data?.user?.name?.trim().charAt(0).toUpperCase() || 'A'}</span>
              )}
            </Link>
            <div>
              <h1 className="font-heading text-base sm:text-2xl font-bold tracking-tight text-ink leading-tight">
                {locale === 'bn' ? currentTitle.bn : currentTitle.en}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted font-medium">
                {data?.user?.name ? `${data.user.name} • ` : ''}Ashik Electric Store
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className="btn-soft text-xs py-1 px-2.5 rounded-lg active:scale-95 transition"
              onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
              title="Toggle Language"
            >
              <span>🌐</span>
              <span className="font-semibold">{locale === 'en' ? 'বাংলা' : 'English'}</span>
            </button>
            <Link
              href="/profile"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-white text-sm text-slate-600 active:scale-95 transition md:hidden"
              title="Profile settings"
            >
              ⚡
            </Link>
          </div>
        </header>

        {children}
      </main>

      {/* Mobile Bottom Navigation (Only visible on mobile screens < 768px) */}
      <nav className="mobile-bottom-nav fixed inset-x-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden">
        {bottomNavItems.map((item) => {
          const active = pathname === item.href;

          if (item.isHero) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center active:scale-95 transition-transform"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue via-cyan to-teal shadow-[0_2px_0_#0f4c81,0_4px_8px_rgba(14,116,144,0.3)] ${
                    active ? 'ring-4 ring-emerald-400 shadow-[0_0_0_2px_rgba(34,197,94,0.22),0_4px_9px_rgba(16,185,129,0.45)]' : 'ring-1 ring-white'
                  }`}
                >
                  <NavIcon type={item.type} active={true} />
                </div>
                <span
                  className={`text-[10px] mt-0.5 font-bold tracking-tight ${
                    active ? 'text-blue' : 'text-slate-600'
                  }`}
                >
                  {locale === 'bn' ? item.bn : item.en}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition ${
                active ? 'text-blue font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`bottom-nav-icon bottom-nav-icon-${item.type} ${active ? 'is-active' : ''}`}
                style={item.type === 'home' ? { background: 'linear-gradient(145deg, #38bdf8, #2563eb)' } : undefined}
              >
                <NavIcon type={item.type} active={active} />
              </div>
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">
                {locale === 'bn' ? item.bn : item.en}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
