import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-violet-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-violet-500/20"
      >
        {/* Mascot */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="mb-6"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-400 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-2">Luby</h1>
        <p className="text-violet-300 mb-8">Your health & wellness companion</p>

        <button
          onClick={onLogin}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
        >
          Sign in to get started
        </button>

        <p className="text-slate-500 text-sm mt-6">
          Track food, hydration, movement & more
        </p>
      </motion.div>
    </div>
  );
};
