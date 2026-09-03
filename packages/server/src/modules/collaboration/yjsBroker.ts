import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { getDb } from '../../db/client.js';
import { collaborationRooms, documentSnapshots } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { SentinelGuard } from '../../middlewares/sentinelGuard.js';

interface Room {
  name: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Set<WebSocket>;
  lastSavedAt: number;
}

const messageSync = 0;
const messageAwareness = 1;

class CollaborationHub {
  private rooms = new Map<string, Room>();

  getOrCreateRoom(roomName: string): Room {
    let room = this.rooms.get(roomName);
    if (!room) {
      const doc = new Y.Doc();
      const awareness = new awarenessProtocol.Awareness(doc);

      room = {
        name: roomName,
        doc,
        awareness,
        conns: new Set(),
        lastSavedAt: Date.now(),
      };

      // Listen to doc updates and broadcast to all connected peers in the room
      doc.on('update', (update: Uint8Array, origin: any) => {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeUpdate(encoder, update);
        const message = encoding.toUint8Array(encoder);

        room!.conns.forEach((client) => {
          if (client !== origin && client.readyState === 1) { // 1 = OPEN
            client.send(message);
          }
        });

        // Trigger periodic DB snapshot debounce (every 30 seconds of activity)
        if (Date.now() - room!.lastSavedAt > 30_000) {
          this.persistSnapshot(roomName, doc).catch(() => {});
          room!.lastSavedAt = Date.now();
        }
      });

      // Awareness (Presence / Cursors) changes
      awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
        const changedClients = added.concat(updated, removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
        );
        const buff = encoding.toUint8Array(encoder);

        room!.conns.forEach((client) => {
          if (client !== origin && client.readyState === 1) {
            client.send(buff);
          }
        });
      });

      this.rooms.set(roomName, room);
    }
    return room;
  }

  async persistSnapshot(roomName: string, doc: Y.Doc) {
    try {
      const db = getDb();
      const stateVector = Y.encodeStateAsUpdate(doc);
      const base64State = Buffer.from(stateVector).toString('base64');
      const textPreview = doc.getText('markdown').toString().slice(0, 1000);

      // Ensure room exists in DB
      await db
        .insert(collaborationRooms)
        .values({
          id: roomName,
          title: `Document ${roomName}`,
          activeConnections: this.rooms.get(roomName)?.conns.size || 0,
        })
        .onConflictDoUpdate({
          target: collaborationRooms.id,
          set: {
            activeConnections: this.rooms.get(roomName)?.conns.size || 0,
            updatedAt: new Date(),
          },
        });

      // Save snapshot version
      await db.insert(documentSnapshots).values({
        roomId: roomName,
        binaryState: base64State,
        contentPreview: textPreview,
      });
    } catch {
      // In-memory fallback if DB is offline
    }
  }

  handleConnection(ws: WebSocket, roomName: string, traceId: string) {
    const room = this.getOrCreateRoom(roomName);
    room.conns.add(ws);

    // 1. Send SyncStep1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, room.doc);
    ws.send(encoding.toUint8Array(encoder));

    // 2. Send current awareness states
    const awarenessStates = room.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, messageAwareness);
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(
          room.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      ws.send(encoding.toUint8Array(awarenessEncoder));
    }

    // 3. Receive client messages
    ws.on('message', (message: ArrayBuffer | Buffer) => {
      try {
        const uint8Array = new Uint8Array(message as any);
        const decoder = decoding.createDecoder(uint8Array);
        const messageType = decoding.readVarUint(decoder);

        if (messageType === messageSync) {
          const syncEncoder = encoding.createEncoder();
          encoding.writeVarUint(syncEncoder, messageSync);
          syncProtocol.readSyncMessage(decoder, syncEncoder, room.doc, ws);
          if (encoding.length(syncEncoder) > 1) {
            ws.send(encoding.toUint8Array(syncEncoder));
          }
        } else if (messageType === messageAwareness) {
          awarenessProtocol.applyAwarenessUpdate(
            room.awareness,
            decoding.readVarUint8Array(decoder),
            ws
          );
        }
      } catch (err) {
        // Safe message ignore on malformed payload
      }
    });

    ws.on('close', () => {
      room.conns.delete(ws);
      if (room.conns.size === 0) {
        // Last user left: persist final snapshot
        this.persistSnapshot(roomName, room.doc).catch(() => {});
      }
    });
  }

  getRoomStats() {
    return Array.from(this.rooms.entries()).map(([name, room]) => ({
      room: name,
      activeUsers: room.conns.size,
    }));
  }
}

export const collaborationHub = new CollaborationHub();

export async function registerCollaborationRoutes(fastify: FastifyInstance) {
  // WebSocket endpoint: /ws/collaborate/:roomId
  fastify.get('/ws/collaborate/:roomId', { websocket: true }, (connection: any, req) => {
    const { roomId } = req.params as { roomId: string };
    const traceId = SentinelGuard.generateTraceId();
    const ws: WebSocket = connection.socket || connection;

    collaborationHub.handleConnection(ws, roomId, traceId);
  });

  // REST Room Metrics endpoint
  fastify.get('/api/collaboration/rooms', async () => {
    return {
      status: 'active',
      rooms: collaborationHub.getRoomStats(),
    };
  });
}
