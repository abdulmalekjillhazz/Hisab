import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { getBusinessCategory } from '@/lib/business-categories';
import Shop from '@/models/Shop';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  let category = url.searchParams.get('category');

  if (!category) {
    try {
      const me = await identity();
      if (me) {
        await connectDB();
        const shop = await Shop.findById(me.shopId).select('category').lean() as { category?: string } | null;
        category = shop?.category || 'general';
      }
    } catch {
      category = 'general';
    }
  }

  const selected = getBusinessCategory(category);
  const paths = selected.paths.map((path) => `<path d="${path}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0f766e"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs>
    <rect width="64" height="64" rx="18" fill="url(#bg)"/>
    <g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
  </svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
