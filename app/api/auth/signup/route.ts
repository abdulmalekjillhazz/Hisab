import { z } from 'zod';
import { hash } from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Shop from '@/models/Shop';
import { fail, ok } from '@/lib/http';

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(10).max(100),
  shopName: z.string().min(2).max(100),
});

export async function POST(req: Request) {
  let createdShopId: any = null;
  try {
    const d = schema.parse(await req.json());
    await connectDB();
    const normalizedEmail = d.email.toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return fail('An account with this email already exists.', 409);
    }
    const passwordHash = await hash(d.password, 12);
    const shop = await Shop.create({ name: d.shopName, currency: 'BDT' });
    createdShopId = shop._id;
    const user = await User.create({
      name: d.name,
      email: normalizedEmail,
      passwordHash,
      shop: shop._id,
      role: 'owner',
    });
    shop.owner = user._id;
    await shop.save();
    return ok({ id: user._id }, 201);
  } catch (e) {
    if (createdShopId) {
      await Shop.findByIdAndDelete(createdShopId).catch(() => null);
    }
    return fail(
      e instanceof z.ZodError ? e.issues[0].message : 'Could not create account',
      400
    );
  }
}
