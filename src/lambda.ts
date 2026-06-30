/**
 * Vercel serverless entry-point.
 * `nest build` compiles this to dist/lambda.js with all path aliases resolved.
 *
 * Limitations on Vercel serverless:
 *  - Socket.IO (Chat) does NOT work — no WebSocket upgrades
 *  - Bull queue workers do NOT run — jobs queue but never process
 *  - All REST API endpoints work normally
 */
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';

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

let cachedApp: NestExpressApplication;

async function getApp(): Promise<NestExpressApplication> {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const cfg = app.get(ConfigService);
  const prefix  = cfg.get<string>('app.apiPrefix', 'api/v1');
  const origins = cfg.get<string[]>('app.allowedOrigins', []);

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

  app.enableCors({
    origin: (origin: string | undefined, cb: (e: Error | null, ok?: boolean) => void) => {
      if (!origin) return cb(null, true);            // non-browser / server calls
      if (!origins.filter(Boolean).length) return cb(null, true); // no allow-list configured
      cb(null, origins.includes(origin));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    credentials: true,
  });

  app.setGlobalPrefix(prefix);
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Register BEFORE app.init() — NestJS registers its catch-all "not found"
  // handler during init(), so any Express route added after is unreachable.
  if (process.env.SWAGGER_ENABLED === 'true') {
    const swaggerCfg = new DocumentBuilder()
      .setTitle('Solar Maket API')
      .setDescription('Solar Maket Nigeria — Solar Marketplace Backend API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addServer('https://solarhub-backend.vercel.app')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerCfg);
    const expressApp = app.getHttpAdapter().getInstance() as any;
    expressApp.get('/docs-json', (_req: any, res: any) => res.json(document));
    expressApp.get('/docs', (_req: any, res: any) => res.send(swaggerUiHtml()));
  }

  await app.init();
  cachedApp = app;
  return app;
}

module.exports = async (req: IncomingMessage, res: ServerResponse) => {
  const app = await getApp();
  const expressApp = app.getHttpAdapter().getInstance() as (
    req: IncomingMessage,
    res: ServerResponse,
  ) => void;
  expressApp(req, res);
};
