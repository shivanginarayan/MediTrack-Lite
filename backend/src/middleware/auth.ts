import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/client';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        clinicId: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  clinicId: string;
  iat: number;
  exp: number;
}

// Extract token from request
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for token in cookies (for web clients)
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  
  return null;
};

// Verify JWT token and attach user to request
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new UnauthorizedError('Access token required');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Check if user still exists and is active
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        isActive: true,
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });
    
    if (!user || !user.clinic.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          isActive: true,
        },
      });
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId,
        };
      }
    }
    
    next();
  } catch (error) {
    // Ignore token errors in optional auth
    next();
  }
};

// Role-based authorization
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        url: req.originalUrl,
      });
      
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  };
};

// Check if user belongs to the same clinic (for data isolation)
export const requireSameClinic = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  
  // This middleware should be used after route parameters are parsed
  // The specific clinic check will be implemented in individual route handlers
  next();
};

// Demo mode middleware - allows access without authentication
export const demoMode = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.DEMO_MODE === 'true') {
    // In demo mode, create a mock user
    req.user = {
      id: 'demo-user-id',
      email: process.env.DEMO_USER_EMAIL || 'demo@meditrack.com',
      role: 'LEAD',
      clinicId: 'demo-clinic-id',
    };
  }
  
  next();
};

export default authenticateToken;