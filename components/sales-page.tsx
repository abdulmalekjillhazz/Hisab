'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useUIStore } from '@/store/use-ui-store';
import { dict } from '@/lib/i18n';
import { getCachedJson, invalidateApiCache } from '@/lib/client-api-cache';

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.coerce.number().int().min(1),
        unitPrice: z.coerce.number().min(0),
      })
    )
    .min(1),
  discount: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0),
  paymentMethod: z.enum(['Cash', 'bKash', 'Nagad', 'Bank transfer', 'Due / Credit']),
});
type Form = z.infer<typeof schema>;

const localKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function SalesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [prodFilter, setProdFilter] = useState('');
  const [data, setData] = useState<any>(null);
  const [monthReport, setMonthReport] = useState<any>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const latestLoad = useRef(0);
  const locale = useUIStore((s) => s.locale);
  const t = dict[locale];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: 'Walk-in Customer',
      items: [{ productId: '', qty: 1, unitPrice: 0 }],
      discount: 0,
      paidAmount: 0,
      paymentMethod: 'Cash',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items') || [];
  const discount = Number(watch('discount') || 0);
  const paidAmount = Number(watch('paidAmount') || 0);
  const paymentMethod = watch('paymentMethod');

  const subtotal = items.reduce(
    (n, i) => n + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0
  );
  const netTotal = Math.max(0, subtotal - discount);
  const currentDue = Math.max(0, netTotal - paidAmount);

  useEffect(() => {
    if (paymentMethod === 'Due / Credit') {
      setValue('paidAmount', 0);
    } else {
      setValue('paidAmount', netTotal);
    }
  }, [netTotal, paymentMethod, setValue]);

  function loadCatalogAndCustomers() {
    getCachedJson('/api/products?limit=500')
      .then((x) => setProducts(x.data?.items || []))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load products'));
    getCachedJson('/api/customers?limit=200')
      .then((x) => setCustomers(x.data?.items || []))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load customers'));
  }

  useEffect(() => {
    loadCatalogAndCustomers();
  }, []);

  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    getCachedJson(`/api/reports?from=${localKey(start)}&to=${localKey(end)}`)
      .then((result) => setMonthReport(result.data))
      .catch(() => undefined);
  }, []);

  async function load() {
    const requestId = ++latestLoad.current;
    try {
      const j = await getCachedJson(`/api/sales?page=${page}&limit=20&q=${encodeURIComponent(q)}`);
      if (requestId === latestLoad.current) setData(j.data);
    } catch (error) {
      if (requestId === latestLoad.current) toast.error(error instanceof Error ? error.message : 'Could not load sales');
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, q ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [q, page]);

  async function submit(v: Form) {
    setBusy(true);
    // Open during the submit gesture; browsers may block popups opened after fetch.
    const invoiceWindow = window.open('about:blank', '_blank');
    const body = {
      customer: { name: v.name, phone: v.phone, address: v.address },
      items: v.items,
      discount: v.discount,
      paidAmount: v.paidAmount,
      paymentMethod: v.paymentMethod,
    };
    try {
    const r = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast.error(j.error);
    invalidateApiCache('/api/sales', '/api/products', '/api/customers', '/api/reports');
    toast.success(
      locale === 'bn'
        ? 'বিক্রি সম্পন্ন হয়েছে এবং স্টক আপডেট হয়েছে!'
        : 'Sale completed and stock updated'
    );
    setOpen(false);
    load();
    loadCatalogAndCustomers();
    if (invoiceWindow) invoiceWindow.location.href = `/api/invoices/${j.data._id}`;
    else toast.info('Sale saved. Open the invoice from the sales list.');
    } catch {
      invoiceWindow?.close();
      toast.error('Could not reach the server. Refresh sales before retrying.');
    } finally {
      setBusy(false);
    }
  }

  async function returnSale(s: any) {
    if (
      !confirm(
        locale === 'bn'
          ? `ইনভয়েস ${s.invoiceNumber} বাতিল/রিটার্ন করতে চান? (পণ্যের স্টক আবার ফিরে আসবে)`
          : `Return / Cancel invoice ${s.invoiceNumber}? Product stock will be restored.`
      )
    )
      return;
    try {
    const r = await fetch(`/api/sales/${s._id}`, { method: 'DELETE' });
    const j = await r.json();
    if (!r.ok) return toast.error(j.error);
    invalidateApiCache('/api/sales', '/api/products', '/api/customers', '/api/reports');
    toast.success(locale === 'bn' ? 'বিল রিটার্ন ও স্টক পুনরুদ্ধার হয়েছে' : 'Sale returned & stock restored');
    load();
    loadCatalogAndCustomers();
    } catch {
      toast.error('Could not reach the server. Refresh sales and stock before retrying.');
    }
  }

  const filteredProducts = prodFilter.trim()
    ? products.filter((p) =>
        `${p.name} ${p.brand || ''} ${p.sku || ''} ${p.category || ''}`
          .toLowerCase()
          .includes(prodFilter.toLowerCase())
      )
    : products;

  function startNewSale() {
    const firstAvailable = products.find((product) => product.qty > 0) || products[0];
    reset({
      name: locale === 'bn' ? 'খুচরা ক্রেতা' : 'Walk-in Customer',
      phone: '',
      address: '',
      items: [{ productId: firstAvailable?._id || '', qty: 1, unitPrice: firstAvailable?.price || 0 }],
      discount: 0,
      paidAmount: firstAvailable?.price || 0,
      paymentMethod: 'Cash',
    });
    setProdFilter('');
    setOpen(true);
  }

  return (
    <div className="sales-page mx-auto max-w-[1500px] space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:flex">
            <span>{locale === 'bn' ? 'ব্যবসার সারাংশ' : 'Business overview'}</span><span className="text-slate-300">/</span><span>{locale === 'bn' ? 'বিক্রি' : 'Sales'}</span>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{locale === 'bn' ? 'বিক্রি ও ইনভয়েস' : 'Sales & Invoices'}</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{locale === 'bn' ? 'লেনদেন, পেমেন্ট ও ইনভয়েস পরিচালনা করুন।' : 'Manage transactions, payments and customer invoices.'}</p>
        </div>
        <button type="button" onClick={startNewSale} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-[0_4px_10px_rgba(79,70,229,.2)] transition hover:bg-indigo-700">
          <span className="text-base leading-none">+</span>{locale === 'bn' ? 'নতুন বিক্রি' : 'New sale'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <SalesMetric label={locale === 'bn' ? 'এই মাসের বিক্রি' : 'Sales this month'} value={money(monthReport?.stats?.revenue, monthReport?.currency)} tone="indigo" />
        <SalesMetric label={locale === 'bn' ? 'জমা পাওয়া' : 'Payments received'} value={money(monthReport?.stats?.cash, monthReport?.currency)} tone="emerald" />
        <SalesMetric label={locale === 'bn' ? 'বর্তমান বাকি' : 'Outstanding due'} value={money(monthReport?.dueSummary?.totalMarketDue, monthReport?.currency)} tone="rose" />
        <SalesMetric label={locale === 'bn' ? 'এই মাসের ইনভয়েস' : 'Invoices this month'} value={Number(monthReport?.stats?.invoices || 0).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} tone="slate" />
      </div>

      <div className="hidden">
        <button
          className="sales-action-icon sales-action-icon-new"
          title={t.newSale}
          aria-label={t.newSale}
          onClick={() => {
            const firstAvailable = products.find((p) => p.qty > 0) || products[0];
            reset({
              name: locale === 'bn' ? 'খুচরা ক্রেতা' : 'Walk-in Customer',
              phone: '',
              address: '',
              items: [
                {
                  productId: firstAvailable?._id || '',
                  qty: 1,
                  unitPrice: firstAvailable?.price || 0,
                },
              ],
              discount: 0,
              paidAmount: firstAvailable?.price || 0,
              paymentMethod: 'Cash',
            });
            setProdFilter('');
            setOpen(true);
          }}
        >
          🛒
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,.035)] sm:p-5">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:mb-4">
          <div>
            <h3 className="font-heading text-sm font-bold text-slate-800 sm:text-base">{locale === 'bn' ? 'ইনভয়েস তালিকা' : 'Invoice register'}</h3>
            <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">{Number(data?.total || 0).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} {locale === 'bn' ? 'টি ইনভয়েস' : 'invoices'}</p>
          </div>
        </div>
        <div className="relative mb-3 w-full sm:mb-4 sm:max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">⌕</span>
          <input
          className="field w-full pl-9"
          placeholder={
            locale === 'bn'
              ? 'ইনভয়েস নম্বর, ক্রেতার নাম বা ফোন দিয়ে খুঁজুন...'
              : 'Search invoice, customer name or phone...'
          }
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        </div>
        <div className="space-y-2 sm:hidden">
          {data?.items?.map((s: any) => {
            const paid = s.paidAmount !== undefined ? s.paidAmount : s.paymentMethod === 'Due / Credit' ? 0 : s.total;
            const due = s.dueAmount !== undefined ? s.dueAmount : s.paymentMethod === 'Due / Credit' ? s.total : 0;
            return (
              <article key={s._id} className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,.035)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="block truncate text-xs text-ink">{s.invoiceNumber}</b>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">{s.customerSnapshot?.name || 'Walk-in Customer'}</span>
                  </div>
                  <strong className="shrink-0 text-sm text-blue">৳{Number(s.total).toLocaleString()}</strong>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                  <span className="text-muted">{s.items.length} item{ s.items.length !== 1 ? 's' : '' } · {new Date(s.date).toLocaleDateString()}</span>
                  {due > 0 ? <span className="badge bg-red-50 text-red">! ৳{Number(due).toLocaleString()}</span> : <span className="font-semibold text-green">✓ ৳{Number(paid).toLocaleString()}</span>}
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <a className="sales-action-icon sales-action-icon-invoice sales-action-icon-sm" href={`/api/invoices/${s._id}`} target="_blank" title="Open invoice" aria-label="Open invoice">🧾</a>
                  <button type="button" className="sales-action-icon sales-action-icon-return sales-action-icon-sm" onClick={() => returnSale(s)} title="Return sale" aria-label="Return sale">↩</button>
                </div>
              </article>
            );
          })}
          {!data && <p className="py-8 text-center text-xs text-muted">Loading sales…</p>}
          {data && !data.items.length && <p className="py-8 text-center text-xs text-muted">No invoices found.</p>}
        </div>
        <div className="hidden sm:block table-wrap">
          <table>
            <thead>
              <tr>
                <th>{locale === 'bn' ? 'ইনভয়েস' : 'Invoice'}</th>
                <th>{locale === 'bn' ? 'ক্রেতা' : 'Customer'}</th>
                <th>{locale === 'bn' ? 'পণ্য' : 'Items'}</th>
                <th>{locale === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th>{locale === 'bn' ? 'মোট বিল' : 'Total'}</th>
                <th>{locale === 'bn' ? 'জমা / বাকি' : 'Paid / Due'}</th>
                <th>{locale === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((s: any) => {
                const paid =
                  s.paidAmount !== undefined
                    ? s.paidAmount
                    : s.paymentMethod === 'Due / Credit'
                    ? 0
                    : s.total;
                const due =
                  s.dueAmount !== undefined
                    ? s.dueAmount
                    : s.paymentMethod === 'Due / Credit'
                    ? s.total
                    : 0;
                return (
                  <tr key={s._id}>
                    <td>
                      <b>{s.invoiceNumber}</b>
                      <small className="block text-muted">{s.paymentMethod}</small>
                    </td>
                    <td>
                      <b>{s.customerSnapshot?.name}</b>
                      <small className="block text-muted">{s.customerSnapshot?.phone}</small>
                    </td>
                    <td>
                      {s.items.length} item(s)
                      <small className="block text-muted truncate max-w-[200px]">
                        {s.items.map((x: any) => `${x.name} (${x.qty})`).join(', ')}
                      </small>
                    </td>
                    <td>{new Date(s.date).toLocaleDateString()}</td>
                    <td>
                      <b>৳{Number(s.total).toLocaleString()}</b>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-green">
                        {locale === 'bn' ? 'জমা:' : 'Paid:'} ৳{Number(paid).toLocaleString()}
                      </span>
                      {due > 0 && (
                        <span className="mt-0.5 block badge bg-red-100 text-red">
                          {locale === 'bn' ? 'বাকি:' : 'Due:'} ৳{Number(due).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="space-x-1 whitespace-nowrap">
                      <a
                        className="sales-action-icon sales-action-icon-invoice sales-action-icon-sm"
                        href={`/api/invoices/${s._id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open invoice"
                        aria-label="Open invoice"
                      >
                        🧾
                      </a>
                      <button
                        type="button"
                        className="ml-1 sales-action-icon sales-action-icon-return sales-action-icon-sm"
                        onClick={() => returnSale(s)}
                        title="Return sale"
                        aria-label="Return sale"
                      >
                        ↩
                      </button>
                    </td>
                  </tr>
                );
              }) || (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted">
                    Loading sales…
                  </td>
                </tr>
              )}
              {data && !data.items.length && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 sm:mt-4 sm:gap-3">
          <button className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-sm text-slate-600 disabled:opacity-40" title="Previous page" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ←
          </button>
          <button
            className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-sm text-slate-600 disabled:opacity-40"
            title="Next page"
            aria-label="Next page"
            disabled={page >= (data?.pages || 1)}
            onClick={() => setPage(page + 1)}
          >
            →
          </button>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit(submit)}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl space-y-4 overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold">
                {locale === 'bn' ? 'নতুন ক্যাশ মেমো / বিক্রি (POS)' : 'Create POS Sale / Cash Memo'}
              </h3>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                <button
                  type="button"
                  className="btn-soft text-xs"
                  onClick={() => {
                    setValue('name', locale === 'bn' ? 'খুচরা ক্রেতা' : 'Walk-in Customer');
                    setValue('phone', '');
                    setValue('address', '');
                  }}
                >
                  ⚡ {t.walkInCustomer}
                </button>
                {customers.length > 0 && (
                  <select
                    className="field min-w-0 w-full max-w-full py-1.5 text-xs sm:w-[220px] sm:max-w-[220px]"
                    onChange={(e) => {
                      const c = customers.find((x) => x._id === e.target.value);
                      if (c) {
                        setValue('name', c.name);
                        setValue('phone', c.phone || '');
                        setValue('address', c.address || '');
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">
                      {locale === 'bn' ? 'পুরনো গ্রাহক সিলেক্ট করুন...' : 'Select saved customer...'}
                    </option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}{' '}
                        {c.totalDue > 0 ? `[Due: ৳${c.totalDue}]` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 max-[650px]:grid-cols-1">
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'ক্রেতার নাম *' : 'Customer name *'}
                <input className="field mt-1" {...register('name')} />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'মোবাইল নম্বর' : 'Phone number'}
                <input
                  className="field mt-1"
                  placeholder="017XXXXXXXX"
                  {...register('phone')}
                />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'ঠিকানা' : 'Address'}
                <input className="field mt-1" {...register('address')} />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              <b>{locale === 'bn' ? 'বিক্রিত পণ্যের তালিকা' : 'Sale Items'}</b>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                <input
                  type="text"
                  className="field min-w-0 w-full max-w-full flex-1 py-1.5 text-xs sm:w-[200px] sm:max-w-[200px]"
                  placeholder={locale === 'bn' ? 'পণ্য ফিল্টার করুন...' : 'Filter products...'}
                  value={prodFilter}
                  onChange={(e) => setProdFilter(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-soft text-xs"
                  onClick={() => append({ productId: '', qty: 1, unitPrice: 0 })}
                >
                  ＋ {locale === 'bn' ? 'আরও পণ্য' : 'Add item'}
                </button>
              </div>
            </div>

            {fields.map((f, i) => (
              <div
                key={f.id}
                className="grid min-w-0 grid-cols-2 items-end gap-2 min-[551px]:grid-cols-[minmax(0,1fr)_90px_120px_36px]"
              >
                <label className="text-xs font-bold text-muted">
                  {locale === 'bn' ? 'পণ্য' : 'Product'}
                  <select
                    className="field mt-1"
                    {...register(`items.${i}.productId`)}
                    onChange={(e) => {
                      const p = products.find((x) => x._id === e.target.value);
                      setValue(`items.${i}.productId`, e.target.value);
                      if (p) setValue(`items.${i}.unitPrice`, p.price);
                    }}
                  >
                    <option value="">
                      {locale === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Choose product'}
                    </option>
                    {filteredProducts.map((p) => (
                      <option key={p._id} value={p._id} disabled={p.qty <= 0}>
                        {p.name} {p.brand ? `(${p.brand})` : ''} · ৳{p.price} · [{p.qty} {p.unit}]
                        {p.warranty && p.warranty !== 'No Warranty' ? ` · ${p.warranty}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-muted">
                  {locale === 'bn' ? 'পরিমাণ' : 'Qty'}
                  <input type="number" min="1" className="field mt-1" {...register(`items.${i}.qty`)} />
                </label>
                <label className="text-xs font-bold text-muted">
                  {locale === 'bn' ? 'দর (৳)' : 'Unit price'}
                  <input
                    type="number"
                    min="0"
                    step=".01"
                    className="field mt-1"
                    {...register(`items.${i}.unitPrice`)}
                  />
                </label>
                <button
                  type="button"
                  className="btn-soft"
                  disabled={fields.length === 1}
                  onClick={() => remove(i)}
                >
                  ×
                </button>
              </div>
            ))}

            <div className="grid grid-cols-3 gap-3 border-t border-line pt-3 max-[650px]:grid-cols-1">
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'ডিসকাউন্ট / ছাড় (৳)' : 'Discount (৳)'}
                <input
                  type="number"
                  min="0"
                  step=".01"
                  className="field mt-1"
                  {...register('discount')}
                />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                <select className="field mt-1" {...register('paymentMethod')}>
                  <option value="Cash">Cash (নগদ)</option>
                  <option value="bKash">bKash (বিকাশ)</option>
                  <option value="Nagad">Nagad (নগদ অ্যাপ)</option>
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Due / Credit">Due / Credit (পূর্ণ বাকি)</option>
                </select>
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'নগদ জমা (Paid Amount ৳)' : 'Cash Paid Now (৳)'}
                <input
                  type="number"
                  min="0"
                  step=".01"
                  className="field mt-1"
                  {...register('paidAmount')}
                />
              </label>
            </div>

            {Object.keys(errors).length > 0 && (
              <p className="text-sm text-red">Please fill in all required fields.</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bg p-4">
              <div className="text-sm">
                <span>Subtotal: ৳{subtotal.toLocaleString()}</span>
                <span className="mx-2">·</span>
                <span>Discount: ৳{discount.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <b className="text-base">
                  {locale === 'bn' ? 'মোট বিল:' : 'Net Total:'} ৳{netTotal.toLocaleString()}
                </b>
                <div className="text-xs font-bold">
                  <span className="text-green">
                    {locale === 'bn' ? 'নগদ জমা:' : 'Paid:'} ৳{paidAmount.toLocaleString()}
                  </span>
                  {' · '}
                  <span className={currentDue > 0 ? 'text-red' : 'text-muted'}>
                    {locale === 'bn' ? 'বাকি থাকবে:' : 'Balance Due:'} ৳{currentDue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-soft" onClick={() => setOpen(false)}>
                {locale === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button disabled={busy || !products.length} className="btn-primary">
                {busy
                  ? 'Saving…'
                  : locale === 'bn'
                  ? 'বিল সম্পন্ন ও ক্যাশ মেমো প্রিন্ট করুন'
                  : 'Complete sale & invoice'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function money(value: number | undefined, currency?: string) {
  return `${currency === 'USD' ? '$' : '৳'}${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function SalesMetric({ label, value, tone }: { label: string; value: string; tone: 'indigo' | 'emerald' | 'rose' | 'slate' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_5px_16px_rgba(15,23,42,.025)] sm:p-4">
      <span className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {tone === 'indigo' && <><path d="M4 17.5 9 12l3.5 3.5L20 7"/><path d="M14.5 7H20v5.5M4 4v16h16"/></>}
          {tone === 'emerald' && <><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3.5 9h17M8 14h.01M12 14h4"/></>}
          {tone === 'rose' && <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></>}
          {tone === 'slate' && <><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z"/><path d="M9 8h6M9 12h6"/></>}
        </svg>
      </span>
      <p className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">{label}</p>
      <p className="mt-1 truncate font-heading text-lg font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
    </article>
  );
}
