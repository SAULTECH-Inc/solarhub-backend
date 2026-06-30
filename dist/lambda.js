"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
void [require('firebase-admin/app'), require('firebase-admin/messaging')];
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const compression = require("compression");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
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
let cachedApp;
async function getApp() {
    if (cachedApp)
        return cachedApp;
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    const cfg = app.get(config_1.ConfigService);
    const prefix = cfg.get('app.apiPrefix', 'api/v1');
    const origins = cfg.get('app.allowedOrigins', []);
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
        origin: (origin, cb) => {
            if (!origin)
                return cb(null, true);
            cb(null, origins.includes(origin));
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: '*',
        credentials: true,
    });
    app.setGlobalPrefix(prefix);
    app.enableVersioning({ type: common_1.VersioningType.URI });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    if (process.env.SWAGGER_ENABLED === 'true') {
        const swaggerCfg = new swagger_1.DocumentBuilder()
            .setTitle('Solar Maket API')
            .setDescription('Solar Maket Nigeria — Solar Marketplace Backend API')
            .setVersion('1.0')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
            .addServer('https://solarhub-backend.vercel.app')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerCfg);
        const expressApp = app.getHttpAdapter().getInstance();
        expressApp.get('/docs-json', (_req, res) => res.json(document));
        expressApp.get('/docs', (_req, res) => res.send(swaggerUiHtml()));
    }
    await app.init();
    cachedApp = app;
    return app;
}
module.exports = async (req, res) => {
    const app = await getApp();
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp(req, res);
};
//# sourceMappingURL=lambda.js.map