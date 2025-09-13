import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Custom error classes
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// Handle Prisma errors
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[];
      return new ConflictError(`${field?.join(', ') || 'Field'} already exists`);
    
    case 'P2025':
      // Record not found
      return new NotFoundError('Record');
    
    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError('Invalid reference to related record');
    
    case 'P2014':
      // Required relation violation
      return new ValidationError('Required relation is missing');
    
    default:
      logger.error('Unhandled Prisma error:', { code: error.code, message: error.message });
      return new AppError('Database operation failed', 500);
  }
}

// Main error handler middleware
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Handle different types of errors
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = new ValidationError('Invalid data provided');
  } else if (error.name === 'ValidationError') {
    appError = new ValidationError(error.message);
  } else if (error.name === 'JsonWebTokenError') {
    appError = new UnauthorizedError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new UnauthorizedError('Token expired');
  } else {
    // Unknown error
    appError = new AppError(
      process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
      500,
      false
    );
  }

  // Log error
  if (appError.statusCode >= 500) {
    logger.error('Server Error:', {
      message: appError.message,
      stack: appError.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } else {
    logger.warn('Client Error:', {
      message: appError.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
      statusCode: appError.statusCode,
    });
  }

  // Send error response
  const errorResponse: any = {
    error: {
      message: appError.message,
      statusCode: appError.statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = appError.stack;
  }

  res.status(appError.statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;