import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';

const statusSchema = z.enum(['pending', 'approved', 'rejected']);
const messageSchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  body: z.string().trim().min(1).max(2000),
  visibility: z.enum(['public', 'private']).default('public'),
}).strict();
const cursorSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export function createGuestbook(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, 'guestbook.sqlite');
  function use(fn) {
    const db = new DatabaseSync(file);
    try { return fn(db); } finally { db.close(); }
  }
  use(db => db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL, body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    createdAt TEXT NOT NULL, reviewedAt TEXT
  ); CREATE INDEX IF NOT EXISTS messages_status_id ON messages(status, id);`));
  use(db => {
    if (!db.prepare('PRAGMA table_info(messages)').all().some(column => column.name === 'visibility')) {
      db.exec("ALTER TABLE messages ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','private'))");
    }
  });
  use(db => {
    const columns = db.prepare('PRAGMA table_info(messages)').all();
    if (!columns.some(c => c.name === 'reply')) db.exec("ALTER TABLE messages ADD COLUMN reply TEXT NOT NULL DEFAULT ''");
    if (!columns.some(c => c.name === 'repliedAt')) db.exec('ALTER TABLE messages ADD COLUMN repliedAt TEXT');
  });
  fs.chmodSync(file, 0o600);
  return {
    submit(input) {
      const { nickname, body, visibility } = messageSchema.parse(input);
      return use(db => {
        db.prepare('INSERT INTO messages (nickname, body, createdAt, visibility) VALUES (?, ?, ?, ?)')
          .run(nickname, body, new Date().toISOString(), visibility);
        return { status: 'pending', message: visibility === 'public' ? '留言已提交，审核通过后会展示在这里。' : '留言已提交，仅管理员可见，不会公开展示。' };
      });
    },
    list({ status = 'approved', before, privateFields = false } = {}) {
      if (privateFields) z.enum(['all', 'pending', 'approved', 'rejected']).parse(status);
      else statusSchema.parse(status);
      const cursor = before === undefined ? Number.MAX_SAFE_INTEGER : cursorSchema.parse(before);
      const fields = privateFields ? '*' : 'id, nickname, body, createdAt, reply, repliedAt';
      const all = privateFields && status === 'all';
      const rows = use(db => db.prepare(`SELECT ${fields} FROM messages WHERE ${all ? '1 = 1' : 'status = ?'} ${privateFields ? '' : "AND visibility = 'public' AND status = 'approved'"} AND id < ? ORDER BY id DESC LIMIT 21`).all(...(all ? [cursor] : [status, cursor])));
      const items = rows.slice(0, 20);
      return { items, nextCursor: rows.length > 20 ? items.at(-1).id : null };
    },
    reply(id, input) {
      const messageId = cursorSchema.parse(id);
      const { reply } = z.object({ reply: z.string().trim().max(2000) }).strict().parse(input);
      const result = use(db => db.prepare('UPDATE messages SET reply = ?, repliedAt = ? WHERE id = ?').run(reply, reply ? new Date().toISOString() : null, messageId));
      if (!result.changes) throw Object.assign(new Error('留言不存在'), { status: 404 });
      return { ok: true };
    },
    remove(id) {
      const messageId = cursorSchema.parse(id);
      const result = use(db => db.prepare('DELETE FROM messages WHERE id = ?').run(messageId));
      if (!result.changes) throw Object.assign(new Error('留言不存在'), { status: 404 });
      return { ok: true };
    },
    moderate(id, input) {
      const messageId = cursorSchema.parse(id);
      const { status } = z.object({ status: statusSchema }).strict().parse(input);
      const result = use(db => db.prepare('UPDATE messages SET status = ?, reviewedAt = ? WHERE id = ?').run(status, new Date().toISOString(), messageId));
      if (!result.changes) throw Object.assign(new Error('留言不存在'), { status: 404 });
      return { ok: true };
    },
  };
}

// Bounded memory, no persisted IPs. Origin validation does not replace this limit.
export function submissionLimiter(getIp, now = Date.now) {
  const windowMs = 15 * 60_000;
  let expires = 0, total = 0;
  const attempts = new Map();
  return (req, res, next) => {
    const time = now();
    if (time >= expires) { attempts.clear(); total = 0; expires = time + windowMs; }
    const key = getIp(req);
    const count = attempts.get(key) ?? 0;
    if (total >= 100 || count >= 5) {
      res.set('Retry-After', String(Math.ceil((expires - time) / 1000)));
      return res.status(429).json({ error: '提交过于频繁，请稍后再试。' });
    }
    total++;
    attempts.set(key, count + 1);
    next();
  };
}
