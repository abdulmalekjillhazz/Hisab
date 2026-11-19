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
    const customer = await Customer.findOne({ _id: params.id, shop: me.shopId });
    if (!customer) return fail('Customer not found', 404);
    if ((customer.totalDue || 0) <= 0) return fail('This customer has no outstanding due', 400);
    if (d.amount > customer.totalDue) {
      return fail(`Payment cannot exceed current due (${customer.totalDue})`, 400);
    }

    customer.totalDue = Math.max(0, customer.totalDue - d.amount);
    customer.payments = customer.payments || [];
    customer.payments.push({
      amount: d.amount,
      method: d.method,
      note: d.note || 'Due collection',
      date: new Date(),
    });
    await customer.save();

    await Activity.create({
      shop: me.shopId,
      actor: me.userId,
      action: 'customer.due_paid',
      message: `Collected due ৳${d.amount.toFixed(0)} from ${customer.name} via ${d.method} (Remaining due: ৳${customer.totalDue.toFixed(0)})`,
    });

    return ok(customer);
  } catch {
    return fail('Invalid due payment details', 400);
  }
}
