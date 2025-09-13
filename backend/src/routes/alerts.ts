import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { prisma } from '../database/client';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { validate, alertSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication to all alert routes
router.use(authenticateToken);

interface AlertQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string;
  severity?: string;
  isRead?: boolean;
  isResolved?: boolean;
  startDate?: string;
  endDate?: string;
}

// Get all alerts with pagination and filtering
router.get('/', 
  validate({ 
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sortBy: Joi.string().optional(),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
      search: Joi.string().optional().allow(''),
      type: Joi.string().valid('LOW_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'CUSTOM').optional(),
      severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
      isRead: Joi.boolean().optional(),
      isResolved: Joi.boolean().optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      type,
      severity,
      isRead,
      isResolved,
      startDate,
      endDate,
    } = req.query as AlertQueryParams;

    const skip = (page - 1) * limit;
    const clinicId = req.user!.clinicId;

    // Build where clause
    const where: any = {
      rule: {
        clinicId,
      },
    };

    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (typeof isRead === 'boolean') where.isRead = isRead;
    if (typeof isResolved === 'boolean') where.isResolved = isResolved;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [alerts, totalCount] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          rule: {
            select: {
              id: true,
              name: true,
              item: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.alert.count({ where }),
    ]);

    // Get summary statistics
    const summary = await prisma.alert.groupBy({
      by: ['severity', 'isRead', 'isResolved'],
      where: {
        rule: {
          clinicId,
        },
      },
      _count: true,
    });

    const summaryStats = {
      total: totalCount,
      unread: summary.filter(s => !s.isRead).reduce((sum, s) => sum + s._count, 0),
      unresolved: summary.filter(s => !s.isResolved).reduce((sum, s) => sum + s._count, 0),
      bySeverity: {
        low: summary.filter(s => s.severity === 'LOW').reduce((sum, s) => sum + s._count, 0),
        medium: summary.filter(s => s.severity === 'MEDIUM').reduce((sum, s) => sum + s._count, 0),
        high: summary.filter(s => s.severity === 'HIGH').reduce((sum, s) => sum + s._count, 0),
        critical: summary.filter(s => s.severity === 'CRITICAL').reduce((sum, s) => sum + s._count, 0),
      },
    };

    res.json({
      alerts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      summary: summaryStats,
    });
  })
);

// Get single alert by ID
router.get('/:id', 
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const alert = await prisma.alert.findFirst({
      where: {
        id,
        rule: {
          clinicId,
        },
      },
      include: {
        rule: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    res.json({ alert });
  })
);

// Mark alert as read
router.patch('/:id/read', 
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const alert = await prisma.alert.findFirst({
      where: {
        id,
        rule: {
          clinicId,
        },
      },
    });

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });

    logger.info('Alert marked as read', {
      alertId: id,
      userId: req.user!.id,
    });

    res.json({ alert: updatedAlert });
  })
);

// Mark alert as resolved
router.patch('/:id/resolve', 
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const alert = await prisma.alert.findFirst({
      where: {
        id,
        rule: {
          clinicId,
        },
      },
    });

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: { 
        isResolved: true,
        isRead: true, // Auto-mark as read when resolved
      },
    });

    logger.info('Alert resolved', {
      alertId: id,
      userId: req.user!.id,
    });

    res.json({ alert: updatedAlert });
  })
);

// Bulk mark alerts as read
router.patch('/bulk/read', 
  validate({ 
    body: {
      alertIds: require('joi').array().items(require('joi').string()).min(1).required(),
    }
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { alertIds } = req.body;
    const clinicId = req.user!.clinicId;

    // Verify all alerts belong to the clinic
    const alerts = await prisma.alert.findMany({
      where: {
        id: { in: alertIds },
        rule: {
          clinicId,
        },
      },
    });

    if (alerts.length !== alertIds.length) {
      throw new ValidationError('Some alerts not found or do not belong to your clinic');
    }

    const result = await prisma.alert.updateMany({
      where: {
        id: { in: alertIds },
      },
      data: {
        isRead: true,
      },
    });

    logger.info('Bulk alerts marked as read', {
      count: result.count,
      userId: req.user!.id,
    });

    res.json({ 
      message: `${result.count} alerts marked as read`,
      count: result.count,
    });
  })
);

// Get all alert rules
router.get('/rules/list', 
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

    const [rules, totalCount] = await Promise.all([
      prisma.alertRule.findMany({
        where: { clinicId },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              alerts: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.alertRule.count({ where: { clinicId } }),
    ]);

    res.json({
      rules,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  })
);

// Get single alert rule by ID
router.get('/rules/:id', 
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const rule = await prisma.alertRule.findFirst({
      where: {
        id,
        clinicId,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            threshold: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            severity: true,
            isRead: true,
            isResolved: true,
            createdAt: true,
          },
        },
      },
    });

    if (!rule) {
      throw new NotFoundError('Alert rule');
    }

    res.json({ rule });
  })
);

// Create new alert rule
router.post('/rules', 
  requireRole(['LEAD', 'ADMIN']),
  validate({ body: alertSchemas.createRule }),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, type, threshold, recipients, channels, itemId } = req.body;
    const clinicId = req.user!.clinicId;
    const userId = req.user!.id;

    // If itemId is provided, verify it belongs to the clinic
    if (itemId) {
      const item = await prisma.item.findFirst({
        where: {
          id: itemId,
          clinicId,
          isActive: true,
        },
      });

      if (!item) {
        throw new ValidationError('Invalid item ID');
      }
    }

    const rule = await prisma.alertRule.create({
      data: {
        name,
        type,
        threshold,
        recipients,
        channels,
        itemId,
        clinicId,
        userId,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Alert rule created', {
      ruleId: rule.id,
      name: rule.name,
      type: rule.type,
      userId,
      clinicId,
    });

    res.status(201).json({ rule });
  })
);

// Update alert rule
router.patch('/rules/:id', 
  validate({ 
    params: commonSchemas.id,
    body: alertSchemas.updateRule 
  }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;
    const updateData = req.body;

    const existingRule = await prisma.alertRule.findFirst({
      where: { id, clinicId },
    });

    if (!existingRule) {
      throw new NotFoundError('Alert rule');
    }

    const updatedRule = await prisma.alertRule.update({
      where: { id },
      data: updateData,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Alert rule updated', {
      ruleId: id,
      changes: Object.keys(updateData),
      userId: req.user!.id,
    });

    res.json({ rule: updatedRule });
  })
);

// Delete alert rule
router.delete('/rules/:id', 
  validate({ params: commonSchemas.id }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const rule = await prisma.alertRule.findFirst({
      where: { id, clinicId },
    });

    if (!rule) {
      throw new NotFoundError('Alert rule');
    }

    await prisma.alertRule.delete({
      where: { id },
    });

    logger.info('Alert rule deleted', {
      ruleId: id,
      name: rule.name,
      userId: req.user!.id,
    });

    res.status(204).send();
  })
);

// Test alert rule (send test notification)
router.post('/rules/:id/test', 
  validate({ params: commonSchemas.id }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const rule = await prisma.alertRule.findFirst({
      where: {
        id,
        clinicId,
        isActive: true,
      },
      include: {
        item: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!rule) {
      throw new NotFoundError('Alert rule');
    }

    // Create a test alert
    const testAlert = await prisma.alert.create({
      data: {
        type: rule.type,
        title: `Test Alert: ${rule.name}`,
        message: `This is a test alert for rule "${rule.name}". ${rule.item ? `Item: ${rule.item.name}` : ''}`,
        severity: 'LOW',
        ruleId: rule.id,
        data: {
          isTest: true,
          testedBy: req.user!.id,
          testedAt: new Date().toISOString(),
        },
      },
    });

    // In a real implementation, you would send notifications here
    // For now, we'll just log and return success
    logger.info('Test alert created', {
      ruleId: id,
      alertId: testAlert.id,
      recipients: rule.recipients,
      channels: rule.channels,
      userId: req.user!.id,
    });

    res.json({
      message: 'Test alert sent successfully',
      alert: testAlert,
      recipients: rule.recipients,
      channels: rule.channels,
    });
  })
);

// Get alert statistics
router.get('/stats/summary', 
  asyncHandler(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalAlerts, recentAlerts, alertsByType, alertsBySeverity, activeRules] = await Promise.all([
      prisma.alert.count({
        where: {
          rule: { clinicId },
        },
      }),
      prisma.alert.count({
        where: {
          rule: { clinicId },
          createdAt: { gte: last24Hours },
        },
      }),
      prisma.alert.groupBy({
        by: ['type'],
        where: {
          rule: { clinicId },
          createdAt: { gte: last7Days },
        },
        _count: true,
      }),
      prisma.alert.groupBy({
        by: ['severity'],
        where: {
          rule: { clinicId },
          isResolved: false,
        },
        _count: true,
      }),
      prisma.alertRule.count({
        where: {
          clinicId,
          isActive: true,
        },
      }),
    ]);

    res.json({
      summary: {
        totalAlerts,
        recentAlerts,
        activeRules,
        unresolvedAlerts: alertsBySeverity.reduce((sum, item) => sum + item._count, 0),
      },
      alertsByType: alertsByType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      alertsBySeverity: alertsBySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  })
);

export default router;