import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IUser, UserRole } from '../../types/user.types';
import { CONSTANTS } from '../../config/constants';

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
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
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true
    },
    phone: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    passwordSetupToken: {
      type: String,
      select: false
    },
    passwordSetupExpire: {
      type: Date,
      select: false
    },
    lastLogin: Date
  },
  {
    timestamps: true
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ email: 1, role: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(CONSTANTS.BCRYPT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
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

// Generate password setup token
UserSchema.methods.generatePasswordSetupToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordSetupToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.passwordSetupExpire = new Date(
    Date.now() + CONSTANTS.PASSWORD_SETUP_EXPIRE
  );
  
  return token;
};

export default mongoose.model<IUser>('User', UserSchema);