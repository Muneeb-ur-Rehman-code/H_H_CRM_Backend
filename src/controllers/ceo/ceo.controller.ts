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
import AuthService from '../../services/auth.service';
import { UserRole } from '../../types/user.types';
import { AuthRequest } from '../../types/auth.types';

class CEOController {
  // Create staff directly
  async createStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name, role, phone } = req.body;
      
      const result = await AuthService.adminCreateStaff(
        req.user!._id.toString(),
        { email, name, role, phone }
      );
      
      res.status(201).json(
        ApiResponse.success(result.message, { userId: result.userId })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get pending staff registrations
  async getPendingRegistrations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pendingUsers = await User.find({
        accountStatus: 'pending_approval',
        role: { $ne: UserRole.STUDENT }
      }).select('-password');
      
      res.status(200).json(
        ApiResponse.success('Pending registrations fetched', {
          registrations: pendingUsers
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Approve staff registration
  async approveRegistration(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { reviewNotes, role, phone } = req.body;
      
      const result = await AuthService.adminApproveStaffRegistration(
        req.user!._id.toString(),
        userId,
        { reviewNotes, role, phone }
      );
      
      res.status(200).json(ApiResponse.success(result.message));
    } catch (error) {
      next(error);
    }
  }

  // Reject staff registration
  async rejectRegistration(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      const result = await AuthService.adminRejectStaffRegistration(
        req.user!._id.toString(),
        userId,
        reason
      );
      
      res.status(200).json(ApiResponse.success(result.message));
    } catch (error) {
      next(error);
    }
  }

  // Get All Staff Members
  async getAllStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, role, accountStatus } = req.query;
      
      const query: any = {
        role: { $ne: UserRole.STUDENT }
      };
      
      if (role) query.role = role;
      if (accountStatus) query.accountStatus = accountStatus;
      
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
      
      const user = await User.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      if (user.role === UserRole.CEO) {
        throw new ApiError(403, 'Cannot modify CEO account');
      }
      
      // Remove sensitive fields
      delete updates.password;
      delete updates.email;
      
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

  // Toggle Staff Status
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

  // Get Dashboard Stats
  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalStaff,
        activeStaff,
        pendingApprovals,
        totalStudents,
        roleDistribution
      ] = await Promise.all([
        User.countDocuments({ role: { $ne: UserRole.STUDENT } }),
        User.countDocuments({ role: { $ne: UserRole.STUDENT }, accountStatus: 'active' }),
        User.countDocuments({ accountStatus: 'pending_approval' }),
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
        pendingApprovals,
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