import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { UserRole } from '../types/user.types';
import ApiError from '../utils/ApiError';

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Unauthorized'));
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      next(new ApiError(403, 'You do not have permission to access this resource'));
      return;
    }

    next();
  };
};