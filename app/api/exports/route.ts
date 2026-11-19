import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail } from '@/lib/http';
import Sale from '@/models/Sale';

const csv = (v: unknown) => {
  let s = String(v ?? '');
  if (/^[\s]*[=+@]/.test(s) || /^\s*-/.test(s)) s = "'" + s;
  return `"${s.replaceAll('"', '""')}"`;
};

export async function GET(req: Request) {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  await connectDB();
  const u = new URL(req.url);
  const from = u.searchParams.get('from');
  const to = u.searchParams.get('to');
  const end = to ? new Date(to) : null;
  if (end && to?.length === 10) end.setHours(23, 59, 59, 999);

  const f: any = { shop: me.shopId };
  if (from || to) {
    f.date = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(end ? { $lte: end } : {}),
    };
  }

  const sales = await Sale.find(f).sort({ date: 1 }).lean();
  const rows: unknown[][] = [
    [
      'Invoice',
      'Date',
      'Customer',
      'Phone',
      'Payment Method',
      'Product',
      'Warranty',
      'Quantity',
      'Unit Cost',
      'Unit Price',
      'Line Total',
      'Invoice Total',
      'Paid Amount',
      'Due Amount',
    ],
  ];

  for (const s of sales) {
    const paid =
      s.paidAmount !== undefined
        ? s.paidAmount
        : s.paymentMethod === 'Due / Credit'
        ? 0
        : s.total;
    const due =
      s.dueAmount !== undefined
        ? s.dueAmount
        : s.paymentMethod === 'Due / Credit'
        ? s.total
        : 0;
    for (const i of s.items) {
      rows.push([
        s.invoiceNumber,
        s.date.toISOString(),
        s.customerSnapshot?.name || '',
        s.customerSnapshot?.phone || '',
        s.paymentMethod,
        i.name,
        (i as any).warranty || 'No Warranty',
        i.qty,
        (i as any).unitCost || 0,
        i.unitPrice,
        i.lineTotal,
        s.total,
        paid,
        due,
      ]);
    }
  }

  return new Response('\uFEFF' + rows.map((r) => r.map(csv).join(',')).join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ashik-electric-sales.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
