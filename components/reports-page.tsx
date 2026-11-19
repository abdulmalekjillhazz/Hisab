'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { useUIStore } from '@/store/use-ui-store';
import { dict } from '@/lib/i18n';
import { getCachedJson } from '@/lib/client-api-cache';

const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function ReportsPage() {
  const now = new Date();
  const [from, setFrom] = useState(localKey(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(localKey(now));
  const [d, setD] = useState<any>(null);
  const locale = useUIStore((s) => s.locale);
  const t = dict[locale];

  async function load(customFrom = from, customTo = to) {
    try {
      const j = await getCachedJson(`/api/reports?from=${customFrom}&to=${customTo}`);
      setD(j.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load reports');
    }
  }

  useEffect(() => {
    load(from, to);
  }, []);

  function applyRange(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    load(nextFrom, nextTo);
  }

  const sym = d?.currency === 'USD' ? '$' : '৳';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Date Filter & Fast Range Card */}
      <section className="panel p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Inputs */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="shrink-0">{locale === 'bn' ? 'তারিখ:' : 'Date:'}</span>
            <input
              className="field py-1 px-2 text-xs"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-muted shrink-0">—</span>
            <input
              className="field py-1 px-2 text-xs"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <button className="btn-primary py-1 px-2.5 text-xs shrink-0" onClick={() => load(from, to)}>
              {locale === 'bn' ? 'দেখুন' : 'Filter'}
            </button>
          </div>

          {/* Quick Buttons & Export */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
            <button
              className="btn-soft py-1 px-2 text-[11px] sm:text-xs"
              onClick={() => {
                const end = new Date();
                const key = localKey(end);
                applyRange(key, key);
              }}
            >
              {locale === 'bn' ? 'আজ' : 'Today'}
            </button>
            <button
              className="btn-soft py-1 px-2 text-[11px] sm:text-xs"
              onClick={() => {
                const end = new Date();
                const start = new Date(end.getFullYear(), end.getMonth(), 1);
                applyRange(localKey(start), localKey(end));
              }}
            >
              {locale === 'bn' ? 'চলতি মাস' : 'Month'}
            </button>
            <button
              className="btn-soft py-1 px-2 text-[11px] sm:text-xs"
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setMonth(start.getMonth() - 3);
                applyRange(localKey(start), localKey(end));
              }}
            >
              {locale === 'bn' ? '৩ মাস' : '3M'}
            </button>
            <a
              className="btn-accent py-1 px-2.5 text-[11px] sm:text-xs font-bold"
              href={`/api/exports?from=${from}&to=${to}`}
              download
            >
              {locale === 'bn' ? '↓ এক্সপোর্ট' : '↓ CSV'}
            </a>
          </div>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          title={locale === 'bn' ? 'মোট বিক্রি' : 'Total Sales'}
          value={d?.stats?.revenue}
          symbol={sym}
          color="text-blue"
        />
        <Stat
          title={locale === 'bn' ? 'নিট লাভ' : 'Net Profit'}
          value={d?.stats?.profit}
          symbol={sym}
          color={(d?.stats?.profit || 0) < 0 ? 'text-red' : 'text-green'}
        />
        <Stat
          title={locale === 'bn' ? 'নগদ জমা' : 'Cash Received'}
          value={d?.stats?.cash}
          symbol={sym}
          color="text-teal"
          sub={
            d?.stats?.dueCollected > 0
              ? locale === 'bn'
                ? `আদায়: ${sym}${Number(d.stats.dueCollected).toLocaleString()}`
                : `Collected: ${sym}${Number(d.stats.dueCollected).toLocaleString()}`
              : undefined
          }
        />
        <Stat
          title={locale === 'bn' ? 'বাকি বিক্রি' : 'Due Sales'}
          value={d?.stats?.due}
          symbol={sym}
          color="text-red"
        />
        <div className="col-span-2 sm:col-span-1">
          <Stat
            title={locale === 'bn' ? 'মোট মেমো' : 'Invoices'}
            value={d?.stats?.invoices}
            isCount
            color="text-slate-800"
          />
        </div>
      </div>

      {/* Charts & Valuation Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-4">
        {/* Monthly Trend Chart */}
        <section className="panel">
          <div className="mb-2">
            <h3 className="font-heading text-xs sm:text-sm font-bold text-ink">
              {locale === 'bn' ? 'মাসিক বিক্রি ও লাভ' : 'Monthly Sales & Profit'}
            </h3>
          </div>
          <div className="h-48 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d?.monthly || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748B' }} stroke="#CBD5E1" />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} stroke="#CBD5E1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="revenue" name="Sales" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Stock Valuation & Top Sellers */}
        <section className="panel space-y-3">
          <div>
            <h3 className="font-heading text-xs sm:text-sm font-bold text-ink mb-1">
              {locale === 'bn' ? 'স্টক ও পণ্যের মূল্য' : 'Stock Valuation'}
            </h3>

            <Metric
              label={locale === 'bn' ? 'পণ্যের মোট আইটেম' : 'Total Items'}
              value={d?.inventory?.count}
            />
            <Metric
              label={locale === 'bn' ? 'স্টকে মোট ইউনিট' : 'Total Units'}
              value={d?.inventory?.units}
            />
            <Metric
              label={locale === 'bn' ? 'কেনা দামের মোট মূল্য' : 'Total Cost Value'}
              value={`${sym}${Number(d?.inventory?.costValue || 0).toLocaleString()}`}
              raw
            />
            <Metric
              label={locale === 'bn' ? 'বিক্রয় মূল্যের মোট মূল্য' : 'Retail Value'}
              value={`${sym}${Number(d?.inventory?.potentialValue || 0).toLocaleString()}`}
              raw
            />
          </div>

          <div className="pt-2 border-t border-line">
            <h3 className="font-heading text-xs sm:text-sm font-bold text-ink mb-1.5">
              {locale === 'bn' ? 'বেশি বিক্রীত পণ্য' : 'Top Selling Products'}
            </h3>
            {d?.topProducts?.length ? (
              <div className="space-y-1">
                {d.topProducts.map((tp: any) => (
                  <div
                    key={tp._id}
                    className="flex items-center justify-between border-b border-line/60 py-1 text-xs last:border-0"
                  >
                    <span className="font-medium text-ink truncate pr-2">{tp._id}</span>
                    <b className="shrink-0 text-slate-800">
                      {tp.qtySold} sold · {sym}
                      {Number(tp.revenue).toLocaleString()}
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted py-1">
                {locale === 'bn' ? 'কোনো বিক্রি পাওয়া যায়নি।' : 'No sales found.'}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  symbol = '৳',
  isCount = false,
  color = 'text-slate-900',
  sub,
}: {
  title: string;
  value: any;
  symbol?: string;
  isCount?: boolean;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="panel p-2.5 sm:p-3.5">
      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-muted block truncate">
        {title}
      </span>
      <b className={`mt-0.5 block text-base sm:text-2xl font-bold tracking-tight ${color}`}>
        {isCount ? value || 0 : `${symbol}${Number(value || 0).toLocaleString()}`}
      </b>
      {sub && <span className="mt-0.5 block text-[10px] text-muted truncate">{sub}</span>}
    </div>
  );
}

function Metric({ label, value, raw = false }: any) {
  return (
    <div className="flex justify-between border-b border-line/70 py-1.5 text-xs sm:text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <b className="text-ink">{raw ? value : Number(value || 0).toLocaleString()}</b>
    </div>
  );
}
