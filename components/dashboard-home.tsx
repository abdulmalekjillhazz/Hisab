'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useUIStore } from '@/store/use-ui-store';
import { dict } from '@/lib/i18n';
import { getCachedJson } from '@/lib/client-api-cache';

const localKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function DashboardIcon({ name }: { name: 'sales' | 'profit' | 'due' | 'stock' | 'invoice' | 'chart' }) {
  const common = {
    className: 'h-[18px] w-[18px]',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  switch (name) {
    case 'sales': return <svg {...common}><path d="M4 17.5 9 12l3.5 3.5L20 7"/><path d="M14.5 7H20v5.5M4 4v16h16"/></svg>;
    case 'profit': return <svg {...common}><path d="M12 3.5v17M17.5 7.5c0-2-2.1-3.5-5.5-3.5S6.5 5.4 6.5 7.5 8.2 11 12 12s5.5 2 5.5 4.5-2.1 4-5.5 4-5.5-1.5-5.5-4"/></svg>;
    case 'due': return <svg {...common}><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></svg>;
    case 'stock': return <svg {...common}><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 21v-8.8"/></svg>;
    case 'invoice': return <svg {...common}><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>;
    default: return <svg {...common}><path d="M4 17 9 12l3.5 3.5L20 8"/><path d="M14.5 8H20v5.5"/></svg>;
  }
}

export function DashboardHome() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const locale = useUIStore((state) => state.locale);
  const isDark = useUIStore((state) => state.theme === 'dark');
  const t = dict[locale];
  const isBn = locale === 'bn';

  useEffect(() => {
    const today = new Date();
    void getCachedJson(`/api/reports?from=${localKey(today)}&to=${localKey(today)}`)
      .then((result) => {
        if (result.error) throw new Error(result.error);
        setData(result.data);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load dashboard'));
  }, []);

  const stats = data?.stats || {};
  const inventory = data?.inventory || {};
  const due = data?.dueSummary || {};
  const symbol = data?.currency === 'USD' ? '$' : '৳';
  const amount = (value: number | undefined) => `${symbol}${Number(value || 0).toLocaleString(isBn ? 'bn-BD' : 'en-US', { maximumFractionDigits: 0 })}`;
  const today = new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const cards = [
    { key: 'sales', label: t.todaySales, value: amount(stats.revenue), icon: 'sales' as const, color: 'text-indigo-600', tint: 'bg-indigo-50' },
    { key: 'profit', label: t.todayProfit, value: amount(stats.profit), icon: 'profit' as const, color: (stats.profit || 0) < 0 ? 'text-rose-500' : 'text-emerald-600', tint: 'bg-emerald-50' },
    { key: 'due', label: t.totalMarketDue, value: amount(due.totalMarketDue), icon: 'due' as const, color: 'text-rose-500', tint: 'bg-rose-50' },
    { key: 'stock', label: isBn ? 'পণ্য / ইউনিট' : 'Products / units', value: `${Number(inventory.count || 0).toLocaleString()} / ${Number(inventory.units || 0).toLocaleString()}`, icon: 'stock' as const, color: 'text-violet-600', tint: 'bg-violet-50' },
    { key: 'low-stock', label: t.lowStockAlerts, value: Number(data?.lowStock || 0).toLocaleString(isBn ? 'bn-BD' : 'en-US'), icon: 'invoice' as const, color: data?.lowStock ? 'text-amber-600' : 'text-slate-900', tint: 'bg-amber-50' },
  ];

  return (
    <div className="dashboard-page mx-auto max-w-[1500px] space-y-5 pb-8 sm:space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 sm:text-sm">
          {isBn ? 'ড্যাশবোর্ড লোড করা যায়নি:' : 'Unable to load dashboard:'} {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:flex">
            <span>{isBn ? 'ব্যবসার সারাংশ' : 'Business overview'}</span><span className="text-slate-300">/</span><span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isBn ? 'আজকের হিসাব' : 'Overview'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{isBn ? 'আপনার দোকানের আজকের অবস্থা এক নজরে।' : 'Your shop performance, clearly in view.'}</p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">{today}</span>
          <Link href="/sales" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-[0_4px_10px_rgba(79,70,229,.2)] transition hover:bg-indigo-700">
            <span className="text-base leading-none">+</span>{isBn ? 'নতুন বিক্রি' : 'New sale'}
          </Link>
        </div>
      </div>

      <section aria-label={isBn ? 'আজকের ব্যবসার সারাংশ' : 'Today at a glance'}>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="font-heading text-sm font-semibold text-slate-800 sm:text-base">{isBn ? 'আজকের সারাংশ' : 'Today at a glance'}</h3>
          <span className="text-[10px] font-medium text-slate-400 sm:text-xs">{isBn ? 'সারা দিনের হিসাব' : 'Today so far'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {cards.map((card) => (
            <article key={card.key} className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_5px_16px_rgba(15,23,42,.025)] transition hover:-translate-y-0.5 hover:shadow-md sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${card.tint} ${card.color}`}><DashboardIcon name={card.icon}/></span>
                <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-400">→</span>
              </div>
              <p className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">{card.label}</p>
              <p className={`mt-1 truncate font-heading text-lg font-bold tracking-tight sm:text-2xl ${card.color}`}>{data ? card.value : '—'}</p>
              <p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">{isBn ? 'আজকের হিসাব' : "Today's total"}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1.45fr_1fr]">
        <section className="min-h-[330px] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,.035)] sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{isBn ? 'পারফরম্যান্স' : 'Performance tracking'}</p>
              <h3 className="mt-1 font-heading text-base font-bold text-slate-800 sm:text-lg">{t.salesByMonth}</h3>
            </div>
            <Link href="/reports" className="inline-flex shrink-0 items-center gap-1 pt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              {isBn ? 'সব রিপোর্ট' : 'View reports'} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="h-[250px] sm:h-[275px]">
            {data?.monthly?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly} margin={{ top: 12, right: 4, left: -17, bottom: 0 }} barGap={5}>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke={isDark ? '#29445b' : '#e8edf5'} />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8b98ad' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8b98ad' }} tickFormatter={(value) => `${symbol}${Number(value).toLocaleString()}`} />
                  <Tooltip formatter={(value: number, name: string) => [amount(value), name === 'revenue' ? (isBn ? 'বিক্রি' : 'Sales') : (isBn ? 'লাভ' : 'Profit')]} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 30px rgba(15,23,42,.08)', fontSize: 12 }} />
                  <Bar dataKey="revenue" name="revenue" fill="#4f5ff2" radius={[5, 5, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="profit" name="profit" fill="#10a783" radius={[5, 5, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500"><DashboardIcon name="chart"/></span>
                <p className="text-sm font-semibold text-slate-700">{isBn ? 'এখনো বিক্রির তথ্য নেই' : 'No sales data yet'}</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">{isBn ? 'লেনদেন রেকর্ড হলে এখানে বিশ্লেষণ দেখা যাবে।' : 'Insights will appear here when transactions are recorded.'}</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,.035)] sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{isBn ? 'ইনভেন্টরি' : 'Inventory snapshot'}</p>
              <h3 className="mt-1 font-heading text-base font-bold text-slate-800 sm:text-lg">{isBn ? 'স্টকের অবস্থা' : 'Stock health'}</h3>
            </div>
            <Link href="/products" aria-label={isBn ? 'পণ্য দেখুন' : 'View products'} className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-500 transition hover:bg-indigo-100"><DashboardIcon name="stock"/></Link>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <MiniMetric label={isBn ? 'পণ্য' : 'Products'} value={Number(inventory.count || 0).toLocaleString(isBn ? 'bn-BD' : 'en-US')} />
            <MiniMetric label={isBn ? 'ইউনিট' : 'Stock units'} value={Number(inventory.units || 0).toLocaleString(isBn ? 'bn-BD' : 'en-US')} />
          </div>
          <div className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${data?.lowStock ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <span className={`h-2 w-2 rounded-full ${data?.lowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}/>
            {data ? (data.lowStock ? (isBn ? `${data.lowStock}টি পণ্যের স্টক কম` : `${data.lowStock} item${data.lowStock === 1 ? '' : 's'} need restocking`) : (isBn ? 'স্টক ঠিক আছে' : 'Inventory up to date')) : (isBn ? 'স্টক যাচাই হচ্ছে…' : 'Checking inventory…')}
          </div>
          <div className="space-y-2">
            {data?.lowStockItems?.length ? data.lowStockItems.slice(0, 4).map((product: any) => (
              <div key={product._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                <div className="min-w-0">
                  <b className="block truncate text-xs font-semibold text-slate-700">{product.name}</b>
                  <span className="text-[10px] text-slate-400">{product.brand || product.sku || (isBn ? 'পণ্য' : 'Product')}</span>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${product.qty <= 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'}`}>
                  {product.qty} {product.unit}
                </span>
              </div>
            )) : (
              <div className="flex min-h-28 flex-col items-center justify-center text-center">
                <span className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><DashboardIcon name="stock"/></span>
                <p className="text-xs font-semibold text-slate-700">{data ? (isBn ? 'সব পণ্যের স্টক যথেষ্ট' : 'All stock levels are healthy') : '—'}</p>
                <p className="mt-1 text-[10px] text-slate-400">{isBn ? 'এখনই নতুন করে স্টক তুলতে হবে না।' : 'No items need restocking right now.'}</p>
              </div>
            )}
          </div>
          <Link href="/products" className="mt-4 inline-flex text-xs font-semibold text-indigo-600 hover:text-indigo-800">{isBn ? 'ইনভেন্টরি দেখুন' : 'Open inventory'} <span className="ml-1">→</span></Link>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,.035)] sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{isBn ? 'সাম্প্রতিক কাজ' : 'Recent activity'}</p>
            <h3 className="mt-1 font-heading text-sm font-bold text-slate-800 sm:text-base">{t.quickActivity}</h3>
          </div>
          <Link href="/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">{isBn ? 'রিপোর্ট' : 'Reports'} →</Link>
        </div>
        {data?.activity?.length ? (
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {data.activity.slice(0, 4).map((item: any) => (
              <div key={item._id} className="flex items-start gap-3 py-3 first:pt-1 sm:px-3 sm:first:pl-0 sm:py-2">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><DashboardIcon name={item.action?.includes('sale') ? 'sales' : 'invoice'}/></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700">{item.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString(isBn ? 'bn-BD' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-24 flex-col items-center justify-center text-center">
            <DashboardIcon name="chart"/>
            <p className="mt-2 text-xs font-semibold text-slate-600">{data ? (isBn ? 'দেখানোর মতো কোনো কাজ নেই' : 'No activity to display') : (isBn ? 'তথ্য লোড হচ্ছে…' : 'Loading activity…')}</p>
            <p className="mt-1 text-[10px] text-slate-400">{isBn ? 'লেনদেন ও আপডেট এখানে দেখা যাবে।' : 'Transactions and updates will appear here.'}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-medium text-slate-400">{label}</p>
      <b className="mt-1 block font-heading text-base font-bold text-slate-800">{value}</b>
    </div>
  );
}
