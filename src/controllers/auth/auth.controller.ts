import { Request, Response, NextFunction } from 'express';
import AuthService from '../../services/auth.service';
import ApiResponse from '../../utils/ApiResponse';
import ApiError from '../../utils/ApiError';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../config/constants';
import { UserRole } from '../../types/user.types';

class AuthController {
  // Staff Login
  async staffLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role } = req.body;

      // Validate that role is not student
      if (role === UserRole.STUDENT) {
        throw new ApiError(400, ERROR_MESSAGES.ROLE_MISMATCH);
      }

      const { user, token } = await AuthService.staffLogin(email, password, role);

      res.status(200).json(
        ApiResponse.success(SUCCESS_MESSAGES.LOGIN_SUCCESS, {
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

  // Student Login
  async studentLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const { user, token } = await AuthService.studentLogin(email, password);

      res.status(200).json(
        ApiResponse.success(SUCCESS_MESSAGES.LOGIN_SUCCESS, {
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

  // CEO Login (Admin)
  async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const { user, token } = await AuthService.staffLogin(email, password, UserRole.CEO);

      res.status(200).json(
        ApiResponse.success(SUCCESS_MESSAGES.LOGIN_SUCCESS, {
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

  // Verify Token
  async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
      }

      res.status(200).json(
        ApiResponse.success('Token is valid', {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();