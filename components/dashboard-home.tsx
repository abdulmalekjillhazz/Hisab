'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useUIStore } from '@/store/use-ui-store';
import { dict } from '@/lib/i18n';
import { getCachedJson } from '@/lib/client-api-cache';

const localKey = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;

export function DashboardHome() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const locale = useUIStore((s) => s.locale);
  const t = dict[locale];

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    getCachedJson(`/api/reports?from=${localKey(d)}&to=${localKey(new Date())}`)
      .then((x) => {
        if (x.error) throw Error(x.error);
        setData(x.data);
      })
      .catch((e) => setError(e.message));
  }, []);

  const s = data?.stats || {};
  const inv = data?.inventory || {};
  const dueSummary = data?.dueSummary || {};
  const symbol = data?.currency === 'USD' ? '$' : '৳';

  return (
    <div className="space-y-4 sm:space-y-5 pb-16 sm:pb-6">
      {error && (
        <div className="rounded-xl border border-red/20 bg-red-50 p-3 text-xs sm:text-sm font-medium text-red">
          Unable to load dashboard: {error}
        </div>
      )}

      {/* Clean KPI Cards Grid - 2 columns on mobile, 5 on desktop */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          label={t.todaySales}
          value={`${symbol}${Number(s.revenue || 0).toLocaleString()}`}
          color="text-blue"
        />
        <Stat
          label={t.todayProfit}
          value={`${symbol}${Number(s.profit || 0).toLocaleString()}`}
          color="text-green"
        />
        <Stat
          label={t.totalMarketDue}
          value={`${symbol}${Number(dueSummary.totalMarketDue || 0).toLocaleString()}`}
          color="text-red"
        />
        <Stat
          label={locale === 'bn' ? 'মোট পণ্য ও স্টক' : 'Stock Units'}
          value={`${inv.count || 0} / ${inv.units || 0}`}
          color="text-purple"
        />
        <div className="col-span-2 sm:col-span-1">
          <Stat
            label={t.lowStockAlerts}
            value={data?.lowStock || 0}
            color="text-orange"
          />
        </div>
      </div>

      {/* Analytics Chart & Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-3 sm:gap-4">
        {/* Sales Trend Chart */}
        <section className="panel">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-ink">{t.salesByMonth}</h3>
            </div>
            <Link href="/reports" className="text-xs font-semibold text-blue hover:underline">
              {locale === 'bn' ? 'রিপোর্ট →' : 'View Reports →'}
            </Link>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthly || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="revenue" name="Sales" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Low Stock & Activity Watch */}
        <section className="panel flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center justify-between border-b border-line pb-2.5">
              <div>
                <h3 className="font-heading text-sm sm:text-base font-bold text-ink">{t.lowStockWatch}</h3>
              </div>
              <Link href="/products" className="text-xs font-bold text-blue hover:underline">
                {locale === 'bn' ? 'পণ্য তালিকা' : 'Inventory'}
              </Link>
            </div>

            {data?.lowStockItems?.length ? (
              <div className="space-y-1.5">
                {data.lowStockItems.slice(0, 3).map((p: any) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between rounded-xl border border-line bg-slate-50/50 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <b className="block truncate text-ink">{p.name}</b>
                      <span className="text-[10px] text-muted">
                        {p.brand ? `${p.brand} • ` : ''}
                        {p.sku || 'No SKU'}
                      </span>
                    </div>
                    <span
                      className={`badge shrink-0 ${
                        p.qty <= 0
                          ? 'bg-red-50 text-red border border-red/20'
                          : 'bg-amber-50 text-orange border border-orange/20'
                      }`}
                    >
                      {p.qty} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-muted font-medium">{t.allStockHealthy}</p>
            )}
          </div>

        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: any;
  sub?: string;
  color: string;
}) {
  return (
    <div className="panel p-3 sm:p-4">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted block truncate">{label}</span>
      <strong className={`mt-1 block text-lg sm:text-2xl font-bold tracking-tight ${color}`}>{value}</strong>
      {sub && <span className="mt-0.5 text-[11px] text-muted block truncate">{sub}</span>}
    </div>
  );
}
