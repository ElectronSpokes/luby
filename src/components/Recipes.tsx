import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChefHat, 
  Clock, 
  Flame, 
  Target, 
  ChevronRight, 
  Plus,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Recipe } from '../types';

export const Recipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchRecipes = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await api.searchRecipes(query);
      const recipes = (result.recipes || []).map((r: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        ...r,
      }));
      setResults(recipes);
    } catch (e) {
      console.error("Failed to search recipes", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {!selectedRecipe ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Health Recipes</h2>
                <p className="text-slate-500">Delicious meals that fuel your vitality.</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search recipes (e.g. Keto, Vegan, High Protein)"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchRecipes(searchQuery)}
                />
              </div>
            </div>

            {isSearching ? (
              <div className="py-20 text-center">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Finding the perfect recipes...</p>
              </div>
            ) : recipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recipes.map((recipe) => (
                  <div 
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className="aspect-video bg-slate-100 relative overflow-hidden">
                      <img 
                        src={`https://picsum.photos/seed/${recipe.name}/600/400`} 
                        alt={recipe.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {recipe.calories} kcal
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-violet-600 transition-colors">{recipe.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-6">{recipe.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Protein</p>
                            <p className="text-sm font-bold text-slate-800">{recipe.protein}g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Fiber</p>
                            <p className="text-sm font-bold text-slate-800">{recipe.fiber}g</p>
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <ChefHat className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Discover New Flavors</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Enter a dietary preference or ingredient above to generate healthy, AI-powered recipes.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
          >
            <button 
              onClick={() => setSelectedRecipe(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Recipes
            </button>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
              <div className="aspect-[21/9] relative">
                <img 
                  src={`https://picsum.photos/seed/${selectedRecipe.name}/1200/600`} 
                  alt={selectedRecipe.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h2 className="text-4xl font-bold mb-2">{selectedRecipe.name}</h2>
                  <p className="text-white/80 max-w-2xl">{selectedRecipe.description}</p>
                </div>
              </div>

              <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <NutrientBox label="Calories" value={`${selectedRecipe.calories} kcal`} icon={Flame} color="text-orange-500" />
                    <NutrientBox label="Protein" value={`${selectedRecipe.protein}g`} icon={Target} color="text-violet-500" />
                    <NutrientBox label="Fiber" value={`${selectedRecipe.fiber}g`} icon={Sparkles} color="text-emerald-500" />
                    <NutrientBox label="Sugar" value={`${selectedRecipe.sugar}g`} icon={Clock} color="text-blue-500" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Ingredients</h3>
                    <ul className="space-y-3">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0" />
                          <span className="text-sm font-medium">{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Instructions</h3>
                  <div className="space-y-8">
                    {selectedRecipe.instructions.map((step, i) => (
                      <div key={i} className="flex gap-6">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-slate-600 leading-relaxed pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NutrientBox = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
    <Icon className={cn("w-4 h-4 mb-2", color)} />
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-slate-800">{value}</p>
  </div>
);
