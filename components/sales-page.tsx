'use client';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useUIStore } from '@/store/use-ui-store';
import { dict } from '@/lib/i18n';

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

export function SalesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [prodFilter, setProdFilter] = useState('');
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
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
    fetch('/api/products?limit=500')
      .then((r) => r.json())
      .then((x) => setProducts(x.data?.items || []));
    fetch('/api/customers?limit=200')
      .then((r) => r.json())
      .then((x) => setCustomers(x.data?.items || []));
  }

  useEffect(() => {
    loadCatalogAndCustomers();
  }, []);

  async function load() {
    const r = await fetch(`/api/sales?page=${page}&limit=20&q=${encodeURIComponent(q)}`);
    const j = await r.json();
    if (r.ok) setData(j.data);
    else toast.error(j.error);
  }

  useEffect(() => {
    load();
  }, [q, page]);

  async function submit(v: Form) {
    setBusy(true);
    const body = {
      customer: { name: v.name, phone: v.phone, address: v.address },
      items: v.items,
      discount: v.discount,
      paidAmount: v.paidAmount,
      paymentMethod: v.paymentMethod,
    };
    const r = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast.error(j.error);
    toast.success(
      locale === 'bn'
        ? 'বিক্রি সম্পন্ন হয়েছে এবং স্টক আপডেট হয়েছে!'
        : 'Sale completed and stock updated'
    );
    setOpen(false);
    load();
    loadCatalogAndCustomers();
    window.open(`/api/invoices/${j.data._id}`, '_blank');
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
    const r = await fetch(`/api/sales/${s._id}`, { method: 'DELETE' });
    const j = await r.json();
    if (!r.ok) return toast.error(j.error);
    toast.success(locale === 'bn' ? 'বিল রিটার্ন ও স্টক পুনরুদ্ধার হয়েছে' : 'Sale returned & stock restored');
    load();
    loadCatalogAndCustomers();
  }

  const filteredProducts = prodFilter.trim()
    ? products.filter((p) =>
        `${p.name} ${p.brand || ''} ${p.sku || ''} ${p.category || ''}`
          .toLowerCase()
          .includes(prodFilter.toLowerCase())
      )
    : products;

  return (
    <div>
      <div className="mb-4 flex justify-end">
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

      <section className="panel p-3 sm:p-5">
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
              <article key={s._id} className="rounded-xl border border-line bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="block truncate text-xs text-ink">{s.invoiceNumber}</b>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">{s.customerSnapshot?.name || 'Walk-in Customer'}</span>
                  </div>
                  <strong className="shrink-0 text-sm text-blue">৳{Number(s.total).toLocaleString()}</strong>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[11px]">
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
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-4">
          <form
            onSubmit={handleSubmit(submit)}
            className="max-h-[92vh] w-full max-w-3xl space-y-4 overflow-auto rounded-2xl bg-white p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold">
                {locale === 'bn' ? 'নতুন ক্যাশ মেমো / বিক্রি (POS)' : 'Create POS Sale / Cash Memo'}
              </h3>
              <div className="flex items-center gap-2">
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
                    className="field py-1.5 text-xs max-w-[220px]"
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
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="field py-1.5 text-xs max-w-[200px]"
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
                className="grid grid-cols-[1fr_90px_120px_36px] items-end gap-2 max-[550px]:grid-cols-2"
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
