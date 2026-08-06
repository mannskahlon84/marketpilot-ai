'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, Play, Sparkles, Settings2, Video, CheckCircle2, Share2, Film, Home, ArrowRight, Building2, UploadCloud } from 'lucide-react';

const steps = [
  { id: 'landing', duration: 3000 },
  { id: 'workspace', duration: 3000 },
  { id: 'industry', duration: 3000 },
  { id: 'campaign', duration: 4000 },
  { id: 'generation', duration: 5000 },
  { id: 'studio', duration: 5000 },
];

export default function ProductDemo() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const runStep = () => {
      const step = steps[currentStepIndex];
      timeoutId = setTimeout(() => {
        setCurrentStepIndex((prev) => (prev + 1) % steps.length);
      }, step.duration);
    };

    runStep();

    return () => clearTimeout(timeoutId);
  }, [currentStepIndex]);

  const stepId = steps[currentStepIndex].id;

  return (
    <div className="relative w-full aspect-[16/10] max-w-4xl mx-auto bg-white dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col ring-1 ring-slate-900/5 dark:ring-white/10">
      {/* Fake Browser Header */}
      <div className="h-12 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4 shrink-0">
         <div className="flex gap-2">
           <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
           <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
           <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
         </div>
         <div className="flex-1 flex justify-center">
           <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium w-64 text-center shadow-sm flex items-center justify-center gap-2">
             <span>marketpilot.ai</span>
           </div>
         </div>
         <div className="w-16" /> {/* Spacer for symmetry */}
      </div>

      <div className="flex-1 relative overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <AnimatePresence mode="wait">
          {stepId === 'landing' && <LandingScreen key="landing" />}
          {stepId === 'workspace' && <WorkspaceScreen key="workspace" />}
          {stepId === 'industry' && <IndustryScreen key="industry" />}
          {stepId === 'campaign' && <CampaignScreen key="campaign" />}
          {stepId === 'generation' && <GenerationScreen key="generation" />}
          {stepId === 'studio' && <StudioScreen key="studio" />}
        </AnimatePresence>

        {/* Animated Mouse Cursor */}
        <AnimatedCursor stepId={stepId} />
      </div>
    </div>
  );
}

// --- Screens ---

function LandingScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white dark:bg-slate-950 flex flex-col">
       <div className="p-4 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center">
         <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            MarketPilot
         </div>
         <div className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-full">Log In</div>
       </div>
       <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
         <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Cinematic AI Video</h1>
         <p className="text-sm text-slate-500 dark:text-slate-400">Generate targeted campaigns at scale.</p>
         <div className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md shadow-indigo-600/20" id="landing-btn">
           Start Creating Free
         </div>
       </div>
    </motion.div>
  );
}

function WorkspaceScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
       <div className="p-8 w-full max-w-md">
         <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white text-center">Select Workspace</h2>
         <div className="grid grid-cols-2 gap-4">
           <div className="bg-white dark:bg-slate-800 border-2 border-indigo-500 p-5 rounded-2xl shadow-sm relative overflow-hidden" id="workspace-card">
              <div className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Acme Corp</div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Business</div>
           </div>
           <div className="bg-slate-100 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 border-dashed p-5 rounded-2xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">+ New Workspace</span>
           </div>
         </div>
       </div>
    </motion.div>
  );
}

function IndustryScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
       <div className="p-8 w-full max-w-lg">
         <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white text-center">Select Industry</h2>
         <div className="grid grid-cols-3 gap-4">
           <div className="bg-white dark:bg-slate-800 border-2 border-indigo-500 p-4 rounded-2xl text-center shadow-sm" id="industry-hotel">
              <Building2 className="w-8 h-8 mx-auto mb-3 text-indigo-600 dark:text-indigo-400" />
              <div className="font-bold text-slate-900 dark:text-white text-sm">Hotel & Resort</div>
           </div>
           <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-center opacity-70">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg mx-auto mb-3" />
              <div className="font-bold text-slate-900 dark:text-white text-sm">E-Commerce</div>
           </div>
           <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-center opacity-70">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg mx-auto mb-3" />
              <div className="font-bold text-slate-900 dark:text-white text-sm">Real Estate</div>
           </div>
         </div>
       </div>
    </motion.div>
  );
}

function CampaignScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
       <div className="p-8 w-full max-w-lg">
         <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Hotel Campaign Wizard
         </h2>
         <div className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm space-y-6">
            <div>
               <div className="h-4 w-32 bg-slate-100 dark:bg-slate-700 rounded mb-3" />
               <div className="h-10 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
            </div>
            <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-xl text-center flex flex-col items-center justify-center">
               <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
               <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Assets Uploaded (254MB)</span>
            </div>
            <div className="pt-2">
               <div className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold text-center shadow-md shadow-indigo-600/20" id="generate-btn">
                 Generate Cinematic Campaign
               </div>
            </div>
         </div>
       </div>
    </motion.div>
  );
}

function GenerationScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-50 dark:bg-slate-900 flex p-8 gap-6">
       <div className="w-1/3 space-y-4">
         <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
         {[1, 2, 3, 4].map((i) => (
           <motion.div 
             key={i} 
             initial={{ opacity: 0, x: -10 }} 
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: i * 0.8 }}
             className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm"
           >
             <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] text-indigo-600 dark:text-indigo-400">✓</div>
             <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-600 rounded" />
           </motion.div>
         ))}
       </div>
       <div className="w-2/3 bg-slate-900 dark:bg-black rounded-2xl flex flex-col items-center justify-center border border-slate-800 shadow-inner">
           <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin mb-6" />
           <span className="text-white text-sm font-medium tracking-wide">Hybrid AI Processing...</span>
       </div>
    </motion.div>
  );
}

function StudioScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-50 dark:bg-slate-900 p-8 flex flex-col">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Studio</h2>
          <div className="px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-900/50">Completed</div>
       </div>
       <div className="flex gap-6 flex-1 h-full">
         <div className="w-2/3 bg-slate-900 dark:bg-black rounded-2xl relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30" id="play-btn">
                 <Play className="w-6 h-6 text-white ml-1 fill-white" />
               </div>
            </div>
         </div>
         <div className="w-1/3 space-y-4">
           <div className="bg-white dark:bg-slate-800 p-5 border border-slate-200 dark:border-slate-700 rounded-2xl h-full flex flex-col shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Publishing</h3>
              <div className="flex-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700 mb-4 leading-relaxed">
                "Experience luxury like never before. Welcome to our newest resort. ✨🌴 #Luxury"
              </div>
              <div className="mt-auto space-y-3">
                 <div className="w-full py-2.5 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 text-center" id="publish-btn">TikTok (9:16)</div>
                 <div className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold text-center shadow-md shadow-indigo-600/20">Publish Campaign</div>
              </div>
           </div>
         </div>
       </div>
    </motion.div>
  );
}

// --- Cursor Animation ---

function AnimatedCursor({ stepId }: { stepId: string }) {
  // Adjust coordinates for the slightly larger spacing in the redesigned screens
  const cursorVariants = {
    landing: {
      x: [100, 420],
      y: [300, 240],
      scale: [1, 1, 0.9, 1],
      transition: { duration: 3, times: [0, 0.8, 0.9, 1], ease: "easeInOut" }
    },
    workspace: {
      x: [420, 250],
      y: [240, 160],
      scale: [1, 1, 0.9, 1],
      transition: { duration: 3, times: [0, 0.8, 0.9, 1], ease: "easeInOut" }
    },
    industry: {
      x: [250, 200],
      y: [160, 200],
      scale: [1, 1, 0.9, 1],
      transition: { duration: 3, times: [0, 0.8, 0.9, 1], ease: "easeInOut" }
    },
    campaign: {
      x: [200, 400],
      y: [200, 310],
      scale: [1, 1, 0.9, 1],
      transition: { duration: 4, times: [0, 0.8, 0.9, 1], ease: "easeInOut" }
    },
    generation: {
      x: 400,
      y: 310,
      opacity: 0, // hide cursor while generating
      transition: { duration: 5 }
    },
    studio: {
      opacity: 1,
      x: [400, 700, 700],
      y: [310, 260, 310],
      scale: [1, 1, 0.9, 1, 1, 0.9, 1],
      transition: { duration: 5, times: [0, 0.3, 0.4, 0.5, 0.7, 0.8, 0.9], ease: "easeInOut" }
    }
  };

  return (
    <motion.div
      variants={cursorVariants}
      animate={stepId}
      initial="landing"
      className="absolute top-0 left-0 z-50 pointer-events-none drop-shadow-2xl"
      style={{ originX: 0, originY: 0 }}
    >
      <MousePointer2 className="w-8 h-8 text-slate-900 dark:text-white fill-white dark:fill-slate-900" />
      {/* Click ripple effect */}
      <motion.div 
        animate={{ 
           scale: [1, 2.5, 2.5], 
           opacity: [0, 0.5, 0],
        }}
        transition={{ 
           duration: 0.5, 
           repeat: Infinity, 
           repeatDelay: stepId === 'campaign' ? 3.5 : 2.5 
        }}
        className="absolute top-1 left-1 w-5 h-5 bg-indigo-500 rounded-full -z-10"
      />
    </motion.div>
  );
}
