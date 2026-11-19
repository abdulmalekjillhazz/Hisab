import { Schema, models, model } from 'mongoose';

const S = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    role: { type: String, enum: ['owner', 'staff'], default: 'owner' },
    avatar: { type: String, default: '' }, // DataURL or Cloudinary URL
    securityPin: { type: String, default: '1234', trim: true }, // Master PIN for password recovery
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.User || model('User', S);
