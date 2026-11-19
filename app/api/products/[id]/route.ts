import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import Product from '@/models/Product';
import Activity from '@/models/ActivityLog';

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
  image: z.object({ url: z.string().url(), publicId: z.string() }).optional(),
});

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  try {
    const body = await req.json();
    await connectDB();

    // Quick stock restock (+Stock) support
    if (typeof body.addStock === 'number' && Number.isInteger(body.addStock) && body.addStock !== 0) {
      const p = await Product.findOneAndUpdate(
        { _id: params.id, shop: me.shopId, qty: { $gte: body.addStock < 0 ? Math.abs(body.addStock) : 0 } },
        { $inc: { qty: body.addStock } },
        { new: true }
      );
      if (!p) return fail('Product not found or insufficient stock', 404);
      await Activity.create({
        shop: me.shopId,
        actor: me.userId,
        action: 'product.restocked',
        message: `Stock updated for ${p.name}: ${body.addStock > 0 ? `+${body.addStock}` : body.addStock} (Now ${p.qty} ${p.unit})`,
      });
      return ok(p);
    }

    const d = schema.parse(body);
    const p = await Product.findOneAndUpdate(
      { _id: params.id, shop: me.shopId },
      {
        ...d,
        brand: d.brand?.trim() || '',
        category: d.category?.trim() || 'General',
        warranty: d.warranty?.trim() || 'No Warranty',
        warrantyUntil: d.warrantyUntil ? new Date(d.warrantyUntil) : undefined,
        sku: d.sku?.trim().toUpperCase() || undefined,
      },
      { new: true, runValidators: true }
    );
    if (!p) return fail('Product not found', 404);
    await Activity.create({
      shop: me.shopId,
      actor: me.userId,
      action: 'product.updated',
      message: `Updated product: ${p.name}`,
    });
    return ok(p);
  } catch (e: any) {
    return fail(e.code === 11000 ? 'SKU already exists' : 'Invalid product information', 400);
  }
}

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  if (me.role !== 'owner') return fail('Only the shop owner can delete products', 403);
  await connectDB();
  const p = await Product.findOneAndDelete({ _id: params.id, shop: me.shopId });
  if (!p) return fail('Product not found', 404);
  await Activity.create({
    shop: me.shopId,
    actor: me.userId,
    action: 'product.deleted',
    message: `Deleted product: ${p.name}`,
  });
  return ok({ deleted: true });
}
