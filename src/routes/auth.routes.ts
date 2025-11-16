import { Router } from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/auth/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import ApiResponse from '../utils/ApiResponse'; // Added import

const router = Router();

// ==================== STAFF ROUTES ====================

// Staff login
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

// Staff self-registration
router.post(
  '/staff/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').notEmpty().trim(),
    body('phone').notEmpty(),
    body('role').isIn(['manager', 'consultant', 'accountant', 'backend_officer'])
  ],
  validate,
  AuthController.staffSelfRegister
);

// Verify staff registration OTP
router.post(
  '/staff/verify-registration-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 })
  ],
  validate,
  AuthController.verifyStaffRegistrationOTP
);

// Complete staff setup (from email link)
router.post(
  '/staff/complete-setup',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 })
  ],
  validate,
  AuthController.staffCompleteSetup
);

// ==================== STUDENT ROUTES ====================

// Student login
router.post(
  '/student/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  AuthController.studentLogin
);

// Initiate student registration
router.post(
  '/student/register',
  [body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),],
  validate,
  AuthController.studentInitiateRegistration
);

// Verify student OTP
router.post(
  '/student/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 })
  ],
  validate,
  AuthController.studentVerifyOTP
);

// Complete student registration
router.post(
  '/student/complete-registration',
  protect,
  [
    body('name').notEmpty().trim(),
    body('password').isLength({ min: 6 }),
    body('phone').optional()
  ],
  validate,
  AuthController.studentCompleteRegistration
);

// ==================== COMMON ROUTES ====================

// Resend OTP
router.post(
  '/resend-otp',
  [body('email').isEmail().normalizeEmail()],
  validate,
  AuthController.resendOTP
);

// Verify token
router.get('/verify', protect, (req, res) => {
  res.status(200).json(
    ApiResponse.success('Token is valid', {
      user: req.user
    })
  );
});

export default router;