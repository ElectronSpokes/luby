import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Check, 
  ChevronRight, 
  ChefHat,
  ShoppingBag,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '../lib/utils';
import { MealPlan, ShoppingItem, Recipe } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const MenuPlanner: React.FC = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'planner' | 'shopping'>('planner');

  useEffect(() => {
    const savedPlans = localStorage.getItem('vitality_meal_plans');
    const savedList = localStorage.getItem('vitality_shopping_list');
    if (savedPlans) setMealPlans(JSON.parse(savedPlans));
    if (savedList) setShoppingList(JSON.parse(savedList));
  }, []);

  useEffect(() => {
    localStorage.setItem('vitality_meal_plans', JSON.stringify(mealPlans));
    localStorage.setItem('vitality_shopping_list', JSON.stringify(shoppingList));
  }, [mealPlans, shoppingList]);

  const generateWeeklyPlan = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a healthy weekly meal plan for 7 days (Monday-Sunday). For each day, provide breakfast, lunch, and dinner. Also generate a combined shopping list of ingredients needed for all these meals.",
        config: {
          responseMimeType: "application/json",
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
                        dinner: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              shoppingList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      if (result.plans) setMealPlans(result.plans);
      if (result.shoppingList) {
        setShoppingList(result.shoppingList.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          checked: false
        })));
      }
    } catch (err) {
      console.error("Error generating plan:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Health Planner</h2>
          <p className="text-slate-500">Plan your week, simplify your shopping.</p>
        </div>
        <button 
          onClick={generateWeeklyPlan}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20"
        >
          {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isGenerating ? "Generating..." : "Generate AI Plan"}
        </button>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('planner')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'planner' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Weekly Menu
        </button>
        <button 
          onClick={() => setActiveTab('shopping')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'shopping' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Shopping List
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'planner' ? (
          <motion.div 
            key="planner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {mealPlans.length > 0 ? mealPlans.map((plan, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 font-bold">
                    {plan.day.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{plan.day}</h3>
                </div>
                
                <div className="space-y-4">
                  <MealItem label="Breakfast" value={plan.meals.breakfast} />
                  <MealItem label="Lunch" value={plan.meals.lunch} />
                  <MealItem label="Dinner" value={plan.meals.dinner} />
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No meal plan generated yet.</p>
                <p className="text-sm text-slate-400">Click the button above to create your weekly health menu.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="shopping"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-violet-600" />
                Shopping List
              </h3>
              <span className="text-sm font-medium text-slate-400">
                {shoppingList.filter(i => i.checked).length} / {shoppingList.length} items
              </span>
            </div>

            {shoppingList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {shoppingList.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => toggleShoppingItem(item.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      item.checked ? "bg-emerald-500 border-emerald-500" : "border-slate-200 group-hover:border-violet-400"
                    )}>
                      {item.checked && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "font-bold transition-all",
                        item.checked ? "text-slate-400 line-through" : "text-slate-700"
                      )}>
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">{item.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Your shopping list is empty.</p>
                <p className="text-sm text-slate-400">Generate a meal plan to populate your list.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MealItem = ({ label, value }: { label: string, value?: string }) => (
  <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-violet-50/50 transition-colors">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-bold text-slate-700 leading-snug">{value || 'Not planned'}</p>
  </div>
);
