"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const path = require("path");
const typeorm_1 = require("typeorm");
const envPath = path.resolve(process.cwd(), '.env');
try {
    require('dotenv').config({ path: envPath });
}
catch {
}
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'mac',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'solarhub',
    synchronize: false,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    url: process.env.DB_URL,
    logging: true,
    entities: [path.join(__dirname, '../modules/**/*.entity{.ts,.js}')],
    migrations: [path.join(__dirname, './migrations/*{.ts,.js}')],
    subscribers: [],
});
//# sourceMappingURL=data-source.js.map