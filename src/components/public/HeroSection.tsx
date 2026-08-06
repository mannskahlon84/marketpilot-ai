'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center">
        <div className="absolute top-[20%] w-[800px] h-[500px] bg-indigo-50 dark:bg-indigo-900/20 rounded-[100%] blur-[120px] opacity-70" />
        <div className="absolute top-[40%] right-[10%] w-[600px] h-[400px] bg-purple-50 dark:bg-purple-900/20 rounded-[100%] blur-[100px] opacity-50" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto space-y-8"
      >
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-indigo-500/30 bg-white dark:bg-indigo-500/10 text-slate-600 dark:text-indigo-300 text-sm font-medium shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>MarketPilot 2.0 is now live</span>
          </div>
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          Cinematic AI Video <br className="hidden sm:block" /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">At Enterprise Scale</span>
        </motion.h1>

        <motion.p variants={itemVariants} className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Generate highly targeted, on-brand video campaigns. MarketPilot adapts instantly to your industry and brand identity using advanced Hybrid AI Directors.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link href="/login" className="px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
            Start Creating Free
          </Link>
          <a href="#demo" className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group">
            <Play className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            Watch Demo
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
