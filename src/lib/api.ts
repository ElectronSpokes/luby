const API_URL = import.meta.env.VITE_API_URL || 'http://10.0.110.27:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json();
}

export const api = {
  // Auth
  getMe: () => request<{ user: { sub: string; email: string; name: string; preferred_username: string } | null }>('/auth/me'),
  getLoginUrl: () => `${API_URL}/api/v1/auth/login`,
  getLogoutUrl: () => `${API_URL}/api/v1/auth/logout`,

  // Food
  getFood: (from?: number, to?: number) => {
    const params = from && to ? `?from=${from}&to=${to}` : '';
    return request<any[]>(`/food${params}`);
  },
  addFood: (entry: { name: string; calories: number; protein: number; fiber: number; carbs: number; fat: number; sugar: number; timestamp: number }) =>
    request<any>('/food', { method: 'POST', body: JSON.stringify(entry) }),
  deleteFood: (id: string) => request<any>(`/food/${id}`, { method: 'DELETE' }),

  // Hydration
  getHydration: (from?: number, to?: number) => {
    const params = from && to ? `?from=${from}&to=${to}` : '';
    return request<any[]>(`/hydration${params}`);
  },
  addHydration: (entry: { amount: number; timestamp: number }) =>
    request<any>('/hydration', { method: 'POST', body: JSON.stringify(entry) }),
  deleteHydration: (id: string) => request<any>(`/hydration/${id}`, { method: 'DELETE' }),

  // Movement
  getMovement: (from?: number, to?: number) => {
    const params = from && to ? `?from=${from}&to=${to}` : '';
    return request<any[]>(`/movement${params}`);
  },
  addMovement: (entry: { type: string; duration: number; intensity: string; timestamp: number }) =>
    request<any>('/movement', { method: 'POST', body: JSON.stringify(entry) }),
  deleteMovement: (id: string) => request<any>(`/movement/${id}`, { method: 'DELETE' }),

  // Fasting
  getFasting: () => request<any[]>('/fasting'),
  getActiveFasting: () => request<any | null>('/fasting/active'),
  startFasting: (entry: { startTime: number; targetDuration: number }) =>
    request<any>('/fasting', { method: 'POST', body: JSON.stringify(entry) }),
  completeFasting: (id: string) => request<any>(`/fasting/${id}/complete`, { method: 'PUT' }),
  deleteFasting: (id: string) => request<any>(`/fasting/${id}`, { method: 'DELETE' }),

  // Meals
  getMeals: () => request<any[]>('/meals'),
  saveMeals: (plans: any[]) =>
    request<any[]>('/meals', { method: 'POST', body: JSON.stringify({ plans }) }),
  getShopping: () => request<any[]>('/meals/shopping'),
  saveShopping: (items: any[]) =>
    request<any[]>('/meals/shopping', { method: 'POST', body: JSON.stringify({ items }) }),
  toggleShopping: (id: string, checked: boolean) =>
    request<any>(`/meals/shopping/${id}`, { method: 'PATCH', body: JSON.stringify({ checked }) }),

  // Recipes
  getRecipes: () => request<any[]>('/recipes'),
  saveRecipes: (recipes: any[]) =>
    request<any[]>('/recipes/bulk', { method: 'POST', body: JSON.stringify({ recipes }) }),
  deleteRecipe: (id: string) => request<any>(`/recipes/${id}`, { method: 'DELETE' }),

  // Coaching
  getCoaching: (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return request<any>(`/coaching${params}`);
  },
  saveCoaching: (plan: { date: string; focus: string; eatingSteps: string[]; movementSteps: string[] }) =>
    request<any>('/coaching', { method: 'POST', body: JSON.stringify(plan) }),

  // Chat
  getChat: (limit?: number) => request<any[]>(`/chat${limit ? `?limit=${limit}` : ''}`),
  saveChat: (msg: { role: string; content: string; timestamp: number }) =>
    request<any>('/chat', { method: 'POST', body: JSON.stringify(msg) }),
  clearChat: () => request<any>('/chat', { method: 'DELETE' }),

  // AI
  generateCoachingPlan: (stats: any) =>
    request<any>('/ai/coaching-plan', { method: 'POST', body: JSON.stringify({ stats }) }),
  generateInsight: (stats: any) =>
    request<{ insight: string }>('/ai/insight', { method: 'POST', body: JSON.stringify({ stats }) }),
  scanFood: (image: string, mimeType: string) =>
    request<any>('/ai/scan-food', { method: 'POST', body: JSON.stringify({ image, mimeType }) }),
  generateMealPlan: (preferences?: string) =>
    request<any>('/ai/generate-meal-plan', { method: 'POST', body: JSON.stringify({ preferences }) }),
  searchRecipes: (query: string) =>
    request<{ recipes: any[] }>('/ai/search-recipes', { method: 'POST', body: JSON.stringify({ query }) }),
  aiChat: (messages: any[], stats: any) =>
    request<{ response: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ messages, stats }) }),
  getLiveToken: () => request<{ apiKey: string }>('/ai/live-token'),
};
