import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import Customer from '@/models/Customer';
import Activity from '@/models/ActivityLog';

const schema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(['Cash', 'bKash', 'Nagad', 'Bank transfer']).default('Cash'),
  note: z.string().max(200).optional().default(''),
});

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const me = await identity();
  if (!me) return fail('Sign in required', 401);

  try {
    const d = schema.parse(await req.json());
    await connectDB();
    const customer = await Customer.findOneAndUpdate(
      { _id: params.id, shop: me.shopId, totalDue: { $gte: d.amount } },
      {
        $inc: { totalDue: -d.amount },
        $push: {
          payments: {
            amount: d.amount,
            method: d.method,
            note: d.note || 'Due collection',
            date: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      const exists = await Customer.exists({ _id: params.id, shop: me.shopId });
      if (!exists) return fail('Customer not found', 404);
      const current: any = await Customer.findOne({ _id: params.id, shop: me.shopId }).select('totalDue').lean();
      return fail(
        current?.totalDue
          ? `Payment exceeds the current due (${current.totalDue})`
          : 'This customer has no outstanding due',
        400
      );
    }

    // The balance update is committed; a log outage must not cause a retry
    // that could record the same payment twice.
    try {
      await Activity.create({
        shop: me.shopId,
        actor: me.userId,
        action: 'customer.due_paid',
        message: `Collected due ৳${d.amount.toFixed(0)} from ${customer.name} via ${d.method} (Remaining due: ৳${customer.totalDue.toFixed(0)})`,
      });
    } catch (error) {
      console.error('Due payment activity log failed:', error);
    }

    return ok(customer);
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message || 'Invalid due payment details', 400);
    console.error('Due payment failed:', error);
    return fail('Could not record due payment. Refresh the ledger and check the balance.', 500);
  }
}
