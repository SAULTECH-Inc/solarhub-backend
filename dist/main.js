"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const compression = require("compression");
const helmet_1 = require("helmet");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
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
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });
    const config = app.get(config_1.ConfigService);
    const port = config.get('app.port', 3001);
    const prefix = config.get('app.apiPrefix', 'api/v1');
    const origins = config.get('app.allowedOrigins', ['http://localhost:5173', 'http://localhost:3002', 'http://localhost:3001', 'http://localhost:3000']);
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
                imgSrc: ["'self'", 'data:', 'blob:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", 'data:', 'https://unpkg.com'],
            },
        },
    }));
    app.use(compression());
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            const allowed = origins.includes(origin);
            callback(null, allowed);
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: '*',
        credentials: true,
    });
    app.setGlobalPrefix(prefix);
    app.enableVersioning({ type: common_1.VersioningType.URI });
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'uploads'), { prefix: '/uploads' });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new transform_interceptor_1.TransformInterceptor());
    if (process.env.SWAGGER_ENABLED === 'true') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
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
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        const expressApp = app.getHttpAdapter().getInstance();
        expressApp.get('/docs-json', (_req, res) => res.json(document));
        expressApp.get('/docs', (_req, res) => res.send(swaggerUiHtml()));
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
//# sourceMappingURL=main.js.map