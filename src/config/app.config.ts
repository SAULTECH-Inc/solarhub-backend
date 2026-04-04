import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv:      process.env.NODE_ENV || 'development',
  port:         parseInt(process.env.PORT, 10) || 3001,
  apiPrefix:    process.env.API_PREFIX || 'api/v1',
  frontendUrl:  process.env.FRONTEND_URL || 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(','),
  maxUploadMb:  parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 10,
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'NGN',
  supportedCurrencies: (process.env.SUPPORTED_CURRENCIES || 'NGN,USD,CNY,GHS').split(','),
}));

export const dbConfig = registerAs('database', () => ({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'solarhub',
  sync:     process.env.DB_SYNC === 'true',
  logging:  process.env.DB_LOGGING === 'true',
}));

export const redisConfig = registerAs('redis', () => ({
  host:     process.env.REDIS_HOST || 'localhost',
  port:     parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  ttl:      parseInt(process.env.REDIS_TTL, 10) || 3600,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret:          process.env.JWT_SECRET,
  expiresIn:       process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret:   process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn:process.env.JWT_REFRESH_EXPIRES_IN || '30d',
}));

export const googleConfig = registerAs('google', () => ({
  clientId:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackUrl:  process.env.GOOGLE_CALLBACK_URL,
}));

export const anthropicConfig = registerAs('anthropic', () => ({
  apiKey:       process.env.ANTHROPIC_API_KEY,
  model:        process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
  advisorModel: process.env.CLAUDE_ADVISOR_MODEL || 'claude-sonnet-4-6',
}));

export const openaiConfig = registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  model:  process.env.OPENAI_MODEL || 'gpt-4o-mini',
}));

export const emailConfig = registerAs('email', () => ({
  host:      process.env.SMTP_HOST,
  port:      parseInt(process.env.SMTP_PORT, 10) || 587,
  user:      process.env.SMTP_USER,
  pass:      process.env.SMTP_PASS,
  fromName:  process.env.SMTP_FROM_NAME || 'SolarHub',
  fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@solarhub.ng',
}));

export const paystackConfig = registerAs('paystack', () => ({
  secretKey:     process.env.PAYSTACK_SECRET_KEY,
  publicKey:     process.env.PAYSTACK_PUBLIC_KEY,
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
}));

export const stripeConfig = registerAs('stripe', () => ({
  secretKey:     process.env.STRIPE_SECRET_KEY,
  publicKey:     process.env.STRIPE_PUBLIC_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
}));

export const cloudinaryConfig = registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey:    process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl:   parseInt(process.env.THROTTLE_TTL, 10) || 60,
  limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
}));
