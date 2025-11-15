import mongoose, { Schema } from 'mongoose';

export interface IBackendOfficerProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  assignedApplications: mongoose.Types.ObjectId[];
  specialization: string[];
  documentsProcessed: number;
  visaApplicationsHandled: number;
  successfulApplications: number;
  pendingApplications: number;
  expertise: {
    countries: string[];
    visaTypes: string[];
  };
  workload: {
    current: number;
    maximum: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BackendOfficerProfileSchema = new Schema<IBackendOfficerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    assignedApplications: [{
      type: Schema.Types.ObjectId,
      ref: 'Lead'
    }],
    specialization: [{
      type: String,
      default: ['General Processing']
    }],
    documentsProcessed: {
      type: Number,
      default: 0
    },
    visaApplicationsHandled: {
      type: Number,
      default: 0
    },
    successfulApplications: {
      type: Number,
      default: 0
    },
    pendingApplications: {
      type: Number,
      default: 0
    },
    expertise: {
      countries: [String],
      visaTypes: [String]
    },
    workload: {
      current: {
        type: Number,
        default: 0
      },
      maximum: {
        type: Number,
        default: 20
      }
    }
  },
  {
    timestamps: true
  }
);

BackendOfficerProfileSchema.index({ userId: 1 });
BackendOfficerProfileSchema.index({ 'workload.current': 1 });

export default mongoose.model<IBackendOfficerProfile>('BackendOfficerProfile', BackendOfficerProfileSchema);