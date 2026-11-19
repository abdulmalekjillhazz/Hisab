import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import Shop from '@/models/Shop';
import User from '@/models/User';

const schema = z.object({
  name: z.string().min(2).max(100),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  address: z.string().optional(),
  avatar: z.string().max(480000).optional(), // DataURL for an image up to 350 KB
  category: z.enum(['electrical', 'grocery', 'clothing', 'pharmacy', 'electronics', 'restaurant', 'general']).default('general'),
  currency: z.enum(['BDT', 'USD']),
  invoiceFooter: z.string().max(300).optional(),
  locale: z.enum(['en', 'bn']),
});

export async function GET() {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  await connectDB();
  const [s, u]: [any, any] = await Promise.all([
    Shop.findById(me.shopId).lean(),
    User.findById(me.userId).select('avatar name email').lean(),
  ]);
  if (!s) return fail('Shop not found', 404);
  return ok({
    ...s,
    avatar: s.avatar || u?.avatar || '',
  });
}

export async function PATCH(req: Request) {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  if (me.role !== 'owner') return fail('Only the owner can change shop settings', 403);
  try {
    const d = schema.parse(await req.json());
    await connectDB();
    const [s] = await Promise.all([
      Shop.findByIdAndUpdate(me.shopId, d, { new: true, runValidators: true }),
      d.avatar !== undefined ? User.findByIdAndUpdate(me.userId, { avatar: d.avatar }) : null,
    ]);
    return s ? ok(s) : fail('Shop not found', 404);
  } catch (err) {
    if (err instanceof z.ZodError) return fail(err.issues[0]?.message || 'Invalid shop profile data', 400);
    console.error('Shop profile update failed:', err);
    return fail('Could not save shop profile. Please try again later.', 500);
  }
}
