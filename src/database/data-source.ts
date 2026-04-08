import 'reflect-metadata';
import * as path from 'path';
import { DataSource } from 'typeorm';

// Resolve .env relative to the project root (two levels up from src/database/)
const envPath = path.resolve(process.cwd(), '.env');
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: envPath });
} catch {
  // dotenv is optional — fall back to process.env if not available
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT   || '5432', 10),
  username: process.env.DB_USER     || 'mac',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'solarhub',
  synchronize: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  url: process.env.DB_URL, // Optional: override with a full connection string
  logging: true,
  entities:   [path.join(__dirname, '../modules/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, './migrations/*{.ts,.js}')],
  subscribers: [],
});
