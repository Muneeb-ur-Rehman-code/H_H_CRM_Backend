import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/config';
import { TokenPayload } from '../types/auth.types';

class TokenService {
  // Generate JWT Token
  generateJWT(userId: string, role: string): string {
    const payload: TokenPayload = {
      id: userId,
      role
    };
    
    const signOptions: SignOptions = {
    expiresIn: config.jwtExpire as SignOptions['expiresIn']  // Cast to jwt SignOptions type
    };
    
    return jwt.sign(payload, config.jwtSecret, signOptions);
  }

  // Verify JWT Token
  verifyJWT(token: string): TokenPayload {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  }

  // Generate Random Token
  generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash Token
  hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  // Generate Password Reset Token
  generatePasswordResetToken(): { token: string; hashedToken: string; expiry: Date } {
    const token = this.generateRandomToken();
    const hashedToken = this.hashToken(token);
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    return {
      token,
      hashedToken,
      expiry
    };
  }

  // Decode JWT without verification (for debugging)
  decodeJWT(token: string): any {
    return jwt.decode(token);
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeJWT(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }
}

export default new TokenService();