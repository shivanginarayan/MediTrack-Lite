import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

interface ValidationOptions {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}

// Generic validation middleware
export const validate = (schemas: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schemas.body) {
      const { error } = schemas.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => `Body: ${detail.message}`));
      }
    }

    // Validate query parameters
    if (schemas.query) {
      const { error } = schemas.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => `Query: ${detail.message}`));
      }
    }

    // Validate route parameters
    if (schemas.params) {
      const { error } = schemas.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => `Params: ${detail.message}`));
      }
    }

    // Validate headers
    if (schemas.headers) {
      const { error } = schemas.headers.validate(req.headers, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => `Headers: ${detail.message}`));
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  // ID parameter validation
  id: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'ID is required',
      'any.required': 'ID is required',
    }),
  }),

  // Pagination query validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().optional().allow(''),
  }),

  // Date range query validation
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }),
};

// Auth validation schemas
export const authSchemas = {
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).optional(), // Optional for demo mode
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('STAFF', 'LEAD').default('STAFF'),
    clinicId: Joi.string().required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]')).required().messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters long',
    }),
  }),
};

// Inventory validation schemas
export const inventorySchemas = {
  createItem: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).optional().allow(''),
    category: Joi.string().max(100).optional().allow(''),
    unit: Joi.string().max(50).default('units'),
    threshold: Joi.number().integer().min(0).default(10),
  }),

  updateItem: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(1000).optional().allow(''),
    category: Joi.string().max(100).optional().allow(''),
    unit: Joi.string().max(50).optional(),
    threshold: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional(),
  }),

  createBatch: Joi.object({
    batchNumber: Joi.string().min(1).max(100).required(),
    lotNumber: Joi.string().max(100).optional().allow(''),
    expiryDate: Joi.date().iso().optional(),
    quantity: Joi.number().integer().min(0).required(),
  }),

  stockAdjustment: Joi.object({
    type: Joi.string().valid('IN', 'OUT', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED').required(),
    quantity: Joi.number().integer().required().custom((value, helpers) => {
      const type = helpers.state.ancestors[0].type;
      if (type === 'OUT' || type === 'EXPIRED' || type === 'DAMAGED') {
        return value <= 0 ? value : helpers.error('number.negative');
      }
      return value > 0 ? value : helpers.error('number.positive');
    }),
    reason: Joi.string().max(200).optional().allow(''),
    notes: Joi.string().max(500).optional().allow(''),
    batchId: Joi.string().optional(),
  }),

  inventoryQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().optional().allow(''),
    status: Joi.string().valid('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK').optional(),
    category: Joi.string().optional(),
    expiringBefore: Joi.date().iso().optional(),
  }),
};

// Alert validation schemas
export const alertSchemas = {
  createRule: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    type: Joi.string().valid('LOW_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'CUSTOM').required(),
    threshold: Joi.number().integer().min(0).when('type', {
      is: Joi.string().valid('LOW_STOCK', 'EXPIRING_SOON'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    recipients: Joi.array().items(Joi.string().email()).min(1).required(),
    channels: Joi.array().items(Joi.string().valid('email', 'sms')).min(1).required(),
    itemId: Joi.string().optional(),
  }),

  updateRule: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    threshold: Joi.number().integer().min(0).optional(),
    recipients: Joi.array().items(Joi.string().email()).min(1).optional(),
    channels: Joi.array().items(Joi.string().valid('email', 'sms')).min(1).optional(),
    isActive: Joi.boolean().optional(),
  }),
};

// Message validation schemas
export const messageSchemas = {
  create: Joi.object({
    type: Joi.string().valid('ALERT', 'BROADCAST', 'REMINDER', 'NOTIFICATION').default('BROADCAST'),
    subject: Joi.string().max(200).required(),
    content: Joi.string().min(1).max(2000).required(),
    language: Joi.string().valid('en', 'es').default('en'),
    recipients: Joi.array().items(Joi.string().email()).min(1).required(),
    channels: Joi.array().items(Joi.string().valid('EMAIL', 'SMS')).min(1).required(),
    templateId: Joi.string().optional(),
    scheduledAt: Joi.date().iso().min('now').optional(),
    metadata: Joi.object().optional(),
  }),

  update: Joi.object({
    subject: Joi.string().max(200).optional(),
    content: Joi.string().min(1).max(2000).optional(),
    language: Joi.string().valid('en', 'es').optional(),
    recipients: Joi.array().items(Joi.string().email()).min(1).optional(),
    channels: Joi.array().items(Joi.string().valid('EMAIL', 'SMS')).min(1).optional(),
    scheduledAt: Joi.date().iso().min('now').optional(),
    metadata: Joi.object().optional(),
  }),

  createTemplate: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    type: Joi.string().valid('ALERT', 'BROADCAST', 'REMINDER', 'NOTIFICATION').required(),
    subject: Joi.string().max(200).optional(),
    content: Joi.string().min(1).max(2000).required(),
    language: Joi.string().valid('en', 'es').default('en'),
    variables: Joi.array().items(Joi.string()).optional(),
  }),

  updateTemplate: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    subject: Joi.string().max(200).optional(),
    content: Joi.string().min(1).max(2000).optional(),
    language: Joi.string().valid('en', 'es').optional(),
    variables: Joi.array().items(Joi.string()).optional(),
  }),
};

// Settings validation schemas
export const settingsSchemas = {
  updateClinic: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    address: Joi.string().max(500).optional(),
    phone: Joi.string().max(50).optional(),
    email: Joi.string().email().optional(),
    timezone: Joi.string().optional(),
    settings: Joi.object().optional(),
  }),

  createUser: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('STAFF', 'LEAD').required(),
    password: Joi.string().min(6).required(),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    role: Joi.string().valid('STAFF', 'LEAD').optional(),
    password: Joi.string().min(6).optional(),
    isActive: Joi.boolean().optional(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    currentPassword: Joi.string().optional(),
    newPassword: Joi.string().min(6).optional(),
  }),

  updatePreferences: Joi.object({
    language: Joi.string().valid('en', 'es').optional(),
    dateFormat: Joi.string().optional(),
    timeFormat: Joi.string().valid('12h', '24h').optional(),
    currency: Joi.string().optional(),
    timezone: Joi.string().optional(),
    notifications: Joi.object().optional(),
    inventory: Joi.object().optional(),
    alerts: Joi.object().optional(),
  }),
};

export default validate;