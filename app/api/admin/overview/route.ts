import { connectDB } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';
import User from '@/models/User';
import Shop from '@/models/Shop';
import AdminAuditLog from '@/models/AdminAuditLog';
import { ok, fail } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return fail('Super admin access required.', 403);
    await connectDB();
    const [users, activeUsers, shops, activeShops, recent] = await Promise.all([
      User.countDocuments(), User.countDocuments({ active: true }),
      Shop.countDocuments(), Shop.countDocuments({ active: { $ne: false } }),
      AdminAuditLog.find().sort({ createdAt: -1 }).limit(8).select('action targetType targetLabel createdAt').lean(),
    ]);
    return ok({ users, activeUsers, shops, activeShops, recent });
  } catch (error) { console.error('Admin overview failed:', error); return fail('Could not load admin overview.', 500); }
}
