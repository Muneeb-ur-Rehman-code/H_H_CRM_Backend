import mongoose, { Schema } from 'mongoose';

export interface IManagerProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  department: string;
  teamMembers: mongoose.Types.ObjectId[];
  permissions: string[];
  reportsTo?: mongoose.Types.ObjectId;
  performance: {
    targetsAchieved: number;
    totalTargets: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ManagerProfileSchema = new Schema<IManagerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    department: {
      type: String,
      default: 'General Management'
    },
    teamMembers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    permissions: [{
      type: String
    }],
    reportsTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    performance: {
      targetsAchieved: {
        type: Number,
        default: 0
      },
      totalTargets: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

ManagerProfileSchema.index({ userId: 1 });

export default mongoose.model<IManagerProfile>('ManagerProfile', ManagerProfileSchema);