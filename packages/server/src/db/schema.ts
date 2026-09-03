import { pgTable, text, varchar, timestamp, integer, uuid, jsonb } from 'drizzle-orm/pg-core';

// 1. Users & OAuth Identity
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  googleId: varchar('google_id', { length: 255 }),
  picture: text('picture'),
  role: varchar('role', { length: 50 }).default('editor').notNull(), // admin, editor, viewer
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Real-time Collaborative Rooms
export const collaborationRooms = pgTable('collaboration_rooms', {
  id: varchar('id', { length: 128 }).primaryKey(), // docId / room slug
  title: varchar('title', { length: 255 }).notNull().default('Untitled Document'),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  activeConnections: integer('active_connections').default(0).notNull(),
  isEncrypted: integer('is_encrypted').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Document CRDT State Snapshots
export const documentSnapshots = pgTable('document_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: varchar('room_id', { length: 128 }).notNull().references(() => collaborationRooms.id, { onDelete: 'cascade' }),
  binaryState: text('binary_state').notNull(), // Base64-encoded Yjs Vector State
  contentPreview: text('content_preview'),     // Markdown / Plaintext search preview
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. AMEVA Sentinel Tamper-Evident Audit Logs
export const sentinelAuditLogs = pgTable('sentinel_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  traceId: varchar('trace_id', { length: 64 }).notNull(),
  actor: varchar('actor', { length: 255 }).default('anonymous').notNull(),
  action: varchar('action', { length: 100 }).notNull(), // AUTH_LOGIN, WS_CONNECT, CONVERT_DOC, EXPORT_ADC
  resource: varchar('resource', { length: 255 }).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  riskScore: integer('risk_score').default(0).notNull(), // 0 to 100
  decision: varchar('decision', { length: 32 }).default('ALLOW').notNull(), // ALLOW, CHALLENGE, BLOCK
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. AMEVA Sentinel Risk Events
export const sentinelRiskEvents = pgTable('sentinel_risk_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  traceId: varchar('trace_id', { length: 64 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(), // RATE_LIMIT_EXCEEDED, INVALID_NONCE, REPLAY_ATTACK
  severity: varchar('severity', { length: 32 }).default('INFO').notNull(), // INFO, LOW, MEDIUM, HIGH, CRITICAL
  signals: jsonb('signals'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
