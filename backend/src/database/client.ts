import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Create a singleton instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connect to database on startup
prisma.$connect()
  .then(() => {
    logger.info('🗄️  Database connection established');
  })
  .catch((error) => {
    logger.error('❌ Failed to connect to database:', error);
    process.exit(1);
  });

export default prisma;