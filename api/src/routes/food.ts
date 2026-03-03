import { Hono } from 'hono';
import { sql } from '../db/client';
import type { AppEnv } from '../types';

export const foodRoutes = new Hono<AppEnv>();

// GET /food - list food entries (today by default)
foodRoutes.get('/', async (c) => {
  const userId = c.get('auth').userId;
  const from = c.req.query('from');
  const to = c.req.query('to');

  let entries;
  if (from && to) {
    entries = await sql`
      SELECT * FROM food_entries
      WHERE user_id = ${userId} AND timestamp >= ${Number(from)} AND timestamp <= ${Number(to)}
      ORDER BY timestamp DESC
    `;
  } else {
    entries = await sql`
      SELECT * FROM food_entries
      WHERE user_id = ${userId}
      ORDER BY timestamp DESC
      LIMIT 100
    `;
  }

  return c.json(entries);
});

// POST /food - create food entry
foodRoutes.post('/', async (c) => {
  const userId = c.get('auth').userId;
  const body = await c.req.json();
  const { name, calories, protein, fiber, carbs, fat, sugar, timestamp } = body;

  const [entry] = await sql`
    INSERT INTO food_entries (user_id, name, calories, protein, fiber, carbs, fat, sugar, timestamp)
    VALUES (${userId}, ${name}, ${calories || 0}, ${protein || 0}, ${fiber || 0}, ${carbs || 0}, ${fat || 0}, ${sugar || 0}, ${timestamp || Date.now()})
    RETURNING *
  `;

  return c.json(entry, 201);
});

// DELETE /food/:id
foodRoutes.delete('/:id', async (c) => {
  const userId = c.get('auth').userId;
  const id = c.req.param('id');

  const result = await sql`
    DELETE FROM food_entries WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `;

  if (result.length === 0) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json({ deleted: true });
});
