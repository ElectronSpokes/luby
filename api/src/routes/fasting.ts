import { Hono } from 'hono';
import { sql } from '../db/client';
import type { AppEnv } from '../types';

export const fastingRoutes = new Hono<AppEnv>();

fastingRoutes.get('/', async (c) => {
  const userId = c.get('auth').userId;

  const sessions = await sql`
    SELECT * FROM fasting_sessions
    WHERE user_id = ${userId}
    ORDER BY start_time DESC
    LIMIT 50
  `;

  return c.json(sessions);
});

// Get active session
fastingRoutes.get('/active', async (c) => {
  const userId = c.get('auth').userId;

  const [session] = await sql`
    SELECT * FROM fasting_sessions
    WHERE user_id = ${userId} AND status = 'active'
    ORDER BY start_time DESC
    LIMIT 1
  `;

  return c.json(session || null);
});

fastingRoutes.post('/', async (c) => {
  const userId = c.get('auth').userId;
  const body = await c.req.json();
  const { startTime, targetDuration } = body;

  const [session] = await sql`
    INSERT INTO fasting_sessions (user_id, start_time, target_duration, status)
    VALUES (${userId}, ${startTime || Date.now()}, ${targetDuration}, 'active')
    RETURNING *
  `;

  return c.json(session, 201);
});

// Complete a fasting session
fastingRoutes.put('/:id/complete', async (c) => {
  const userId = c.get('auth').userId;
  const id = c.req.param('id');

  const [session] = await sql`
    UPDATE fasting_sessions
    SET status = 'completed', end_time = ${Date.now()}
    WHERE id = ${id} AND user_id = ${userId} AND status = 'active'
    RETURNING *
  `;

  if (!session) {
    return c.json({ error: 'Not found or already completed' }, 404);
  }

  return c.json(session);
});

fastingRoutes.delete('/:id', async (c) => {
  const userId = c.get('auth').userId;
  const id = c.req.param('id');

  const result = await sql`
    DELETE FROM fasting_sessions WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `;

  if (result.length === 0) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json({ deleted: true });
});
