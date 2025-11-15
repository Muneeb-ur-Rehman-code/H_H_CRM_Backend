import { Router } from 'express';
import CEOController from '../controllers/ceo/ceo.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import { validators } from '../utils/validators';
import { UserRole } from '../types/user.types';

const router = Router();

// All routes require CEO authentication
router.use(protect);
router.use(authorize(UserRole.CEO));

// Staff Management
router.post(
  '/staff',
  validators.createStaff,
  validate,
  CEOController.createStaffMember
);

router.get(
  '/staff',
  validators.pagination,
  validate,
  CEOController.getAllStaff
);

router.put(
  '/staff/:id',
  validators.mongoId('id'),
  validate,
  CEOController.updateStaffMember
);

router.patch(
  '/staff/:id/status',
  validators.mongoId('id'),
  validate,
  CEOController.toggleStaffStatus
);

router.post(
  '/staff/:id/reset-password',
  validators.mongoId('id'),
  validate,
  CEOController.resetStaffPassword
);

// Dashboard Stats
router.get('/dashboard/stats', CEOController.getDashboardStats);

export default router;