import { Router } from 'express';
import { body, param } from 'express-validator';
import CEOController from '../controllers/ceo/ceo.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

// All routes require CEO authentication
router.use(protect);
router.use(authorize(UserRole.CEO));

// Create staff directly
router.post(
  '/staff/create',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').notEmpty().trim(),
    body('role').isIn(['manager', 'consultant', 'accountant', 'backend_officer']),
    body('phone').optional()
  ],
  validate,
  CEOController.createStaff
);

// Get pending registrations
router.get('/staff/pending-registrations', CEOController.getPendingRegistrations);

// Approve staff registration
router.post(
  '/staff/approve/:userId',
  [
    param('userId').isMongoId(),
    body('reviewNotes').optional()
  ],
  validate,
  CEOController.approveRegistration
);

// Reject staff registration
router.post(
  '/staff/reject/:userId',
  [
    param('userId').isMongoId(),
    body('reason').notEmpty()
  ],
  validate,
  CEOController.rejectRegistration
);

// Get all staff
router.get('/staff', CEOController.getAllStaff);

// Dashboard stats
router.get('/dashboard/stats', CEOController.getDashboardStats);

export default router;