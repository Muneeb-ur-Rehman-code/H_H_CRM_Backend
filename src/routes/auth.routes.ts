import { Router } from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/auth/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import ApiResponse from '../utils/ApiResponse';

const router = Router();


// Admin Login
router.post(
  '/admin/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  AuthController.adminLogin
);

// Staff Login
router.post(
  '/staff/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('role').notEmpty()
  ],
  validate,
  AuthController.staffLogin
);

// Staff Registration & Setup
router.post('/staff/register', [/* validations */], validate, AuthController.staffSelfRegister);
router.post('/staff/verify-registration-otp', [/* ... */], validate, AuthController.verifyStaffRegistrationOTP);
router.post('/staff/complete-setup', [/* ... */], validate, AuthController.staffCompleteSetup);

// Student Routes
router.post('/student/login', [/* ... */], validate, AuthController.studentLogin);
router.post('/student/register', [body('email').isEmail().normalizeEmail()], validate, AuthController.studentInitiateRegistration);
router.post('/student/verify-otp', [/* ... */], validate, AuthController.studentVerifyOTP);
router.post('/student/complete-registration', protect, [/* ... */], validate, AuthController.studentCompleteRegistration);
router.post('/resend-otp', [body('email').isEmail()], validate, AuthController.resendOTP);

// Token verify
router.get('/verify', protect, (req, res) => {
  res.json(ApiResponse.success('Token valid', { user: req.user }));
});

export default router;