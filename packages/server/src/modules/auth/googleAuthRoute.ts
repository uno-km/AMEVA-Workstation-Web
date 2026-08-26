import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { getDb } from '../../db/client.js';
import { users } from '../../db/schema.js';

const syncUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  googleId: z.string().optional(),
  picture: z.string().url().optional(),
});

export async function registerAuthRoutes(fastify: FastifyInstance) {
  // Sync Google Account profile to PostgreSQL
  fastify.post('/api/auth/sync-user', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = syncUserSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ error: 'Invalid User Payload', details: parse.error.errors });
    }

    const { email, name, googleId, picture } = parse.data;

    try {
      const db = getDb();
      const [upserted] = await db
        .insert(users)
        .values({ email, name, googleId, picture })
        .onConflictDoUpdate({
          target: users.email,
          set: { name, googleId, picture, updatedAt: new Date() },
        })
        .returning();

      return {
        status: 'synced',
        user: {
          id: upserted.id,
          email: upserted.email,
          name: upserted.name,
          role: upserted.role,
        },
      };
    } catch (err: any) {
      return reply.code(500).send({
        error: 'Database Sync Failed',
        message: err.message || 'PostgreSQL unavailable',
      });
    }
  });

  // Google Drive Push Webhook Receiver
  fastify.post('/api/auth/drive-webhook', async (req: FastifyRequest) => {
    const channelId = req.headers['x-goog-channel-id'];
    const resourceState = req.headers['x-goog-resource-state'];

    return {
      received: true,
      channelId,
      resourceState,
      timestamp: new Date().toISOString(),
    };
  });
}
