import { Request, Response, NextFunction } from 'express';
import AuthService from '../../services/auth.service';
import ApiResponse from '../../utils/ApiResponse';
import ApiError from '../../utils/ApiError';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../config/constants';

class RegisterController {
  // This controller is no longer needed as registration is handled in auth.controller.ts
  // Keeping for backward compatibility or can be removed
  
  async checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      
      // Use the new flow
      const result = await AuthService.studentInitiateRegistration(email);
      
      res.status(200).json(
        ApiResponse.success(result.message, {
          status: result.status
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async registerStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // This is now a multi-step process
      // Step 1: Initiate registration (handled by checkEmail)
      // Step 2: Verify OTP
      // Step 3: Complete registration
      
      throw new ApiError(400, 'Please use the new registration flow: /api/auth/student/register');
    } catch (error) {
      next(error);
    }
  }

  async setPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      
      // Use the new staff/student complete setup flow
      const { user, token: jwtToken } = await AuthService.staffCompleteSetup(token, password);
      
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