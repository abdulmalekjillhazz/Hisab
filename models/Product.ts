import { Schema, models, model } from 'mongoose';

const S = new Schema(
  {
    shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true, default: '' },
    sku: { type: String, trim: true, uppercase: true },
    category: { type: String, default: 'General', trim: true },
    unit: { type: String, default: 'Piece' },
    warranty: { type: String, default: 'No Warranty' },
    warrantyUntil: { type: Date },
    cost: { type: Number, min: 0, required: true },
    price: { type: Number, min: 0, required: true },
    qty: { type: Number, min: 0, required: true },
    minStock: { type: Number, min: 0, default: 5 },
    image: { url: String, publicId: String },
  },
  { timestamps: true }
);

S.index(
  { shop: 1, sku: 1 },
  { unique: true, partialFilterExpression: { sku: { $type: 'string', $gt: '' } } }
);
S.index({ shop: 1, name: 'text', brand: 'text', sku: 'text', category: 'text' });

export default models.Product || model('Product', S);
