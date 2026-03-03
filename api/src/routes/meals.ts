import { Hono } from 'hono';
import { sql } from '../db/client';
import type { AppEnv } from '../types';

export const mealsRoutes = new Hono<AppEnv>();

// GET /meals - list meal plans
mealsRoutes.get('/', async (c) => {
  const userId = c.get('auth').userId;

  const plans = await sql`
    SELECT * FROM meal_plans
    WHERE user_id = ${userId}
    ORDER BY day ASC
  `;

  return c.json(plans);
});

// POST /meals - create/replace meal plans (bulk)
mealsRoutes.post('/', async (c) => {
  const userId = c.get('auth').userId;
  const body = await c.req.json();
  const { plans } = body; // Array of { day, meals }

  if (!Array.isArray(plans)) {
    return c.json({ error: 'plans must be an array' }, 400);
  }

  // Delete existing plans for this user
  await sql`DELETE FROM meal_plans WHERE user_id = ${userId}`;

  const inserted = [];
  for (const plan of plans) {
    const [row] = await sql`
      INSERT INTO meal_plans (user_id, day, meals)
      VALUES (${userId}, ${plan.day}, ${sql.json(plan.meals)})
      RETURNING *
    `;
    inserted.push(row);
  }

  return c.json(inserted, 201);
});

// GET /meals/shopping - list shopping items
mealsRoutes.get('/shopping', async (c) => {
  const userId = c.get('auth').userId;

  const items = await sql`
    SELECT * FROM shopping_items
    WHERE user_id = ${userId}
    ORDER BY category, name
  `;

  return c.json(items);
});

// POST /meals/shopping - create/replace shopping list (bulk)
mealsRoutes.post('/shopping', async (c) => {
  const userId = c.get('auth').userId;
  const body = await c.req.json();
  const { items } = body; // Array of { name, category, checked }

  if (!Array.isArray(items)) {
    return c.json({ error: 'items must be an array' }, 400);
  }

  await sql`DELETE FROM shopping_items WHERE user_id = ${userId}`;

  const inserted = [];
  for (const item of items) {
    const [row] = await sql`
      INSERT INTO shopping_items (user_id, name, category, checked)
      VALUES (${userId}, ${item.name}, ${item.category || ''}, ${item.checked || false})
      RETURNING *
    `;
    inserted.push(row);
  }

  return c.json(inserted, 201);
});

// PATCH /meals/shopping/:id - toggle checked
mealsRoutes.patch('/shopping/:id', async (c) => {
  const userId = c.get('auth').userId;
  const id = c.req.param('id');
  const body = await c.req.json();

  const [item] = await sql`
    UPDATE shopping_items
    SET checked = ${body.checked}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;

  if (!item) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json(item);
});
