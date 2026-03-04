import { Hono } from 'hono';
import { sql } from '../db/client';
import type { AppEnv } from '../types';

export const recipesRoutes = new Hono<AppEnv>();

recipesRoutes.get('/', async (c) => {
  const userId = c.get('auth').userId;

  const recipes = await sql`
    SELECT * FROM recipes
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return c.json(recipes);
});

recipesRoutes.post('/', async (c) => {
  const userId = c.get('auth').userId;
  const body = await c.req.json();
  const { name, description, ingredients, instructions, calories, protein, fiber, carbs, fat, sugar } = body;

  const [recipe] = await sql`
    INSERT INTO recipes (user_id, name, description, ingredients, instructions, calories, protein, fiber, carbs, fat, sugar)
    VALUES (${userId}, ${name}, ${description || ''}, ${sql.json(ingredients || [])}, ${sql.json(instructions || [])},
            ${calories || 0}, ${protein || 0}, ${fiber || 0}, ${carbs || 0}, ${fat || 0}, ${sugar || 0})
    RETURNING *
  `;

  return c.json(recipe, 201);
});

// POST /recipes/bulk - save multiple recipes (transactional)
recipesRoutes.post('/bulk', async (c) => {
  const userId = c.get('auth').userId;
  const body = await c.req.json();
  const { recipes: recipeList } = body;

  if (!Array.isArray(recipeList)) {
    return c.json({ error: 'recipes must be an array' }, 400);
  }

  const inserted = await sql.begin(async (tx) => {
    const rows = [];
    for (const r of recipeList) {
      const [recipe] = await tx`
        INSERT INTO recipes (user_id, name, description, ingredients, instructions, calories, protein, fiber, carbs, fat, sugar)
        VALUES (${userId}, ${r.name}, ${r.description || ''}, ${sql.json(r.ingredients || [])}, ${sql.json(r.instructions || [])},
                ${r.calories || 0}, ${r.protein || 0}, ${r.fiber || 0}, ${r.carbs || 0}, ${r.fat || 0}, ${r.sugar || 0})
        RETURNING *
      `;
      rows.push(recipe);
    }
    return rows;
  });

  return c.json(inserted, 201);
});

recipesRoutes.delete('/:id', async (c) => {
  const userId = c.get('auth').userId;
  const id = c.req.param('id');

  const result = await sql`
    DELETE FROM recipes WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `;

  if (result.length === 0) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json({ deleted: true });
});
