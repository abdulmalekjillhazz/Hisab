'use client';

import { useEffect, useState } from 'react';

type Metric = {
  label: string;
  value: number;
  change: number;
  favorable: boolean;
  money?: boolean;
};

type Quote = {
  name: string;
  unit: string;
  price: number;
  change: number;
  stock: number;
};

const startingMetrics: Metric[] = [
  { label: "Today's sales", value: 24850, change: 1.8, favorable: true, money: true },
  { label: 'Gross profit', value: 4920, change: 2.4, favorable: true, money: true },
  { label: 'Invoices', value: 36, change: 5.6, favorable: true },
  { label: 'Due balance', value: 12600, change: 0.7, favorable: false, money: true },
];

const startingQuotes: Quote[] = [
  { name: 'Copper wire 1.5 mm', unit: 'per coil', price: 6850, change: 0.8, stock: 24 },
  { name: 'LED bulb 12W', unit: 'per piece', price: 125, change: -0.4, stock: 42 },
  { name: 'MCB breaker 32A', unit: 'per piece', price: 550, change: 1.2, stock: 18 },
  { name: 'Ceiling fan 56 in', unit: 'per piece', price: 3450, change: 0.3, stock: 7 },
];

const startingSeries = [31, 38, 34, 48, 43, 56, 51, 67, 61, 73, 69, 82];

function money(value: number) {
  return `৳${Math.round(value).toLocaleString()}`;
}

function nextPrice(price: number) {
  const direction = Math.random() < 0.5 ? -1 : 1;
  const amount = Math.max(1, Math.round(price * (0.0003 + Math.random() * 0.0014)));
  return price + direction * amount;
}

function chartPoints(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((value, index) => {
    const x = 8 + (index / Math.max(1, values.length - 1)) * 584;
    const y = 190 - ((value - min) / span) * 164;
    return `${x},${y}`;
  }).join(' ');
}

export function DemoDashboard() {
  const [metrics, setMetrics] = useState(startingMetrics);
  const [quotes, setQuotes] = useState(startingQuotes);
  const [series, setSeries] = useState(startingSeries);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    setUpdatedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const timer = window.setInterval(() => {
      setMetrics((current) => {
        const next = current.map((metric, index) => {
          const direction = Math.random() < 0.48 ? -1 : 1;
          const amount = index === 2 ? (Math.random() < 0.35 ? 1 : 0) : Math.max(1, Math.round(metric.value * (0.0002 + Math.random() * 0.001)));
          const change = Number((direction * (0.1 + Math.random() * 1.2)).toFixed(1));
          return {
            ...metric,
            value: Math.max(0, metric.value + direction * amount),
            change,
            favorable: metric.label === 'Due balance' ? direction < 0 : direction > 0,
          };
        });
        return next;
      });
      setSeries((values) => {
        const previous = values[values.length - 1] || 1;
        const movement = Math.max(1, Math.round(previous * (0.0002 + Math.random() * 0.002)));
        return [...values.slice(1), Math.max(0, previous + (Math.random() < 0.48 ? -movement : movement))];
      });
      setQuotes((current) => current.map((quote) => {
        const price = nextPrice(quote.price);
        return {
          ...quote,
          price,
          change: Number((((price - quote.price) / quote.price) * 100).toFixed(2)),
        };
      }));
      setUpdatedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 20 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const points = chartPoints(series);
  const lastPoint = points.split(' ').pop()?.split(',') || ['592', '100'];
  const area = `${points} 592,204 8,204`;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-2 sm:px-8 sm:pb-14 lg:px-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Store overview</h1>
            <span className="rounded-lg border border-teal/15 bg-teal/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">Demo</span>
          </div>
          <p className="mt-1 text-sm text-muted">Ashik Electric · Sales and inventory pulse</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green" />
          </span>
          <span>Demo refreshes every 20 min</span>
          {updatedAt && <span className="hidden border-l border-line pl-2 sm:inline">{updatedAt}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-line/80 bg-white p-3.5 shadow-card transition-shadow hover:shadow-md sm:p-5">
            <p className="truncate text-xs font-semibold text-muted sm:text-sm">{metric.label}</p>
            <p className="mt-2 truncate font-heading text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {metric.money ? money(metric.value) : metric.value.toLocaleString()}
            </p>
            <p className={`mt-2 flex items-center gap-1 text-xs font-bold ${metric.favorable ? 'text-green' : 'text-red'}`}>
              <span aria-hidden="true">{metric.change >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(metric.change).toFixed(1)}%</span>
              <span className="font-medium text-muted">vs last update</span>
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_.85fr]">
        <section className="rounded-2xl border border-line/80 bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-bold sm:text-lg">Sales activity</h2>
              <p className="mt-1 text-xs text-muted">Simulated movement · last 12 updates</p>
            </div>
            <div className="rounded-xl bg-teal/5 px-3 py-2 text-right">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted">Today</span>
              <strong className="text-sm text-teal">{money(metrics[0].value)}</strong>
            </div>
          </div>
          <div className="mt-5 h-52 sm:h-64">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label="Simulated sales trend chart">
              <defs>
                <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity=".22" />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[44, 92, 140, 188].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />)}
              <polygon points={area} fill="url(#salesFill)" />
              <polyline points={points} fill="none" stroke="#0f766e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={lastPoint[0]} cy={lastPoint[1]} r="5" fill="#0f766e" stroke="white" strokeWidth="3" />
            </svg>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-[11px] text-muted">
            <span>12 updates ago</span><span>Recent</span><span>Now</span>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-line/80 bg-white shadow-card">
          <div className="flex items-start justify-between border-b border-line px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-heading text-base font-bold sm:text-lg">Product price pulse</h2>
              <p className="mt-1 text-xs text-muted">Sample prices moving up and down</p>
            </div>
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">Demo</span>
          </div>
          <div className="divide-y divide-line/70">
            {quotes.map((quote) => (
              <div key={quote.name} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{quote.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{quote.stock} in stock · {quote.unit}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-heading text-sm font-bold tabular-nums text-ink">{money(quote.price)}</p>
                  <p className={`mt-0.5 text-xs font-bold tabular-nums ${quote.change >= 0 ? 'text-green' : 'text-red'}`}>
                    {quote.change >= 0 ? '↑ +' : '↓ '}{quote.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-line bg-slate-50/70 px-4 py-3 text-[11px] leading-5 text-muted sm:px-5">
            Values are simulated for preview. Your account dashboard uses your saved shop data.
          </p>
        </section>
      </div>
    </section>
  );
}
