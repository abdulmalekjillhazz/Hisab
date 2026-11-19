import { Schema, models, model } from 'mongoose';

const Item = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: String,
    unit: String,
    warranty: { type: String, default: 'No Warranty' },
    qty: { type: Number, min: 1, required: true },
    unitCost: { type: Number, min: 0, default: 0 },
    unitPrice: { type: Number, min: 0, required: true },
    lineTotal: { type: Number, min: 0, required: true },
  },
  { _id: false }
);

const S = new Schema(
  {
    shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    invoiceNumber: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerSnapshot: { name: String, phone: String, address: String },
    items: { type: [Item], required: true },
    subtotal: { type: Number, min: 0, required: true },
    discount: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, required: true },
    totalCost: { type: Number, min: 0, default: 0 },
    paidAmount: { type: Number, min: 0, default: 0 },
    dueAmount: { type: Number, min: 0, default: 0 },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'bKash', 'Nagad', 'Bank transfer', 'Due / Credit'],
      default: 'Cash',
    },
    date: { type: Date, default: Date.now, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

S.index({ shop: 1, invoiceNumber: 1 }, { unique: true });
S.index({ shop: 1, date: -1 });

export default models.Sale || model('Sale', S);
