import { Request, Response, NextFunction } from 'express';
import AuthService from '../../services/auth.service';
import ApiResponse from '../../utils/ApiResponse';
import { UserRole } from '../../types/user.types';

class AuthController {
  // ==================== STAFF CONTROLLERS ====================
  
  async staffLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role } = req.body;

      const { user, token } = await AuthService.staffLogin(email, password, role);

      res.status(200).json(
        ApiResponse.success('Login successful', {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }, token)
      );
    } catch (error) {
      next(error);
    }
  }

  async staffSelfRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.staffSelfRegister(req.body);
      res.status(201).json(ApiResponse.success(result.message));
    } catch (error) {
      next(error);
    }
  }

  async verifyStaffRegistrationOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.verifyStaffRegistrationOTP(email, otp);
      res.status(200).json(ApiResponse.success(result.message));
    } catch (error) {
      next(error);
    }
  }

  async staffCompleteSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      const { user, token: jwtToken } = await AuthService.staffCompleteSetup(token, password);

      res.status(200).json(
        ApiResponse.success('Account setup completed successfully', {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }, jwtToken)
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== STUDENT CONTROLLERS ====================

  async studentLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.studentLogin(email, password);

      res.status(200).json(
        ApiResponse.success('Login successful', {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }, token)
      );
    } catch (error) {
      next(error);
    }
  }

  async studentInitiateRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.studentInitiateRegistration(email);
      res.status(200).json(ApiResponse.success(result.message, { status: result.status }));
    } catch (error) {
      next(error);
    }
  }

  async studentVerifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.studentVerifyOTP(email, otp);
      res.status(200).json(ApiResponse.success(result.message, { tempToken: result.tempToken }));
    } catch (error) {
      next(error);
    }
  }

  async studentCompleteRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id;
      const { user, token } = await AuthService.studentCompleteRegistration(userId.toString(), req.body);

      res.status(201).json(
        ApiResponse.success('Registration completed successfully', {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }, token)
      );
    } catch (error) {
      next(error);
    }
  }

  async resendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.resendOTP(email);
      res.status(200).json(ApiResponse.success(result.message));
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();