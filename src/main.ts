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

function swaggerUiHtml() {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Solar Maket API</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css">
    <style>body{margin:0}.topbar{display:none}</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: '/docs-json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout',
          persistAuthorization: true,
          deepLinking: true,
          tryItOutEnabled: true,
        });
      };
    </script>
  </body>
</html>`;
}

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
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        styleSrc:    ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        imgSrc:      ["'self'", 'data:', 'blob:'],
        connectSrc:  ["'self'"],
        fontSrc:     ["'self'", 'data:', 'https://unpkg.com'],
      },
    },
  }));
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
  if (process.env.SWAGGER_ENABLED === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Solar Maket API')
      .setDescription('Solar Maket Nigeria — Solar Marketplace Backend API')
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

    // Bypass NestJS static-file middleware (missing from serverless bundles).
    // Register raw Express routes: /docs-json for the spec, /docs for CDN-hosted UI.
    const expressApp = app.getHttpAdapter().getInstance() as any;
    expressApp.get('/docs-json', (_req: any, res: any) => res.json(document));
    expressApp.get('/docs', (_req: any, res: any) => res.send(swaggerUiHtml()));

    logger.log(`Swagger docs → http://localhost:${port}/docs`);
  }

  await app.listen(port);
  logger.log(`🌞 Solar Maket API running on http://localhost:${port}/${prefix}`);
  logger.log(`📦 Environment: ${config.get('app.nodeEnv')}`);
}

bootstrap().catch(err => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
