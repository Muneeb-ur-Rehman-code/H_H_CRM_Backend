import { Router } from 'express';
import ConsultantController from '../controllers/consultant/consultant.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import { validators } from '../utils/validators';
import { UserRole } from '../types/user.types';

const router = Router();

// All routes require consultant authentication
router.use(protect);
router.use(authorize(UserRole.CONSULTANT));

// Potential Clients
router.post(
  '/potential-clients',
  validators.addPotentialClient,
  validate,
  ConsultantController.addPotentialClient
);

router.get(
  '/potential-clients',
  validators.pagination,
  validate,
  ConsultantController.getPotentialClients
);

router.put(
  '/potential-clients/:potentialClientId',
  validators.mongoId('potentialClientId'),
  validate,
  ConsultantController.updatePotentialClient
);

router.post(
  '/potential-clients/:potentialClientId/approve',
  validators.mongoId('potentialClientId'),
  validate,
  ConsultantController.approvePotentialClient
);

router.post(
  '/potential-clients/:potentialClientId/reject',
  validators.mongoId('potentialClientId'),
  validate,
  ConsultantController.rejectPotentialClient
);

// Leads
router.get(
  '/leads',
  validators.pagination,
  validate,
  ConsultantController.getLeads
);

export default router;