'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useUIStore } from '@/store/use-ui-store';
import { BusinessCategoryIcon } from '@/components/business-category-icon';
import { prefetchPageData } from '@/lib/client-route-prefetch';
import { clearApiCache } from '@/lib/client-api-cache';

const links = [
  { href: '/dashboard', icon: 'dashboard', en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  { href: '/products', icon: 'products', en: 'Products & Stock', bn: 'পণ্য ও স্টক' },
  { href: '/sales', icon: 'sales', en: 'Sales & Invoices', bn: 'বিক্রি ও ইনভয়েস' },
  { href: '/customers', icon: 'customers', en: 'Customers', bn: 'গ্রাহক' },
  { href: '/reports', icon: 'reports', en: 'Reports', bn: 'রিপোর্ট' },
  { href: '/profile', icon: 'profile', en: 'Shop Profile', bn: 'দোকানের প্রোফাইল' },
] as const;

function SidebarIcon({ type, active }: { type: (typeof links)[number]['icon']; active: boolean }) {
  return (
    <span className={`sidebar-icon ${active ? 'is-active' : ''}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {type === 'dashboard' && <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>}
        {type === 'products' && <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5M12 13v8"/></>}
        {type === 'sales' && <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 8h8M8 12h5M8 16h2"/></>}
        {type === 'customers' && <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.5a3.5 3.5 0 0 1 0 6.8M17 14a5.5 5.5 0 0 1 4.5 5.5"/></>}
        {type === 'reports' && <><path d="M4 20V11M10 20V4M16 20v-7M22 20H2"/><path d="m3 8 6-4 6 6 6-5"/></>}
        {type === 'profile' && <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"/></>}
      </svg>
    </span>
  );
}

export function Sidebar({
  shopName = 'Ashik Electric',
  avatar = '',
  category = 'general',
  expanded,
  onToggle,
}: {
  shopName?: string;
  avatar?: string;
  category?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const path = usePathname();
  const locale = useUIStore((s) => s.locale);

  return (
    <aside className={`sidebar-rail fixed inset-y-0 left-0 z-20 flex flex-col bg-sidebar py-5 text-slate-200 safe-top safe-bottom ${expanded ? 'w-[250px] px-4' : 'w-[76px] px-2'}`}>
      <div className={`mb-4 flex items-center gap-3 ${expanded ? 'px-2' : 'justify-center'}`}>
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal to-blue text-white shadow-md">
          {avatar ? <img src={avatar} alt={`${shopName} logo`} className="h-full w-full object-cover" /> : <BusinessCategoryIcon category={category} className="h-6 w-6" />}
        </span>
        {expanded && (
          <span className="min-w-0">
            <b className="block max-w-[150px] truncate font-heading text-base font-bold tracking-wide text-white">{shopName}</b>
            <small className="text-xs text-slate-400 font-mono">Store Manager</small>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={expanded ? 'Hide sidebar labels' : 'Show sidebar labels'}
        title={expanded ? 'Hide details' : 'Show details'}
        className={`sidebar-toggle mb-5 flex min-h-9 items-center rounded-xl text-xs font-bold text-slate-300 hover:text-white ${expanded ? 'w-full justify-between px-3' : 'mx-auto w-[60px] justify-center gap-1 px-1'}`}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {expanded ? <path d="m14 18-6-6 6-6" /> : <path d="m10 18 6-6-6-6" />}
        </svg>
        <span>{expanded ? 'Hide' : 'Show'}</span>
      </button>

      <nav className="space-y-2" aria-label="Main navigation">
        {links.map((item) => {
          const active = path === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={expanded ? undefined : item.en}
              onMouseEnter={() => prefetchPageData(item.href)}
              onFocus={() => prefetchPageData(item.href)}
              onTouchStart={() => prefetchPageData(item.href)}
              className={`sidebar-link flex min-h-12 items-center rounded-2xl text-sm font-medium transition-all ${expanded ? 'gap-3 px-3' : 'justify-center px-0'} ${active ? 'is-active text-white' : 'text-slate-300 hover:bg-white/[.06] hover:text-white'}`}
            >
              <SidebarIcon type={item.icon} active={active} />
              {expanded && <span className="min-w-0 truncate">{locale === 'bn' ? item.bn : item.en}</span>}
            </Link>
          );
        })}
      </nav>

      {expanded && (
        <div className="sidebar-status mt-auto rounded-2xl border border-slate-700/60 bg-slate-800/50 p-3.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold text-sand">
            <span className="status-dot" />
            <span>Online & Connected</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Inventory, bills and customer ledger synced in real-time.</p>
        </div>
      )}

      <button
        onClick={() => {
          clearApiCache();
          signOut({ callbackUrl: '/login' });
        }}
        title={expanded ? undefined : 'Sign out'}
        className={`sidebar-signout mt-3 flex min-h-11 items-center rounded-xl text-sm text-slate-400 transition hover:bg-white/5 hover:text-white ${expanded ? 'gap-2 px-3.5' : 'justify-center px-1'}`}
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>
        </svg>
        {expanded && <span>Sign out</span>}
      </button>
    </aside>
  );
}
