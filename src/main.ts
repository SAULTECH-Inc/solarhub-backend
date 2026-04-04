import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3001);
  const prefix = config.get<string>('app.apiPrefix', 'api/v1');
  const origins = config.get<string[]>('app.allowedOrigins', ['http://localhost:5173', 'http://localhost:3002', 'http://localhost:3001', 'http://localhost:3000']);

  // ── Security ──────────────────────────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  // ── CORS ──────────────────────────────────────────────────
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow Postman, curl

      const allowed = origins.includes(origin);
      callback(null, allowed);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*', // 👈 IMPORTANT
    credentials: true,
  });

  // ── Global prefix & versioning ────────────────────────────
  app.setGlobalPrefix(prefix);
  app.enableVersioning({ type: VersioningType.URI });

  // ── Static files (uploaded images fallback) ───────────────
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  // ── Global pipes & filters ────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ── Swagger ───────────────────────────────────────────────
  if (config.get('app.nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SolarHub API')
      .setDescription('SolarHub Nigeria — Solar Marketplace Backend API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addTag('Auth', 'Authentication & OAuth')
      .addTag('Users', 'User management')
      .addTag('Products', 'Product listings')
      .addTag('Categories', 'Product categories')
      .addTag('Cart', 'Shopping cart')
      .addTag('Orders', 'Orders & checkout')
      .addTag('Payments', 'Payment processing')
      .addTag('Delivery', 'Delivery & tracking')
      .addTag('Chat', 'Customer support chat')
      .addTag('Advisor', 'Solar system advisor')
      .addTag('Reviews', 'Product reviews')
      .addTag('Favourites', 'Saved products')
      .addTag('Uploads', 'File uploads')
      .addTag('Notifications', 'User notifications')
      .addTag('Admin', 'Admin operations')
      .addServer(`http://localhost:${port}`)
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger docs → http://localhost:${port}/docs`);
  }

  await app.listen(port);
  logger.log(`🌞 SolarHub API running on http://localhost:${port}/${prefix}`);
  logger.log(`📦 Environment: ${config.get('app.nodeEnv')}`);
}

bootstrap().catch(err => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
