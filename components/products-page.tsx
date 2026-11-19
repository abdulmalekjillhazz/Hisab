'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useUIStore } from '@/store/use-ui-store';
import { dict } from '@/lib/i18n';
import { getCachedJson, invalidateApiCache } from '@/lib/client-api-cache';

const schema = z.object({
  name: z.string().min(1),
  brand: z.string().optional().default(''),
  sku: z.string().optional(),
  category: z.string().optional().default('General'),
  unit: z.string(),
  warranty: z.string().optional().default('No Warranty'),
  warrantyUntil: z.string().optional().default(''),
  cost: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  qty: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
});
type Form = z.infer<typeof schema>;

const UNITS = ['Piece', 'Meter', 'Coil', 'Box', 'Set', 'Pair', 'Dozen'];

export function ProductsPage() {
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const latestLoad = useRef(0);
  const locale = useUIStore((s) => s.locale);
  const t = dict[locale];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'Piece', warranty: 'No Warranty', warrantyUntil: '', qty: 0, minStock: 5 },
  });

  async function load() {
    const requestId = ++latestLoad.current;
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      q,
    });
    if (category) params.set('category', category);
    if (lowStockOnly) params.set('lowStock', '1');
    try {
      const j = await getCachedJson(`/api/products?${params.toString()}`);
      if (requestId === latestLoad.current) setData(j.data);
    } catch (error) {
      if (requestId === latestLoad.current) toast.error(error instanceof Error ? error.message : 'Could not load products');
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, q ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [page, q, category, lowStockOnly]);

  function start(p?: any) {
    setFile(null);
    setEdit(p || null);
    reset(
      p
        ? {
            ...p,
            brand: p.brand || '',
            warranty: p.warranty || 'No Warranty',
            warrantyUntil: p.warrantyUntil ? new Date(p.warrantyUntil).toISOString().slice(0, 10) : '',
            qty: Number(p.qty),
          }
        : {
            name: '',
            brand: '',
            sku: '',
            category: 'Lighting',
            unit: 'Piece',
            warranty: 'No Warranty',
            warrantyUntil: '',
            cost: 0,
            price: 0,
            qty: 0,
            minStock: 5,
          }
    );
    setOpen(true);
  }

  async function quickRestock(p: any) {
    const input = prompt(
      locale === 'bn'
        ? `"${p.name}"-এর নতুন কত ${p.unit} স্টকে যোগ করতে চান?`
        : `How many ${p.unit} of "${p.name}" arrived in new stock?`,
      '10'
    );
    if (!input) return;
    const addStock = parseInt(input, 10);
    if (Number.isNaN(addStock) || addStock === 0) return toast.error('Invalid quantity');
    try {
    const r = await fetch(`/api/products/${p._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addStock }),
    });
    const j = await r.json();
    if (!r.ok) return toast.error(j.error);
    invalidateApiCache('/api/products', '/api/reports');
    toast.success(
      locale === 'bn'
        ? `স্টক আপডেট হয়েছে: বর্তমান স্টক ${j.data.qty} ${p.unit}`
        : `Stock updated: now ${j.data.qty} ${p.unit}`
    );
    load();
    } catch {
      toast.error('Could not reach the server. Refresh stock before retrying.');
    }
  }

  async function save(v: Form) {
    setBusy(true);
    try {
    let image = edit?.image;
    if (file) {
      const sr = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name }),
      });
      const signed = await sr.json();
      if (!sr.ok) {
        setBusy(false);
        return toast.error(signed.error);
      }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', signed.data.apiKey);
      fd.append('timestamp', String(signed.data.timestamp));
      fd.append('folder', signed.data.folder);
      fd.append('public_id', signed.data.publicId);
      fd.append('signature', signed.data.signature);
      const uploaded = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.data.cloudName}/image/upload`,
        { method: 'POST', body: fd }
      );
      const up = await uploaded.json();
      if (!uploaded.ok) {
        setBusy(false);
        return toast.error(up.error?.message || 'Image upload failed');
      }
      image = { url: up.secure_url, publicId: up.public_id };
    }
    const r = await fetch(edit ? `/api/products/${edit._id}` : '/api/products', {
      method: edit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...v, image }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast.error(j.error);
    invalidateApiCache('/api/products', '/api/reports', '/api/sales');
    toast.success(locale === 'bn' ? 'পণ্য সেভ হয়েছে' : 'Product saved');
    setOpen(false);
    load();
    } catch {
      toast.error('Could not reach the server. Your product was not confirmed; refresh the list before retrying.');
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm(locale === 'bn' ? 'পণ্যটি মুছে ফেলতে চান?' : 'Delete this product?')) return;
    try {
    const r = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    const j = await r.json();
    if (r.ok) invalidateApiCache('/api/products', '/api/reports', '/api/sales');
    r.ok ? toast.success('Product deleted') : toast.error(j.error);
    load();
    } catch {
      toast.error('Could not reach the server. Refresh the product list before retrying.');
    }
  }

  return (
    <div className="products-page mx-auto max-w-[1500px] space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:flex">
            <span>{locale === 'bn' ? 'ব্যবসার সারাংশ' : 'Business overview'}</span><span className="text-slate-300">/</span><span>{locale === 'bn' ? 'ইনভেন্টরি' : 'Inventory'}</span>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{locale === 'bn' ? 'পণ্য ও স্টক' : 'Products & Stock'}</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{locale === 'bn' ? 'পণ্য, মজুত ও মূল্য এক জায়গা থেকে পরিচালনা করুন।' : 'Manage your products, stock levels and pricing in one place.'}</p>
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-[0_4px_10px_rgba(79,70,229,.2)] transition hover:bg-indigo-700" onClick={() => start()}>
          <span className="text-base leading-none">+</span>{locale === 'bn' ? 'পণ্য যোগ করুন' : 'Add product'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <ProductMetric icon="product" label={locale === 'bn' ? 'মোট পণ্য' : 'Total products'} value={Number(data?.summary?.count || 0).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} tone="indigo" />
        <ProductMetric icon="units" label={locale === 'bn' ? 'মোট ইউনিট' : 'Stock units'} value={Number(data?.summary?.units || 0).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} tone="emerald" />
        <ProductMetric icon="value" label={locale === 'bn' ? 'ক্রয়মূল্যে স্টক' : 'Stock cost value'} value={`৳${Number(data?.summary?.costValue || 0).toLocaleString()}`} tone="violet" />
        <ProductMetric icon="alert" label={locale === 'bn' ? 'স্টক কম' : 'Low stock items'} value={Number(data?.summary?.lowStock || 0).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} tone={data?.summary?.lowStock ? 'amber' : 'slate'} />
      </div>
      <div className="hidden">
        <button className="product-action product-action-add" onClick={() => start()} title={t.addProduct} aria-label={t.addProduct}>
          ＋
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,.035)] sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4 sm:gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">⌕</span>
            <input
            className="field w-full pl-9"
            placeholder={t.searchProducts}
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            />
          </div>
          <select
            className="field min-w-0 max-w-[180px] flex-1 sm:flex-none"
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
          >
            <option value="">{t.allCategories}</option>
            {(data?.categories || []).map((c: string) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            title="Low stock only"
            aria-label="Low stock only"
            className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition active:scale-95 ${lowStockOnly ? 'border border-orange bg-orange-50 text-orange' : 'border border-line bg-slate-50 text-muted'}`}
            onClick={() => {
              setPage(1);
              setLowStockOnly(!lowStockOnly);
            }}
          >
            ⚠
          </button>
        </div>

        <div className="space-y-2 sm:hidden">
          {data?.items?.map((p: any) => {
            const stockTone = p.qty <= 0 ? 'bg-red-100 text-red' : p.qty <= p.minStock ? 'bg-orange-100 text-orange' : 'bg-green-100 text-green';
            const stockIcon = p.qty <= 0 ? '✕' : p.qty <= p.minStock ? '!' : '✓';
            return (
              <article key={p._id} className="products-compact-card rounded-xl border border-line bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="block truncate text-sm text-ink">{p.name}</b>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">{[p.brand, p.category, p.sku].filter(Boolean).join(' · ')}</span>
                  </div>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-black ${stockTone}`} title="Stock status">{stockIcon}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 border-y border-line py-2 text-center">
                  <div><span className="block text-[10px] text-muted">Buy</span><b className="text-xs text-ink">৳{Number(p.cost).toLocaleString()}</b></div>
                  <div><span className="block text-[10px] text-muted">Sell</span><b className="text-xs text-blue">৳{Number(p.price).toLocaleString()}</b></div>
                  <div><span className="block text-[10px] text-muted">Stock</span><b className="text-xs text-ink">{p.qty} {p.unit}</b></div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-[10px] text-muted">Warranty: {p.warrantyUntil ? new Date(p.warrantyUntil).toLocaleDateString() : p.warranty || 'No Warranty'}</span>
                  <div className="flex shrink-0 gap-2">
                    <button className="product-action product-action-stock" onClick={() => quickRestock(p)} title="Quick add stock" aria-label="Quick add stock">＋</button>
                    <button className="product-action product-action-edit" onClick={() => start(p)} title="Edit product" aria-label="Edit product">✎</button>
                    <button className="product-action product-action-delete" onClick={() => del(p._id)} title="Delete product" aria-label="Delete product">✕</button>
                  </div>
                </div>
              </article>
            );
          })}
          {!data && <p className="py-10 text-center text-xs text-muted">Loading inventory…</p>}
          {data && !data.items.length && <p className="py-10 text-center text-xs text-muted">No products found.</p>}
        </div>
        <div className="hidden sm:block table-wrap">
          <table>
            <thead>
              <tr>
                <th>{locale === 'bn' ? 'পণ্য ও ব্র্যান্ড' : 'Product & Brand'}</th>
                <th>{locale === 'bn' ? 'ওয়ারেন্টি' : 'Warranty'}</th>
                <th>{locale === 'bn' ? 'কেনা দাম' : 'Cost'}</th>
                <th>{locale === 'bn' ? 'বিক্রয় মূল্য' : 'Price'}</th>
                <th>{locale === 'bn' ? 'স্টক' : 'Stock Qty'}</th>
                <th>{locale === 'bn' ? 'অবস্থা' : 'Status'}</th>
                <th>{locale === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((p: any) => (
                <tr key={p._id}>
                  <td>
                    <b>{p.name}</b>
                    <small className="block text-muted">
                      {p.brand ? `${p.brand} · ` : ''}
                      {p.category} · {p.unit} {p.sku ? `· SKU: ${p.sku}` : ''}
                    </small>
                  </td>
                  <td>
                    <span className="badge bg-blue-50 text-blue">{p.warrantyUntil ? new Date(p.warrantyUntil).toLocaleDateString() : p.warranty || 'No Warranty'}</span>
                  </td>
                  <td>৳{Number(p.cost).toLocaleString()}</td>
                  <td>
                    <b>৳{Number(p.price).toLocaleString()}</b>
                  </td>
                  <td>
                    <b>{p.qty}</b> <small className="text-muted">{p.unit}</small>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        p.qty <= 0
                          ? 'bg-red-100 text-red'
                          : p.qty <= p.minStock
                          ? 'bg-orange-100 text-orange'
                          : 'bg-green-100 text-green'
                      }`}
                    >
                      {p.qty <= 0
                        ? locale === 'bn'
                          ? 'স্টক শেষ'
                          : 'Out of stock'
                        : p.qty <= p.minStock
                        ? locale === 'bn'
                          ? 'স্টক কম'
                          : 'Low stock'
                        : locale === 'bn'
                        ? 'স্টকে আছে'
                        : 'In stock'}
                    </span>
                  </td>
                  <td className="space-x-1 whitespace-nowrap">
                    <button
                      className="product-action product-action-stock"
                      onClick={() => quickRestock(p)}
                      title="Quick add stock"
                      aria-label="Quick add stock"
                    >
                      ＋
                    </button>
                    <button className="product-action product-action-edit" onClick={() => start(p)} title="Edit product" aria-label="Edit product">
                      ✎
                    </button>
                    <button
                      className="product-action product-action-delete"
                      onClick={() => del(p._id)}
                      title="Delete product"
                      aria-label="Delete product"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    Loading inventory…
                  </td>
                </tr>
              )}
              {data && !data.items.length && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    {locale === 'bn'
                      ? 'কোনো পণ্য পাওয়া যায়নি। নতুন পণ্য যোগ করুন।'
                      : 'No products found. Add your first product.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pages={data?.pages || 1} setPage={setPage} />
      </section>

      {open && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-4">
          <form
            onSubmit={handleSubmit(save)}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-xl space-y-3 overflow-y-auto overscroll-contain rounded-2xl bg-white p-4 sm:p-6"
          >
            <h3 className="text-lg font-bold">
              {edit
                ? locale === 'bn'
                  ? 'পণ্য আপডেট করুন'
                  : 'Edit Product'
                : locale === 'bn'
                ? 'নতুন ইলেকট্রিক পণ্য যোগ করুন'
                : 'Add Electric Product'}
            </h3>
            <div className="mb-2">
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'পণ্যের ছবি (সরাসরি ক্লাউডিনারি আপলোড)' : 'Product image (Direct Cloudinary upload)'}
                <div className="mt-1 flex items-center gap-3">
                  {(file || edit?.image?.url) && (
                    <img
                      src={file ? URL.createObjectURL(file) : edit.image.url}
                      alt="Preview"
                      className="h-12 w-12 rounded-xl object-cover border border-line shadow-sm"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="field min-w-0 flex-1 text-xs"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && f.size > 5 * 1024 * 1024) {
                        toast.error('ছবি সর্বোচ্চ ৫ MB পর্যন্ত হতে পারবে');
                        return;
                      }
                      setFile(f || null);
                    }}
                  />
                </div>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 max-[500px]:grid-cols-1">
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'পণ্যের নাম *' : 'Product name *'}
                <input
                  className="field mt-1"
                  placeholder="e.g. Super Star 18W LED Bulb"
                  {...register('name')}
                />
                {errors.name && <small className="text-red">Required</small>}
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'ব্র্যান্ড / কোম্পানি' : 'Brand / Company'}
                <input
                  className="field mt-1"
                  placeholder="e.g. Walton, BRB, Super Star, Click"
                  {...register('brand')}
                />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                <input
                  className="field mt-1"
                  placeholder="e.g. Cable, Switch, LED Light, Fan"
                  {...register('category')}
                />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'মডেল / SKU কোড' : 'SKU / Model Code'}
                <input className="field mt-1" placeholder="e.g. LED-18W" {...register('sku')} />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'একক (Unit)' : 'Unit'}
                <select className="field mt-1" {...register('unit')}>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'ওয়ারেন্টি / গ্যারান্টি' : 'Warranty'}
                <input className="field mt-1" placeholder="e.g. 2 years / Brand warranty" {...register('warranty')} />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'ওয়ারেন্টি শেষের তারিখ' : 'Warranty expiry date'}
                <input type="date" className="field mt-1" {...register('warrantyUntil')} />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'কেনা দাম (Cost Price ৳) *' : 'Cost price (৳) *'}
                <input type="number" step=".01" className="field mt-1" {...register('cost')} />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'বিক্রয় মূল্য (Selling Price ৳) *' : 'Selling price (৳) *'}
                <input type="number" step=".01" className="field mt-1" {...register('price')} />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'বর্তমান স্টক পরিমাণ *' : 'Current stock *'}
                <input type="number" className="field mt-1" {...register('qty')} />
              </label>
              <label className="text-xs font-bold text-muted">
                {locale === 'bn' ? 'কম স্টকের সতর্কতা সীমা' : 'Low stock alert at'}
                <input type="number" className="field mt-1" {...register('minStock')} />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-soft" onClick={() => setOpen(false)}>
                {locale === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button disabled={busy} className="btn-primary">
                {busy ? 'Saving…' : locale === 'bn' ? 'পণ্য সেভ করুন' : 'Save product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Pager({
  page,
  pages,
  setPage,
}: {
  page: number;
  pages: number;
  setPage: (x: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
      <button
        disabled={page <= 1}
        className="product-action product-action-page disabled:opacity-40"
        title="Previous page"
        aria-label="Previous page"
        onClick={() => setPage(page - 1)}
      >
        ←
      </button>
      <button
        disabled={page >= pages}
        className="product-action product-action-page disabled:opacity-40"
        title="Next page"
        aria-label="Next page"
        onClick={() => setPage(page + 1)}
      >
        →
      </button>
    </div>
  );
}

function ProductMetric({ icon, label, value, tone }: { icon: 'product' | 'units' | 'value' | 'alert'; label: string; value: string; tone: 'indigo' | 'emerald' | 'violet' | 'amber' | 'slate' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_5px_16px_rgba(15,23,42,.025)] sm:p-4">
      <span className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon === 'product' && <><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 21v-8.8"/></>}
          {icon === 'units' && <><rect x="3.5" y="4" width="7" height="7" rx="1.5"/><rect x="13.5" y="4" width="7" height="7" rx="1.5"/><rect x="3.5" y="14" width="7" height="7" rx="1.5"/><rect x="13.5" y="14" width="7" height="7" rx="1.5"/></>}
          {icon === 'value' && <><path d="M12 3.5v17M17.5 7.5c0-2-2.1-3.5-5.5-3.5S6.5 5.4 6.5 7.5 8.2 11 12 12s5.5 2 5.5 4.5-2.1 4-5.5 4-5.5-1.5-5.5-4"/></>}
          {icon === 'alert' && <><path d="m12 3 9 16H3z"/><path d="M12 9v4M12 17h.01"/></>}
        </svg>
      </span>
      <p className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">{label}</p>
      <p className="mt-1 truncate font-heading text-lg font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
    </article>
  );
}
