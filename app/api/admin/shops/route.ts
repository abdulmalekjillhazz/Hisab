import { connectDB } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';
import Shop from '@/models/Shop';
import User from '@/models/User';
import AdminAuditLog from '@/models/AdminAuditLog';
import { ok, fail, pageParams } from '@/lib/http';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const changeSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), active: z.boolean() });

export async function GET(req: Request) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return fail('Super admin access required.', 403);
    await connectDB();
    const { page, limit, skip, safeQ } = pageParams(new URL(req.url));
    const filter = safeQ ? { name: { $regex: safeQ, $options: 'i' } } : {};
    const [items, total] = await Promise.all([
      Shop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(limit, 100)).select('name ownerName email phone category active createdAt').populate({ path: 'owner', select: 'name email' }).lean(),
      Shop.countDocuments(filter),
    ]);
    const ids = items.map((shop) => shop._id);
    const counts = await User.aggregate([{ $match: { shop: { $in: ids } } }, { $group: { _id: '$shop', count: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
    return ok({ items: items.map((shop) => ({ ...shop, active: shop.active !== false, userCount: countMap.get(String(shop._id)) || 0 })), total, page, limit: Math.min(limit, 100) });
  } catch (error) { console.error('Admin shops list failed:', error); return fail('Could not load shops.', 500); }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return fail('Super admin access required.', 403);
    const parsed = changeSchema.safeParse(await req.json());
    if (!parsed.success) return fail('Invalid shop status request.', 400);
    await connectDB();
    const shop = await Shop.findById(parsed.data.id).select('name active');
    if (!shop) return fail('Shop not found.', 404);
    if (!parsed.data.active) {
      const allowlist = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
      const protectedAdmin = await User.exists({ shop: shop._id, email: { $in: allowlist }, active: true });
      if (protectedAdmin) return fail('Move the admin account before suspending this shop.', 409);
    }
    if ((shop.active !== false) === parsed.data.active) return ok({ id: shop._id, active: parsed.data.active });
    shop.active = parsed.data.active;
    await shop.save();
    await AdminAuditLog.create({ actor: admin.userId, action: shop.active ? 'shop.activate' : 'shop.suspend', targetType: 'Shop', targetId: shop._id, targetLabel: shop.name });
    return ok({ id: shop._id, active: shop.active });
  } catch (error) { console.error('Admin shop update failed:', error); return fail('Could not update shop access.', 500); }
}
