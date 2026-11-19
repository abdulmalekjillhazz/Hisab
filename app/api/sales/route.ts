import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail, ok, pageParams } from '@/lib/http';
import Product from '@/models/Product';
import Sale from '@/models/Sale';
import Customer from '@/models/Customer';
import Activity from '@/models/ActivityLog';
import Shop from '@/models/Shop';

const WALK_IN_NAMES = new Set(['walk-in customer', 'walk in customer', 'খুচরা ক্রেতা', 'খুচরা গ্রাহক']);

const schema = z.object({
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.coerce.number().int().min(1),
        unitPrice: z.coerce.number().min(0),
      })
    )
    .min(1),
  discount: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z
    .enum(['Cash', 'bKash', 'Nagad', 'Bank transfer', 'Due / Credit'])
    .default('Cash'),
  date: z.coerce.date().optional(),
});

export async function GET(req: Request) {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  await connectDB();
  const { page, limit, skip, q, safeQ } = pageParams(new URL(req.url));
  const f: any = { shop: me.shopId };
  if (q) {
    f.$or = [
      { invoiceNumber: { $regex: safeQ, $options: 'i' } },
      { 'customerSnapshot.name': { $regex: safeQ, $options: 'i' } },
      { 'customerSnapshot.phone': { $regex: safeQ, $options: 'i' } },
    ];
  }
  const [items, total] = await Promise.all([
    Sale.find(f).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Sale.countDocuments(f),
  ]);
  return ok({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
}

export async function POST(req: Request) {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  await connectDB();
  let session: mongoose.ClientSession | null = null;
  try {
    const d = schema.parse(await req.json());
    const shop: any = await Shop.findById(me.shopId).lean();
    if (!shop) return fail('Shop not found', 404);

    const grouped = new Map<string, { qty: number; unitPrice: number }>();
    for (const i of d.items) {
      const old = grouped.get(i.productId);
      grouped.set(i.productId, {
        qty: (old?.qty || 0) + i.qty,
        unitPrice: i.unitPrice,
      });
    }

    session = await mongoose.startSession();
    let created: any;

    await session.withTransaction(async () => {
      const lines: any[] = [];
      let subtotal = 0;
      let totalCost = 0;

      for (const [id, line] of grouped) {
        const p = await Product.findOneAndUpdate(
          { _id: id, shop: me.shopId, qty: { $gte: line.qty } },
          { $inc: { qty: -line.qty } },
          { new: true, session }
        );
        if (!p) throw Error('INSUFFICIENT_STOCK');
        const lineTotal = line.qty * line.unitPrice;
        const unitCost = Number(p.cost || 0);
        subtotal += lineTotal;
        totalCost += line.qty * unitCost;
        lines.push({
          product: p._id,
          name: p.name,
          sku: p.sku,
          unit: p.unit,
          warranty: p.warranty || 'No Warranty',
          qty: line.qty,
          unitCost,
          unitPrice: line.unitPrice,
          lineTotal,
        });
      }

      if (d.discount > subtotal) throw Error('DISCOUNT_TOO_LARGE');
      const total = subtotal - d.discount;

      let paidAmount =
        d.paidAmount !== undefined
          ? Math.min(total, Math.max(0, d.paidAmount))
          : d.paymentMethod === 'Due / Credit'
          ? 0
          : total;
      const dueAmount = Math.max(0, total - paidAmount);
      const effectiveMethod =
        dueAmount > 0 && paidAmount === 0 ? 'Due / Credit' : d.paymentMethod;

      const normalizedPhone = (d.customer.phone || '').replace(/\D/g, '');
      const normalizedName = d.customer.name.trim().toLowerCase();
      const isGenericWalkIn = WALK_IN_NAMES.has(normalizedName) && !normalizedPhone;

      if (dueAmount > 0 && isGenericWalkIn) {
        throw Error('DUE_REQUIRES_CUSTOMER_INFO');
      }

      let customerId: mongoose.Types.ObjectId | undefined;

      if (!isGenericWalkIn) {
        let customer = normalizedPhone
          ? await Customer.findOne({ shop: me.shopId, normalizedPhone }).session(session)
          : null;
        if (!customer && !WALK_IN_NAMES.has(normalizedName)) {
          customer = await Customer.findOne({ shop: me.shopId, normalizedName }).session(session);
        }

        if (customer) {
          customer.name = d.customer.name;
          if (d.customer.phone) customer.phone = d.customer.phone;
          if (d.customer.address) customer.address = d.customer.address;
          customer.visits += 1;
          customer.totalSpent += total;
          customer.totalDue = Math.max(0, (customer.totalDue || 0) + dueAmount);
          customer.lastVisit = d.date || new Date();
          await customer.save({ session });
          customerId = customer._id;
        } else {
          const [newCustomer] = await Customer.create(
            [
              {
                shop: me.shopId,
                name: d.customer.name,
                normalizedName,
                phone: d.customer.phone || '',
                normalizedPhone,
                address: d.customer.address || '',
                visits: 1,
                totalSpent: total,
                totalDue: dueAmount,
                lastVisit: d.date || new Date(),
              },
            ],
            { session }
          );
          customerId = newCustomer._id;
        }
      }

      const invoiceNumber = `AE-${Date.now().toString().slice(-8)}-${Math.floor(
        Math.random() * 90 + 10
      )}`;
      [created] = await Sale.create(
        [
          {
            shop: me.shopId,
            invoiceNumber,
            ...(customerId ? { customer: customerId } : {}),
            customerSnapshot: d.customer,
            items: lines,
            subtotal,
            discount: d.discount,
            total,
            totalCost,
            paidAmount,
            dueAmount,
            paymentMethod: effectiveMethod,
            date: d.date || new Date(),
            createdBy: me.userId,
          },
        ],
        { session }
      );

      const sym = shop.currency === 'USD' ? '$' : '৳';
      const dueNote = dueAmount > 0 ? ` (Due: ${sym}${dueAmount.toFixed(0)})` : '';
      await Activity.create(
        [
          {
            shop: me.shopId,
            actor: me.userId,
            action: 'sale.created',
            message: `Sale ${invoiceNumber} · ${d.customer.name} · ${sym}${total.toFixed(0)}${dueNote}`,
          },
        ],
        { session }
      );
    });

    return ok(created, 201);
  } catch (e: any) {
    return fail(
      e.message === 'INSUFFICIENT_STOCK'
        ? 'Stock changed or is insufficient. Refresh products and try again.'
        : e.message === 'DISCOUNT_TOO_LARGE'
        ? 'Discount cannot exceed subtotal'
        : e.message === 'DUE_REQUIRES_CUSTOMER_INFO'
        ? 'Please enter the customer name and phone number for due/credit sales.'
        : 'Could not complete sale',
      400
    );
  } finally {
    await session?.endSession();
  }
}
