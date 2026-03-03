import { Hono } from 'hono';
import { sql } from '../db/client';
import type { AppEnv } from '../types';

export const chatRoutes = new Hono<AppEnv>();

// GET /chat - get chat history
chatRoutes.get('/', async (c) => {
  const userId = c.get('auth').userId;
  const limit = Number(c.req.query('limit') || 50);

  const messages = await sql`
    SELECT * FROM chat_messages
    WHERE user_id = ${userId}
    ORDER BY timestamp ASC
    LIMIT ${limit}
  `;

  return c.json(messages);
});

// POST /chat - save a chat message
chatRoutes.post('/', async (c) => {
  const userId = c.get('auth').userId;
  const body = await c.req.json();
  const { role, content, timestamp } = body;

  const [message] = await sql`
    INSERT INTO chat_messages (user_id, role, content, timestamp)
    VALUES (${userId}, ${role}, ${content}, ${timestamp || Date.now()})
    RETURNING *
  `;

  return c.json(message, 201);
});

// DELETE /chat - clear chat history
chatRoutes.delete('/', async (c) => {
  const userId = c.get('auth').userId;

  await sql`DELETE FROM chat_messages WHERE user_id = ${userId}`;

  return c.json({ deleted: true });
});
