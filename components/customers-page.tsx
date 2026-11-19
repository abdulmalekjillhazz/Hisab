'use client';

import { useEffect, useState } from 'react';
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
  const locale = useUIStore((s) => s.locale);

  function load() {
    getCachedJson(
      `/api/customers?page=${page}&limit=20&q=${encodeURIComponent(q)}${
        dueOnly ? '&dueOnly=1' : ''
      }`
    )
      .then((x) => setD(x.data))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load customers'));
  }

  useEffect(() => {
    load();
  }, [q, page, dueOnly]);

  async function collectDue(e: React.FormEvent) {
    e.preventDefault();
    if (!payModal) return;
    setBusy(true);
    const r = await fetch(`/api/customers/${payModal._id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), method, note }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast.error(j.error);
    invalidateApiCache('/api/customers', '/api/reports', '/api/sales');
    toast.success(
      locale === 'bn'
        ? `৳${Number(amount).toLocaleString()} বাকি আদায় সম্পন্ন হয়েছে!`
        : `Collected ৳${Number(amount).toLocaleString()} due payment!`
    );
    setPayModal(null);
    load();
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Ledger Metric Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-red/20 bg-gradient-to-r from-red/5 via-white to-red/10 p-3.5 sm:p-4 shadow-sm">
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
      <section className="panel p-3 sm:p-4">
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
            className={`py-2 px-3 text-xs sm:text-sm rounded-xl font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 ${
              dueOnly
                ? 'bg-red text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
                className="rounded-xl border border-line bg-white p-3 space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <b className="font-heading text-sm text-ink block">{c.name}</b>
                    <span className="text-xs text-muted block">{c.phone || 'মোবাইল নেই'}</span>
                    {c.address && <small className="text-[10px] text-muted block truncate max-w-[200px]">{c.address}</small>}
                  </div>
                  <div className="text-right">
                    {hasDue ? (
                      <span className="inline-block rounded-md bg-red-50 border border-red/20 px-2 py-0.5 text-xs font-bold text-red">
                        ৳{Number(c.totalDue).toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-block rounded-md bg-green-50 text-green px-2 py-0.5 text-[11px] font-semibold">
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
                      className="btn-primary py-1 px-3 text-xs font-bold"
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
        <div className="hidden sm:block table-wrap">
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
                        <span className="badge bg-red-50 text-red border border-red/20 font-bold">
                          ৳{Number(c.totalDue).toLocaleString()}
                        </span>
                      ) : (
                        <span className="badge bg-green-50 text-green font-medium">
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
                          className="btn-primary py-1 px-3 text-xs font-bold"
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
        <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-muted">
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
            className="max-h-[calc(100dvh-2rem)] w-full max-w-sm space-y-3.5 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-4 shadow-2xl sm:p-5"
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
