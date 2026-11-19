import { Schema, models, model } from 'mongoose';

const PaymentEntry = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, default: 'Cash' },
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const S = new Schema(
  {
    shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    phone: { type: String, default: '' },
    normalizedPhone: { type: String, default: '' },
    address: { type: String, default: '' },
    visits: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalDue: { type: Number, default: 0, min: 0 },
    payments: { type: [PaymentEntry], default: [] },
    lastVisit: Date,
  },
  { timestamps: true }
);

S.index({ shop: 1, normalizedPhone: 1 });
S.index({ shop: 1, normalizedName: 1 });
S.index({ shop: 1, totalDue: -1 });

export default models.Customer || model('Customer', S);
