import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../../models/User/User.model';
import StudentProfile from '../../models/Profiles/StudentProfile.model';
import ConsultantProfile from '../../models/Profiles/ConsultantProfile.model';
import PotentialClient from '../../models/PotentialClient/PotentialClient.model';
import Lead from '../../models/Lead/Lead.model';
import ApiResponse from '../../utils/ApiResponse';
import ApiError from '../../utils/ApiError';
import EmailService from '../../services/email.service';
import AuthService from '../../services/auth.service';
import { AuthRequest } from '../../types/auth.types';
import { UserRole } from '../../types/user.types';

class ConsultantController {
  // Add Potential Client
  async addPotentialClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, phone, targetCountry, preferredCourse, source, notes } = req.body;
      
      const existingClient = await PotentialClient.findOne({ email });
      if (existingClient) {
        throw new ApiError(400, 'Client with this email already exists');
      }
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, 'This email is already registered as a user');
      }
      
      const potentialClient = await PotentialClient.create({
        name,
        email,
        phone,
        targetCountry,
        preferredCourse,
        consultantId: req.user!._id,
        source: source || 'tablet',
        status: 'new',
        notes
      });
      
      res.status(201).json(
        ApiResponse.success('Potential client added successfully', {
          client: potentialClient
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get Potential Clients
  async getPotentialClients(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, status } = req.query;
      
      const query: any = {
        consultantId: req.user!._id
      };
      
      if (status) {
        query.status = status;
      }
      
      const potentialClients = await PotentialClient.find(query)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort('-createdAt');
      
      const total = await PotentialClient.countDocuments(query);
      
      res.status(200).json(
        ApiResponse.success('Potential clients fetched successfully', {
          clients: potentialClients,
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

  // Approve Potential Client
  async approvePotentialClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { potentialClientId } = req.params;
      const { university, city, notes } = req.body;
      
      const result = await AuthService.consultantApproveClient(
        req.user!._id.toString(),
        potentialClientId,
        { university, city, notes }
      );
      
      res.status(200).json(ApiResponse.success(result.message));
    } catch (error) {
      next(error);
    }
  }

  // Update Potential Client
  async updatePotentialClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { potentialClientId } = req.params;
      const updates = req.body;
      
      const potentialClient = await PotentialClient.findById(potentialClientId);
      
      if (!potentialClient) {
        throw new ApiError(404, 'Potential client not found');
      }
      
      if (potentialClient.consultantId.toString() !== req.user!._id.toString()) {
        throw new ApiError(403, 'You can only update your own potential clients');
      }
      
      delete updates.status;
      delete updates.consultantId;
      
      Object.assign(potentialClient, updates);
      await potentialClient.save();
      
      res.status(200).json(
        ApiResponse.success('Potential client updated successfully', {
          client: potentialClient
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Reject Potential Client
  async rejectPotentialClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { potentialClientId } = req.params;
      const { reason } = req.body;
      
      const potentialClient = await PotentialClient.findById(potentialClientId);
      
      if (!potentialClient) {
        throw new ApiError(404, 'Potential client not found');
      }
      
      if (potentialClient.consultantId.toString() !== req.user!._id.toString()) {
        throw new ApiError(403, 'You can only reject your own potential clients');
      }
      
      potentialClient.status = 'not_interested';
      potentialClient.notes = reason || 'Rejected by consultant';
      await potentialClient.save();
      
      res.status(200).json(
        ApiResponse.success('Potential client rejected')
      );
    } catch (error) {
      next(error);
    }
  }

  // Get Leads
  async getLeads(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, status } = req.query;
      
      const query: any = {
        consultantId: req.user!._id
      };
      
      if (status) {
        query.status = status;
      }
      
      const leads = await Lead.find(query)
        .populate('studentId', 'name email phone')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort('-createdAt');
      
      const total = await Lead.countDocuments(query);
      
      res.status(200).json(
        ApiResponse.success('Leads fetched successfully', {
          leads,
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
}

export default new ConsultantController();