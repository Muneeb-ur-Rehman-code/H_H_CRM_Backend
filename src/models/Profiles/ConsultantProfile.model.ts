import mongoose, { Schema } from 'mongoose';
import { IConsultantProfile } from '../../types/user.types';

const MeetingSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  date: Date,
  notes: String,
  outcome: String
});

const ConsultantProfileSchema = new Schema<IConsultantProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    assignedStudents: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    expertiseCountries: [String],
    totalLeads: {
      type: Number,
      default: 0
    },
    convertedLeads: {
      type: Number,
      default: 0
    },
    meetingHistory: [MeetingSchema]
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IConsultantProfile>('ConsultantProfile', ConsultantProfileSchema);