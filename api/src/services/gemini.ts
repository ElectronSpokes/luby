import { GoogleGenAI, Type } from '@google/genai';

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function generateCoachingPlan(stats: {
  calories: number;
  protein: number;
  fiber: number;
  sugar: number;
  water: number;
  movementMinutes: number;
}) {
  const client = getAI();
  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Based on today's health stats, create a personalized coaching plan.
Stats: Calories: ${stats.calories}, Protein: ${stats.protein}g, Fiber: ${stats.fiber}g, Sugar: ${stats.sugar}g, Water: ${stats.water}ml, Movement: ${stats.movementMinutes} minutes.
Create specific, actionable steps.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          focus: { type: Type.STRING, description: 'Main focus area for today' },
          eatingSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3-5 eating recommendations' },
          movementSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: '2-3 movement recommendations' },
        },
        required: ['focus', 'eatingSteps', 'movementSteps'],
      },
    },
  });

  return JSON.parse(response.text!);
}

export async function generateInsight(stats: {
  calories: number;
  protein: number;
  fiber: number;
  sugar: number;
  water: number;
  movementMinutes: number;
}) {
  const client = getAI();
  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Based on these health stats, give ONE short encouraging tip (1-2 sentences max).
Calories: ${stats.calories}, Protein: ${stats.protein}g, Fiber: ${stats.fiber}g, Sugar: ${stats.sugar}g, Water: ${stats.water}ml, Movement: ${stats.movementMinutes}min.`,
  });

  return response.text || '';
}

export async function scanFood(imageBase64: string, mimeType: string) {
  const client = getAI();
  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
          {
            text: 'Identify this food item and estimate its nutritional values per serving. Return JSON with: name (string), calories (number), protein (number in grams), fiber (number in grams), carbs (number in grams), fat (number in grams), sugar (number in grams).',
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          fiber: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          sugar: { type: Type.NUMBER },
        },
        required: ['name', 'calories', 'protein', 'fiber', 'carbs', 'fat', 'sugar'],
      },
    },
  });

  return JSON.parse(response.text!);
}

export async function generateMealPlan(preferences?: string) {
  const client = getAI();
  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Generate a 7-day healthy meal plan${preferences ? ` with these preferences: ${preferences}` : ''}. Include breakfast, lunch, dinner, and an optional snack for each day. Also generate a combined shopping list grouped by category.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plans: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                meals: {
                  type: Type.OBJECT,
                  properties: {
                    breakfast: { type: Type.STRING },
                    lunch: { type: Type.STRING },
                    dinner: { type: Type.STRING },
                    snack: { type: Type.STRING },
                  },
                },
              },
            },
          },
          shoppingList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
              },
            },
          },
        },
        required: ['plans', 'shoppingList'],
      },
    },
  });

  return JSON.parse(response.text!);
}

export async function searchRecipes(query: string) {
  const client = getAI();
  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Search for 3 recipes matching: "${query}". For each recipe, include name, description, ingredients list, step-by-step instructions, and full nutritional breakdown per serving.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            sugar: { type: Type.NUMBER },
          },
          required: ['name', 'description', 'ingredients', 'instructions', 'calories', 'protein', 'fiber', 'carbs', 'fat', 'sugar'],
        },
      },
    },
  });

  return JSON.parse(response.text!);
}

export async function chatWithLuby(messages: Array<{ role: string; content: string }>, stats: {
  calories: number;
  protein: number;
  fiber: number;
  sugar: number;
  water: number;
  movementMinutes: number;
}) {
  const client = getAI();

  const systemInstruction = `You are Luby, a cute and fluffy health mascot. You're knowledgeable about nutrition, exercise, and wellness. Be encouraging, specific, and friendly. Keep responses concise.
Current user stats today: Calories: ${stats.calories}, Protein: ${stats.protein}g, Fiber: ${stats.fiber}g, Sugar: ${stats.sugar}g, Water: ${stats.water}ml, Movement: ${stats.movementMinutes}min.`;

  const chat = client.chats.create({
    model: 'gemini-2.0-flash',
    config: { systemInstruction },
  });

  // Send previous messages for context then the last user message
  const lastMessage = messages[messages.length - 1];
  const history = messages.slice(0, -1);

  // Build history
  for (const msg of history) {
    await chat.sendMessage(msg.content);
  }

  const response = await chat.sendMessage(lastMessage.content);
  return response.text || '';
}

export function getLiveApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return apiKey;
}
