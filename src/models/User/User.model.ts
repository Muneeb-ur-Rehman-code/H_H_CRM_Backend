import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IUser, UserRole } from '../../types/user.types';
import { CONSTANTS } from '../../config/constants';

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email'
      ]
    },
    password: {
      type: String,
      select: false,
      minlength: CONSTANTS.PASSWORD_MIN_LENGTH
    },
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true
    },
    
    // Account Status Management
    accountStatus: {
      type: String,
      enum: ['pending_approval', 'pending_setup', 'active', 'suspended'],
      default: 'pending_approval'
    },
    
    // Tracking Fields
    passwordSet: {
      type: Boolean,
      default: false
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    profileCompleted: {
      type: Boolean,
      default: false
    },
    
    // Creation & Approval Info
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdVia: {
      type: String,
      enum: ['admin', 'self_registration', 'consultant', 'direct'],
      required: true
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    
    // For Pending Staff Registration
    pendingRegistrationData: {
      additionalInfo: Schema.Types.Mixed,
      submittedAt: Date,
      reviewNotes: String
    },
    
    // OTP Fields
    emailOTP: {
      code: {
        type: String,
        select: false
      },
      expiry: {
        type: Date,
        select: false
      },
      attempts: {
        type: Number,
        default: 0,
        select: false
      },
      lastAttempt: {
        type: Date,
        select: false
      }
    },
    
    // Setup Token (for email links)
    setupToken: {
      type: String,
      select: false
    },
    setupTokenExpiry: {
      type: Date,
      select: false
    },
    
    // Activity Tracking
    lastLogin: Date,
    setupCompletedAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ accountStatus: 1 });
UserSchema.index({ 'emailOTP.expiry': 1 });
UserSchema.index({ 'setupTokenExpiry': 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(CONSTANTS.BCRYPT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordSet = true;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate 6-digit OTP
UserSchema.methods.generateOTP = function(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.emailOTP = {
    code: crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex'),
    expiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: 0,
    lastAttempt: new Date()
  };
  
  return otp;
};

// Verify OTP
UserSchema.methods.verifyOTP = async function(otp: string): Promise<boolean> {
  if (!this.emailOTP?.code || !this.emailOTP?.expiry) {
    return false;
  }
  
  if (new Date() > this.emailOTP.expiry) {
    return false;
  }
  
  if (this.emailOTP.attempts >= 5) {
    return false;
  }
  
  // Rate limiting - wait 30 seconds between attempts
  if (this.emailOTP.lastAttempt) {
    const timeSinceLastAttempt = Date.now() - this.emailOTP.lastAttempt.getTime();
    if (timeSinceLastAttempt < 30000) {
      throw new Error('Please wait 30 seconds before trying again');
    }
  }
  
  this.emailOTP.attempts += 1;
  this.emailOTP.lastAttempt = new Date();
  
  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  if (hashedOTP === this.emailOTP.code) {
    this.emailOTP = undefined;
    this.emailVerified = true;
    return true;
  }
  
  await this.save();
  return false;
};

// Generate Setup Token (48 hours validity)
UserSchema.methods.generateSetupToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  
  this.setupToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.setupTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
  
  return token;
};

export default mongoose.model<IUser>('User', UserSchema);