import { Request, Response, NextFunction } from 'express';
import ManagerProfile from '../../models/Profiles/ManagerProfile.model';
import User from '../../models/User/User.model';
import ApiResponse from '../../utils/ApiResponse';
import ApiError from '../../utils/ApiError';

class ManagerController {
  // Get own profile
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await ManagerProfile.findOne({ userId: req.user!._id }).populate('teamMembers', 'name email');
      if (!profile) throw new ApiError(404, 'Manager profile not found');

      res.status(200).json(ApiResponse.success('Manager profile fetched successfully', { profile }));
    } catch (error) {
      next(error);
    }
  }

  // Update manager profile
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = req.body;
      const profile = await ManagerProfile.findOne({ userId: req.user!._id });

      if (!profile) throw new ApiError(404, 'Manager profile not found');

      Object.assign(profile, updates);
      await profile.save();

      res.status(200).json(ApiResponse.success('Profile updated successfully', { profile }));
    } catch (error) {
      next(error);
    }
  }

  // Get team members
  async getTeamMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await ManagerProfile.findOne({ userId: req.user!._id }).populate('teamMembers', 'name email role');
      if (!profile) throw new ApiError(404, 'Manager profile not found');

      res.status(200).json(ApiResponse.success('Team members fetched', { team: profile.teamMembers }));
    } catch (error) {
      next(error);
    }
  }

  // Add team member
  async addTeamMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;

      const profile = await ManagerProfile.findOne({ userId: req.user!._id });
      if (!profile) throw new ApiError(404, 'Manager profile not found');

      if (!profile.teamMembers.includes(userId)) profile.teamMembers.push(userId);
      await profile.save();

      res.status(200).json(ApiResponse.success('Team member added', { profile }));
    } catch (error) {
      next(error);
    }
  }

  // Remove team member
  async removeTeamMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const profile = await ManagerProfile.findOne({ userId: req.user!._id });

      if (!profile) throw new ApiError(404, 'Manager profile not found');

      profile.teamMembers = profile.teamMembers.filter((id) => id.toString() !== userId);
      await profile.save();

      res.status(200).json(ApiResponse.success('Team member removed', { profile }));
    } catch (error) {
      next(error);
    }
  }
}

export default new ManagerController();
