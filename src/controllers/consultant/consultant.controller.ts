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
import { AuthRequest } from '../../types/auth.types';
import { UserRole } from '../../types/user.types';

class ConsultantController {
  // Add Potential Client (from tablet/form)
  async addPotentialClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, phone, targetCountry, preferredCourse, source, notes } = req.body;

      // Check if potential client already exists
      const existingClient = await PotentialClient.findOne({ email });
      if (existingClient) {
        throw new ApiError(400, 'Client with this email already exists in potential clients');
      }

      // Check if already a user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, 'This email is already registered as a user');
      }

      // Create potential client
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

  // Get Potential Clients for Consultant
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

  // Approve Potential Client (Convert to Lead)
  async approvePotentialClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { potentialClientId } = req.params;
      const { notes } = req.body;

      const potentialClient = await PotentialClient.findById(potentialClientId);
      
      if (!potentialClient) {
        throw new ApiError(404, 'Potential client not found');
      }

      if (potentialClient.consultantId.toString() !== req.user!._id.toString()) {
        throw new ApiError(403, 'You can only approve your own potential clients');
      }

      if (potentialClient.status === 'approved') {
        throw new ApiError(400, 'Client already approved');
      }

      // Create user account (without password)
      const user = await User.create([{
        name: potentialClient.name,
        email: potentialClient.email,
        phone: potentialClient.phone,
        role: UserRole.STUDENT,
        isActive: true,
        isEmailVerified: false
      }], { session });

      // Generate password setup token
      const setupToken = user[0].generatePasswordSetupToken();
      await user[0].save({ session });

      // Create student profile
      await StudentProfile.create([{
        userId: user[0]._id,
        targetCountry: potentialClient.targetCountry,
        applicationStatus: 'lead'
      }], { session });

      // Create lead
      await Lead.create([{
        studentId: user[0]._id,
        consultantId: req.user!._id,
        status: 'new',
        priority: 'medium',
        notes: notes ? [{ text: notes, createdBy: req.user!._id }] : []
      }], { session });

      // Update consultant profile
      await ConsultantProfile.findOneAndUpdate(
        { userId: req.user!._id },
        {
          $push: { assignedStudents: user[0]._id },
          $inc: { totalLeads: 1 }
        },
        { session }
      );

      // Update potential client status
      potentialClient.status = 'approved';
      await potentialClient.save({ session });

      // Delete from potential clients
      await PotentialClient.findByIdAndDelete(potentialClientId, { session });

      await session.commitTransaction();

      // Send email with password setup link (outside transaction)
      await EmailService.sendPasswordSetupEmail(user[0], setupToken);

      res.status(200).json(
        ApiResponse.success('Client approved and converted to lead successfully', {
          userId: user[0]._id,
          email: user[0].email
        })
      );
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }

  // Get Consultant's Leads
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

      // Don't allow status change through this endpoint
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
}

export default new ConsultantController();