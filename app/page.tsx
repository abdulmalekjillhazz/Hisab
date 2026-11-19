import Link from 'next/link';

const features = [
  {
    number: '01',
    title: 'Track your stock',
    description: 'Keep products, prices and low-stock items together in one clear workspace.',
  },
  {
    number: '02',
    title: 'Record every sale',
    description: 'Create sales, manage customer balances and keep invoice details close at hand.',
  },
  {
    number: '03',
    title: 'Understand your business',
    description: 'See sales and shop activity in reports that are easy to follow.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-bg text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="Hisab home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal text-white shadow-md">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </span>
          <span className="font-heading text-xl font-extrabold tracking-tight">Hisab</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink hover:bg-white/70">Sign in</Link>
          <Link href="/signup" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal">Get started</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pb-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal/15 bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-teal">
            Made for your everyday business
          </span>
          <h1 className="mt-6 font-heading text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Your shop, <span className="text-teal">in good</span> order.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Keep products, sales and customer accounts organized in one simple place. Take a look around, then sign in when you’re ready to manage your shop.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="rounded-2xl bg-teal px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal/20 transition hover:-translate-y-0.5 hover:bg-ink">Create your workspace <span aria-hidden="true">→</span></Link>
            <Link href="/login" className="rounded-2xl border border-line bg-white px-6 py-3.5 text-sm font-bold text-ink transition hover:border-teal/40">I already have an account</Link>
          </div>
          <p className="mt-4 text-xs text-muted">Your shop data stays private to your account.</p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-teal/15 via-blue/10 to-transparent blur-2xl" />
          <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-card sm:p-7">
            <div className="flex items-center justify-between border-b border-line pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted">A clearer view</p>
                <h2 className="mt-1 font-heading text-xl font-bold">Shop overview</h2>
              </div>
              <span className="rounded-xl bg-teal/10 px-3 py-2 text-xs font-bold text-teal">Today</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-cream p-4"><p className="text-xs font-medium text-muted">Today’s sales</p><p className="mt-2 text-2xl font-extrabold">৳ 24,850</p><p className="mt-1 text-xs font-semibold text-teal">Sales at a glance</p></div>
              <div className="rounded-2xl bg-blue/5 p-4"><p className="text-xs font-medium text-muted">Products</p><p className="mt-2 text-2xl font-extrabold">Manage stock</p><p className="mt-1 text-xs font-semibold text-blue">Know what’s on hand</p></div>
            </div>
            <div className="mt-4 rounded-2xl border border-line p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-bold">Recent activity</p><span className="text-xs text-muted">All in one place</span></div>
              <div className="mt-4 space-y-3">
                {['Sales and invoices', 'Customer payments', 'Stock updates'].map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-bold ${index === 1 ? 'bg-blue/10 text-blue' : 'bg-teal/10 text-teal'}`}>{['৳', '↗', '✓'][index]}</span>
                    <span className="text-sm font-semibold text-ink">{item}</span>
                    <span className="ml-auto h-2 w-2 rounded-full bg-teal" />
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted">Preview illustration · Your workspace starts with your own shop data</p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white/55">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-teal">Everything within reach</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Spend less time sorting. More time serving.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.number} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
                <span className="text-xs font-extrabold tracking-[.14em] text-teal">{feature.number}</span>
                <h3 className="mt-5 font-heading text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <span>Hisab · A simpler way to manage your shop</span>
        <div className="flex gap-5"><Link href="/login" className="hover:text-teal">Sign in</Link><Link href="/signup" className="hover:text-teal">Create account</Link></div>
      </footer>
    </main>
  );
}
