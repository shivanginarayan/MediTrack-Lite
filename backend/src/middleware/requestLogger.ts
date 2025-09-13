import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestLog {
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  ip: string;
  userAgent?: string;
  userId?: string;
  contentLength?: number;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response details
  res.send = function (body: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const logData: RequestLog = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      contentLength: body ? Buffer.byteLength(body, 'utf8') : 0,
    };

    // Add user ID if available (from auth middleware)
    if (req.user?.id) {
      logData.userId = req.user.id;
    }

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else {
      logger.info('HTTP Request', logData);
    }

    // Call original send method
    return originalSend.call(this, body);
  };

  next();
};

export default requestLogger;