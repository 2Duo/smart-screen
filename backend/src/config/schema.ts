import { z } from 'zod';

// Environment validation schema
export const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),
  
  // Frontend configuration
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  // OpenWeatherMap API configuration
  OPENWEATHER_API_KEY: z.string().min(1, 'OpenWeatherMap API key is required'),
  OPENWEATHER_BASE_URL: z.string().url().default('https://api.openweathermap.org/data/2.5'),
  DEFAULT_CITY: z.string().default('Tokyo'),
  
  // Google OAuth configuration
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  GOOGLE_REDIRECT_URI: z.string().url().default('http://localhost:3001/api/calendar/callback'),
  
  // AWS Secrets Manager configuration (optional)
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SECRETS_MANAGER_SECRET_NAME: z.string().optional(),
  
  // Security configuration
  CORS_ORIGIN: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters').optional(),
  
  // Logging and monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_REQUEST_LOGGING: z.string().transform(val => val === 'true').default('false'),
});

// Configuration types
export type EnvConfig = z.infer<typeof envSchema>;

// Validation error type
export class ConfigValidationError extends Error {
  constructor(message: string, public details: z.ZodError) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

// Required secrets for different environments
export const requiredSecrets = {
  development: ['OPENWEATHER_API_KEY'],
  staging: ['OPENWEATHER_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  production: ['OPENWEATHER_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'JWT_SECRET'],
} as const;

// Sensitive field list (for logging/debugging purposes)
export const sensitiveFields = [
  'OPENWEATHER_API_KEY',
  'GOOGLE_CLIENT_SECRET',
  'AWS_SECRET_ACCESS_KEY',
  'JWT_SECRET',
] as const;