import mongoose, { Schema } from 'mongoose';

export interface IAccountantProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  assignedStudents: mongoose.Types.ObjectId[];
  specialization: string[];
  totalTransactions: number;
  pendingPayments: number;
  completedPayments: number;
  financialReports: IFinancialReport[];
  createdAt: Date;
  updatedAt: Date;
}

interface IFinancialReport {
  month: string;
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  createdAt: Date;
}

const FinancialReportSchema = new Schema({
  month: String,
  year: Number,
  totalRevenue: Number,
  totalExpenses: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AccountantProfileSchema = new Schema<IAccountantProfile>(
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
    specialization: [{
      type: String,
      default: ['General Accounting']
    }],
    totalTransactions: {
      type: Number,
      default: 0
    },
    pendingPayments: {
      type: Number,
      default: 0
    },
    completedPayments: {
      type: Number,
      default: 0
    },
    financialReports: [FinancialReportSchema]
  },
  {
    timestamps: true
  }
);

AccountantProfileSchema.index({ userId: 1 });

export default mongoose.model<IAccountantProfile>('AccountantProfile', AccountantProfileSchema);