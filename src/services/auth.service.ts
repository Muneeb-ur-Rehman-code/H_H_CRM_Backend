import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User/User.model';
import StudentProfile from '../models/Profiles/StudentProfile.model';
import ConsultantProfile from '../models/Profiles/ConsultantProfile.model';
import AccountantProfile from '../models/Profiles/AccountantProfile.model';
import BackendOfficerProfile from '../models/Profiles/BackendOfficerProfile.model';
import ManagerProfile from '../models/Profiles/ManagerProfile.model';
import PotentialClient from '../models/PotentialClient/PotentialClient.model';
import Lead from '../models/Lead/Lead.model';
import { IUser, UserRole } from '../types/user.types';
import ApiError from '../utils/ApiError';
import { ERROR_MESSAGES } from '../config/constants';
import EmailService from './email.service';
import TokenService from './token.service';

class AuthService {
  
  // ==================== STAFF AUTHENTICATION ====================
  
  /**
   * Method 1: Admin creates staff directly
   */
  async adminCreateStaff(
    adminId: string,
    data: {
      email: string;
      name: string;
      role: UserRole;
      phone?: string;
    }
  ): Promise<{ message: string; userId: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    // Create user account
    const user = await User.create({
      email: data.email,
      name: data.name,
      role: data.role,
      phone: data.phone,
      accountStatus: 'pending_setup',
      passwordSet: false,
      emailVerified: false,
      profileCompleted: false,
      createdBy: adminId,
      createdVia: 'admin',
      approvedBy: adminId,
      approvedAt: new Date()
    });

    // Generate setup token
    const setupToken = user.generateSetupToken();
    await user.save();

    // Send setup email
    await EmailService.sendStaffSetupEmail(user.email, user.name, setupToken, user.role);

    return {
      message: 'Staff account created and setup email sent',
      userId: user._id.toString()
    };
  }

  /**
   * Method 2: Staff self-registration
   */
  async staffSelfRegister(data: {
    email: string;
    name: string;
    role: UserRole;
    phone: string;
    additionalInfo?: any;
  }): Promise<{ message: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    
    if (existingUser) {
      if (existingUser.accountStatus === 'pending_approval') {
        throw new ApiError(400, 'A registration request for this email is already pending approval');
      }
      throw new ApiError(400, 'User with this email already exists');
    }

    // Validate role (staff only, no CEO or Student)
    const allowedRoles = [
      UserRole.MANAGER,
      UserRole.CONSULTANT,
      UserRole.ACCOUNTANT,
      UserRole.BACKEND_OFFICER
    ];

    if (!allowedRoles.includes(data.role)) {
      throw new ApiError(400, 'Invalid role for staff registration');
    }

    // Create pending user
    const user = await User.create({
      email: data.email,
      name: data.name,
      role: data.role,
      phone: data.phone,
      accountStatus: 'pending_approval',
      passwordSet: false,
      emailVerified: false,
      profileCompleted: false,
      createdVia: 'self_registration',
      pendingRegistrationData: {
        additionalInfo: data.additionalInfo,
        submittedAt: new Date()
      }
    });

    // Send OTP for email verification
    const otp = user.generateOTP();
    await EmailService.sendOTPEmail(user.email, otp);
    await user.save();

    // Notify admin about new registration request
    await this.notifyAdminNewRegistration(user);

    return {
      message: 'Registration request submitted. Please verify your email with the OTP sent.'
    };
  }

  /**
   * Verify OTP for staff self-registration
   */
  async verifyStaffRegistrationOTP(email: string, otp: string): Promise<{ message: string }> {
    const user = await User.findOne({ email, accountStatus: 'pending_approval' })
      .select('+emailOTP.code +emailOTP.expiry +emailOTP.attempts +emailOTP.lastAttempt');

    if (!user) {
      throw new ApiError(404, 'No pending registration found for this email');
    }
console.log(otp)
    const isValid = await user.verifyOTP(otp);
    console.log(isValid)

    if (!isValid) {
      await user.save();
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    user.emailVerified = true;
    await user.save();

    return {
      message: 'Email verified. Your registration is pending admin approval.'
    };
  }

  /**
   * Admin approves staff registration
   */
  async adminApproveStaffRegistration(
    adminId: string,
    userId: string,
    data?: {
      reviewNotes?: string;
      role?: UserRole;
      phone?: string;
    }
  ): Promise<{ message: string }> {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.accountStatus !== 'pending_approval') {
      throw new ApiError(400, 'This registration is not pending approval');
    }

    // Update user with approval
    user.accountStatus = 'pending_setup';
    user.approvedBy = adminId as any;
    user.approvedAt = new Date();
    
    if (data?.reviewNotes) {
      user.pendingRegistrationData = {
        ...user.pendingRegistrationData,
        reviewNotes: data.reviewNotes
      };
    }
    
    if (data?.role) {
      user.role = data.role;
    }
    
    if (data?.phone) {
      user.phone = data.phone;
    }

    // Generate setup token
    const setupToken = user.generateSetupToken();
    await user.save();

    // Send setup email
    await EmailService.sendStaffApprovalEmail(user.email, user.name, setupToken);

    return {
      message: 'Registration approved and setup email sent to staff'
    };
  }

  /**
   * Admin rejects staff registration
   */
  async adminRejectStaffRegistration(
    adminId: string,
    userId: string,
    reason: string
  ): Promise<{ message: string }> {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.accountStatus !== 'pending_approval') {
      throw new ApiError(400, 'This registration is not pending approval');
    }

    // Send rejection email
    await EmailService.sendStaffRejectionEmail(user.email, user.name, reason);

    // Delete the pending user
    await User.findByIdAndDelete(userId);

    return {
      message: 'Registration rejected and user notified'
    };
  }

  /**
   * Staff completes setup (sets password)
   */
  async staffCompleteSetup(token: string, password: string): Promise<{
    user: IUser;
    token: string;
  }> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      setupToken: hashedToken,
      setupTokenExpiry: { $gt: Date.now() },
      accountStatus: 'pending_setup'
    }).select('+setupToken +setupTokenExpiry');

    if (!user) {
      throw new ApiError(400, 'Invalid or expired setup link');
    }

    // Set password and activate account
    user.password = password;
    user.passwordSet = true;
    user.accountStatus = 'active';
    user.profileCompleted = true;
    user.setupToken = undefined;
    user.setupTokenExpiry = undefined;
    user.setupCompletedAt = new Date();
    await user.save();

    // Create role-specific profile
    await this.createRoleSpecificProfile(user._id.toString(), user.role);

    // Notify admin that setup is complete
    await this.notifyAdminSetupComplete(user);

    const jwtToken = TokenService.generateJWT(user._id.toString(), user.role);

    return {
      user,
      token: jwtToken
    };
  }

  /**
   * Staff Login
   */
  async staffLogin(email: string, password: string, role: string): Promise<{
    user: IUser;
    token: string;
  }> {
    // First check if there's a pending registration
    const pendingUser = await User.findOne({ 
      email, 
      accountStatus: 'pending_approval' 
    });

    if (pendingUser) {
      throw new ApiError(403, 'Your registration has not yet been approved by admin');
    }

    // Check for pending setup
    const pendingSetupUser = await User.findOne({ 
      email, 
      accountStatus: 'pending_setup' 
    });

    if (pendingSetupUser) {
      throw new ApiError(403, 'Please complete your account setup using the link sent to your email');
    }

    // Normal login
    const user = await User.findOne({ email, role }).select('+password');

    if (!user) {
      throw new ApiError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.accountStatus !== 'active') {
      throw new ApiError(403, `Account status: ${user.accountStatus}`);
    }

    if (!user.isActive) {
      throw new ApiError(403, ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = TokenService.generateJWT(user._id.toString(), user.role);
    user.password = undefined;

    return { user, token };
  }

  // ==================== STUDENT AUTHENTICATION ====================

  /**
   * Student Login
   */
  async studentLogin(email: string, password: string): Promise<{
    user: IUser;
    token: string;
  }> {
    const user = await User.findOne({ 
      email, 
      role: UserRole.STUDENT 
    }).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid credentials. Please register first.');
    }

    if (!user.passwordSet) {
      throw new ApiError(400, 'Please register and set your password first');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = TokenService.generateJWT(user._id.toString(), user.role);
    user.password = undefined;

    return { user, token };
  }

  /**
   * Student Registration - Step 1: Check email and send OTP
   */
  async studentInitiateRegistration(email: string): Promise<{
    status: 'new' | 'existing_no_password' | 'existing_with_password';
    message: string;
  }> {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // New student - send OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP temporarily (you might want to use Redis for this)
      const tempUser = await User.create({
        email,
        role: UserRole.STUDENT,
        accountStatus: 'pending_setup',
        createdVia: 'direct',
        emailOTP: {
          code: crypto.createHash('sha256').update(otp).digest('hex'),
          expiry: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
          lastAttempt: new Date()
        }
      });

      await EmailService.sendOTPEmail(email, otp);

      return {
        status: 'new',
        message: 'OTP sent to your email'
      };
    }

    if (!user.passwordSet) {
      // User exists but no password (created by consultant)
      const otp = user.generateOTP();
      await user.save();
      await EmailService.sendOTPEmail(email, otp);

      return {
        status: 'existing_no_password',
        message: 'Please verify your email to set password'
      };
    }

    return {
      status: 'existing_with_password',
      message: 'Email already registered. Please login.'
    };
  }

  /**
   * Student Registration - Step 2: Verify OTP
   */
  async studentVerifyOTP(email: string, otp: string): Promise<{
    message: string;
    tempToken: string;
  }> {
    const user = await User.findOne({ email, role: UserRole.STUDENT })
      .select('+emailOTP.code +emailOTP.expiry +emailOTP.attempts +emailOTP.lastAttempt');

    if (!user) {
      throw new ApiError(404, 'Registration session not found. Please start again.');
    }

    const isValid = await user.verifyOTP(otp);
    if (!isValid) {
      await user.save();
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    user.emailVerified = true;
    await user.save();

    // Generate temporary token for completing registration
    const tempToken = TokenService.generateJWT(user._id.toString(), user.role);

    return {
      message: 'Email verified successfully',
      tempToken
    };
  }

  /**
   * Student Registration - Step 3: Complete profile and set password
   */
  async studentCompleteRegistration(
    userId: string,
    data: {
      name: string;
      password: string;
      phone?: string;
      location?: string;
      targetCountry?: string;
    }
  ): Promise<{
    user: IUser;
    token: string;
  }> {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.emailVerified) {
      throw new ApiError(400, 'Please verify your email first');
    }

    // Update user profile
    user.name = data.name;
    user.password = data.password;
    user.phone = data.phone;
    user.passwordSet = true;
    user.accountStatus = 'active';
    user.profileCompleted = true;
    await user.save();

    // Create or update student profile
    let studentProfile = await StudentProfile.findOne({ userId: user._id });
    
    if (!studentProfile) {
      studentProfile = await StudentProfile.create({
        userId: user._id,
        targetCountry: data.targetCountry,
        applicationStatus: 'potential_client'
      });
    } else {
      if (data.targetCountry) {
        studentProfile.targetCountry = data.targetCountry;
        await studentProfile.save();
      }
    }

    const token = TokenService.generateJWT(user._id.toString(), user.role);

    return { user, token };
  }

  /**
   * Consultant approves potential client
   */
   async consultantApproveClient(
    consultantId: string,
    potentialClientId: string,
    additionalData: {
      university?: string;
      city?: string;
      notes?: string;
    }
  ): Promise<{ message: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const potentialClient = await PotentialClient.findById(potentialClientId);
      
      if (!potentialClient) {
        throw new ApiError(404, 'Potential client not found');
      }

      // Check if user already exists
      let user = await User.findOne({ email: potentialClient.email });

      if (!user) {
        // Create user without using array (for non-session)
        const newUserData = {
          email: potentialClient.email,
          name: potentialClient.name,
          phone: potentialClient.phone,
          role: UserRole.STUDENT,
          accountStatus: 'pending_setup' as const,
          passwordSet: false,
          emailVerified: false,
          profileCompleted: false,
          createdBy: consultantId,
          createdVia: 'consultant' as const
        };

        // Create with session properly
        user = new User(newUserData);
        await user.save({ session });
      } else if (user.passwordSet) {
        throw new ApiError(400, 'This student already has an active account');
      }

      // Generate setup token
      const setupToken = user.generateSetupToken();
      await user.save({ session });

      // Create student profile
      const studentProfileData = {
        userId: user._id,
        targetCountry: potentialClient.targetCountry,
        targetUniversity: additionalData.university,
        applicationStatus: 'lead'
      };
      
      const studentProfile = new StudentProfile(studentProfileData);
      await studentProfile.save({ session });

      // Create lead
      const leadData = {
        studentId: user._id,
        consultantId,
        status: 'new',
        priority: 'medium',
        notes: additionalData.notes ? [{
          text: additionalData.notes,
          createdBy: consultantId,
          createdAt: new Date()
        }] : []
      };
      
      const lead = new Lead(leadData);
      await lead.save({ session });

      // Update consultant profile
      await ConsultantProfile.findOneAndUpdate(
        { userId: consultantId },
        {
          $push: { assignedStudents: user._id },
          $inc: { totalLeads: 1, convertedLeads: 1 }
        },
        { session }
      );

      // Mark potential client as converted
      potentialClient.status = 'approved';
      await potentialClient.save({ session });

      await session.commitTransaction();

      // Send setup email to student
      await EmailService.sendStudentApprovalEmail(
        user.email,
        user.name || 'Student',
        setupToken
      );

      return {
        message: 'Client approved and converted to lead. Setup email sent to student.'
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }


  /**
   * Resend OTP
   */
  async resendOTP(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email })
      .select('+emailOTP.lastAttempt');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Rate limiting
    if (user.emailOTP?.lastAttempt) {
      const timeSinceLastOTP = Date.now() - user.emailOTP.lastAttempt.getTime();
      if (timeSinceLastOTP < 60000) {
        const waitTime = Math.ceil((60000 - timeSinceLastOTP) / 1000);
        throw new ApiError(429, `Please wait ${waitTime} seconds before requesting new OTP`);
      }
    }

    const otp = user.generateOTP();
    await user.save();

    await EmailService.sendOTPEmail(email, otp);

    return {
      message: 'New OTP sent to your email'
    };
  }

  // ==================== HELPER METHODS ====================

  private async createRoleSpecificProfile(userId: string, role: UserRole): Promise<void> {
    switch (role) {
      case UserRole.CONSULTANT:
        await ConsultantProfile.create({ userId });
        break;
      case UserRole.MANAGER:
        await ManagerProfile.create({ userId });
        break;
      case UserRole.ACCOUNTANT:
        await AccountantProfile.create({ userId });
        break;
      case UserRole.BACKEND_OFFICER:
        await BackendOfficerProfile.create({ userId });
        break;
    }
  }

  private async notifyAdminNewRegistration(user: IUser): Promise<void> {
    // Get all CEO/Admin users
    const admins = await User.find({ role: UserRole.CEO, isActive: true });
    
    for (const admin of admins) {
      await EmailService.sendAdminNotification(
        admin.email,
        'New Staff Registration Request',
        `${user.name} (${user.email}) has requested to join as ${user.role}`
      );
    }
  }

  private async notifyAdminSetupComplete(user: IUser): Promise<void> {
    if (user.approvedBy) {
      const admin = await User.findById(user.approvedBy);
      if (admin) {
        await EmailService.sendAdminNotification(
          admin.email,
          'Staff Setup Complete',
          `${user.name} (${user.email}) has completed their account setup`
        );
      }
    }
  }
    // CEO + Future Admin Login (Special Case)
  async adminOrCEOLogin(email: string, password: string) {
    const user = await User.findOne({
      email: email.toLowerCase(),
      role: UserRole.CEO
    }).select('+password');

    if (!user) throw new ApiError(401, 'Invalid email or password');
    if (!user.isActive) throw new ApiError(403, 'Account deactivated');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    // CEO ke liye force active kar do (seed account hai)
    if (user.accountStatus !== 'active') {
      user.accountStatus = 'active';
      user.profileCompleted = true;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = TokenService.generateJWT(user._id.toString(), user.role);
    user.password = undefined as any;

    return { user, token };
  }
}



export default new AuthService();