import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail, ok, pageParams } from '@/lib/http';
import Customer from '@/models/Customer';

export async function GET(req: Request) {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  await connectDB();
  const url = new URL(req.url);
  const { page, limit, skip, q, safeQ } = pageParams(url);
  const dueOnly = url.searchParams.get('dueOnly') === '1';

  const f: any = { shop: me.shopId };
  if (q) {
    f.$or = [
      { name: { $regex: safeQ, $options: 'i' } },
      { phone: { $regex: safeQ, $options: 'i' } },
      { address: { $regex: safeQ, $options: 'i' } },
    ];
  }
  if (dueOnly) {
    f.totalDue = { $gt: 0 };
  }

  const shopId = new mongoose.Types.ObjectId(me.shopId);
  const [items, total, dueAgg] = await Promise.all([
    Customer.find(f).sort({ totalDue: -1, lastVisit: -1 }).skip(skip).limit(limit).lean(),
    Customer.countDocuments(f),
    Customer.aggregate([
      { $match: { shop: shopId } },
      {
        $group: {
          _id: null,
          customers: { $sum: 1 },
          totalDue: { $sum: { $cond: [{ $gt: ['$totalDue', 0] }, '$totalDue', 0] } },
          dueCustomers: { $sum: { $cond: [{ $gt: ['$totalDue', 0] }, 1, 0] } },
        },
      },
    ]),
  ]);

  return ok({
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    summary: dueAgg[0] || { totalDue: 0, dueCustomers: 0, customers: 0 },
  });
}
