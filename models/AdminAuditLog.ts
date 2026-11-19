import { Schema, models, model } from 'mongoose';

const S = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, enum: ['user.suspend', 'user.activate', 'shop.suspend', 'shop.activate'] },
  targetType: { type: String, required: true, enum: ['User', 'Shop'] },
  targetId: { type: Schema.Types.ObjectId, required: true, index: true },
  targetLabel: { type: String, required: true, maxlength: 180 },
  ip: { type: String, maxlength: 64 },
}, { timestamps: { createdAt: true, updatedAt: false } });
S.index({ createdAt: -1 });
export default models.AdminAuditLog || model('AdminAuditLog', S);
