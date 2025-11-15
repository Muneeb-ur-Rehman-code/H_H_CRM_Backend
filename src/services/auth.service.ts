import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/config';
import User from '../models/User/User.model';
import StudentProfile from '../models/Profiles/StudentProfile.model';
import ConsultantProfile from '../models/Profiles/ConsultantProfile.model';
import PotentialClient from '../models/PotentialClient/PotentialClient.model';
import Lead from '../models/Lead/Lead.model';
import { IUser, UserRole } from '../types/user.types';
import { TokenPayload } from '../types/auth.types';
import ApiError from '../utils/ApiError';
import { ERROR_MESSAGES } from '../config/constants';
import EmailService from './email.service';

class AuthService {
  // Generate JWT Token
  generateToken(userId: string, role: string): string {
    const payload: TokenPayload = { id: userId, role };
    const signOptions: SignOptions = {
      expiresIn: config.jwtExpire as SignOptions['expiresIn']
    };

    return jwt.sign(payload, config.jwtSecret, signOptions);
  }

  // Verify JWT Token
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  }

  // Staff Login
  async staffLogin(email: string, password: string, role: string): Promise<{ user: IUser; token: string }> {
    // Find user with password field
    const user = await User.findOne({ email, role }).select('+password');

    if (!user) {
      throw new ApiError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new ApiError(403, ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
    }

    if (!user.password) {
      throw new ApiError(400, ERROR_MESSAGES.PASSWORD_NOT_SET);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user._id.toString(), user.role);

    // Remove password from response
    user.password = undefined;

    return { user, token };
  }

  // Student Login
  async studentLogin(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ 
      email, 
      role: UserRole.STUDENT 
    }).select('+password');

    if (!user) {
      throw new ApiError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.password) {
      throw new ApiError(400, ERROR_MESSAGES.PASSWORD_NOT_SET);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user._id.toString(), user.role);
    user.password = undefined;

    return { user, token };
  }

  // Check Student Email
  async checkStudentEmail(email: string): Promise<{
    exists: boolean;
    hasPassword: boolean;
    isStudent: boolean;
  }> {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return { exists: false, hasPassword: false, isStudent: false };
    }

    return {
      exists: true,
      hasPassword: !!user.password,
      isStudent: user.role === UserRole.STUDENT
    };
  }

  // Student Registration
  async registerStudent(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ user: IUser; token: string }> {
    // Check if user exists
    let user = await User.findOne({ email: data.email }).select('+password');

    if (user) {
      if (!user.password && user.role === UserRole.STUDENT) {
        // Update existing user with password
        user.password = data.password;
        user.name = data.name || user.name;
        user.phone = data.phone || user.phone;
        user.isEmailVerified = true;
        await user.save();

        const token = this.generateToken(user._id.toString(), user.role);
        user.password = undefined;
        return { user, token };
      }

      throw new ApiError(400, ERROR_MESSAGES.USER_EXISTS);
    }

    // Create new student user
    user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: UserRole.STUDENT,
      isEmailVerified: false
    });

    // Create student profile
    await StudentProfile.create({
      userId: user._id,
      applicationStatus: 'potential_client'
    });

    const token = this.generateToken(user._id.toString(), user.role);
    user.password = undefined;

    return { user, token };
  }

  // Set Password (via link)
  async setPassword(token: string, password: string): Promise<{ user: IUser; token: string }> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordSetupToken: hashedToken,
      passwordSetupExpire: { $gt: Date.now() }
    }).select('+passwordSetupToken +passwordSetupExpire');

    if (!user) {
      throw new ApiError(400, ERROR_MESSAGES.INVALID_TOKEN);
    }

    user.password = password;
    user.passwordSetupToken = undefined;
    user.passwordSetupExpire = undefined;
    user.isEmailVerified = true;
    await user.save();

    const jwtToken = this.generateToken(user._id.toString(), user.role);
    user.password = undefined;

    return { user, token: jwtToken };
  }

  // Approve Potential Client (Consultant)
  async approvePotentialClient(
    potentialClientId: string,
    consultantId: string
  ): Promise<void> {
    const potentialClient = await PotentialClient.findById(potentialClientId);
    
    if (!potentialClient) {
      throw new ApiError(404, 'Potential client not found');
    }

    // Create user account (without password)
    const user = await User.create({
      name: potentialClient.name,
      email: potentialClient.email,
      phone: potentialClient.phone,
      role: UserRole.STUDENT,
      isActive: true,
      isEmailVerified: false
    });

    // Generate password setup token
    const setupToken = user.generatePasswordSetupToken();
    await user.save();

    // Create student profile
    await StudentProfile.create({
      userId: user._id,
      targetCountry: potentialClient.targetCountry,
      applicationStatus: 'lead'
    });

    // Create lead
    await Lead.create({
      studentId: user._id,
      consultantId: consultantId,
      status: 'new',
      priority: 'medium'
    });

    // Update consultant profile
    await ConsultantProfile.findOneAndUpdate(
      { userId: consultantId },
      {
        $push: { assignedStudents: user._id },
        $inc: { totalLeads: 1 }
      }
    );

    // Send email with password setup link
    await EmailService.sendPasswordSetupEmail(user, setupToken);

    // Delete from potential clients
    await PotentialClient.findByIdAndDelete(potentialClientId);
  }
}

export default new AuthService();