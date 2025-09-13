import { Router, Request, Response } from 'express';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    memory: {
      used: string;
      total: string;
      percentage: number;
    };
  };
  checks: {
    name: string;
    status: 'pass' | 'fail';
    duration: number;
    message?: string;
  }[];
}

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks: HealthCheck['checks'] = [];
  let overallStatus: 'healthy' | 'unhealthy' = 'healthy';

  // Database connectivity check
  const dbCheckStart = Date.now();
  let dbStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
    checks.push({
      name: 'database',
      status: 'pass',
      duration: Date.now() - dbCheckStart,
    });
  } catch (error) {
    dbStatus = 'error';
    overallStatus = 'unhealthy';
    checks.push({
      name: 'database',
      status: 'fail',
      duration: Date.now() - dbCheckStart,
      message: error instanceof Error ? error.message : 'Unknown database error',
    });
    logger.error('Database health check failed:', error);
  }

  // Memory usage check
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

  // Memory warning if usage is above 80%
  if (memoryPercentage > 80) {
    checks.push({
      name: 'memory',
      status: 'fail',
      duration: 0,
      message: `High memory usage: ${memoryPercentage}%`,
    });
    overallStatus = 'unhealthy';
  } else {
    checks.push({
      name: 'memory',
      status: 'pass',
      duration: 0,
    });
  }

  const healthCheck: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbStatus,
      memory: {
        used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
        total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
        percentage: memoryPercentage,
      },
    },
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
}));

// Detailed health check with more comprehensive tests
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks: HealthCheck['checks'] = [];
  let overallStatus: 'healthy' | 'unhealthy' = 'healthy';

  // Database connectivity and basic operations
  const dbCheckStart = Date.now();
  let dbStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Test a simple query
    const clinicCount = await prisma.clinic.count();
    
    dbStatus = 'connected';
    checks.push({
      name: 'database_connectivity',
      status: 'pass',
      duration: Date.now() - dbCheckStart,
      message: `Connected. ${clinicCount} clinics in database.`,
    });
  } catch (error) {
    dbStatus = 'error';
    overallStatus = 'unhealthy';
    checks.push({
      name: 'database_connectivity',
      status: 'fail',
      duration: Date.now() - dbCheckStart,
      message: error instanceof Error ? error.message : 'Unknown database error',
    });
  }

  // Environment variables check
  const envCheckStart = Date.now();
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    checks.push({
      name: 'environment_variables',
      status: 'fail',
      duration: Date.now() - envCheckStart,
      message: `Missing required environment variables: ${missingEnvVars.join(', ')}`,
    });
    overallStatus = 'unhealthy';
  } else {
    checks.push({
      name: 'environment_variables',
      status: 'pass',
      duration: Date.now() - envCheckStart,
    });
  }

  // Memory usage check
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

  if (memoryPercentage > 80) {
    checks.push({
      name: 'memory_usage',
      status: 'fail',
      duration: 0,
      message: `High memory usage: ${memoryPercentage}%`,
    });
    overallStatus = 'unhealthy';
  } else {
    checks.push({
      name: 'memory_usage',
      status: 'pass',
      duration: 0,
      message: `Memory usage: ${memoryPercentage}%`,
    });
  }

  // Disk space check (simplified)
  const diskCheckStart = Date.now();
  try {
    const stats = await import('fs').then(fs => fs.promises.stat('.'));
    checks.push({
      name: 'disk_access',
      status: 'pass',
      duration: Date.now() - diskCheckStart,
    });
  } catch (error) {
    checks.push({
      name: 'disk_access',
      status: 'fail',
      duration: Date.now() - diskCheckStart,
      message: 'Cannot access disk',
    });
    overallStatus = 'unhealthy';
  }

  const healthCheck: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbStatus,
      memory: {
        used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
        total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
        percentage: memoryPercentage,
      },
    },
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
}));

// Readiness probe (for Kubernetes/Docker)
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if database is ready
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

// Liveness probe (for Kubernetes/Docker)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

export default router;