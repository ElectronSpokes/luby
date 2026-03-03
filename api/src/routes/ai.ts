import { Hono } from 'hono';
import {
  generateCoachingPlan,
  generateInsight,
  scanFood,
  generateMealPlan,
  searchRecipes,
  chatWithLuby,
  getLiveApiKey,
} from '../services/gemini';
import type { AppEnv } from '../types';

export const aiRoutes = new Hono<AppEnv>();

// POST /ai/coaching-plan
aiRoutes.post('/coaching-plan', async (c) => {
  const body = await c.req.json();
  const { stats } = body;

  try {
    const plan = await generateCoachingPlan(stats);
    return c.json(plan);
  } catch (error) {
    console.error('Coaching plan generation failed:', error);
    return c.json({ error: 'Failed to generate coaching plan' }, 500);
  }
});

// POST /ai/insight
aiRoutes.post('/insight', async (c) => {
  const body = await c.req.json();
  const { stats } = body;

  try {
    const insight = await generateInsight(stats);
    return c.json({ insight });
  } catch (error) {
    console.error('Insight generation failed:', error);
    return c.json({ error: 'Failed to generate insight' }, 500);
  }
});

// POST /ai/scan-food
aiRoutes.post('/scan-food', async (c) => {
  const body = await c.req.json();
  const { image, mimeType } = body;

  try {
    const result = await scanFood(image, mimeType || 'image/jpeg');
    return c.json(result);
  } catch (error) {
    console.error('Food scan failed:', error);
    return c.json({ error: 'Failed to scan food' }, 500);
  }
});

// POST /ai/generate-meal-plan
aiRoutes.post('/generate-meal-plan', async (c) => {
  const body = await c.req.json();
  const { preferences } = body;

  try {
    const result = await generateMealPlan(preferences);
    return c.json(result);
  } catch (error) {
    console.error('Meal plan generation failed:', error);
    return c.json({ error: 'Failed to generate meal plan' }, 500);
  }
});

// POST /ai/search-recipes
aiRoutes.post('/search-recipes', async (c) => {
  const body = await c.req.json();
  const { query } = body;

  try {
    const recipes = await searchRecipes(query);
    return c.json({ recipes });
  } catch (error) {
    console.error('Recipe search failed:', error);
    return c.json({ error: 'Failed to search recipes' }, 500);
  }
});

// POST /ai/chat
aiRoutes.post('/chat', async (c) => {
  const body = await c.req.json();
  const { messages, stats } = body;

  try {
    const response = await chatWithLuby(messages, stats);
    return c.json({ response });
  } catch (error) {
    console.error('Chat failed:', error);
    return c.json({ error: 'Failed to chat' }, 500);
  }
});

// GET /ai/live-token - Return API key for client-side live audio
aiRoutes.get('/live-token', (c) => {
  try {
    const apiKey = getLiveApiKey();
    return c.json({ apiKey });
  } catch (error) {
    return c.json({ error: 'Live API not available' }, 500);
  }
});
