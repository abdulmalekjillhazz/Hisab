'use client';

import { useCallback, useEffect, useState } from 'react';

type Summary = { users: number; activeUsers: number; shops: number; activeShops: number; recent: { _id: string; action: string; targetType: string; targetLabel: string; createdAt: string }[] };
type UserRow = { _id: string; name: string; email: string; role: string; active: boolean; createdAt: string; shop?: { _id: string; name: string; active: boolean } | null };
type ShopRow = { _id: string; name: string; ownerName?: string; email?: string; phone?: string; category: string; active: boolean; createdAt: string; userCount: number; owner?: { name: string; email: string } | null };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Request failed.');
  return body.data as T;
}

export function AdminPanel() {
  const [tab, setTab] = useState<'overview' | 'users' | 'shops'>('overview');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => setSummary(await request<Summary>('/api/admin/overview')), []);
  const loadList = useCallback(async () => {
    const params = new URLSearchParams({ limit: '50', page: String(page) });
    if (search) params.set('q', search);
    if (tab === 'users') { const result = await request<{ items: UserRow[]; total: number }>(`/api/admin/users?${params}`); setUsers(result.items); setTotal(result.total); }
    if (tab === 'shops') { const result = await request<{ items: ShopRow[]; total: number }>(`/api/admin/shops?${params}`); setShops(result.items); setTotal(result.total); }
  }, [page, search, tab]);

  useEffect(() => { loadSummary().catch((e) => setError(e.message)); }, [loadSummary]);
  useEffect(() => { loadList().catch((e) => setError(e.message)); }, [loadList]);

  async function toggle(kind: 'users' | 'shops', row: UserRow | ShopRow) {
    const key = `${kind}:${row._id}`;
    setBusy(key); setError('');
    try {
      await request(`/api/admin/${kind}`, { method: 'PATCH', body: JSON.stringify({ id: row._id, active: !row.active }) });
      await Promise.all([loadSummary(), loadList()]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Update failed.'); }
    finally { setBusy(''); }
  }

  const card = 'rounded-2xl border border-line bg-card p-4 shadow-sm';
  const button = 'rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:border-teal/50 hover:bg-teal/5 disabled:opacity-50';
  const label = 'text-xs font-semibold uppercase tracking-[.12em] text-muted';

  return <section className="admin-page mx-auto max-w-6xl space-y-5 pb-8">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className={label}>Platform control</p><h2 className="mt-1 font-heading text-2xl font-bold text-ink sm:text-3xl">Super Admin</h2><p className="mt-1 text-sm text-muted">Manage account access and shop availability.</p></div>
      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600">Protected session</span>
    </div>
    {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</div>}
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
      {(['overview', 'users', 'shops'] as const).map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => { setTab(item); setPage(1); }} className={`${button} capitalize ${tab === item ? 'border-teal bg-teal text-white hover:bg-teal' : ''}`}>{item}</button>)}
    </div>
    {tab === 'overview' && <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[[summary?.users ?? '—', 'Total users'], [summary?.activeUsers ?? '—', 'Active users'], [summary?.shops ?? '—', 'Total shops'], [summary?.activeShops ?? '—', 'Active shops']].map(([value, title]) => <div className={card} key={title}><p className={label}>{title}</p><p className="mt-2 font-heading text-3xl font-bold text-ink">{value}</p></div>)}
      </div>
      <div className={card}><h3 className="font-heading text-lg font-bold text-ink">Recent admin activity</h3><div className="mt-3 divide-y divide-line">{summary?.recent.length ? summary.recent.map((item) => <div key={item._id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-medium text-ink">{item.action.replace('.', ' ')} · {item.targetLabel}</span><time className="text-muted">{new Date(item.createdAt).toLocaleString()}</time></div>) : <p className="py-5 text-sm text-muted">No privileged changes recorded yet.</p>}</div></div>
    </>}
    {(tab === 'users' || tab === 'shops') && <>
      <form className={`${card} flex flex-col gap-2 sm:flex-row`} onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(query.trim()); }}><input className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-teal" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === 'users' ? 'Search name or email' : 'Search shop name'} /><button className={button}>Search</button></form>
      {tab === 'users' && <div className="grid gap-3">{users.map((user) => <article key={user._id} className={card}><div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold text-ink">{user.name}</h3><p className="break-all text-sm text-muted">{user.email}</p><p className="mt-1 text-xs text-muted">{user.shop?.name || 'No shop'} · {user.role}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{user.active ? 'Active' : 'Suspended'}</span><button className={button} disabled={busy === `users:${user._id}`} onClick={() => toggle('users', user)}>{busy === `users:${user._id}` ? 'Saving…' : user.active ? 'Suspend' : 'Reactivate'}</button></div></div></article>)}{users.length === 0 && <div className={card}><p className="text-sm text-muted">No matching users.</p></div>}</div>}
      {tab === 'shops' && <div className="grid gap-3">{shops.map((shop) => <article key={shop._id} className={card}><div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold text-ink">{shop.name}</h3><p className="text-sm text-muted">{shop.owner?.name || shop.ownerName || 'No owner'} · {shop.userCount} users · {shop.category}</p><p className="break-all text-xs text-muted">{shop.owner?.email || shop.email || ''}{shop.phone ? ` · ${shop.phone}` : ''}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${shop.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{shop.active ? 'Active' : 'Suspended'}</span><button className={button} disabled={busy === `shops:${shop._id}`} onClick={() => toggle('shops', shop)}>{busy === `shops:${shop._id}` ? 'Saving…' : shop.active ? 'Suspend shop' : 'Reactivate'}</button></div></div></article>)}{shops.length === 0 && <div className={card}><p className="text-sm text-muted">No matching shops.</p></div>}</div>}
      {(tab === 'users' || tab === 'shops') && <div className="flex items-center justify-between gap-3 text-sm text-muted"><span>{total === 0 ? '0 results' : `${(page - 1) * 50 + 1}–${Math.min(page * 50, total)} of ${total}`}</span><div className="flex gap-2"><button className={button} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button className={button} disabled={page * 50 >= total} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>}
    </>}
  </section>;
}
