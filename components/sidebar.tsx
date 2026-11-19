'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useUIStore } from '@/store/use-ui-store';

const links = [
  ['/dashboard', '▦', 'Dashboard', 'ড্যাশবোর্ড'],
  ['/products', '▤', 'Products & Stock', 'পণ্য ও স্টক'],
  ['/sales', '▧', 'Sales & Invoices', 'বিক্রি ও ইনভয়েস'],
  ['/customers', '♙', 'Customers', 'গ্রাহক'],
  ['/reports', '▥', 'Reports', 'রিপোর্ট'],
  ['/profile', '⚙', 'Shop Profile', 'দোকানের প্রোফাইল'],
];

export function Sidebar() {
  const path = usePathname();
  const locale = useUIStore((s) => s.locale);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[250px] flex-col bg-sidebar px-4 py-6 text-slate-200 safe-top safe-bottom max-[700px]:w-[68px] max-[700px]:px-2">
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal to-blue shadow-md">
          {/* Stylized electric & friendly node mark */}
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
        <span className="max-[700px]:hidden">
          <b className="block font-heading text-base font-bold text-white tracking-wide">
            Ashik Electric
          </b>
          <small className="text-xs text-slate-400 font-mono">Store Manager</small>
        </span>
      </div>

      {/* Navigation */}
      <nav className="space-y-1.5">
        {links.map(([href, icon, en, bn]) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              title={en}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-medium transition max-[700px]:justify-center ${
                active
                  ? 'bg-gradient-to-r from-teal to-blue text-white shadow-card font-semibold'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="w-5 text-center text-lg">{icon}</span>
              <span className="max-[700px]:hidden text-sm">{locale === 'bn' ? bn : en}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="mt-auto rounded-2xl border border-slate-700/60 bg-slate-800/50 p-3.5 text-xs text-slate-300 max-[700px]:hidden">
        <div className="flex items-center gap-2 font-semibold text-sand">
          <span>⚡</span>
          <span>Online & Connected</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
          Inventory, bills and customer ledger synced in real-time.
        </p>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="mt-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white max-[700px]:px-1 max-[700px]:justify-center"
      >
        <span>↪</span>
        <span className="max-[700px]:hidden">Sign out</span>
      </button>
    </aside>
  );
}
