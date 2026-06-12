import React, { useState, useEffect } from 'react';
import { TabType } from './types';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PathfindingVisualizer from './components/PathfindingVisualizer';
import SortingVisualizer from './components/SortingVisualizer';
import CPUScheduler from './components/CPUScheduler';
import MemoryAllocator from './components/MemoryAllocator';
import ComparisonArena from './components/ComparisonArena';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ShieldCheck, Heart, Github } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Optional custom cursor glow movement tracking
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'home':
        return <HomeView setCurrentTab={setCurrentTab} />;
      case 'pathfinder':
        return <PathfindingVisualizer />;
      case 'sorting':
        return <SortingVisualizer />;
      case 'cpu':
        return <CPUScheduler />;
      case 'memory':
        return <MemoryAllocator />;
      case 'comparison':
        return <ComparisonArena />;
      default:
        return <HomeView setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] bg-grid-fly text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      
      {/* Dynamic Cursor Glow Dot */}
      <div 
        className="pointer-events-none fixed w-[500px] h-[500px] rounded-full bg-radial-gradient-glow opacity-30 mix-blend-screen -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-300 ease-out hidden md:block"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 60%)',
          pointerEvents: 'none'
        }}
      />

      {/* Glowing horizontal laser boundary */}
      <div 
        className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/50 to-purple-600/50 z-50 shadow-[0_1px_15px_rgba(6,182,212,0.5)]"
        style={{ pointerEvents: 'none' }}
      />

      {/* Navigation Layer */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Core View Container mapped with Framer Motion entering animations to represent route transitions */}
      <main className="flex-1 w-full bg-gradient-to-b from-transparent via-[#09090c]/50 to-[#050507] relative z-10" id="visualizers">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Cybernetic Footer */}
      <footer className="w-full glass-header py-8 border-t border-white/[0.04] text-center font-mono text-[10px] text-zinc-500 relative z-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ALGOVISTA MAIN TERMINAL ONLINE</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with precision</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse fill-rose-500" />
            <span>using React & Tailwind</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-650">v2.4.0 [STA_BUILD]</span>
            <span className="hidden md:inline">SYSTEMS OPERABILITY: 100%</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
