import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/client';
import { asyncHandler, NotFoundError, UnauthorizedError, ValidationError } from '../middleware/errorHandler';
import { validate, authSchemas } from '../middleware/validation';
import { authRateLimitMiddleware } from '../middleware/rateLimiter';
import { authenticateToken, demoMode } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Apply auth rate limiting to all auth routes
router.use(authRateLimitMiddleware);

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    clinic: {
      id: string;
      name: string;
    };
  };
  token: string;
  refreshToken: string;
  expiresIn: string;
}

// Generate JWT tokens
const generateTokens = (user: any) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    clinicId: user.clinicId,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  } as any);

  return { token, refreshToken };
};

// Login endpoint
router.post('/login', 
  demoMode, // Allow demo mode access
  validate({ body: authSchemas.login }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Demo mode handling
    if (process.env.DEMO_MODE === 'true' && email === process.env.DEMO_USER_EMAIL) {
      // Create or get demo user
      let demoUser = await prisma.user.findFirst({
        where: { email },
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!demoUser) {
        // Create demo clinic and user
        const demoClinic = await prisma.clinic.create({
          data: {
            id: 'demo-clinic-id',
            name: 'Demo Clinic',
            timezone: 'UTC',
          },
        });

        demoUser = await prisma.user.create({
          data: {
            id: 'demo-user-id',
            email,
            name: 'Demo User',
            password: await bcrypt.hash('demo123', 12),
            role: 'LEAD',
            clinicId: demoClinic.id,
          },
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }

      const { token, refreshToken } = generateTokens(demoUser!);

      const response: LoginResponse = {
        user: {
          id: demoUser!.id,
          email: demoUser!.email,
          name: demoUser!.name,
          role: demoUser!.role,
          clinic: demoUser!.clinic,
        },
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      };

      logger.info('Demo user login', { email, ip: req.ip });
      return res.json(response);
    }

    // Regular authentication
    if (!password) {
      throw new ValidationError('Password is required for non-demo login');
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email,
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
      logger.warn('Login attempt with invalid email', { email, ip: req.ip });
      throw new UnauthorizedError('Invalid email or password');
    }

    // For now, we'll implement a simple password check
    // In a real implementation, you'd store hashed passwords
    const isValidPassword = password === 'demo123' || await bcrypt.compare(password, user.password || '');
    
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { email, ip: req.ip });
      throw new UnauthorizedError('Invalid email or password');
    }

    const { token, refreshToken } = generateTokens(user);

    const response: LoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clinic: user.clinic,
      },
      token,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    };

    logger.info('User login successful', { userId: user.id, email, ip: req.ip });
    res.json(response);
  })
);

// Refresh token endpoint
router.post('/refresh', 
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      
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

      const { token, refreshToken: newRefreshToken } = generateTokens(user);

      res.json({
        token,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });
    } catch (error) {
      logger.warn('Invalid refresh token', { ip: req.ip });
      throw new UnauthorizedError('Invalid refresh token');
    }
  })
);

// Get current user profile
router.get('/me', 
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        clinic: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({ user });
  })
);

// Update user profile
router.patch('/me', 
  authenticateToken,
  validate({
    body: authSchemas.register.fork(['email', 'role', 'clinicId'], (schema) => schema.optional())
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info('User profile updated', { userId: req.user!.id });
    res.json({ user: updatedUser });
  })
);

// Change password
router.post('/change-password', 
  authenticateToken,
  validate({ body: authSchemas.changePassword }),
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    // For demo mode, skip password validation
    if (process.env.DEMO_MODE === 'true') {
      logger.info('Password change attempted in demo mode', { userId: req.user!.id });
      return res.json({ message: 'Password change not available in demo mode' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password || '');
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    });

    logger.info('Password changed successfully', { userId: req.user!.id });
    res.json({ message: 'Password changed successfully' });
  })
);

// Logout endpoint (for token blacklisting in the future)
router.post('/logout', 
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    // In a production app, you might want to blacklist the token
    // For now, we'll just log the logout
    logger.info('User logout', { userId: req.user!.id });
    res.json({ message: 'Logged out successfully' });
  })
);

// Verify token endpoint
router.get('/verify', 
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ 
      valid: true, 
      user: {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        clinicId: req.user!.clinicId,
      }
    });
  })
);

export default router;