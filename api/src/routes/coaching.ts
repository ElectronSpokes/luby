import { Hono } from 'hono';
import { sql } from '../db/client';
import type { AppEnv } from '../types';

export const coachingRoutes = new Hono<AppEnv>();

// GET /coaching - get today's coaching plan
coachingRoutes.get('/', async (c) => {
  const userId = c.get('auth').userId;
  const date = c.req.query('date');

  if (date) {
    const [plan] = await sql`
      SELECT * FROM coaching_plans
      WHERE user_id = ${userId} AND date = ${date}
    `;
    return c.json(plan || null);
  }

  const plans = await sql`
    SELECT * FROM coaching_plans
    WHERE user_id = ${userId}
    ORDER BY date DESC
    LIMIT 7
  `;

  return c.json(plans);
});

// POST /coaching - save coaching plan (upsert by date)
coachingRoutes.post('/', async (c) => {
  const userId = c.get('auth').userId;
  const body = await c.req.json();
  const { date, focus, eatingSteps, movementSteps } = body;

  const [plan] = await sql`
    INSERT INTO coaching_plans (user_id, date, focus, eating_steps, movement_steps)
    VALUES (${userId}, ${date}, ${focus || ''}, ${sql.json(eatingSteps || [])}, ${sql.json(movementSteps || [])})
    ON CONFLICT (user_id, date) DO UPDATE SET
      focus = EXCLUDED.focus,
      eating_steps = EXCLUDED.eating_steps,
      movement_steps = EXCLUDED.movement_steps
    RETURNING *
  `;

  return c.json(plan, 201);
});
