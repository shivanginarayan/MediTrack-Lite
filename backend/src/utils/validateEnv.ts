import Joi from 'joi';
import { logger } from './logger';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  API_VERSION: Joi.string().default('v1'),
  
  // Database
  DATABASE_URL: Joi.string().uri().required(),
  
  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  
  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // Email
  SMTP_HOST: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  SMTP_PASS: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  FROM_EMAIL: Joi.string().email().default('noreply@meditrack.com'),
  FROM_NAME: Joi.string().default('MediTrack Lite'),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('logs/app.log'),
  
  // File Upload
  MAX_FILE_SIZE: Joi.number().default(5242880), // 5MB
  UPLOAD_PATH: Joi.string().default('uploads/'),
  
  // Demo Mode
  DEMO_MODE: Joi.boolean().default(false),
  DEMO_USER_EMAIL: Joi.string().email().default('demo@meditrack.com'),
}).unknown();

export function validateEnv(): void {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    logger.error('❌ Invalid environment configuration:', error.details);
    throw new Error(`Environment validation failed: ${error.message}`);
  }
  
  // Update process.env with validated and default values
  Object.assign(process.env, value);
  
  logger.info('✅ Environment configuration validated successfully');
}

export default validateEnv;