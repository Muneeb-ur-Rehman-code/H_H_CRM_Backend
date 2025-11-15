import mongoose, { Schema } from 'mongoose';
import { IStudentProfile } from '../../types/user.types';

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    targetCountry: String,
    targetUniversity: String,
    educationLevel: String,
    englishProficiency: String,
    budget: String,
    intakePreference: String,
    applicationStatus: {
      type: String,
      enum: ['potential_client', 'lead', 'active', 'completed'],
      default: 'lead'
    },
    documentsSubmitted: {
      type: Boolean,
      default: false
    },
    visaStatus: String
  },
  {
    timestamps: true
  }
);

StudentProfileSchema.index({ userId: 1 });
StudentProfileSchema.index({ applicationStatus: 1 });

export default mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);