import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { env } from '../config/env.js';

let queryClient: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    queryClient = postgres(env.DATABASE_URL, {
      max: env.NODE_ENV === 'production' ? 10 : 5,
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {},
    });
    dbInstance = drizzle(queryClient, { schema });
  }
  return dbInstance;
}

export async function checkDbHealth(): Promise<{ status: 'healthy' | 'degraded'; message: string }> {
  try {
    const db = getDb();
    if (!queryClient) {
      return { status: 'degraded', message: 'DB client not initialized' };
    }
    await queryClient`SELECT 1`;
    return { status: 'healthy', message: 'PostgreSQL connection active' };
  } catch (error: any) {
    return {
      status: 'degraded',
      message: `PostgreSQL offline (running with in-memory Sentinel/Yjs buffer): ${error.message || 'connection failed'}`
    };
  }
}
