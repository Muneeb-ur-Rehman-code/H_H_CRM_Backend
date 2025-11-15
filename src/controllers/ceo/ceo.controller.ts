import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../../models/User/User.model';
import ConsultantProfile from '../../models/Profiles/ConsultantProfile.model';
import AccountantProfile from '../../models/Profiles/AccountantProfile.model';
import BackendOfficerProfile from '../../models/Profiles/BackendOfficerProfile.model';
import ManagerProfile from '../../models/Profiles/ManagerProfile.model';
import ApiResponse from '../../utils/ApiResponse';
import ApiError from '../../utils/ApiError';
import EmailService from '../../services/email.service';
import { UserRole } from '../../types/user.types';
import { AuthRequest } from '../../types/auth.types';

class CEOController {
  // Create Staff Member
  async createStaffMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, role, phone, department, specialization } = req.body;

      // Validate role
      const allowedRoles = [
        UserRole.MANAGER,
        UserRole.CONSULTANT,
        UserRole.ACCOUNTANT,
        UserRole.BACKEND_OFFICER
      ];

      if (!allowedRoles.includes(role)) {
        throw new ApiError(400, 'Invalid role specified');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, 'User with this email already exists');
      }

      // Generate temporary password
      const tempPassword = crypto.randomBytes(8).toString('hex');

      // Create user
      const newUser = await User.create({
        name,
        email,
        password: tempPassword,
        phone,
        role,
        isActive: true,
        isEmailVerified: true
      });

      // Create role-specific profile
      switch (role) {
        case UserRole.CONSULTANT:
          await ConsultantProfile.create({
            userId: newUser._id,
            expertiseCountries: specialization || []
          });
          break;
        
        case UserRole.ACCOUNTANT:
          await AccountantProfile.create({
            userId: newUser._id,
            specialization: specialization || ['General Accounting']
          });
          break;
        
        case UserRole.BACKEND_OFFICER:
          await BackendOfficerProfile.create({
            userId: newUser._id,
            specialization: specialization || ['General Processing']
          });
          break;
        
        case UserRole.MANAGER:
          await ManagerProfile.create({
            userId: newUser._id,
            department: department || 'General Management'
          });
          break;
      }

      // Send credentials email
      await EmailService.sendStaffCredentials({
        email,
        name,
        tempPassword,
        role
      });

      res.status(201).json(
        ApiResponse.success('Staff member created successfully', {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          }
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get All Staff Members
  async getAllStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, role, isActive } = req.query;
      
      const query: any = {
        role: { $ne: UserRole.STUDENT }
      };

      if (role) {
        query.role = role;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const staff = await User.find(query)
        .select('-password')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort('-createdAt');

      const total = await User.countDocuments(query);

      res.status(200).json(
        ApiResponse.success('Staff members fetched successfully', {
          staff,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
          }
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Update Staff Member
  async updateStaffMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Prevent role change for CEO
      const user = await User.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (user.role === UserRole.CEO) {
        throw new ApiError(403, 'Cannot modify CEO account');
      }

      // Remove sensitive fields from updates
      delete updates.password;
      delete updates.role;
      delete updates.email; // Email shouldn't be changed

      const updatedUser = await User.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      res.status(200).json(
        ApiResponse.success('Staff member updated successfully', {
          user: updatedUser
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Toggle Staff Status (Active/Inactive)
  async toggleStaffStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(id);
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (user.role === UserRole.CEO) {
        throw new ApiError(403, 'Cannot deactivate CEO account');
      }

      user.isActive = isActive;
      await user.save();

      res.status(200).json(
        ApiResponse.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`, {
          user: {
            id: user._id,
            isActive: user.isActive
          }
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Reset Staff Password
  async resetStaffPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Generate new temporary password
      const tempPassword = crypto.randomBytes(8).toString('hex');
      user.password = tempPassword;
      await user.save();

      // Send new credentials
      await EmailService.sendStaffCredentials({
        email: user.email,
        name: user.name,
        tempPassword,
        role: user.role
      });

      res.status(200).json(
        ApiResponse.success('Password reset successfully. New credentials sent to user email.')
      );
    } catch (error) {
      next(error);
    }
  }

  // Get Dashboard Statistics
  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalStaff,
        activeStaff,
        totalStudents,
        roleDistribution
      ] = await Promise.all([
        User.countDocuments({ role: { $ne: UserRole.STUDENT } }),
        User.countDocuments({ role: { $ne: UserRole.STUDENT }, isActive: true }),
        User.countDocuments({ role: UserRole.STUDENT }),
        User.aggregate([
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      const stats = {
        totalStaff,
        activeStaff,
        totalStudents,
        roleDistribution: roleDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {} as Record<string, number>)
      };

      res.status(200).json(
        ApiResponse.success('Dashboard statistics fetched successfully', stats)
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new CEOController();