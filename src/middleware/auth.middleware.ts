import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User/User.model';
import { AuthRequest } from '../types/auth.types';
import ApiError from '../utils/ApiError';
import { ERROR_MESSAGES } from '../config/constants';

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
    };

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw new ApiError(403, ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, ERROR_MESSAGES.INVALID_TOKEN));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token has expired'));
    } else {
      next(error);
    }
  }
};