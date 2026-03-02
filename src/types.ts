export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fiber: number;
  carbs: number;
  fat: number;
  sugar: number;
  timestamp: number;
}

export interface HydrationEntry {
  id: string;
  amount: number; // in ml
  timestamp: number;
}

export interface MovementEntry {
  id: string;
  type: string;
  duration: number; // in minutes
  intensity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface FastingSession {
  id: string;
  startTime: number;
  endTime?: number;
  targetDuration: number; // in hours
  status: 'active' | 'completed';
}

export interface DailyStats {
  calories: number;
  protein: number;
  fiber: number;
  sugar: number;
  water: number;
  movementMinutes: number;
}

export interface CoachingPlan {
  date: string;
  eatingSteps: string[];
  movementSteps: string[];
  focus: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  protein: number;
  fiber: number;
  carbs: number;
  fat: number;
  sugar: number;
  image?: string;
}

export interface MealPlan {
  id: string;
  day: string;
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snack?: string;
  };
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
