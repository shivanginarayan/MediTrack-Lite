import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../utils/logger';
import { AppError } from './errorHandler';

// Create rate limiter instance
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => {
    // Use IP address as key, but include user ID if authenticated for better tracking
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.id;
    return userId ? `${ip}:${userId}` : ip;
  },
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Number of requests
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000, // Per 15 minutes (in seconds)
  blockDuration: 60, // Block for 1 minute if limit exceeded
});

// Stricter rate limiter for auth endpoints
const authRateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `auth:${ip}`;
  },
  points: 5, // 5 attempts
  duration: 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

// Rate limiter for file uploads
const uploadRateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.id;
    return userId ? `upload:${ip}:${userId}` : `upload:${ip}`;
  },
  points: 10, // 10 uploads
  duration: 3600, // Per hour
  blockDuration: 3600, // Block for 1 hour
});

export const createRateLimitMiddleware = (limiter: RateLimiterMemory) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = limiter.keyGenerator ? limiter.keyGenerator(req) : (req.ip || 'unknown');
      const resRateLimiter = await limiter.consume(key);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': limiter.points.toString(),
        'X-RateLimit-Remaining': resRateLimiter.remainingPoints?.toString() || '0',
        'X-RateLimit-Reset': new Date(Date.now() + resRateLimiter.msBeforeNext).toISOString(),
      });
      
      next();
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      // Log rate limit violation
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        retryAfter: secs,
      });
      
      res.set({
        'Retry-After': secs.toString(),
        'X-RateLimit-Limit': limiter.points.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
      });
      
      const error = new AppError(
        `Too many requests. Please try again in ${secs} seconds.`,
        429
      );
      
      next(error);
    }
  };
};

// Default rate limiter middleware
export const rateLimitMiddleware = createRateLimitMiddleware(rateLimiter);

// Auth-specific rate limiter
export const authRateLimitMiddleware = createRateLimitMiddleware(authRateLimiter);

// Upload-specific rate limiter
export const uploadRateLimitMiddleware = createRateLimitMiddleware(uploadRateLimiter);

export { rateLimitMiddleware as rateLimiter };
export default rateLimitMiddleware;