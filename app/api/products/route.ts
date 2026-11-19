import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail, ok, pageParams } from '@/lib/http';
import Product from '@/models/Product';
import Activity from '@/models/ActivityLog';

const schema = z.object({
  name: z.string().min(1),
  brand: z.string().optional().default(''),
  sku: z.string().optional(),
  category: z.string().optional().default('General'),
  unit: z.string().default('Piece'),
  warranty: z.string().optional().default('No Warranty'),
  warrantyUntil: z.string().optional().default(''),
  cost: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  qty: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0).default(5),
  image: z.object({ url: z.string().url(), publicId: z.string() }).optional(),
});

export async function GET(req: Request) {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  await connectDB();
  const url = new URL(req.url);
  const { page, limit, skip, q, safeQ } = pageParams(url);
  const category = (url.searchParams.get('category') || '').trim();
  const lowStock = url.searchParams.get('lowStock') === '1';

  const filter: any = { shop: me.shopId };
  if (q) {
    filter.$or = [
      { name: { $regex: safeQ, $options: 'i' } },
      { brand: { $regex: safeQ, $options: 'i' } },
      { sku: { $regex: safeQ, $options: 'i' } },
      { category: { $regex: safeQ, $options: 'i' } },
    ];
  }
  if (category) {
    filter.category = category;
  }
  if (lowStock) {
    filter.$expr = { $lte: ['$qty', '$minStock'] };
  }

  const [items, total, categories] = await Promise.all([
    Product.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
    Product.distinct('category', { shop: me.shopId }),
  ]);

  return ok({
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    categories: categories.filter(Boolean).sort(),
  });
}

export async function POST(req: Request) {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  try {
    const d = schema.parse(await req.json());
    await connectDB();
    const item = await Product.create({
      ...d,
      brand: d.brand?.trim() || '',
      category: d.category?.trim() || 'General',
      warranty: d.warranty?.trim() || 'No Warranty',
      warrantyUntil: d.warrantyUntil ? new Date(d.warrantyUntil) : undefined,
      sku: d.sku?.trim().toUpperCase() || undefined,
      shop: me.shopId,
    });
    await Activity.create({
      shop: me.shopId,
      actor: me.userId,
      action: 'product.created',
      message: `Added product: ${item.name} (${item.qty} ${item.unit})`,
    });
    return ok(item, 201);
  } catch (e: any) {
    return fail(e.code === 11000 ? 'SKU already exists' : 'Invalid product information', 400);
  }
}
