import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  // Generate JWT token
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  // Verify JWT token
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  // Get current user from request (for API routes)
  static getCurrentUser(request: NextRequest): JWTPayload | null {
    try {
      const token = request.cookies.get('auth-token')?.value;

      if (!token) {
        return null;
      }

      return this.verifyToken(token);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated (for API routes)
  static isAuthenticated(request: NextRequest): boolean {
    return this.getCurrentUser(request) !== null;
  }

  // Middleware helper for protecting routes
  static requireAuth(request: NextRequest): JWTPayload | null {
    const user = this.getCurrentUser(request);
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  }
}

// Client-side auth helpers (for use in components)
export class ClientAuthService {
  // Get current user from client-side
  static async getCurrentUser(): Promise<JWTPayload | null> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Logout user
  static async logout(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }

  // Check authentication status
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

export default AuthService;