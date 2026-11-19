'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { useUIStore } from '@/store/use-ui-store';
import { getCachedJson } from '@/lib/client-api-cache';

type ReportData = {
  currency: 'BDT' | 'USD';
  period: { from: string; to: string };
  stats: { revenue: number; profit: number; cash: number; due: number; invoices: number };
  monthly: Array<{ _id: string; revenue: number; profit: number }>;
  inventory: { count: number; units: number; costValue: number; potentialValue: number };
  lowStock: number;
  topProducts: Array<{ _id: string; qtySold: number; revenue: number }>;
  activity: Array<{ _id: string; action: string; message: string; createdAt: string }>;
};

const localKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function dateLabel(value: string, locale: string) {
  if (!value) return '';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function ReportIcon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'calendar':
      return <svg {...common}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" /></svg>;
    case 'sales':
      return <svg {...common}><path d="M4 17.5 9 12l3.5 3.5L20 7" /><path d="M14.5 7H20v5.5" /><path d="M4 4v16h16" /></svg>;
    case 'profit':
      return <svg {...common}><path d="M12 3.5v17M17.5 7.5c0-2-2.1-3.5-5.5-3.5S6.5 5.4 6.5 7.5 8.2 11 12 12s5.5 2 5.5 4.5-2.1 4-5.5 4-5.5-1.5-5.5-4" /></svg>;
    case 'cash':
      return <svg {...common}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3.5 9h17M8 14h.01M12 14h4" /></svg>;
    case 'due':
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg>;
    case 'invoice':
      return <svg {...common}><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>;
    case 'inventory':
      return <svg {...common}><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9z" /><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 21v-8.8M8 5.1l8.3 4.6" /></svg>;
    case 'download':
      return <svg {...common}><path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4 17v3h16v-3" /></svg>;
    case 'trend':
      return <svg {...common}><path d="M4 17 9 12l3.5 3.5L20 8" /><path d="M14.5 8H20v5.5" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4M12 16h.01" /></svg>;
  }
}

export function ReportsPage() {
  const now = new Date();
  const [from, setFrom] = useState(localKey(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(localKey(now));
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<'today' | 'month' | '3m'>('month');
  const locale = useUIStore((state) => state.locale);
  const isBn = locale === 'bn';
  const symbol = data?.currency === 'USD' ? '$' : '৳';

  async function load(start = from, end = to) {
    setLoading(true);
    try {
      const result = await getCachedJson(`/api/reports?from=${start}&to=${end}`);
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(from, to);
    // Load the initial reporting period once when the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyRange(start: string, end: string, preset: 'today' | 'month' | '3m' | null = null) {
    if (start > end) {
      toast.error(isBn ? 'শুরুর তারিখ শেষের তারিখের পরে হতে পারে না' : 'Start date must be before the end date');
      return;
    }
    setFrom(start);
    setTo(end);
    setActiveRange(preset || 'month');
    void load(start, end);
  }

  function selectPreset(preset: 'today' | 'month' | '3m') {
    const end = new Date();
    if (preset === 'today') {
      const day = localKey(end);
      applyRange(day, day, preset);
      return;
    }
    const start = preset === 'month'
      ? new Date(end.getFullYear(), end.getMonth(), 1)
      : new Date(end.getFullYear(), end.getMonth() - 2, 1);
    applyRange(localKey(start), localKey(end), preset);
  }

  const amount = (value: number | undefined) =>
    `${symbol}${Number(value || 0).toLocaleString(isBn ? 'bn-BD' : 'en-US', { maximumFractionDigits: 0 })}`;
  const periodLabel = `${dateLabel(from, locale)} – ${dateLabel(to, locale)}`;

  const stats = [
    {
      key: 'revenue',
      title: isBn ? 'মোট বিক্রি' : 'Total sales',
      value: amount(data?.stats.revenue),
      icon: 'sales',
      color: 'text-indigo-600',
      tint: 'bg-indigo-50',
    },
    {
      key: 'profit',
      title: isBn ? 'নিট লাভ' : 'Net profit',
      value: amount(data?.stats.profit),
      icon: 'profit',
      color: (data?.stats.profit || 0) < 0 ? 'text-rose-500' : 'text-emerald-600',
      tint: 'bg-emerald-50',
    },
    {
      key: 'cash',
      title: isBn ? 'জমা পাওয়া' : 'Cash received',
      value: amount(data?.stats.cash),
      icon: 'cash',
      color: 'text-emerald-600',
      tint: 'bg-emerald-50',
    },
    {
      key: 'due',
      title: isBn ? 'বাকি বিক্রি' : 'Due sales',
      value: amount(data?.stats.due),
      icon: 'due',
      color: 'text-rose-500',
      tint: 'bg-rose-50',
    },
    {
      key: 'invoices',
      title: isBn ? 'ইনভয়েস' : 'Invoices',
      value: Number(data?.stats.invoices || 0).toLocaleString(isBn ? 'bn-BD' : 'en-US'),
      icon: 'invoice',
      color: 'text-slate-900',
      tint: 'bg-slate-100',
    },
  ];

  return (
    <div className="reports-page mx-auto max-w-[1500px] space-y-5 pb-8 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:flex">
            <span>{isBn ? 'ব্যবসার রিপোর্ট' : 'Business overview'}</span>
            <span className="text-slate-300">/</span>
            <span>{isBn ? 'বিশ্লেষণ' : 'Analytics'}</span>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isBn ? 'রিপোর্ট' : 'Reports'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {isBn ? 'এক জায়গায় ব্যবসার সব হিসাব দেখুন।' : 'Monitor your business performance in one place.'}
          </p>
        </div>
        <span className="hidden rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200 sm:inline-flex">
          {isBn ? 'নির্বাচিত সময়' : 'Selected period'} · {periodLabel}
        </span>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-4">
        <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {isBn ? 'রিপোর্টের সময়সীমা' : 'Reporting period'}
        </div>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <label className="relative min-w-0 flex-1 sm:flex-none">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><ReportIcon name="calendar" className="h-4 w-4" /></span>
              <input
                aria-label={isBn ? 'শুরুর তারিখ' : 'Start date'}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50 sm:w-[168px] sm:text-sm"
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <span className="shrink-0 text-slate-400">→</span>
            <label className="relative min-w-0 flex-1 sm:flex-none">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><ReportIcon name="calendar" className="h-4 w-4" /></span>
              <input
                aria-label={isBn ? 'শেষের তারিখ' : 'End date'}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50 sm:w-[168px] sm:text-sm"
                type="date"
                value={to}
                min={from}
                max={localKey(new Date())}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 xl:flex xl:items-center">
            <div className="col-span-3 grid grid-cols-3 rounded-xl bg-slate-100 p-1 xl:col-span-1 xl:w-[250px]">
              {(['today', 'month', '3m'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={`h-9 rounded-lg text-xs font-semibold transition ${activeRange === preset ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {preset === 'today' ? (isBn ? 'আজ' : 'Today') : preset === 'month' ? (isBn ? 'মাস' : 'Month') : '3M'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => applyRange(from, to)}
              disabled={loading}
              className="col-span-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white shadow-[0_4px_10px_rgba(79,70,229,0.2)] transition hover:bg-indigo-700 disabled:opacity-60 xl:col-span-1 xl:h-11 xl:min-w-[150px]"
            >
              <ReportIcon name="trend" className="h-4 w-4" />
              {loading ? (isBn ? 'লোড হচ্ছে…' : 'Loading…') : (isBn ? 'ফিল্টার' : 'Filter')}
            </button>
            <a
              className="col-span-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 xl:col-span-1 xl:h-11 xl:min-w-[150px]"
              href={`/api/exports?from=${from}&to=${to}`}
              download
            >
              <ReportIcon name="download" className="h-4 w-4" />
              {isBn ? 'CSV এক্সপোর্ট' : 'Export CSV'}
            </a>
          </div>
        </div>
      </section>

      <section aria-label={isBn ? 'আর্থিক সারাংশ' : 'Financial overview'}>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="font-heading text-sm font-semibold text-slate-800 sm:text-base">
            {isBn ? 'আর্থিক সারাংশ' : 'Financial overview'}
          </h3>
          <span className="text-[10px] font-medium text-slate-400 sm:text-xs">{periodLabel}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <article key={stat.key} className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_5px_16px_rgba(15,23,42,0.025)] transition hover:-translate-y-0.5 hover:shadow-md sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${stat.tint} ${stat.color}`}>
                  <ReportIcon name={stat.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-400">→</span>
              </div>
              <p className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">{stat.title}</p>
              <p className={`mt-1 truncate font-heading text-lg font-bold tracking-tight sm:text-2xl ${stat.color}`}>
                {loading && !data ? '—' : stat.value}
              </p>
              <p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">{isBn ? 'নির্বাচিত সময়' : 'Selected period'}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1.45fr_1fr]">
        <section className="min-h-[330px] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{isBn ? 'পারফরম্যান্স' : 'Performance tracking'}</p>
              <h3 className="mt-1 font-heading text-base font-bold text-slate-800 sm:text-lg">
                {isBn ? 'মাসিক বিক্রি ও লাভ' : 'Monthly sales & profit'}
              </h3>
            </div>
            <div className="flex gap-3 pt-1 text-[10px] font-medium text-slate-500 sm:text-xs">
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-indigo-500" />{isBn ? 'বিক্রি' : 'Sales'}</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" />{isBn ? 'লাভ' : 'Profit'}</span>
            </div>
          </div>
          <div className="h-[250px] sm:h-[275px]">
            {data?.monthly?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly} margin={{ top: 12, right: 4, left: -17, bottom: 0 }} barGap={5}>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e8edf5" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8b98ad' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8b98ad' }} tickFormatter={(value) => `${symbol}${Number(value).toLocaleString()}`} />
                  <Tooltip
                    cursor={{ fill: '#f5f7ff' }}
                    formatter={(value: number, name: string) => [amount(value), name === 'revenue' ? (isBn ? 'বিক্রি' : 'Sales') : (isBn ? 'লাভ' : 'Profit')]}
                    contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 30px rgba(15,23,42,.08)', fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" name="revenue" fill="#4f5ff2" radius={[5, 5, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="profit" name="profit" fill="#10a783" radius={[5, 5, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500"><ReportIcon name="sales" className="h-7 w-7" /></span>
                <p className="text-sm font-semibold text-slate-700">{isBn ? 'এখনো বিক্রির তথ্য নেই' : 'No sales data yet'}</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">{isBn ? 'বিক্রি রেকর্ড হলে এখানে বিশ্লেষণ দেখা যাবে।' : 'Insights will appear here when transactions are recorded.'}</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{isBn ? 'স্টকের সারাংশ' : 'Inventory snapshot'}</p>
              <h3 className="mt-1 font-heading text-base font-bold text-slate-800 sm:text-lg">
                {isBn ? 'স্টকের মূল্য' : 'Stock valuation'}
              </h3>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-500"><ReportIcon name="inventory" className="h-6 w-6" /></span>
          </div>
          <div className="divide-y divide-slate-100">
            <InventoryRow label={isBn ? 'মোট আইটেম' : 'Total items'} value={Number(data?.inventory.count || 0).toLocaleString(isBn ? 'bn-BD' : 'en-US')} />
            <InventoryRow label={isBn ? 'মোট ইউনিট' : 'Total units'} value={Number(data?.inventory.units || 0).toLocaleString(isBn ? 'bn-BD' : 'en-US')} />
            <InventoryRow label={isBn ? 'ক্রয়মূল্য' : 'Total cost value'} value={amount(data?.inventory.costValue)} />
            <InventoryRow label={isBn ? 'সম্ভাব্য বিক্রয়মূল্য' : 'Potential selling value'} value={amount(data?.inventory.potentialValue)} />
          </div>
          <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${data?.lowStock ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <span className={`h-2 w-2 rounded-full ${data?.lowStock ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {loading && !data
              ? (isBn ? 'স্টক যাচাই হচ্ছে…' : 'Checking inventory…')
              : data?.lowStock
                ? (isBn ? `${data.lowStock}টি পণ্যের স্টক কম` : `${data.lowStock} item${data.lowStock === 1 ? '' : 's'} need restocking`)
                : (isBn ? 'স্টক ঠিক আছে' : 'Inventory up to date')}
          </div>
          {data?.topProducts?.length ? (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h4 className="mb-2 text-xs font-semibold text-slate-700">{isBn ? 'সেরা বিক্রিত পণ্য' : 'Top selling products'}</h4>
              <div className="space-y-2">
                {data.topProducts.slice(0, 3).map((product) => (
                  <div key={product._id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate text-slate-500">{product._id}</span>
                    <b className="shrink-0 text-slate-700">{product.qtySold} · {amount(product.revenue)}</b>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{isBn ? 'সাম্প্রতিক কাজ' : 'Recent activity'}</p>
            <h3 className="mt-1 font-heading text-sm font-bold text-slate-800 sm:text-base">{isBn ? 'দোকানের আপডেট' : 'Shop updates'}</h3>
          </div>
          <span className="text-xs text-slate-400">{isBn ? 'সাম্প্রতিক' : 'Latest'}</span>
        </div>
        {data?.activity?.length ? (
          <div className="divide-y divide-slate-100">
            {data.activity.slice(0, 5).map((item) => (
              <div key={item._id} className="flex items-start gap-3 py-3 first:pt-1 last:pb-0">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><ReportIcon name={item.action.includes('sale') ? 'sales' : 'inventory'} className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700">{item.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString(isBn ? 'bn-BD' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-24 flex-col items-center justify-center text-center">
            <ReportIcon name="trend" className="mb-2 h-6 w-6 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">{isBn ? 'দেখানোর মতো কোনো কাজ নেই' : 'No activity to display'}</p>
            <p className="mt-1 text-[10px] text-slate-400">{isBn ? 'লেনদেন হলে এখানে দেখা যাবে।' : 'Transactions and updates will appear here.'}</p>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-2 px-1 text-[10px] leading-relaxed text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
        <span className="inline-flex items-center gap-1.5"><ReportIcon name="due" className="h-3.5 w-3.5" />{isBn ? 'নির্বাচিত সময়ের হিসাব' : 'Showing data for the selected reporting period'}</span>
        <span className="sm:text-right">{isBn ? `মুদ্রা: ${data?.currency === 'USD' ? 'USD ($)' : 'BDT (৳)'}` : `Amounts in ${data?.currency || 'BDT'} (${symbol})`}</span>
      </div>
    </div>
  );
}

function InventoryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-xs sm:text-sm">
      <span className="text-slate-500">{label}</span>
      <b className="text-right font-semibold text-slate-800">{value}</b>
    </div>
  );
}
