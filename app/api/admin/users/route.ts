import { connectDB } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';
import User from '@/models/User';
import Shop from '@/models/Shop';
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
    const filter = safeQ ? { $or: [{ name: { $regex: safeQ, $options: 'i' } }, { email: { $regex: safeQ, $options: 'i' } }] } : {};
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(limit, 100)).select('name email shop role active createdAt').populate({ path: 'shop', select: 'name active' }).lean(),
      User.countDocuments(filter),
    ]);
    return ok({ items, total, page, limit: Math.min(limit, 100) });
  } catch (error) { console.error('Admin users list failed:', error); return fail('Could not load users.', 500); }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return fail('Super admin access required.', 403);
    const parsed = changeSchema.safeParse(await req.json());
    if (!parsed.success) return fail('Invalid user status request.', 400);
    const { id, active } = parsed.data;
    if (id === admin.userId) return fail('You cannot suspend your own admin account.', 409);
    await connectDB();
    const allowlist = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    const target = await User.findById(id).select('name email active');
    if (!target) return fail('User not found.', 404);
    if (allowlist.includes(target.email.toLowerCase())) return fail('Admin accounts cannot be changed here.', 409);
    if (target.active === active) return ok({ id, active });
    target.active = active;
    await target.save();
    await AdminAuditLog.create({ actor: admin.userId, action: active ? 'user.activate' : 'user.suspend', targetType: 'User', targetId: target._id, targetLabel: `${target.name} (${target.email})` });
    return ok({ id, active });
  } catch (error) { console.error('Admin user update failed:', error); return fail('Could not update user access.', 500); }
}
