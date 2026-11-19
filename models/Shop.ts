import { Schema, models, model } from 'mongoose';

const S = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'Ashik Electric', trim: true },
    ownerName: String,
    phone: String,
    email: String,
    address: String,
    avatar: { type: String, default: '' }, // Profile picture / Logo (< 200 KB)
    category: {
      type: String,
      enum: ['electrical', 'grocery', 'clothing', 'pharmacy', 'electronics', 'restaurant', 'general'],
      default: 'general',
    },
    currency: { type: String, enum: ['BDT', 'USD'], default: 'BDT' },
    invoiceFooter: { type: String, default: 'Thank you for shopping with us!' },
    locale: { type: String, enum: ['en', 'bn'], default: 'en' },
  },
  { timestamps: true }
);

export default models.Shop || model('Shop', S);
