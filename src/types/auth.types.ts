import { Request } from 'express';
import { IUser } from './user.types';

export interface LoginRequest {
  email: string;
  password: string;
  role?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface TokenPayload {
  id: string;
  role: string;
}