import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Extend PrismaClient with custom methods if needed
class ExtendedPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query', (e) => {
        logger.debug('Query: ' + e.query);
        logger.debug('Params: ' + e.params);
        logger.debug('Duration: ' + e.duration + 'ms');
      });
    }

    this.$on('error', (e) => {
      logger.error('Database error:', e);
    });

    this.$on('warn', (e) => {
      logger.warn('Database warning:', e);
    });

    this.$on('info', (e) => {
      logger.info('Database info:', e);
    });
  }

  async onModuleInit() {
    await this.$connect();
    logger.info('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    logger.info('❌ Database disconnected');
  }
}

// Create a singleton instance
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new ExtendedPrismaClient();

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