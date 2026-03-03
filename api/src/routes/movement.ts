import { Hono } from 'hono';
import { sql } from '../db/client';
import type { AppEnv } from '../types';

export const movementRoutes = new Hono<AppEnv>();

movementRoutes.get('/', async (c) => {
  const userId = c.get('auth').userId;
  const from = c.req.query('from');
  const to = c.req.query('to');

  let entries;
  if (from && to) {
    entries = await sql`
      SELECT * FROM movement_entries
      WHERE user_id = ${userId} AND timestamp >= ${Number(from)} AND timestamp <= ${Number(to)}
      ORDER BY timestamp DESC
    `;
  } else {
    entries = await sql`
      SELECT * FROM movement_entries
      WHERE user_id = ${userId}
      ORDER BY timestamp DESC
      LIMIT 100
    `;
  }

  return c.json(entries);
});

movementRoutes.post('/', async (c) => {
  const userId = c.get('auth').userId;
  const body = await c.req.json();
  const { type, duration, intensity, timestamp } = body;

  const [entry] = await sql`
    INSERT INTO movement_entries (user_id, type, duration, intensity, timestamp)
    VALUES (${userId}, ${type}, ${duration}, ${intensity || 'medium'}, ${timestamp || Date.now()})
    RETURNING *
  `;

  return c.json(entry, 201);
});

movementRoutes.delete('/:id', async (c) => {
  const userId = c.get('auth').userId;
  const id = c.req.param('id');

  const result = await sql`
    DELETE FROM movement_entries WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `;

  if (result.length === 0) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json({ deleted: true });
});
