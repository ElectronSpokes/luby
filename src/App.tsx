import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Droplets, 
  Activity, 
  Timer, 
  Utensils, 
  ChevronRight, 
  History,
  Flame,
  Target,
  Trophy,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Calendar,
  ChefHat,
  Camera,
  MessageSquare,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isToday, startOfDay } from 'date-fns';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from './lib/utils';
import { FoodEntry, HydrationEntry, MovementEntry, FastingSession, DailyStats, CoachingPlan } from './types';
import { FoodScanner } from './components/FoodScanner';
import { MenuPlanner } from './components/MenuPlanner';
import { Recipes } from './components/Recipes';
import { AIAssistant } from './components/AIAssistant';

// --- Components ---
// ... (CoachingView, AIInsight, StatCard, LubyMascot, WeightLossScore components)

const CoachingView = ({ stats, foodEntries, movementEntries }: { stats: DailyStats, foodEntries: FoodEntry[], movementEntries: MovementEntry[] }) => {
  const [plan, setPlan] = useState<CoachingPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on the user's recent health data:
        Today's stats: ${stats.calories}kcal, ${stats.protein}g protein, ${stats.fiber}g fiber, ${stats.sugar}g sugar, ${stats.water}ml water, ${stats.movementMinutes}min movement.
        Recent meals: ${foodEntries.slice(-3).map(f => f.name).join(', ')}.
        Recent activities: ${movementEntries.slice(-3).map(m => m.type).join(', ')}.
        Generate a personalized daily coaching plan with 3 actionable steps for healthy eating and 3 actionable steps for movement.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              focus: { type: Type.STRING, description: "A short focus theme for the day" },
              eatingSteps: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "3 specific, actionable eating steps"
              },
              movementSteps: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "3 specific, actionable movement steps"
              }
            },
            required: ["date", "focus", "eatingSteps", "movementSteps"]
          }
        }
      });
      
      const parsed = JSON.parse(response.text || "{}");
      setPlan(parsed);
      localStorage.setItem('vitality_coaching_plan', JSON.stringify(parsed));
    } catch (e) {
      console.error("Failed to generate plan", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('vitality_coaching_plan');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === format(new Date(), 'yyyy-MM-dd')) {
        setPlan(parsed);
      } else {
        generatePlan();
      }
    } else {
      generatePlan();
    }
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Daily Coaching</h2>
              <p className="text-slate-400">Tailored plan for your vitality</p>
            </div>
            <button 
              onClick={generatePlan}
              disabled={loading}
              className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-5 h-5 text-slate-600", loading && "animate-spin")} />
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Crafting your personalized plan...</p>
            </div>
          ) : plan ? (
            <div className="space-y-8">
              <div className="bg-violet-50 p-6 rounded-3xl border border-violet-100">
                <div className="flex items-center gap-3 mb-2">
                  <Lightbulb className="w-5 h-5 text-violet-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Today's Focus</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{plan.focus}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Utensils className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-slate-800">Healthy Eating</h3>
                  </div>
                  {plan.eatingSteps.map((step, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-orange-200 transition-colors"
                    >
                      <div className="mt-1">
                        <CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{step}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-slate-800">Movement Support</h3>
                  </div>
                  {plan.movementSteps.map((step, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (i + 3) * 0.1 }}
                      className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-colors"
                    >
                      <div className="mt-1">
                        <CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{step}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
      </div>
    </div>
  );
};

const LubyMascot = ({ score }: { score: number }) => {
  const getColor = () => {
    if (score >= 80) return "#10b981"; // Emerald (Peak)
    if (score >= 50) return "#3b82f6"; // Blue (On track)
    return "#f59e0b"; // Amber (Encouragement)
  };

  const getMessage = () => {
    if (score >= 80) return "You're in the peak zone! Amazing!";
    if (score >= 50) return "Doing great! Keep it up!";
    return "Let's log some more goals today!";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32">
        {/* Fluffy Body */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            y: [0, -5, 0],
            backgroundColor: getColor(),
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-full h-full rounded-full shadow-lg relative overflow-hidden"
          style={{ boxShadow: `0 0 40px ${getColor()}44` }}
        >
          {/* Texture/Fluff effect */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_70%)]" />
          
          {/* Eyes */}
          <div className="absolute top-1/3 left-1/4 right-1/4 flex justify-between px-2">
            <div className="relative">
              <motion.div
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                className="w-4 h-4 bg-slate-900 rounded-full"
              />
            </div>
            <div className="relative">
              <motion.div
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3.2 }}
                className="w-4 h-4 bg-slate-900 rounded-full"
              />
            </div>
          </div>

          {/* Blush */}
          <div className="absolute top-1/2 left-1/4 right-1/4 flex justify-between px-1 opacity-40">
            <div className="w-3 h-2 bg-pink-300 rounded-full blur-[2px]" />
            <div className="w-3 h-2 bg-pink-300 rounded-full blur-[2px]" />
          </div>

          {/* Smile */}
          <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2">
            <div className="w-6 h-3 border-b-2 border-slate-900 rounded-full" />
          </div>
        </motion.div>

        {/* Little Ears/Antenna */}
        <div className="absolute -top-2 left-1/4 -translate-x-1/2 w-4 h-6 bg-inherit rounded-full rotate-[-20deg]" style={{ backgroundColor: getColor() }} />
        <div className="absolute -top-2 right-1/4 translate-x-1/2 w-4 h-6 bg-inherit rounded-full rotate-[20deg]" style={{ backgroundColor: getColor() }} />
      </div>
      
      <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 relative">
        <p className="text-xs font-bold text-slate-700">Luby: {getMessage()}</p>
        {/* Speech bubble tail */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-slate-100 rotate-45" />
      </div>
    </div>
  );
};

const WeightLossScore = ({ score }: { score: number }) => {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 50) return "text-blue-500";
    return "text-orange-500";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "High Likelihood";
    if (s >= 50) return "Moderate Likelihood";
    return "Low Likelihood";
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Weight Loss Likelihood</h3>
      <div className="relative w-40 h-40 flex items-center justify-center mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-100"
          />
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={440}
            initial={{ strokeDashoffset: 440 }}
            animate={{ strokeDashoffset: 440 - (440 * score) / 100 }}
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-slate-800">{score}%</span>
        </div>
      </div>
      <p className={cn("font-bold text-lg mb-1", getScoreColor(score))}>
        {getScoreLabel(score)}
      </p>
      <p className="text-sm text-slate-400 max-w-[200px]">
        {score < 50 ? "Log more protein and movement to boost your score." : "You're on the right track for your goals!"}
      </p>
    </div>
  );
};

const AIInsight = ({ stats }: { stats: DailyStats }) => {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const getInsight = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on today's health stats: ${stats.calories}kcal, ${stats.protein}g protein, ${stats.fiber}g fiber, ${stats.sugar}g sugar, ${stats.water}ml water, ${stats.movementMinutes}min movement. Give a 1-sentence encouraging health tip.`,
      });
      setInsight(response.text || "Keep up the great work!");
    } catch (e) {
      setInsight("Stay hydrated and keep moving!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInsight();
  }, []);

  return (
    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-violet-200" />
          <span className="text-xs font-bold uppercase tracking-widest text-violet-200">AI Insight</span>
        </div>
        <p className="text-lg font-medium leading-relaxed">
          {loading ? "Generating your daily insight..." : insight}
        </p>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
    </div>
  );
};

const StatCard = ({ title, value, unit, icon: Icon, color, progress }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4"
  >
    <div className="flex justify-between items-start">
      <div className={cn("p-2.5 rounded-2xl", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span></h3>
      </div>
    </div>
    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(progress * 100, 100)}%` }}
        className={cn("h-full rounded-full", color.replace('bg-', 'bg-'))}
        style={{ backgroundColor: color.includes('emerald') ? '#10b981' : color.includes('blue') ? '#3b82f6' : color.includes('orange') ? '#f97316' : '#8b5cf6' }}
      />
    </div>
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [hydrationEntries, setHydrationEntries] = useState<HydrationEntry[]>([]);
  const [movementEntries, setMovementEntries] = useState<MovementEntry[]>([]);
  const [fastingSessions, setFastingSessions] = useState<FastingSession[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  
  // Load data
  useEffect(() => {
    const savedFood = localStorage.getItem('vitality_food');
    const savedHydration = localStorage.getItem('vitality_hydration');
    const savedMovement = localStorage.getItem('vitality_movement');
    const savedFasting = localStorage.getItem('vitality_fasting');
    
    if (savedFood) setFoodEntries(JSON.parse(savedFood));
    if (savedHydration) setHydrationEntries(JSON.parse(savedHydration));
    if (savedMovement) setMovementEntries(JSON.parse(savedMovement));
    if (savedFasting) setFastingSessions(JSON.parse(savedFasting));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('vitality_food', JSON.stringify(foodEntries));
    localStorage.setItem('vitality_hydration', JSON.stringify(hydrationEntries));
    localStorage.setItem('vitality_movement', JSON.stringify(movementEntries));
    localStorage.setItem('vitality_fasting', JSON.stringify(fastingSessions));
  }, [foodEntries, hydrationEntries, movementEntries, fastingSessions]);

  const todayStats: DailyStats = {
    calories: foodEntries.filter(e => isToday(e.timestamp)).reduce((acc, curr) => acc + curr.calories, 0),
    protein: foodEntries.filter(e => isToday(e.timestamp)).reduce((acc, curr) => acc + curr.protein, 0),
    fiber: foodEntries.filter(e => isToday(e.timestamp)).reduce((acc, curr) => acc + curr.fiber, 0),
    sugar: foodEntries.filter(e => isToday(e.timestamp)).reduce((acc, curr) => acc + curr.sugar, 0),
    water: hydrationEntries.filter(e => isToday(e.timestamp)).reduce((acc, curr) => acc + curr.amount, 0),
    movementMinutes: movementEntries.filter(e => isToday(e.timestamp)).reduce((acc, curr) => acc + curr.duration, 0),
  };

  const calculateWeightLossScore = (stats: DailyStats) => {
    let score = 0;
    if (stats.calories > 1200 && stats.calories <= 1800) score += 30;
    else if (stats.calories > 1800 && stats.calories <= 2200) score += 15;
    else if (stats.calories > 0 && stats.calories <= 1200) score += 20;
    if (stats.protein >= 100) score += 20;
    else if (stats.protein >= 60) score += 10;
    if (stats.fiber >= 25) score += 15;
    else if (stats.fiber >= 15) score += 7;
    if (stats.movementMinutes >= 45) score += 20;
    else if (stats.movementMinutes >= 20) score += 10;
    if (stats.water >= 2000) score += 15;
    else if (stats.water >= 1000) score += 7;
    return Math.min(score, 100);
  };

  const weightLossScore = calculateWeightLossScore(todayStats);

  const activeFasting = fastingSessions.find(s => s.status === 'active');

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-20">
      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-20 bg-white border-t md:border-t-0 md:border-r border-slate-200 z-50 flex md:flex-col items-center justify-around md:justify-center gap-8 py-4 md:py-8">
        <NavIcon active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Activity} label="Home" />
        <NavIcon active={activeTab === 'assistant'} onClick={() => setIsAssistantOpen(true)} icon={MessageSquare} label="Luby" />
        <NavIcon active={activeTab === 'coaching'} onClick={() => setActiveTab('coaching')} icon={Lightbulb} label="Coach" />
        <NavIcon active={activeTab === 'planner'} onClick={() => setActiveTab('planner')} icon={Calendar} label="Plan" />
        <NavIcon active={activeTab === 'recipes'} onClick={() => setActiveTab('recipes')} icon={ChefHat} label="Eat" />
        <NavIcon active={activeTab === 'food'} onClick={() => setActiveTab('food')} icon={Utensils} label="Food" />
        <NavIcon active={activeTab === 'hydration'} onClick={() => setActiveTab('hydration')} icon={Droplets} label="Water" />
        <NavIcon active={activeTab === 'movement'} onClick={() => setActiveTab('movement')} icon={Activity} label="Move" />
        <NavIcon active={activeTab === 'fasting'} onClick={() => setActiveTab('fasting')} icon={Timer} label="Fast" />
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-10">
        <header className="mb-10">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-slate-400 font-medium mb-1">{format(new Date(), 'EEEE, MMMM do')}</p>
              <h1 className="text-4xl font-bold text-slate-900">Vitality</h1>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <AIInsight stats={todayStats} />

              <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <LubyMascot score={weightLossScore} />
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Hey there! I'm Luby.</h3>
                  <p className="text-slate-500">I'm tracking your progress today. You're doing great! Keep hitting those goals to keep me happy and fluffy.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Calories" value={todayStats.calories} unit="kcal" icon={Flame} color="bg-orange-500" progress={todayStats.calories / 2000} />
                <StatCard title="Hydration" value={todayStats.water} unit="ml" icon={Droplets} color="bg-blue-500" progress={todayStats.water / 2500} />
                <StatCard title="Movement" value={todayStats.movementMinutes} unit="min" icon={Activity} color="bg-emerald-500" progress={todayStats.movementMinutes / 60} />
                <StatCard title="Protein" value={todayStats.protein} unit="g" icon={Target} color="bg-violet-500" progress={todayStats.protein / 150} />
                <StatCard title="Sugars" value={todayStats.sugar} unit="g" icon={Sparkles} color="bg-pink-500" progress={todayStats.sugar / 50} />
              </div>
              
              {/* Quick Coaching Preview */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setActiveTab('coaching')}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:border-violet-200 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-100 rounded-2xl group-hover:bg-violet-200 transition-colors">
                      <Lightbulb className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Your Daily Coaching Plan</h3>
                      <p className="text-sm text-slate-400">View your personalized steps for today</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" />
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xl font-bold text-slate-800">Nutrient Balance</h2>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-violet-500" />
                          <span className="text-xs font-medium text-slate-500">Protein</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-xs font-medium text-slate-500">Fiber</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={foodEntries.slice(-7)}>
                          <XAxis dataKey="timestamp" tickFormatter={(t) => format(t, 'MMM d')} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(t) => format(t, 'MMMM do')}
                          />
                          <Bar dataKey="protein" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar dataKey="fiber" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-2xl font-bold mb-2">Fasting Status</h2>
                      {activeFasting ? (
                        <div>
                          <p className="text-slate-400 mb-6">You've been fasting for</p>
                          <div className="text-5xl font-mono font-bold mb-8">
                            {formatDuration(Date.now() - activeFasting.startTime)}
                          </div>
                          <button 
                            onClick={() => {
                              const updated = fastingSessions.map(s => s.id === activeFasting.id ? { ...s, status: 'completed', endTime: Date.now() } : s);
                              setFastingSessions(updated as FastingSession[]);
                            }}
                            className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                          >
                            End Fast
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-400 mb-6">Ready to start your next fast?</p>
                          <button 
                            onClick={() => {
                              const newFast: FastingSession = {
                                id: Math.random().toString(36).substr(2, 9),
                                startTime: Date.now(),
                                targetDuration: 16,
                                status: 'active'
                              };
                              setFastingSessions([...fastingSessions, newFast]);
                            }}
                            className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-colors"
                          >
                            Start 16:8 Fast
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                  </div>
                </div>

                <div className="space-y-6">
                  <WeightLossScore score={weightLossScore} />
                  
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                      {movementEntries.slice(-3).reverse().map(entry => (
                        <div key={entry.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                          <div className="p-2 bg-emerald-100 rounded-xl">
                            <Activity className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{entry.type}</p>
                            <p className="text-xs text-slate-400">{entry.duration} mins • {entry.intensity}</p>
                          </div>
                          <p className="text-xs font-medium text-slate-400">{format(entry.timestamp, 'HH:mm')}</p>
                        </div>
                      ))}
                      {movementEntries.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">No activities logged yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-indigo-600 p-6 rounded-[2rem] text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <Trophy className="w-6 h-6" />
                      <h2 className="text-lg font-bold">Daily Goal</h2>
                    </div>
                    <p className="text-indigo-100 text-sm mb-4">You're 75% through your daily movement goal. Keep it up!</p>
                    <div className="w-full bg-indigo-400/30 h-2 rounded-full overflow-hidden">
                      <div className="bg-white h-full w-3/4 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'coaching' && (
            <motion.div 
              key="coaching"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CoachingView 
                stats={todayStats} 
                foodEntries={foodEntries} 
                movementEntries={movementEntries} 
              />
            </motion.div>
          )}

          {activeTab === 'planner' && (
            <motion.div 
              key="planner"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <MenuPlanner />
            </motion.div>
          )}

          {activeTab === 'recipes' && (
            <motion.div 
              key="recipes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Recipes />
            </motion.div>
          )}

          {activeTab === 'food' && (
            <motion.div 
              key="food"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Log a Meal</h2>
                  <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-600 rounded-xl font-bold hover:bg-violet-200 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    Scan Food
                  </button>
                </div>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newEntry: FoodEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: formData.get('name') as string,
                    calories: Number(formData.get('calories')),
                    protein: Number(formData.get('protein')),
                    fiber: Number(formData.get('fiber')),
                    carbs: Number(formData.get('carbs')),
                    fat: Number(formData.get('fat')),
                    sugar: Number(formData.get('sugar')),
                    timestamp: Date.now()
                  };
                  setFoodEntries([...foodEntries, newEntry]);
                  (e.target as HTMLFormElement).reset();
                }}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Meal Name</label>
                    <input name="name" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="e.g. Avocado Toast" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Calories (kcal)</label>
                    <input name="calories" type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="0" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Protein (g)</label>
                      <input name="protein" type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Fiber (g)</label>
                      <input name="fiber" type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Carbs (g)</label>
                      <input name="carbs" type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Fat (g)</label>
                      <input name="fat" type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Sugar (g)</label>
                      <input name="sugar" type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-violet-500 outline-none" placeholder="0" />
                    </div>
                  </div>
                  <button type="submit" className="md:col-span-2 bg-violet-600 text-white p-4 rounded-2xl font-bold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Log Meal
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Today's Meals</h2>
                <div className="space-y-4">
                  {foodEntries.filter(e => isToday(e.timestamp)).reverse().map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-100 rounded-xl">
                          <Utensils className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{entry.name}</p>
                          <p className="text-xs text-slate-400">{format(entry.timestamp, 'HH:mm')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800">{entry.calories} kcal</p>
                        <p className="text-xs text-slate-400">P: {entry.protein}g • F: {entry.fiber}g</p>
                      </div>
                    </div>
                  ))}
                  {foodEntries.filter(e => isToday(e.timestamp)).length === 0 && (
                    <p className="text-center text-slate-400 py-8">No meals logged today.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'hydration' && (
            <motion.div 
              key="hydration"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                <div className="inline-flex p-6 bg-blue-50 rounded-[2.5rem] mb-6">
                  <Droplets className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{todayStats.water} ml</h2>
                <p className="text-slate-400 mb-8">Daily Goal: 2,500 ml</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[250, 500, 750, 1000].map(amount => (
                    <button 
                      key={amount}
                      onClick={() => {
                        const newEntry: HydrationEntry = {
                          id: Math.random().toString(36).substr(2, 9),
                          amount,
                          timestamp: Date.now()
                        };
                        setHydrationEntries([...hydrationEntries, newEntry]);
                      }}
                      className="p-6 rounded-3xl bg-slate-50 hover:bg-blue-500 hover:text-white transition-all group"
                    >
                      <p className="text-lg font-bold">+{amount}</p>
                      <p className="text-xs opacity-60">ml</p>
                    </button>
                  ))}
                </div>

                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((todayStats.water / 2500) * 100, 100)}%` }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
                <p className="text-sm font-medium text-slate-400">
                  {Math.round((todayStats.water / 2500) * 100)}% of your daily goal
                </p>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Hydration History</h2>
                <div className="space-y-4">
                  {hydrationEntries.filter(e => isToday(e.timestamp)).reverse().map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Droplets className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="font-bold text-slate-800">{entry.amount} ml</p>
                      </div>
                      <p className="text-xs font-medium text-slate-400">{format(entry.timestamp, 'HH:mm')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'movement' && (
            <motion.div 
              key="movement"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Log Activity</h2>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newEntry: MovementEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: formData.get('type') as string,
                    duration: Number(formData.get('duration')),
                    intensity: formData.get('intensity') as any,
                    timestamp: Date.now()
                  };
                  setMovementEntries([...movementEntries, newEntry]);
                  (e.target as HTMLFormElement).reset();
                }}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Activity Type</label>
                    <input name="type" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Running, Yoga" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Duration (min)</label>
                    <input name="duration" type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Intensity</label>
                    <select name="intensity" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none appearance-none">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <button type="submit" className="md:col-span-2 bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Log Activity
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Movement</h2>
                <div className="space-y-4">
                  {movementEntries.filter(e => isToday(e.timestamp)).reverse().map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <Activity className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{entry.type}</p>
                          <p className="text-xs text-slate-400">{entry.duration} mins • {entry.intensity} intensity</p>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-400">{format(entry.timestamp, 'HH:mm')}</p>
                    </div>
                  ))}
                  {movementEntries.filter(e => isToday(e.timestamp)).length === 0 && (
                    <p className="text-center text-slate-400 py-8">No activities logged today.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'fasting' && (
            <motion.div 
              key="fasting"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-slate-900 p-10 rounded-[3rem] text-white text-center relative overflow-hidden">
                <div className="relative z-10">
                  <Timer className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                  {activeFasting ? (
                    <>
                      <h2 className="text-4xl font-mono font-bold mb-4">
                        {formatDuration(Date.now() - activeFasting.startTime)}
                      </h2>
                      <p className="text-slate-400 mb-10">Current Fast: 16:8 Protocol</p>
                      <div className="flex justify-center gap-4">
                        <button 
                          onClick={() => {
                            const updated = fastingSessions.map(s => s.id === activeFasting.id ? { ...s, status: 'completed', endTime: Date.now() } : s);
                            setFastingSessions(updated as FastingSession[]);
                          }}
                          className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                        >
                          End Fast
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-bold mb-4">Ready to Fast?</h2>
                      <p className="text-slate-400 mb-10">Choose a protocol to begin your journey.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                        <ProtocolCard 
                          title="16:8 Protocol" 
                          desc="16h fast, 8h window" 
                          onClick={() => {
                            const newFast: FastingSession = {
                              id: Math.random().toString(36).substr(2, 9),
                              startTime: Date.now(),
                              targetDuration: 16,
                              status: 'active'
                            };
                            setFastingSessions([...fastingSessions, newFast]);
                          }}
                        />
                        <ProtocolCard 
                          title="18:6 Protocol" 
                          desc="18h fast, 6h window" 
                          onClick={() => {
                            const newFast: FastingSession = {
                              id: Math.random().toString(36).substr(2, 9),
                              startTime: Date.now(),
                              targetDuration: 18,
                              status: 'active'
                            };
                            setFastingSessions([...fastingSessions, newFast]);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Fasting History</h2>
                <div className="space-y-4">
                  {fastingSessions.filter(s => s.status === 'completed').reverse().slice(0, 5).map(session => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-200 rounded-xl">
                          <History className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{format(session.startTime, 'MMM d, yyyy')}</p>
                          <p className="text-xs text-slate-400">{format(session.startTime, 'HH:mm')} - {format(session.endTime!, 'HH:mm')}</p>
                        </div>
                      </div>
                      <p className="font-mono font-bold text-emerald-600">
                        {formatDuration(session.endTime! - session.startTime)}
                      </p>
                    </div>
                  ))}
                  {fastingSessions.filter(s => s.status === 'completed').length === 0 && (
                    <p className="text-center text-slate-400 py-8">No completed fasts yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {isScannerOpen && (
        <FoodScanner 
          onFoodDetected={(entry) => {
            const newEntry: FoodEntry = {
              ...entry,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: Date.now()
            };
            setFoodEntries([...foodEntries, newEntry]);
            setIsScannerOpen(false);
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      <AnimatePresence>
        {isAssistantOpen && (
          <AIAssistant 
            userStats={todayStats}
            onClose={() => setIsAssistantOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Quick Action Button (Mobile) */}
      <div className="fixed bottom-24 right-6 md:hidden flex flex-col gap-4">
        <button 
          onClick={() => setIsAssistantOpen(true)}
          className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// --- Helper Components & Functions ---

const NavIcon = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 transition-all duration-300",
      active ? "text-slate-900 scale-110" : "text-slate-400 hover:text-slate-600"
    )}
  >
    <div className={cn(
      "p-2 rounded-xl transition-colors",
      active ? "bg-slate-100" : "bg-transparent"
    )}>
      <Icon className="w-6 h-6" />
    </div>
    <span className="text-[10px] font-bold uppercase tracking-tighter md:hidden">{label}</span>
  </button>
);

const ProtocolCard = ({ title, desc, onClick }: any) => (
  <button 
    onClick={onClick}
    className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left group"
  >
    <h3 className="font-bold mb-1 group-hover:text-emerald-400 transition-colors">{title}</h3>
    <p className="text-xs text-slate-500">{desc}</p>
  </button>
);

function formatDuration(ms: number) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
}
