import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import Activity from '@/models/ActivityLog';

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  await connectDB();

  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const sale = await Sale.findOne({ _id: params.id, shop: me.shopId }).session(session);
      if (!sale) throw Error('NOT_FOUND');

      for (const item of sale.items) {
        await Product.findOneAndUpdate(
          { _id: item.product, shop: me.shopId },
          { $inc: { qty: item.qty } },
          { session }
        );
      }

      if (sale.customer) {
        const cust = await Customer.findOne({ _id: sale.customer, shop: me.shopId }).session(session);
        if (cust) {
          cust.visits = Math.max(0, (cust.visits || 1) - 1);
          cust.totalSpent = Math.max(0, (cust.totalSpent || 0) - (sale.total || 0));
          const saleDue =
            sale.dueAmount !== undefined
              ? sale.dueAmount
              : sale.paymentMethod === 'Due / Credit'
              ? sale.total
              : 0;
          cust.totalDue = Math.max(0, (cust.totalDue || 0) - saleDue);
          await cust.save({ session });
        }
      }

      await Sale.deleteOne({ _id: sale._id }, { session: session ?? undefined });
      await Activity.create(
        [
          {
            shop: me.shopId,
            actor: me.userId,
            action: 'sale.returned',
            message: `Returned / Cancelled invoice ${sale.invoiceNumber} (${sale.customerSnapshot?.name || 'Customer'}) — stock restored`,
          },
        ],
        { session: session ?? undefined }
      );
    });

    return ok({ returned: true });
  } catch (e: any) {
    return fail(e.message === 'NOT_FOUND' ? 'Invoice not found' : 'Could not return sale', 400);
  } finally {
    await session?.endSession();
  }
}
