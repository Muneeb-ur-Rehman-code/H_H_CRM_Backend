import { Router } from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/auth/auth.controller';
import RegisterController from '../controllers/auth/register.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Staff Login
router.post(
  '/staff/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').notEmpty().withMessage('Role is required')
  ],
  validate,
  AuthController.staffLogin
);

// Student Login
router.post(
  '/student/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  AuthController.studentLogin
);

// Admin/CEO Login
router.post(
  '/admin/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  AuthController.adminLogin
);

// Check Student Email
router.post(
  '/student/check-email',
  [body('email').isEmail().withMessage('Please provide a valid email')],
  validate,
  RegisterController.checkEmail
);

// Student Registration
router.post(
  '/student/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  validate,
  RegisterController.registerStudent
);

// Set Password
router.post(
  '/student/set-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  validate,
  RegisterController.setPassword
);

// Verify Token
router.get('/verify', protect, AuthController.verifyToken);

export default router;