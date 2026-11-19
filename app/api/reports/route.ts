import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import Product from '@/models/Product';
import Sale from '@/models/Sale';
import Customer from '@/models/Customer';
import Activity from '@/models/ActivityLog';
import Shop from '@/models/Shop';

const parseDate = (value: string | null, fallback: Date, end = false) => {
  if (!value) return fallback;
  const d = new Date(value);
  if (value.length === 10) d.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  return d;
};

export async function GET(req: Request) {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  await connectDB();
  const u = new URL(req.url);
  const to = parseDate(u.searchParams.get('to'), new Date(), true);
  const from = parseDate(u.searchParams.get('from'), new Date(to.getTime() - 30 * 86400000));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return fail('Invalid report period');
  }
  const shopId = new mongoose.Types.ObjectId(me.shopId);

  const [
    stats,
    dueCollections,
    monthly,
    lowStock,
    lowStockItems,
    recent,
    activity,
    inventory,
    dueSummary,
    topProducts,
    shop,
  ] = await Promise.all([
    Sale.aggregate([
      { $match: { shop: shopId, date: { $gte: from, $lte: to } } },
      {
        $addFields: {
          computedCost: {
            $cond: [
              { $gt: ['$totalCost', 0] },
              '$totalCost',
              {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: {
                    $add: [
                      '$$value',
                      { $multiply: ['$$this.qty', { $ifNull: ['$$this.unitCost', 0] }] },
                    ],
                  },
                },
              },
            ],
          },
          computedPaid: {
            $cond: [
              { $ne: [{ $ifNull: ['$paidAmount', null] }, null] },
              '$paidAmount',
              {
                $cond: [{ $eq: ['$paymentMethod', 'Due / Credit'] }, 0, '$total'],
              },
            ],
          },
          computedDue: {
            $cond: [
              { $ne: [{ $ifNull: ['$dueAmount', null] }, null] },
              '$dueAmount',
              {
                $cond: [{ $eq: ['$paymentMethod', 'Due / Credit'] }, '$total', 0],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          totalCost: { $sum: '$computedCost' },
          invoices: { $sum: 1 },
          saleCash: { $sum: '$computedPaid' },
          due: { $sum: '$computedDue' },
        },
      },
    ]),
    Customer.aggregate([
      { $match: { shop: shopId, 'payments.0': { $exists: true } } },
      { $unwind: '$payments' },
      { $match: { 'payments.date': { $gte: from, $lte: to } } },
      {
        $group: {
          _id: null,
          dueCollected: { $sum: '$payments.amount' },
        },
      },
    ]),
    Sale.aggregate([
      {
        $match: {
          shop: shopId,
          date: { $gte: new Date(to.getFullYear(), to.getMonth() - 5, 1), $lte: to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          revenue: { $sum: '$total' },
          cost: { $sum: { $ifNull: ['$totalCost', 0] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.countDocuments({ shop: me.shopId, $expr: { $lte: ['$qty', '$minStock'] } }),
    Product.find({ shop: me.shopId, $expr: { $lte: ['$qty', '$minStock'] } })
      .sort({ qty: 1 })
      .limit(8)
      .select('name brand sku qty minStock unit price')
      .lean(),
    Sale.find({ shop: me.shopId, date: { $gte: from, $lte: to } })
      .sort({ date: -1 })
      .limit(10)
      .lean(),
    Activity.find({ shop: me.shopId }).sort({ createdAt: -1 }).limit(6).lean(),
    Product.aggregate([
      { $match: { shop: shopId } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          units: { $sum: '$qty' },
          costValue: { $sum: { $multiply: ['$qty', '$cost'] } },
          potentialValue: { $sum: { $multiply: ['$qty', '$price'] } },
        },
      },
    ]),
    Customer.aggregate([
      { $match: { shop: shopId, totalDue: { $gt: 0 } } },
      { $group: { _id: null, totalMarketDue: { $sum: '$totalDue' }, dueCustomers: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { shop: shopId, date: { $gte: from, $lte: to } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          qtySold: { $sum: '$items.qty' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { qtySold: -1 } },
      { $limit: 5 },
    ]),
    Shop.findById(me.shopId).select('currency').lean() as Promise<any>,
  ]);

  const rawStats = stats[0] || { revenue: 0, totalCost: 0, invoices: 0, saleCash: 0, due: 0 };
  const dueCollected = dueCollections[0]?.dueCollected || 0;
  const profit = (rawStats.revenue || 0) - (rawStats.totalCost || 0);
  const cash = (rawStats.saleCash || 0) + dueCollected;

  return ok({
    period: { from, to },
    currency: shop?.currency || 'BDT',
    stats: {
      ...rawStats,
      cash,
      dueCollected,
      profit,
    },
    dueSummary: dueSummary[0] || { totalMarketDue: 0, dueCustomers: 0 },
    monthly: monthly.map((m: any) => ({
      ...m,
      profit: (m.revenue || 0) - (m.cost || 0),
    })),
    lowStock,
    lowStockItems,
    topProducts,
    recent,
    activity,
    inventory: inventory[0] || { count: 0, units: 0, costValue: 0, potentialValue: 0 },
  });
}
