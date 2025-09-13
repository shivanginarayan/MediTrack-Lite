import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { prisma } from '../database/client';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { validate, messageSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication to all message routes
router.use(authenticateToken);

interface MessageQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string;
  status?: string;
  language?: string;
  startDate?: string;
  endDate?: string;
}

// Get all messages with pagination and filtering
router.get('/', 
  validate({ 
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sortBy: Joi.string().optional(),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
      search: Joi.string().optional().allow(''),
      type: Joi.string().valid('BROADCAST', 'ALERT', 'REMINDER', 'NOTIFICATION').optional(),
      status: Joi.string().valid('DRAFT', 'QUEUED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED').optional(),
      language: Joi.string().optional(),
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
      status,
      language,
      startDate,
      endDate,
    } = req.query as MessageQueryParams;

    const skip = (page - 1) * limit;
    const clinicId = req.user!.clinicId;

    // Build where clause
    const where: any = { clinicId };

    if (type) where.type = type;
    if (status) where.status = status;
    if (language) where.language = language;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              type: true,
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
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    // Get summary statistics
    const summary = await prisma.message.groupBy({
      by: ['status', 'type'],
      where: { clinicId },
      _count: true,
    });

    const summaryStats = {
      total: totalCount,
      byStatus: {
        draft: summary.filter(s => s.status === 'DRAFT').reduce((sum, s) => sum + s._count, 0),
        queued: summary.filter(s => s.status === 'QUEUED').reduce((sum, s) => sum + s._count, 0),
        sending: summary.filter(s => s.status === 'SENDING').reduce((sum, s) => sum + s._count, 0),
        sent: summary.filter(s => s.status === 'SENT').reduce((sum, s) => sum + s._count, 0),
        failed: summary.filter(s => s.status === 'FAILED').reduce((sum, s) => sum + s._count, 0),
        cancelled: summary.filter(s => s.status === 'CANCELLED').reduce((sum, s) => sum + s._count, 0),
      },
      byType: {
        broadcast: summary.filter(s => s.type === 'BROADCAST').reduce((sum, s) => sum + s._count, 0),
        alert: summary.filter(s => s.type === 'ALERT').reduce((sum, s) => sum + s._count, 0),
        reminder: summary.filter(s => s.type === 'REMINDER').reduce((sum, s) => sum + s._count, 0),
        notification: summary.filter(s => s.type === 'NOTIFICATION').reduce((sum, s) => sum + s._count, 0),
      },
    };

    res.json({
      messages,
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

// Get single message by ID
router.get('/:id', 
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const message = await prisma.message.findFirst({
      where: {
        id,
        clinicId,
      },
      include: {
        template: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundError('Message');
    }

    res.json({ message });
  })
);

// Create new message/broadcast
router.post('/', 
  requireRole(['LEAD', 'ADMIN']),
  validate({ body: messageSchemas.create }),
  asyncHandler(async (req: Request, res: Response) => {
    const { 
      type, 
      subject, 
      content, 
      language = 'en', 
      recipients, 
      channels, 
      templateId, 
      scheduledAt,
      metadata 
    } = req.body;
    const clinicId = req.user!.clinicId;
    const userId = req.user!.id;

    // If templateId is provided, verify it belongs to the clinic
    if (templateId) {
      const template = await prisma.messageTemplate.findFirst({
        where: {
          id: templateId,
          clinicId,
          isActive: true,
        },
      });

      if (!template) {
        throw new ValidationError('Invalid template ID');
      }
    }

    // Determine initial status
    let status = 'DRAFT';
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        throw new ValidationError('Scheduled time must be in the future');
      }
      status = 'QUEUED';
    }

    const message = await prisma.message.create({
      data: {
        type,
        subject,
        content,
        language,
        recipients,
        channels,
        status,
        templateId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        metadata: metadata || {},
        clinicId,
        userId,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
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

    logger.info('Message created', {
      messageId: message.id,
      type: message.type,
      status: message.status,
      recipientCount: recipients.length,
      userId,
      clinicId,
    });

    res.status(201).json({ message });
  })
);

// Update message (only drafts can be updated)
router.patch('/:id', 
  validate({ 
    params: commonSchemas.id,
    body: messageSchemas.update 
  }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;
    const updateData = req.body;

    const existingMessage = await prisma.message.findFirst({
      where: { id, clinicId },
    });

    if (!existingMessage) {
      throw new NotFoundError('Message');
    }

    if (existingMessage.status !== 'DRAFT') {
      throw new ValidationError('Only draft messages can be updated');
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
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

    logger.info('Message updated', {
      messageId: id,
      changes: Object.keys(updateData),
      userId: req.user!.id,
    });

    res.json({ message: updatedMessage });
  })
);

// Send message (change status from DRAFT to QUEUED)
router.post('/:id/send', 
  validate({ params: commonSchemas.id }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const message = await prisma.message.findFirst({
      where: {
        id,
        clinicId,
        status: 'DRAFT',
      },
    });

    if (!message) {
      throw new NotFoundError('Draft message');
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        status: 'QUEUED',
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // In a real implementation, you would add the message to a queue here
    logger.info('Message queued for sending', {
      messageId: id,
      type: message.type,
      recipientCount: message.recipients.length,
      userId: req.user!.id,
    });

    res.json({ 
      message: updatedMessage,
      status: 'Message queued for sending',
    });
  })
);

// Cancel message (only queued messages can be cancelled)
router.post('/:id/cancel', 
  validate({ params: commonSchemas.id }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const message = await prisma.message.findFirst({
      where: {
        id,
        clinicId,
        status: { in: ['QUEUED', 'SENDING'] },
      },
    });

    if (!message) {
      throw new NotFoundError('Queued/sending message');
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    logger.info('Message cancelled', {
      messageId: id,
      previousStatus: message.status,
      userId: req.user!.id,
    });

    res.json({ 
      message: updatedMessage,
      status: 'Message cancelled',
    });
  })
);

// Retry failed message
router.post('/:id/retry', 
  validate({ params: commonSchemas.id }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const message = await prisma.message.findFirst({
      where: {
        id,
        clinicId,
        status: 'FAILED',
      },
    });

    if (!message) {
      throw new NotFoundError('Failed message');
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        status: 'QUEUED',
      },
    });

    logger.info('Message retry queued', {
      messageId: id,
      userId: req.user!.id,
    });

    res.json({ 
      message: updatedMessage,
      status: 'Message queued for retry',
    });
  })
);

// Delete message (only drafts and failed messages can be deleted)
router.delete('/:id', 
  validate({ params: commonSchemas.id }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const message = await prisma.message.findFirst({
      where: {
        id,
        clinicId,
        status: { in: ['DRAFT', 'FAILED', 'CANCELLED'] },
      },
    });

    if (!message) {
      throw new NotFoundError('Deletable message');
    }

    await prisma.message.delete({
      where: { id },
    });

    logger.info('Message deleted', {
      messageId: id,
      type: message.type,
      status: message.status,
      userId: req.user!.id,
    });

    res.status(204).send();
  })
);

// Get all message templates
router.get('/templates/list', 
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

    const [templates, totalCount] = await Promise.all([
      prisma.messageTemplate.findMany({
        where: { 
          clinicId,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.messageTemplate.count({ 
        where: { 
          clinicId,
          isActive: true,
        },
      }),
    ]);

    res.json({
      templates,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  })
);

// Get single message template by ID
router.get('/templates/:id', 
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const template = await prisma.messageTemplate.findFirst({
      where: {
        id,
        clinicId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            subject: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Message template');
    }

    res.json({ template });
  })
);

// Create new message template
router.post('/templates', 
  requireRole(['LEAD', 'ADMIN']),
  validate({ body: messageSchemas.createTemplate }),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, type, subject, content, language = 'en', variables } = req.body;
    const clinicId = req.user!.clinicId;
    const userId = req.user!.id;

    const template = await prisma.messageTemplate.create({
      data: {
        name,
        type,
        subject,
        content,
        language,
        variables: variables || [],
        clinicId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Message template created', {
      templateId: template.id,
      name: template.name,
      type: template.type,
      userId,
      clinicId,
    });

    res.status(201).json({ template });
  })
);

// Update message template
router.patch('/templates/:id', 
  validate({ 
    params: commonSchemas.id,
    body: messageSchemas.updateTemplate 
  }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;
    const updateData = req.body;

    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: { 
        id, 
        clinicId,
        isActive: true,
      },
    });

    if (!existingTemplate) {
      throw new NotFoundError('Message template');
    }

    const updatedTemplate = await prisma.messageTemplate.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Message template updated', {
      templateId: id,
      changes: Object.keys(updateData),
      userId: req.user!.id,
    });

    res.json({ template: updatedTemplate });
  })
);

// Delete message template (soft delete)
router.delete('/templates/:id', 
  validate({ params: commonSchemas.id }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const template = await prisma.messageTemplate.findFirst({
      where: { 
        id, 
        clinicId,
        isActive: true,
      },
    });

    if (!template) {
      throw new NotFoundError('Message template');
    }

    await prisma.messageTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('Message template deleted', {
      templateId: id,
      name: template.name,
      userId: req.user!.id,
    });

    res.status(204).send();
  })
);

// Get message statistics
router.get('/stats/summary', 
  asyncHandler(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalMessages, recentMessages, messagesByStatus, messagesByType, activeTemplates] = await Promise.all([
      prisma.message.count({
        where: { clinicId },
      }),
      prisma.message.count({
        where: {
          clinicId,
          createdAt: { gte: last24Hours },
        },
      }),
      prisma.message.groupBy({
        by: ['status'],
        where: {
          clinicId,
          createdAt: { gte: last30Days },
        },
        _count: true,
      }),
      prisma.message.groupBy({
        by: ['type'],
        where: {
          clinicId,
          createdAt: { gte: last7Days },
        },
        _count: true,
      }),
      prisma.messageTemplate.count({
        where: {
          clinicId,
          isActive: true,
        },
      }),
    ]);

    // Calculate success rate
    const sentMessages = messagesByStatus.find(s => s.status === 'SENT')?._count || 0;
    const failedMessages = messagesByStatus.find(s => s.status === 'FAILED')?._count || 0;
    const totalProcessed = sentMessages + failedMessages;
    const successRate = totalProcessed > 0 ? (sentMessages / totalProcessed) * 100 : 0;

    res.json({
      summary: {
        totalMessages,
        recentMessages,
        activeTemplates,
        successRate: Math.round(successRate * 100) / 100,
        queuedMessages: messagesByStatus.find(s => s.status === 'QUEUED')?._count || 0,
      },
      messagesByStatus: messagesByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      messagesByType: messagesByType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  })
);

export default router;