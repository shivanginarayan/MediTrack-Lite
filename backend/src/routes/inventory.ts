import { Router, Request, Response } from 'express';
import { prisma } from '../database/client';
import { asyncHandler, NotFoundError, ValidationError, ForbiddenError } from '../middleware/errorHandler';
import { validate, inventorySchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { uploadRateLimitMiddleware } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication to all inventory routes
router.use(authenticateToken);

interface InventoryQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  category?: string;
  expiringBefore?: string;
}

// Helper function to calculate stock status
const getStockStatus = (totalQuantity: number, threshold: number) => {
  if (totalQuantity === 0) return 'OUT_OF_STOCK';
  if (totalQuantity <= threshold) return 'LOW_STOCK';
  return 'IN_STOCK';
};

// Get all inventory items with pagination and filtering
router.get('/', 
  validate({ query: inventorySchemas.inventoryQuery }),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
      search,
      status,
      category,
      expiringBefore,
    } = req.query as InventoryQueryParams;

    const skip = (page - 1) * limit;
    const clinicId = req.user!.clinicId;

    // Build where clause
    const where: any = {
      clinicId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    // Get items with their batches
    const items = await prisma.item.findMany({
      where,
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' },
        },
        _count: {
          select: {
            stockAdjustments: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    // Calculate total quantities and apply filters
    const enrichedItems = items.map(item => {
      const totalQuantity = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const stockStatus = getStockStatus(totalQuantity, item.threshold);
      
      // Get earliest expiry date
      const earliestExpiry = item.batches
        .filter(batch => batch.expiryDate)
        .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())[0]?.expiryDate;

      return {
        ...item,
        totalQuantity,
        stockStatus,
        earliestExpiry,
        batchCount: item.batches.length,
        adjustmentCount: item._count.stockAdjustments,
      };
    });

    // Apply status filter after calculation
    let filteredItems = enrichedItems;
    if (status) {
      filteredItems = enrichedItems.filter(item => item.stockStatus === status);
    }

    // Apply expiry filter
    if (expiringBefore) {
      const expiryDate = new Date(expiringBefore);
      filteredItems = filteredItems.filter(item => 
        item.earliestExpiry && new Date(item.earliestExpiry) <= expiryDate
      );
    }

    // Get total count for pagination
    const totalCount = await prisma.item.count({ where });

    res.json({
      items: filteredItems,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalItems: totalCount,
        inStock: enrichedItems.filter(item => item.stockStatus === 'IN_STOCK').length,
        lowStock: enrichedItems.filter(item => item.stockStatus === 'LOW_STOCK').length,
        outOfStock: enrichedItems.filter(item => item.stockStatus === 'OUT_OF_STOCK').length,
      },
    });
  })
);

// Get single inventory item by ID
router.get('/:id', 
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const item = await prisma.item.findFirst({
      where: {
        id,
        clinicId,
        isActive: true,
      },
      include: {
        batches: {
          orderBy: { expiryDate: 'asc' },
        },
        stockAdjustments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            batch: {
              select: {
                id: true,
                batchNumber: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit recent adjustments
        },
        alertRules: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            threshold: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Item');
    }

    const totalQuantity = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
    const stockStatus = getStockStatus(totalQuantity, item.threshold);

    res.json({
      ...item,
      totalQuantity,
      stockStatus,
    });
  })
);

// Create new inventory item
router.post('/', 
  requireRole(['LEAD', 'ADMIN']),
  validate({ body: inventorySchemas.createItem }),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, category, unit, threshold } = req.body;
    const clinicId = req.user!.clinicId;

    // Check if item with same name already exists in clinic
    const existingItem = await prisma.item.findFirst({
      where: {
        name: { equals: name },
        clinicId,
        isActive: true,
      },
    });

    if (existingItem) {
      throw new ValidationError('Item with this name already exists');
    }

    const item = await prisma.item.create({
      data: {
        name,
        description,
        category,
        unit,
        threshold,
        clinicId,
      },
      include: {
        batches: true,
      },
    });

    logger.info('Inventory item created', {
      itemId: item.id,
      name: item.name,
      userId: req.user!.id,
      clinicId,
    });

    res.status(201).json({
      ...item,
      totalQuantity: 0,
      stockStatus: 'OUT_OF_STOCK',
    });
  })
);

// Update inventory item
router.patch('/:id', 
  validate({ 
    params: commonSchemas.id,
    body: inventorySchemas.updateItem 
  }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;
    const updateData = req.body;

    // Check if item exists and belongs to clinic
    const existingItem = await prisma.item.findFirst({
      where: { id, clinicId, isActive: true },
    });

    if (!existingItem) {
      throw new NotFoundError('Item');
    }

    // If updating name, check for duplicates
    if (updateData.name && updateData.name !== existingItem.name) {
      const duplicateItem = await prisma.item.findFirst({
        where: {
          name: { equals: updateData.name },
          clinicId,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateItem) {
        throw new ValidationError('Item with this name already exists');
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        batches: true,
      },
    });

    const totalQuantity = updatedItem.batches.reduce((sum, batch) => sum + batch.quantity, 0);
    const stockStatus = getStockStatus(totalQuantity, updatedItem.threshold);

    logger.info('Inventory item updated', {
      itemId: id,
      changes: Object.keys(updateData),
      userId: req.user!.id,
    });

    res.json({
      ...updatedItem,
      totalQuantity,
      stockStatus,
    });
  })
);

// Delete inventory item (soft delete)
router.delete('/:id', 
  validate({ params: commonSchemas.id }),
  requireRole(['LEAD', 'ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    const item = await prisma.item.findFirst({
      where: { id, clinicId, isActive: true },
    });

    if (!item) {
      throw new NotFoundError('Item');
    }

    await prisma.item.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('Inventory item deleted', {
      itemId: id,
      name: item.name,
      userId: req.user!.id,
    });

    res.status(204).send();
  })
);

// Get item batches
router.get('/:id/batches', 
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clinicId = req.user!.clinicId;

    // Verify item belongs to clinic
    const item = await prisma.item.findFirst({
      where: { id, clinicId, isActive: true },
    });

    if (!item) {
      throw new NotFoundError('Item');
    }

    const batches = await prisma.batch.findMany({
      where: { itemId: id },
      orderBy: { expiryDate: 'asc' },
    });

    res.json({ batches });
  })
);

// Create new batch for item
router.post('/:id/batches', 
  validate({ 
    params: commonSchemas.id,
    body: inventorySchemas.createBatch 
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { batchNumber, lotNumber, expiryDate, quantity } = req.body;
    const clinicId = req.user!.clinicId;

    // Verify item belongs to clinic
    const item = await prisma.item.findFirst({
      where: { id, clinicId, isActive: true },
    });

    if (!item) {
      throw new NotFoundError('Item');
    }

    // Check if batch number already exists for this item
    const existingBatch = await prisma.batch.findFirst({
      where: {
        itemId: id,
        batchNumber,
      },
    });

    if (existingBatch) {
      throw new ValidationError('Batch number already exists for this item');
    }

    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        lotNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        quantity,
        itemId: id,
      },
    });

    // Create stock adjustment record
    await prisma.stockAdjustment.create({
      data: {
        type: 'IN',
        quantity,
        reason: 'New batch created',
        itemId: id,
        batchId: batch.id,
        userId: req.user!.id,
      },
    });

    logger.info('New batch created', {
      batchId: batch.id,
      itemId: id,
      batchNumber,
      quantity,
      userId: req.user!.id,
    });

    res.status(201).json({ batch });
  })
);

// Stock adjustment endpoint
router.post('/:id/adjust', 
  validate({ 
    params: commonSchemas.id,
    body: inventorySchemas.stockAdjustment 
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type, quantity, reason, notes, batchId } = req.body;
    const clinicId = req.user!.clinicId;

    // Verify item belongs to clinic
    const item = await prisma.item.findFirst({
      where: { id, clinicId, isActive: true },
      include: {
        batches: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Item');
    }

    // If batchId is provided, verify it belongs to this item
    let batch = null;
    if (batchId) {
      batch = await prisma.batch.findFirst({
        where: { id: batchId, itemId: id },
      });

      if (!batch) {
        throw new ValidationError('Invalid batch ID for this item');
      }

      // For OUT adjustments, check if batch has enough quantity
      if ((type === 'OUT' || type === 'EXPIRED' || type === 'DAMAGED') && batch.quantity < Math.abs(quantity)) {
        throw new ValidationError('Insufficient quantity in batch');
      }
    }

    // Create stock adjustment record
    const adjustment = await prisma.stockAdjustment.create({
      data: {
        type,
        quantity,
        reason,
        notes,
        itemId: id,
        batchId,
        userId: req.user!.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        batch: {
          select: {
            batchNumber: true,
          },
        },
      },
    });

    // Update batch quantity if batch is specified
    if (batch) {
      await prisma.batch.update({
        where: { id: batchId },
        data: {
          quantity: {
            increment: quantity, // quantity is negative for OUT adjustments
          },
        },
      });
    }

    logger.info('Stock adjustment created', {
      adjustmentId: adjustment.id,
      itemId: id,
      type,
      quantity,
      batchId,
      userId: req.user!.id,
    });

    res.status(201).json({ adjustment });
  })
);

// Get stock adjustment history for an item
router.get('/:id/adjustments', 
  validate({ 
    params: commonSchemas.id,
    query: commonSchemas.pagination 
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query as any;
    const clinicId = req.user!.clinicId;
    const skip = (page - 1) * limit;

    // Verify item belongs to clinic
    const item = await prisma.item.findFirst({
      where: { id, clinicId, isActive: true },
    });

    if (!item) {
      throw new NotFoundError('Item');
    }

    const [adjustments, totalCount] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where: { itemId: id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          batch: {
            select: {
              batchNumber: true,
              lotNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockAdjustment.count({
        where: { itemId: id },
      }),
    ]);

    res.json({
      adjustments,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  })
);

// Get inventory categories
router.get('/meta/categories', 
  asyncHandler(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId;

    const categories = await prisma.item.findMany({
      where: {
        clinicId,
        isActive: true,
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    const categoryList = categories
      .map(item => item.category)
      .filter(Boolean)
      .sort();

    res.json({ categories: categoryList });
  })
);

export default router;