import dotenv from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env from packages/server or root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/ameva_dev'),
  SENTINEL_SECRET: z.string().default('ameva-sentinel-default-sec-key-change-in-prod'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,https://*.vercel.app'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(100),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
