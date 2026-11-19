'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUIStore } from '@/store/use-ui-store';
import { getCachedJson, invalidateApiCache } from '@/lib/client-api-cache';

export function CustomersPage() {
  const [d, setD] = useState<any>(null);
  const [q, setQ] = useState('');
  const [dueOnly, setDueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [payModal, setPayModal] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const latestLoad = useRef(0);
  const locale = useUIStore((s) => s.locale);

  function load() {
    const requestId = ++latestLoad.current;
    getCachedJson(
      `/api/customers?page=${page}&limit=20&q=${encodeURIComponent(q)}${
        dueOnly ? '&dueOnly=1' : ''
      }`
    )
      .then((x) => { if (requestId === latestLoad.current) setD(x.data); })
      .catch((error) => { if (requestId === latestLoad.current) toast.error(error instanceof Error ? error.message : 'Could not load customers'); });
  }

  useEffect(() => {
    const timer = window.setTimeout(load, q ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [q, page, dueOnly]);

  async function collectDue(e: React.FormEvent) {
    e.preventDefault();
    if (!payModal) return;
    setBusy(true);
    try {
    const r = await fetch(`/api/customers/${payModal._id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), method, note }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return toast.error(j.error);
    invalidateApiCache('/api/customers', '/api/reports', '/api/sales');
    toast.success(
      locale === 'bn'
        ? `৳${Number(amount).toLocaleString()} বাকি আদায় সম্পন্ন হয়েছে!`
        : `Collected ৳${Number(amount).toLocaleString()} due payment!`
    );
    setPayModal(null);
    load();
    } catch {
      toast.error('Could not reach the server. Refresh the ledger before retrying.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="customers-page mx-auto max-w-[1500px] space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:flex">
            <span>{locale === 'bn' ? 'ব্যবসার সারাংশ' : 'Business overview'}</span><span className="text-slate-300">/</span><span>{locale === 'bn' ? 'গ্রাহক খাতা' : 'Customer ledger'}</span>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{locale === 'bn' ? 'গ্রাহক ও বাকি খাতা' : 'Customers & Due Ledger'}</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{locale === 'bn' ? 'গ্রাহকের হিসাব ও বকেয়া আদায় এক জায়গায় রাখুন।' : 'Keep customer balances and due collections in one place.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <CustomerMetric label={locale === 'bn' ? 'মোট গ্রাহক' : 'Total customers'} value={Number(d?.summary?.customers || 0).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} tone="indigo" icon="customers" />
        <CustomerMetric label={locale === 'bn' ? 'বাকি আছে' : 'With outstanding due'} value={Number(d?.summary?.dueCustomers || 0).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} tone="amber" icon="due" />
        <CustomerMetric label={locale === 'bn' ? 'মোট বকেয়া' : 'Outstanding balance'} value={`৳${Number(d?.summary?.totalDue || 0).toLocaleString()}`} tone="rose" icon="balance" />
        <CustomerMetric label={locale === 'bn' ? 'পরিশোধিত হিসাব' : 'Accounts clear'} value={Math.max(0, (d?.summary?.customers || 0) - (d?.summary?.dueCustomers || 0)).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} tone="emerald" icon="clear" />
      </div>

      {/* Top Ledger Metric Card */}
      <div className="hidden">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-100 text-red text-lg font-bold">
            📒
          </div>
          <div>
            <h2 className="font-heading text-sm sm:text-base font-bold text-ink">
              {locale === 'bn' ? 'মোট মার্কেট বকেয়া পাওনা' : 'Total Outstanding Market Due'}
            </h2>
            <p className="text-[11px] text-muted">
              {d?.summary?.dueCustomers || 0} {locale === 'bn' ? 'জন গ্রাহকের নিকট বাকি রয়েছে' : 'customers have pending dues'}
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-1 sm:text-right">
          <span className="text-sm font-bold text-red">৳</span>
          <b className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-red">
            {Number(d?.summary?.totalDue || 0).toLocaleString()}
          </b>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,.035)] sm:p-5">
        <div className="mb-3">
          <h3 className="font-heading text-sm font-bold text-slate-800 sm:text-base">{locale === 'bn' ? 'গ্রাহক তালিকা' : 'Customer register'}</h3>
          <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">{Number(d?.total || 0).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} {locale === 'bn' ? 'টি ফলাফল' : 'customers in this view'}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted text-xs pointer-events-none">
              🔍
            </span>
            <input
              className="field pl-8 py-2 text-xs sm:text-sm"
              placeholder={
                locale === 'bn'
                  ? 'গ্রাহকের নাম, মোবাইল বা ঠিকানা খুঁজুন...'
                  : 'Search by customer name, phone or address...'
              }
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
            />
          </div>

          <button
            type="button"
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition active:scale-[.98] ${
              dueOnly
                ? 'bg-indigo-600 text-white shadow-[0_4px_10px_rgba(79,70,229,.2)]'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => {
              setPage(1);
              setDueOnly(!dueOnly);
            }}
          >
            <span>{dueOnly ? '✓' : '•'}</span>
            <span>{locale === 'bn' ? 'শুধু বাকি আছে যাদের' : 'Due Customers Only'}</span>
          </button>
        </div>

        {/* Mobile-Friendly Cards View (Under 640px) */}
        <div className="block sm:hidden space-y-2">
          {d?.items?.map((c: any) => {
            const hasDue = (c.totalDue || 0) > 0;
            return (
              <div
                key={c._id}
                className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,.035)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <b className="font-heading text-sm text-ink block">{c.name}</b>
                    <span className="text-xs text-muted block">{c.phone || 'মোবাইল নেই'}</span>
                    {c.address && <small className="text-[10px] text-muted block truncate max-w-[200px]">{c.address}</small>}
                  </div>
                  <div className="text-right">
                    {hasDue ? (
                      <span className="inline-block rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600">
                        ৳{Number(c.totalDue).toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        {locale === 'bn' ? 'পরিশোধিত' : 'Clear'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-line/60 pt-2 text-[11px] text-muted">
                  <span>
                    {c.visits} {locale === 'bn' ? 'বার ক্রয়' : 'orders'} • ৳{Number(c.totalSpent || 0).toLocaleString()}
                  </span>

                  {hasDue ? (
                    <button
                      className="inline-flex min-h-8 items-center justify-center rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                      onClick={() => {
                        setPayModal(c);
                        setAmount(String(c.totalDue));
                        setMethod('Cash');
                        setNote('');
                      }}
                    >
                      💰 {locale === 'bn' ? 'আদায়' : 'Collect'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-muted">
                      {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {d && !d.items?.length && (
            <div className="py-8 text-center text-xs text-muted">
              {locale === 'bn' ? 'কোনো গ্রাহকের রেকর্ড পাওয়া যায়নি।' : 'No customers found.'}
            </div>
          )}
        </div>

        {/* Desktop Table View (sm and above) */}
        <div className="hidden overflow-x-auto rounded-xl border border-slate-200 sm:block">
          <table>
            <thead>
              <tr>
                <th>{locale === 'bn' ? 'গ্রাহক' : 'Customer'}</th>
                <th>{locale === 'bn' ? 'যোগাযোগ' : 'Contact & Address'}</th>
                <th>{locale === 'bn' ? 'অর্ডার হিস্টোরি' : 'Orders & Spent'}</th>
                <th>{locale === 'bn' ? 'বাকি টাকা' : 'Due Balance'}</th>
                <th>{locale === 'bn' ? 'সর্বশেষ লেনদেন' : 'Last Purchase'}</th>
                <th className="text-right">{locale === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {d?.items?.map((c: any) => {
                const hasDue = (c.totalDue || 0) > 0;
                return (
                  <tr key={c._id}>
                    <td>
                      <b className="text-ink">{c.name}</b>
                    </td>
                    <td>
                      <div className="font-mono text-xs">{c.phone || '—'}</div>
                      {c.address && <div className="text-xs text-muted truncate max-w-[180px]">{c.address}</div>}
                    </td>
                    <td>
                      <span className="text-xs font-medium">
                        {c.visits} {locale === 'bn' ? 'টি মেমো' : 'visits'} • ৳{Number(c.totalSpent || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      {hasDue ? (
                        <span className="badge bg-rose-50 text-rose-600 font-bold">
                          ৳{Number(c.totalDue).toLocaleString()}
                        </span>
                      ) : (
                        <span className="badge bg-emerald-50 text-emerald-700 font-medium">
                          {locale === 'bn' ? 'পরিশোধিত' : 'No Due'}
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-muted">
                      {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : '—'}
                    </td>
                    <td className="text-right">
                      {hasDue ? (
                        <button
                          className="inline-flex min-h-8 items-center justify-center rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                          onClick={() => {
                            setPayModal(c);
                            setAmount(String(c.totalDue));
                            setMethod('Cash');
                            setNote('');
                          }}
                        >
                          💰 {locale === 'bn' ? 'বাকি আদায়' : 'Collect'}
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {d && !d.items?.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-muted">
                    {locale === 'bn' ? 'কোনো গ্রাহকের রেকর্ড পাওয়া যায়নি।' : 'No customer records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            {locale === 'bn' ? `পৃষ্ঠা ${page} / ${d?.pages || 1}` : `Page ${page} of ${d?.pages || 1}`}
          </span>
          <div className="flex gap-1.5">
            <button
              className="btn-soft py-1 px-2.5 text-xs"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              {locale === 'bn' ? 'পূর্ববর্তী' : 'Prev'}
            </button>
            <button
              className="btn-soft py-1 px-2.5 text-xs"
              disabled={page >= (d?.pages || 1)}
              onClick={() => setPage(page + 1)}
            >
              {locale === 'bn' ? 'পরবর্তী' : 'Next'}
            </button>
          </div>
        </div>
      </section>

      {/* Collect Due Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={collectDue}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-sm space-y-3.5 overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5"
          >
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h3 className="font-heading text-base font-bold text-ink">
                {locale === 'bn' ? 'বাকি টাকা জমা নিন' : 'Collect Due Payment'}
              </h3>
              <button
                type="button"
                className="text-muted hover:text-ink text-sm font-bold"
                onClick={() => setPayModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-red/20 bg-red-50/60 p-3 text-xs">
              <b className="text-sm text-ink block">{payModal.name}</b>
              <span className="text-muted block">{payModal.phone || 'কোনো মোবাইল নম্বর নেই'}</span>
              <div className="mt-1.5 font-bold text-red text-sm">
                {locale === 'bn' ? 'বকেয়া পাওনা:' : 'Current Due:'} ৳
                {Number(payModal.totalDue).toLocaleString()}
              </div>
            </div>

            <label className="block text-xs font-semibold text-ink">
              {locale === 'bn' ? 'জমা টাকার পরিমাণ (৳) *' : 'Amount Received (৳) *'}
              <input
                type="number"
                min="1"
                max={payModal.totalDue}
                step=".01"
                required
                className="field mt-1 text-sm font-bold text-blue"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>

            <label className="block text-xs font-semibold text-ink">
              {locale === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
              <select
                className="field mt-1 text-xs"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="Cash">Cash (নগদ)</option>
                <option value="bKash">bKash (বিকাশ)</option>
                <option value="Nagad">Nagad (নগদ)</option>
                <option value="Bank transfer">Bank Transfer (ব্যাংক)</option>
              </select>
            </label>

            <label className="block text-xs font-semibold text-ink">
              {locale === 'bn' ? 'মন্তব্য / নোট (ঐচ্ছিক)' : 'Note (Optional)'}
              <input
                className="field mt-1 text-xs"
                placeholder={locale === 'bn' ? 'যেমন: আংশিক পরিশোধ' : 'e.g. Partial settlement'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                className="btn-soft py-1.5 px-3 text-xs"
                onClick={() => setPayModal(null)}
              >
                {locale === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button disabled={busy} className="btn-primary py-1.5 px-4 text-xs font-bold">
                {busy
                  ? 'Saving…'
                  : locale === 'bn'
                  ? '✓ জমা নিশ্চিত করুন'
                  : 'Confirm Received'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function CustomerMetric({ label, value, tone, icon }: { label: string; value: string; tone: 'indigo' | 'amber' | 'rose' | 'emerald'; icon: 'customers' | 'due' | 'balance' | 'clear' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_5px_16px_rgba(15,23,42,.025)] sm:p-4">
      <span className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon === 'customers' && <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.5a3.5 3.5 0 0 1 0 6.8M17 14a5.5 5.5 0 0 1 4.5 5.5"/></>}
          {icon === 'due' && <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></>}
          {icon === 'balance' && <><path d="M12 3.5v17M17.5 7.5c0-2-2.1-3.5-5.5-3.5S6.5 5.4 6.5 7.5 8.2 11 12 12s5.5 2 5.5 4.5-2.1 4-5.5 4-5.5-1.5-5.5-4"/></>}
          {icon === 'clear' && <><path d="m5 12 4.5 4.5L19 7"/><circle cx="12" cy="12" r="9"/></>}
        </svg>
      </span>
      <p className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">{label}</p>
      <p className="mt-1 truncate font-heading text-lg font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
    </article>
  );
}
