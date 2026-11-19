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

// Clean curve coordinates matching the screenshot
const chartData = [12, 18, 14, 25, 20, 32, 28, 42, 38, 52, 48, 62];

function money(value: number) {
  return `৳${Math.round(value).toLocaleString()}`;
}

function chartPath(points: number[], width: number, height: number) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const paddingX = 12;
  const paddingY = 16;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const coords = points.map((val, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * usableWidth;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return [x, y];
  });

  const polylineStr = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const areaStr = `${polylineStr} ${coords[coords.length - 1][0]},${height} ${coords[0][0]},${height}`;

  return { polylineStr, areaStr, lastCoord: coords[coords.length - 1] };
}

export function DemoDashboard() {
  const [metrics, setMetrics] = useState(startingMetrics);
  const [quotes, setQuotes] = useState(startingQuotes);
  const [updatedAt, setUpdatedAt] = useState('11:57:53 PM');

  useEffect(() => {
    setUpdatedAt(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );

    const timer = setInterval(() => {
      setUpdatedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 20 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const svgWidth = 460;
  const svgHeight = 180;
  const { polylineStr, areaStr } = chartPath(chartData, svgWidth, svgHeight);

  return (
    <div className="demo-dashboard w-full text-slate-800">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-2xl sm:text-[1.75rem] font-black tracking-tight text-[#0F172A]">
              Store overview
            </h2>
            <span className="rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-bold text-[#4F46E5]">
              DEMO
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
            Vaiya-enterprise · Sales and inventory pulse
          </p>
        </div>

        {/* Pulse Refresh Badge */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Demo refreshes every 20 min</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-500">{updatedAt}</span>
        </div>
      </div>

      {/* 4 Big Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-4 mb-6">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.02)] transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
            <p className="mt-2 font-heading text-[1.65rem] font-black tracking-tight text-[#0F172A] leading-none">
              {metric.money ? money(metric.value) : metric.value}
            </p>
            <p
              className={`mt-2.5 flex items-center gap-1 text-[11px] font-bold ${
                metric.favorable ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              <span>{metric.change >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(metric.change).toFixed(1)}%</span>
              <span className="text-slate-400 font-normal">vs last update</span>
            </p>
          </div>
        ))}
      </div>

      {/* Bottom Grid: Left Chart + Right Products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Sales Activity Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading text-base font-bold text-[#0F172A]">Sales activity</h3>
              <p className="mt-0.5 text-xs text-slate-400">Simulated movement · last 12 updates</p>
            </div>
            {/* Today Pill */}
            <div className="rounded-xl bg-[#EEF2FF] px-3.5 py-1.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                TODAY
              </span>
              <span className="block font-heading text-xs font-extrabold text-[#4F46E5] leading-tight">
                {money(metrics[0].value)}
              </span>
            </div>
          </div>

          {/* SVG Area & Polyline Chart */}
          <div className="mt-6 h-48 w-full">
            <svg
              className="h-full w-full overflow-visible"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4338CA" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#4338CA" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Subtle Horizontal Grid lines */}
              {[36, 80, 124, 168].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2={svgWidth}
                  y1={y}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1.5"
                />
              ))}

              {/* Area fill */}
              <polygon points={areaStr} fill="url(#chartGradient)" />

              {/* Crisp blue line */}
              <polyline
                points={polylineStr}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Bottom Time Range */}
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400 font-medium">
            <span>12 updates ago</span>
            <span>Recent</span>
            <span>Now</span>
          </div>
        </div>

        {/* Product Price Pulse Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-[#0F172A] leading-snug">
                  Product <br className="hidden sm:inline" /> price pulse
                </h3>
                <p className="mt-1 text-xs text-slate-400">Sample prices moving up and down</p>
              </div>
              <span className="rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-bold text-[#4F46E5]">
                DEMO
              </span>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100">
              {quotes.map((q) => (
                <div key={q.name} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">{q.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {q.stock} in stock · {q.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-xs font-bold text-[#0F172A]">
                      {money(q.price)}
                    </p>
                    <p
                      className={`text-[11px] font-bold ${
                        q.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {q.change >= 0 ? '↑ +' : '↓ '}
                      {Math.abs(q.change).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
