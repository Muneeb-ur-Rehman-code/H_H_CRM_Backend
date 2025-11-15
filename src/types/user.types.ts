import { Document, Types } from 'mongoose';

export enum UserRole {
  CEO = 'ceo',
  MANAGER = 'manager',
  CONSULTANT = 'consultant',
  ACCOUNTANT = 'accountant',
  BACKEND_OFFICER = 'backend_officer',
  STUDENT = 'student'
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  passwordSetupToken?: string;
  passwordSetupExpire?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordSetupToken(): string;
}

export interface IStudentProfile extends Document {
  userId: Types.ObjectId;
  targetCountry?: string;
  targetUniversity?: string;
  educationLevel?: string;
  englishProficiency?: string;
  budget?: string;
  intakePreference?: string;
  applicationStatus: 'potential_client' | 'lead' | 'active' | 'completed';
  documentsSubmitted: boolean;
  visaStatus?: string;
}

export interface IConsultantProfile extends Document {
  userId: Types.ObjectId;
  assignedStudents: Types.ObjectId[];
  expertiseCountries: string[];
  totalLeads: number;
  convertedLeads: number;
  meetingHistory: IMeeting[];
}

export interface IMeeting {
  studentId: Types.ObjectId;
  date: Date;
  notes: string;
  outcome: string;
}

export interface IManagerProfile extends Document {
  userId: Types.ObjectId;
  department: string;
  teamMembers: Types.ObjectId[];
  permissions: string[];
}

export interface IAccountantProfile extends Document {
  userId: Types.ObjectId;
  assignedStudents: Types.ObjectId[];
  totalTransactions: number;
  pendingPayments: number;
}

export interface IBackendOfficerProfile extends Document {
  userId: Types.ObjectId;
  assignedApplications: Types.ObjectId[];
  specialization: string[];
  documentsProcessed: number;
}

export interface IPotentialClient extends Document {
  name: string;
  email: string;
  phone: string;
  targetCountry: string;
  preferredCourse?: string;
  consultantId: Types.ObjectId;
  source: 'tablet' | 'website' | 'referral' | 'walk-in';
  status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'approved';
  notes?: string;
  createdAt: Date;
}

export interface ILead extends Document {
  studentId: Types.ObjectId;
  consultantId: Types.ObjectId;
  status: 'new' | 'in_progress' | 'documentation' | 'visa_processing' | 'completed';
  assignedBackendOfficer?: Types.ObjectId;
  priority: 'low' | 'medium' | 'high';
  notes: INote[];
  createdAt: Date;
}

export interface INote {
  text: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}