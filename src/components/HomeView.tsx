import React, { useState, useEffect, useRef } from 'react';
import { TabType } from '../types';
import { motion } from 'motion/react';
import { 
  Network, 
  BarChart2, 
  Cpu, 
  Database, 
  Award, 
  ChevronRight, 
  Sparkles, 
  Play, 
  Zap, 
  Flame, 
  Activity, 
  Layers
} from 'lucide-react';

interface HomeViewProps {
  setCurrentTab: (tab: TabType) => void;
}

interface NodePoint {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  glow: boolean;
}

export default function HomeView({ setCurrentTab }: HomeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Initialize interactive nodes immediately so they exist right from the start
  const nodesRef = useRef<NodePoint[]>((() => {
    const defaultLabels = [
      'Dijkstra', 'Sort-Heap', 'First-Fit', 'Quick-Sort', 'A*', 'BFS', 'SJF', 'Round-Robin', 'DFS', 'Merge-Sort'
    ];
    return defaultLabels.map((lbl, idx) => ({
      id: idx,
      x: Math.random() * 600 + 100,
      y: Math.random() * 200 + 50,
      vx: (Math.random() - 0.5) * 1.0,
      vy: (Math.random() - 0.5) * 1.0,
      label: lbl,
      glow: idx % 3 === 0
    }));
  })());

  const mousePosRef = useRef({ x: 0, y: 0 });

  // Connected nodes animation loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler with robust fallback for zero parent dimensions (e.g., hidden states / mount delays)
    const fitToContainer = () => {
      if (canvas.parentElement) {
        const prevWidth = canvas.width;
        let newWidth = canvas.parentElement.clientWidth;
        
        // Use grandparent, window, or standard scale width if parent is unrendered or zero
        if (!newWidth) {
          newWidth = canvas.parentElement.parentElement?.clientWidth || window.innerWidth || 800;
        }

        canvas.width = newWidth;
        canvas.height = 350; // Fixed visual section height

        if (prevWidth && prevWidth !== newWidth && prevWidth > 100) {
          nodesRef.current.forEach(p => {
            p.x = (p.x / prevWidth) * newWidth;
          });
        }
      }
    };
    fitToContainer();
    window.addEventListener('resize', fitToContainer);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const currentNodes = nodesRef.current;
      const mouse = mousePosRef.current;
      
      const widthBound = Math.max(200, canvas.width);
      const heightBound = Math.max(200, canvas.height);

      // Update coordinates
      currentNodes.forEach(p => {
        let nx = p.x + p.vx;
        let ny = p.y + p.vy;

        // Bounce boundaries
        if (nx < 15 || nx > widthBound - 15) p.vx = -p.vx;
        if (ny < 15 || ny > heightBound - 15) p.vy = -p.vy;

        p.x = Math.max(10, Math.min(widthBound - 10, nx));
        p.y = Math.max(10, Math.min(heightBound - 10, ny));
      });

      // Render connected paths with glow
      for (let i = 0; i < currentNodes.length; i++) {
        const nA = currentNodes[i];
        for (let j = i + 1; j < currentNodes.length; j++) {
          const nB = currentNodes[j];
          const dist = Math.hypot(nA.x - nB.x, nA.y - nB.y);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(nA.x, nA.y);
            ctx.lineTo(nB.x, nB.y);
            // Gradient based on distance
            const alpha = (1 - dist / 180) * 0.25;
            ctx.strokeStyle = nA.glow || nB.glow 
              ? `rgba(168, 85, 247, ${alpha})` 
              : `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = nA.glow || nB.glow ? 1.5 : 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      currentNodes.forEach(node => {
        // Draw glow backings
        if (node.glow) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(168, 85, 247, 0.05)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = node.glow ? '#a855f7' : '#06b6d4';
        ctx.shadowColor = node.glow ? '#a855f7' : '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Draw label text
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(node.label, node.x + 12, node.y + 4);
      });

      // Mouse interactive draw
      if (mouse.x > 0 && mouse.y > 0) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 50, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.02)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', fitToContainer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseLeave = () => {
    mousePosRef.current = { x: 0, y: 0 };
  };

  return (
    <div className="w-full min-h-screen bg-[#070709] grid-bg-dots pb-24 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-gradient-glow pointer-events-none -translate-x-1/2 -translate-y-1/2 -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-glow opacity-80 pointer-events-none translate-x-1/2 -z-10" />

      {/* Hero section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 text-center select-none relative z-10 w-full">
        {/* Animated badge */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/25 bg-cyan-950/20 text-cyan-400 font-mono text-[10px] uppercase tracking-wider mb-8"
        >
          <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>v2.4 Live Algorithm Sandbox</span>
        </motion.div>

        {/* Hero title */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-7xl font-display font-bold font-semibold tracking-tight uppercase leading-none max-w-5xl mx-auto"
        >
          Visualizing the <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">Digital Core</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-gray-400 text-sm md:text-lg font-sans max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          Explore interactive, high-fidelity simulations of pathfinding, sorting, CPU scheduling, and memory mapping. Powered by beautiful micro-interactions and real-time complexity analysis.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mt-8"
        >
          <button 
            onClick={() => setCurrentTab('pathfinder')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold tracking-wide flex items-center gap-2 border border-cyan-400/20 cursor-pointer"
            id="home-cta-1"
          >
            <span>START PLAYGROUND</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setCurrentTab('comparison')}
            className="px-6 py-3 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-white font-mono text-xs rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
            id="home-cta-2"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>SORTING ARENA</span>
          </button>
        </motion.div>
      </section>

      {/* Interactive Glowing Node Canvas */}
      <section className="max-w-6xl mx-auto px-6 mt-12 w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative rounded-2xl border border-white/[0.05] bg-[#0c0c0f]/85 overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.8)] h-[350px] p-1 flex flex-col justify-between"
        >
          <div className="absolute top-4 left-6 flex items-center gap-2 z-10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] text-zinc-500 tracking-wider uppercase">INTERACTIVE TOPOLOGICAL MAP</span>
          </div>

          <div className="absolute top-4 right-6 text-right font-mono text-[10px] text-cyan-400 z-10">
            [ HOVER TO DEFLECT NODES ]
          </div>

          <canvas 
            ref={canvasRef} 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full h-full cursor-crosshair opacity-85"
          />

          <div className="absolute bottom-4 left-6 z-10 text-xs font-mono text-slate-500 flex gap-4">
            <span>Dijkstra's Shortest Path</span>
            <span>-</span>
            <span>A* Heuristic Search</span>
            <span>-</span>
            <span>OS Scheduling</span>
          </div>
        </motion.div>
      </section>

      {/* Cyber Statistics */}
      <section className="max-w-7xl mx-auto px-6 mt-20 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { metric: "10+", label: "CORE ALGORITHMS", color: "text-cyan-400" },
            { metric: "O(V + E)", label: "OPTIMIZED SPEED", color: "text-purple-400" },
            { metric: "FPS 60+", label: "FLUID ANIMATIONS", color: "text-emerald-400" },
            { metric: "100%", label: "STATE PERSISTENT", color: "text-amber-400" },
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * idx }}
              className="glass p-5 rounded-xl border border-white/[0.04] text-center"
            >
              <div className={`text-2xl md:text-4xl font-display font-medium ${stat.color} tracking-tight`}>
                {stat.metric}
              </div>
              <div className="text-[10px] font-mono text-slate-400 tracking-widest mt-1 uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bento Grid Feature Cards */}
      <section className="max-w-7xl mx-auto px-6 mt-24 w-full">
        <h2 className="text-xl md:text-3xl font-display font-bold font-medium tracking-tight mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase flex items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400" />
          <span>ALGORITHM EXPERIMENT SUITES</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pathfinder Card */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer flex flex-col justify-between h-[280px]"
            onClick={() => setCurrentTab('pathfinder')}
            id="feature-pathfinder"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 flex items-center justify-center border border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-300">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-100 mt-5 group-hover:text-cyan-400 transition-colors">Pathfinder Sandbox</h3>
              <p className="text-slate-400 text-xs font-sans mt-3 leading-relaxed">
                Draw maze walls, configure start and target nodes interactively, and visualize Dijkstra, A*, BFS, or DFS step-by-step with real-time complexity calculations.
              </p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="font-mono text-[9px] text-cyan-400/80">4 ALGORITHMS</span>
              <span className="text-xs font-mono text-slate-500 group-hover:text-cyan-400 flex items-center transition-colors">
                LAUNCH <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </motion.div>

          {/* Sorting Card */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer flex flex-col justify-between h-[280px]"
            onClick={() => setCurrentTab('sorting')}
            id="feature-sorting"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-950/40 flex items-center justify-center border border-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-black transition-all duration-300">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-100 mt-5 group-hover:text-purple-400 transition-colors">Sorting Visualizer</h3>
              <p className="text-slate-400 text-xs font-sans mt-3 leading-relaxed">
                Interact with size sliders and real-time color states identifying pivots and swaps. Compares processes between Quick, Heap, and Merge Sort.
              </p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="font-mono text-[9px] text-purple-400/80">3 ALGORITHMS</span>
              <span className="text-xs font-mono text-slate-500 group-hover:text-purple-400 flex items-center transition-colors">
                LAUNCH <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </motion.div>

          {/* CPU Scheduler Card */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer flex flex-col justify-between h-[280px]"
            onClick={() => setCurrentTab('cpu')}
            id="feature-cpu"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-950/40 flex items-center justify-center border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-300">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-100 mt-5 group-hover:text-emerald-400 transition-colors">CPU Simulator</h3>
              <p className="text-slate-400 text-xs font-sans mt-3 leading-relaxed">
                Visualizing Kernel execution via Round-Robin and Shortest-Job First (SJF) dispatchers. Complete with real-time process statistics and Gantt chart generation.
              </p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="font-mono text-[9px] text-emerald-400/80">2 DISPATCHERS</span>
              <span className="text-xs font-mono text-slate-500 group-hover:text-emerald-400 flex items-center transition-colors">
                LAUNCH <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </motion.div>

          {/* Memory Allocator Card */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer flex flex-col justify-between h-[280px] md:col-span-2"
            onClick={() => setCurrentTab('memory')}
            id="feature-memory"
          >
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start h-full">
              <div className="max-w-md">
                <div className="w-10 h-10 rounded-xl bg-orange-950/40 flex items-center justify-center border border-orange-500/20 text-orange-400 group-hover:bg-orange-500 group-hover:text-black transition-all duration-300">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-100 mt-5 group-hover:text-orange-400 transition-colors">Memory Allocation Mapping</h3>
                <p className="text-slate-400 text-xs font-sans mt-3 leading-relaxed">
                  Simulate operating system physical layout mapping with First-Fit mechanisms. Keep track of fragmentation and process status on interactive segment blocks.
                </p>
              </div>
              
              {/* Decorative block diagram for memory allocator */}
              <div className="w-full md:w-48 bg-[#09090c] border border-white/[0.05] p-3 rounded-xl flex flex-col gap-2 relative pointer-events-none mt-2 self-center">
                <div className="text-[9px] font-mono text-zinc-500 tracking-wider">PHYSICAL OS BLOCK MAP</div>
                <div className="flex flex-col gap-1.5 font-mono text-[8px]">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-1.5 rounded flex justify-between items-center text-emerald-300">
                    <span>Block 1: Sys - 128KB</span>
                    <span>ACTIVE</span>
                  </div>
                  <div className="bg-transparent border border-white/5 p-1.5 rounded flex justify-between items-center text-zinc-600">
                    <span>Block 2: Free - 256KB</span>
                    <span>EMPTY</span>
                  </div>
                  <div className="bg-orange-500/15 border border-orange-500/30 p-1.5 rounded flex justify-between items-center text-orange-300">
                    <span>Block 3: App - 512KB</span>
                    <span>FIRST-FIT</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span className="font-mono text-[9px] text-orange-400/80">FIRST-FIT SIMULATION</span>
              <span className="text-xs font-mono text-slate-500 group-hover:text-orange-400 flex items-center transition-colors">
                LAUNCH <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </motion.div>

          {/* Comparison Card */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer flex flex-col justify-between h-[280px]"
            onClick={() => setCurrentTab('comparison')}
            id="feature-comparison"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-pink-950/40 flex items-center justify-center border border-pink-500/20 text-pink-400 group-hover:bg-pink-500 group-hover:text-black transition-all duration-300">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-100 mt-5 group-hover:text-pink-400 transition-colors">The Sorting Arena</h3>
              <p className="text-slate-400 text-xs font-sans mt-3 leading-relaxed">
                Run recursive algorithms simultaneously side-by-side to compare absolute runtime, swaps, and core comparisons tally on identical random arrays.
              </p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="font-mono text-[9px] text-pink-400/80">SPEED DUELS</span>
              <span className="text-xs font-mono text-slate-500 group-hover:text-pink-400 flex items-center transition-colors">
                LAUNCH <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
