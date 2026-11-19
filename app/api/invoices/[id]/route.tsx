import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail } from '@/lib/http';
import Sale from '@/models/Sale';
import Shop from '@/models/Shop';
import Customer from '@/models/Customer';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b' },
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderColor: '#2563eb',
    paddingBottom: 12,
    marginBottom: 14,
  },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1d4ed8', marginBottom: 4 },
  subText: { fontSize: 9, color: '#475569', marginBottom: 2 },
  badge: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'right',
  },
  customerBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colItem: { flex: 2.4 },
  colWarranty: { flex: 1, textAlign: 'center' },
  colQty: { flex: 0.8, textAlign: 'center' },
  colPrice: { flex: 1.1, textAlign: 'right' },
  colTotal: { flex: 1.2, textAlign: 'right' },
  totalsWrap: { marginTop: 14, alignItems: 'flex-end' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 210,
    paddingVertical: 3,
  },
  bold: { fontFamily: 'Helvetica-Bold' },
  dueBox: {
    borderTopWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 4,
    paddingTop: 4,
  },
  signatures: {
    marginTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sigLine: {
    borderTopWidth: 1,
    borderColor: '#64748b',
    width: 150,
    paddingTop: 4,
    textAlign: 'center',
    fontSize: 9,
    color: '#475569',
  },
  footer: { marginTop: 28, textAlign: 'center', fontSize: 9, color: '#64748b' },
});

export async function GET(_r: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  await connectDB();
  const [s, shop]: [any, any] = await Promise.all([
    Sale.findOne({ _id: params.id, shop: me.shopId }).lean(),
    Shop.findById(me.shopId).lean(),
  ]);
  if (!s || !shop) return fail('Invoice not found', 404);

  const customerDoc: any = s.customer ? await Customer.findById(s.customer).lean() : null;
  // Use ASCII-safe currency label so Helvetica never renders garbled glyphs for '৳'
  const currency = shop.currency === 'USD' ? '$' : 'Tk. ';
  const paidAmount =
    s.paidAmount !== undefined
      ? s.paidAmount
      : s.paymentMethod === 'Due / Credit'
      ? 0
      : s.total;
  const dueAmount =
    s.dueAmount !== undefined
      ? s.dueAmount
      : s.paymentMethod === 'Due / Credit'
      ? s.total
      : 0;

  const pdf = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBox}>
          <View>
            <Text style={styles.title}>{shop.name || 'Ashik Electric'}</Text>
            {shop.ownerName ? <Text style={styles.subText}>Owner: {shop.ownerName}</Text> : null}
            {shop.address ? <Text style={styles.subText}>{shop.address}</Text> : null}
            {shop.phone ? <Text style={styles.subText}>Phone: {shop.phone}</Text> : null}
            {shop.email ? <Text style={styles.subText}>Email: {shop.email}</Text> : null}
          </View>
          <View>
            <Text style={styles.badge}>CASH MEMO / INVOICE</Text>
            <Text style={[styles.subText, { textAlign: 'right' }]}>No: {s.invoiceNumber}</Text>
            <Text style={[styles.subText, { textAlign: 'right' }]}>
              Date: {new Date(s.date).toLocaleDateString()}
            </Text>
            <Text style={[styles.subText, { textAlign: 'right' }]}>
              Payment: {s.paymentMethod}
            </Text>
          </View>
        </View>

        <View style={styles.customerBox}>
          <View>
            <Text style={styles.bold}>Customer: {s.customerSnapshot?.name || 'Walk-in Customer'}</Text>
            {s.customerSnapshot?.phone ? (
              <Text style={styles.subText}>Phone: {s.customerSnapshot.phone}</Text>
            ) : null}
            {s.customerSnapshot?.address ? (
              <Text style={styles.subText}>Address: {s.customerSnapshot.address}</Text>
            ) : null}
          </View>
          <View>
            <Text style={[styles.bold, { color: dueAmount > 0 ? '#dc2626' : '#16a34a' }]}>
              Status: {dueAmount > 0 ? 'PARTIAL / DUE' : 'PAID IN FULL'}
            </Text>
            {customerDoc && (customerDoc.totalDue || 0) > 0 ? (
              <Text style={styles.subText}>
                Total Ledger Due: {currency}
                {Number(customerDoc.totalDue).toFixed(2)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colItem}>Description / Item</Text>
          <Text style={styles.colWarranty}>Warranty</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Unit Price</Text>
          <Text style={styles.colTotal}>Line Total</Text>
        </View>

        {s.items.map((i: any, idx: number) => (
          <View key={`${String(i.product)}-${idx}`} style={styles.tableRow}>
            <Text style={styles.colItem}>
              {i.name} {i.sku ? `(${i.sku})` : ''}
            </Text>
            <Text style={styles.colWarranty}>{i.warranty || 'No Warranty'}</Text>
            <Text style={styles.colQty}>
              {i.qty} {i.unit}
            </Text>
            <Text style={styles.colPrice}>
              {currency}
              {Number(i.unitPrice).toFixed(2)}
            </Text>
            <Text style={[styles.colTotal, styles.bold]}>
              {currency}
              {Number(i.lineTotal).toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.totalsWrap}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>
              {currency}
              {Number(s.subtotal).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Discount:</Text>
            <Text>
              - {currency}
              {Number(s.discount).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.bold]}>
            <Text>Net Payable Total:</Text>
            <Text>
              {currency}
              {Number(s.total).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.dueBox]}>
            <Text>Cash Paid:</Text>
            <Text>
              {currency}
              {Number(paidAmount).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.bold]}>
            <Text>Balance Due (This Bill):</Text>
            <Text>
              {currency}
              {Number(dueAmount).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.signatures}>
          <Text style={styles.sigLine}>Customer Signature</Text>
          <Text style={styles.sigLine}>Authorized Signature ({shop.name})</Text>
        </View>

        <Text style={styles.footer}>
          {shop.invoiceFooter || 'Thank you for shopping at Ashik Electric!'}
        </Text>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(pdf);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${s.invoiceNumber}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
