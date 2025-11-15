import { Request, Response, NextFunction } from 'express';
import AuthService from '../../services/auth.service';
import ApiResponse from '../../utils/ApiResponse';
import ApiError from '../../utils/ApiError';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../config/constants';
import { UserRole } from '../../types/user.types';

class RegisterController {
  // Check Student Email
  async checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const result = await AuthService.checkStudentEmail(email);

      if (!result.exists) {
        res.status(200).json(
          ApiResponse.success('Email available for registration', {
            available: true
          })
        );
        return;
      }

      if (!result.isStudent) {
        throw new ApiError(400, 'This email is registered as staff member');
      }

      if (!result.hasPassword) {
        res.status(200).json(
          ApiResponse.success('Please set your password to continue', {
            needsPasswordSetup: true
          })
        );
        return;
      }

      res.status(400).json(
        ApiResponse.error('Email already registered. Please login.')
      );
    } catch (error) {
      next(error);
    }
  }

  // Student Registration
  async registerStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;

      const { user, token } = await AuthService.registerStudent({
        name,
        email,
        password,
        phone
      });

      res.status(201).json(
        ApiResponse.success(SUCCESS_MESSAGES.REGISTER_SUCCESS, {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }, token)
      );
    } catch (error) {
      next(error);
    }
  }

  // Set Password
  async setPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      const { user, token: jwtToken } = await AuthService.setPassword(token, password);

      res.status(200).json(
        ApiResponse.success(SUCCESS_MESSAGES.PASSWORD_SET, {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }, jwtToken)
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new RegisterController();