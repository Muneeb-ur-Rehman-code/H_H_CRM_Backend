import mongoose, { Schema } from 'mongoose';
import { ILead } from '../../types/user.types';

const NoteSchema = new Schema({
  text: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const LeadSchema = new Schema<ILead>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    consultantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'documentation', 'visa_processing', 'completed'],
      default: 'new'
    },
    assignedBackendOfficer: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    notes: [NoteSchema]
  },
  {
    timestamps: true
  }
);

LeadSchema.index({ studentId: 1 });
LeadSchema.index({ consultantId: 1 });
LeadSchema.index({ status: 1 });

export default mongoose.model<ILead>('Lead', LeadSchema);