import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const convertTextSchema = z.object({
  content: z.string(),
  sourceFormat: z.enum(['markdown', 'txt', 'html', 'json']).default('markdown'),
  targetFormat: z.enum(['html', 'plain', 'outline']).default('html'),
});

export async function registerConverterRoutes(fastify: FastifyInstance) {
  fastify.post('/api/converter/text', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = convertTextSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'Invalid Request Body',
        details: parseResult.error.errors,
      });
    }

    const { content, sourceFormat, targetFormat } = parseResult.data;

    // Fast In-Memory Stream Transformation
    if (targetFormat === 'outline') {
      const headings = content
        .split('\n')
        .filter((line) => line.startsWith('#'))
        .map((line) => {
          const level = line.match(/^#+/)?.[0].length || 1;
          const text = line.replace(/^#+\s*/, '').trim();
          return { level, text };
        });

      return {
        format: 'outline',
        length: content.length,
        headings,
      };
    }

    // Default plain text extractor / cleaner
    const cleaned = content.replace(/<[^>]*>?/gm, '');

    return {
      sourceFormat,
      targetFormat,
      convertedLength: cleaned.length,
      result: cleaned,
    };
  });
}
