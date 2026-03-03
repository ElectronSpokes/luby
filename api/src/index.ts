import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { loadSecretsFromVault } from './services/vault';
import { testConnection } from './db/client';
import { runMigrations } from './db/migrate';
import { foodRoutes } from './routes/food';
import { hydrationRoutes } from './routes/hydration';
import { movementRoutes } from './routes/movement';
import { fastingRoutes } from './routes/fasting';
import { mealsRoutes } from './routes/meals';
import { recipesRoutes } from './routes/recipes';
import { coachingRoutes } from './routes/coaching';
import { chatRoutes } from './routes/chat';
import { aiRoutes } from './routes/ai';
import { authRoutes } from './routes/auth';
import { authMiddleware, requireAuth } from './middleware/auth';
import type { AppEnv } from './types';

// Load Vault secrets before starting
await loadSecretsFromVault();

const app = new Hono<AppEnv>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://10.0.110.27:3000',
    'https://myluby.net',
    'https://www.myluby.net',
  ],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));

// Health check (no auth)
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API router
const api = new Hono<AppEnv>();

// Auth routes (no auth middleware)
api.route('/auth', authRoutes);

// AI routes (auth required)
api.use('/ai/*', authMiddleware, requireAuth);
api.route('/ai', aiRoutes);

// Data routes (auth required)
api.use('/food/*', authMiddleware, requireAuth);
api.use('/hydration/*', authMiddleware, requireAuth);
api.use('/movement/*', authMiddleware, requireAuth);
api.use('/fasting/*', authMiddleware, requireAuth);
api.use('/meals/*', authMiddleware, requireAuth);
api.use('/recipes/*', authMiddleware, requireAuth);
api.use('/coaching/*', authMiddleware, requireAuth);
api.use('/chat/*', authMiddleware, requireAuth);

api.route('/food', foodRoutes);
api.route('/hydration', hydrationRoutes);
api.route('/movement', movementRoutes);
api.route('/fasting', fastingRoutes);
api.route('/meals', mealsRoutes);
api.route('/recipes', recipesRoutes);
api.route('/coaching', coachingRoutes);
api.route('/chat', chatRoutes);

app.route('/api/v1', api);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err.stack || err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Startup
const connected = await testConnection();
if (connected) {
  console.log('Running migrations...');
  await runMigrations();
}

const port = process.env.PORT || 3001;
console.log(`Luby API running on port ${port}`);

export default {
  port,
  hostname: '0.0.0.0',
  fetch: app.fetch,
};
