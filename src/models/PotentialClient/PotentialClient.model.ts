import mongoose, { Schema } from 'mongoose';
import { IPotentialClient } from '../../types/user.types';

const PotentialClientSchema = new Schema<IPotentialClient>(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    targetCountry: {
      type: String,
      required: true
    },
    preferredCourse: String,
    consultantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    source: {
      type: String,
      enum: ['tablet', 'website', 'referral', 'walk-in'],
      default: 'tablet'
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'interested', 'not_interested', 'approved'],
      default: 'new'
    },
    notes: String
  },
  {
    timestamps: true
  }
);

PotentialClientSchema.index({ consultantId: 1 });
PotentialClientSchema.index({ status: 1 });
PotentialClientSchema.index({ email: 1 });

export default mongoose.model<IPotentialClient>('PotentialClient', PotentialClientSchema);