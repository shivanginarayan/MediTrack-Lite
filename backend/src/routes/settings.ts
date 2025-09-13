import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { prisma } from '../database/client';
import { asyncHandler, NotFoundError, ValidationError, ForbiddenError } from '../middleware/errorHandler';
import { validate, settingsSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

const router = Router();

// Apply authentication to all settings routes
router.use(authenticateToken);

// Get clinic profile
router.get('/clinic', 
  asyncHandler(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        _count: {
          select: {
            users: true,
            items: true,
            alertRules: true,
          },
        },
      },
    });

    if (!clinic) {
      throw new NotFoundError('Clinic');
    }

    res.json({ clinic });
  })
);

// Update clinic profile
router.patch('/clinic', 
  requireRole(['ADMIN']),
  validate({ body: settingsSchemas.updateClinic }),
  asyncHandler(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const updateData = req.body;

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            items: true,
            alertRules: true,
          },
        },
      },
    });

    logger.info('Clinic profile updated', {
      clinicId,
      changes: Object.keys(updateData),
      userId: req.user!.id,
    });

    res.json({ clinic: updatedClinic });
  })
);

// Get all users in clinic
router.get('/users', 
  requireRole(['LEAD', 'ADMIN']),
  validate({ query: commonSchemas.pagination }),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query as any;

    const skip = (page - 1) * limit;
    const clinicId = req.user!.clinicId;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: { 
          clinicId,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ 
        where: { 
          clinicId,
          isActive: true,
        },
      }),
    ]);

    // Get role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      where: {
        clinicId,
        isActive: true,
      },
      _count: true,
    });

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      roleDistribution: roleDistribution.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  })
);

// Get single user by ID
router.get('/users/:id', 
  requireRole(['LEAD', 'ADMIN']),
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const user = await prisma.user.findFirst({
      where: {
        id,
        clinicId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
            select: {
              stockAdjustments: true,
              alertRules: true,
              messagesSent: true,
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

// Create new user
router.post('/users', 
  requireRole(['ADMIN']),
  validate({ body: settingsSchemas.createUser }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, role, password } = req.body;
    const clinicId = req.user!.clinicId;

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        password: hashedPassword,
        clinicId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.info('User created', {
      userId: user.id,
      email: user.email,
      role: user.role,
      createdBy: req.user!.id,
      clinicId,
    });

    res.status(201).json({ user });
  })
);

// Update user
router.patch('/users/:id', 
  requireRole(['ADMIN']),
  validate({ 
    params: commonSchemas.id,
    body: settingsSchemas.updateUser 
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;
    const updateData = req.body;

    // Prevent users from updating themselves to avoid lockout
    if (id === req.user!.id) {
      throw new ValidationError('Cannot update your own account through this endpoint');
    }

    const existingUser = await prisma.user.findFirst({
      where: { 
        id, 
        clinicId,
        isActive: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // If updating password, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    logger.info('User updated', {
      userId: id,
      changes: Object.keys(updateData).filter(key => key !== 'password'),
      updatedBy: req.user!.id,
    });

    res.json({ user: updatedUser });
  })
);

// Deactivate user (soft delete)
router.delete('/users/:id', 
  requireRole(['ADMIN']),
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    // Prevent users from deactivating themselves
    if (id === req.user!.id) {
      throw new ValidationError('Cannot deactivate your own account');
    }

    const user = await prisma.user.findFirst({
      where: { 
        id, 
        clinicId,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if this is the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          clinicId,
          role: 'ADMIN',
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        throw new ValidationError('Cannot deactivate the last admin user');
      }
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('User deactivated', {
      userId: id,
      email: user.email,
      role: user.role,
      deactivatedBy: req.user!.id,
    });

    res.status(204).send();
  })
);

// Get current user profile
router.get('/profile', 
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        clinic: {
          select: {
            id: true,
            name: true,
            timezone: true,
            settings: true,
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

// Update current user profile
router.patch('/profile', 
  validate({ body: settingsSchemas.updateProfile }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { name, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const updateData: any = {};

    if (name) {
      updateData.name = name;
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        throw new ValidationError('Current password is required to change password');
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    logger.info('User profile updated', {
      userId,
      changes: Object.keys(updateData).filter(key => key !== 'password'),
    });

    res.json({ user: updatedUser });
  })
);

// Get system preferences
router.get('/preferences', 
  asyncHandler(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        settings: true,
        timezone: true,
      },
    });

    if (!clinic) {
      throw new NotFoundError('Clinic');
    }

    // Default preferences
    const defaultPreferences = {
      language: 'en',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
      currency: 'USD',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      inventory: {
        lowStockThreshold: 10,
        expiryWarningDays: 30,
        autoReorderEnabled: false,
      },
      alerts: {
        enableLowStock: true,
        enableExpiry: true,
        enableCustom: true,
      },
    };

    const clinicSettings = clinic.settings ? JSON.parse(clinic.settings) : {};
    const preferences = {
      ...defaultPreferences,
      ...clinicSettings,
      timezone: clinic.timezone,
    };

    res.json({ preferences });
  })
);

// Update system preferences
router.patch('/preferences', 
  requireRole(['LEAD', 'ADMIN']),
  validate({ body: settingsSchemas.updatePreferences }),
  asyncHandler(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const preferences = req.body;

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        settings: JSON.stringify(preferences),
        timezone: preferences.timezone || undefined,
      },
      select: {
        settings: true,
        timezone: true,
      },
    });

    logger.info('System preferences updated', {
      clinicId,
      changes: Object.keys(preferences),
      userId: req.user!.id,
    });

    const updatedSettings = updatedClinic.settings ? JSON.parse(updatedClinic.settings) : {};
    res.json({ 
      preferences: {
        ...updatedSettings,
        timezone: updatedClinic.timezone,
      },
    });
  })
);

// Get audit log
router.get('/audit', 
  requireRole(['ADMIN']),
  validate({ 
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sortBy: Joi.string().optional(),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
      search: Joi.string().optional().allow(''),
      userId: Joi.string().optional(),
      action: Joi.string().optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      action,
      startDate,
      endDate,
    } = req.query as any;

    const skip = (page - 1) * limit;
    const clinicId = req.user!.clinicId;

    // Build where clause for audit log
    // Note: This would require an audit log table in a real implementation
    // For now, we'll return a mock response
    const mockAuditLogs = [
      {
        id: '1',
        action: 'USER_CREATED',
        userId: req.user!.id,
        targetId: 'user-123',
        details: { email: 'new.user@example.com', role: 'STAFF' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date(),
      },
      {
        id: '2',
        action: 'INVENTORY_UPDATED',
        userId: req.user!.id,
        targetId: 'item-456',
        details: { field: 'quantity', oldValue: 50, newValue: 45 },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date(Date.now() - 3600000),
      },
    ];

    res.json({
      auditLogs: mockAuditLogs,
      pagination: {
        page,
        limit,
        total: mockAuditLogs.length,
        pages: Math.ceil(mockAuditLogs.length / limit),
      },
      message: 'Audit logging would be implemented with a dedicated audit table',
    });
  })
);

// Export clinic data
router.get('/export', 
  requireRole(['ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;

    const [clinic, users, items, alerts, messages] = await Promise.all([
      prisma.clinic.findUnique({
        where: { id: clinicId },
      }),
      prisma.user.findMany({
        where: { clinicId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.item.findMany({
        where: { clinicId },
        include: {
          batches: true,
        },
      }),
      prisma.alertRule.findMany({
        where: { clinicId },
        include: {
          alerts: {
            take: 100,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.message.findMany({
        where: { clinicId },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const exportData = {
      clinic,
      users,
      items,
      alerts,
      messages,
      exportedAt: new Date(),
      exportedBy: req.user!.id,
    };

    logger.info('Clinic data exported', {
      clinicId,
      userId: req.user!.id,
      recordCounts: {
        users: users.length,
        items: items.length,
        alerts: alerts.length,
        messages: messages.length,
      },
    });

    res.json({ export: exportData });
  })
);

export default router;