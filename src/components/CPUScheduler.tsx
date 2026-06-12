import React, { useState, useEffect, useRef } from 'react';
import { CPUProcess, GanttSegment, CPUSchedulerAlgo, PerformanceMetrics } from '../types';
import { motion } from 'motion/react';
import { 
  Play, 
  RotateCcw, 
  Plus, 
  Check, 
  Info, 
  Sliders, 
  Cpu, 
  Layers, 
  ChevronRight, 
  Sparkles,
  Award
} from 'lucide-react';

export default function CPUScheduler() {
  const [processes, setProcesses] = useState<CPUProcess[]>([
    { id: '1', name: 'P1', arrivalTime: 0, burstTime: 8, remainingTime: 8, completionTime: 0, turnaroundTime: 0, waitingTime: 0, color: 'bg-cyan-500 text-cyan-200' },
    { id: '2', name: 'P2', arrivalTime: 1, burstTime: 4, remainingTime: 4, completionTime: 0, turnaroundTime: 0, waitingTime: 0, color: 'bg-purple-500 text-purple-200' },
    { id: '3', name: 'P3', arrivalTime: 2, burstTime: 9, remainingTime: 9, completionTime: 0, turnaroundTime: 0, waitingTime: 0, color: 'bg-emerald-500 text-emerald-200' },
    { id: '4', name: 'P4', arrivalTime: 3, burstTime: 5, remainingTime: 5, completionTime: 0, turnaroundTime: 0, waitingTime: 0, color: 'bg-amber-500 text-amber-200' },
  ]);

  const [algo, setAlgo] = useState<CPUSchedulerAlgo>('rr');
  const [quantum, setQuantum] = useState(3);
  const [speedMs, setSpeedMs] = useState(40);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>(['CPU Core Dispatcher ready. Ready for mock operations.']);

  // Custom process inputs
  const [newProcessName, setNewProcessName] = useState('P5');
  const [newBurst, setNewBurst] = useState(6);
  const [newArrival, setNewArrival] = useState(4);

  // States to trace execution metrics
  const [gantt, setGantt] = useState<GanttSegment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [avgWait, setAvgWait] = useState(0);
  const [avgTurnaround, setAvgTurnaround] = useState(0);

  // Stop running execution references
  const runningIntervalRef = useRef<number | null>(null);

  // Stop animation/sim ticks
  const stopSim = () => {
    if (runningIntervalRef.current) {
      clearInterval(runningIntervalRef.current);
      runningIntervalRef.current = null;
    }
    setIsRunning(false);
  };

  // Reset simulator
  const resetSim = (keepOriginalProcesses = true) => {
    stopSim();
    setCurrentTime(0);
    setGantt([]);
    setAvgWait(0);
    setAvgTurnaround(0);
    setLogs(['Process registers flushed. CPU cycles set to zero.']);

    setProcesses(p => p.map(proc => ({
      ...proc,
      remainingTime: proc.burstTime,
      completionTime: 0,
      turnaroundTime: 0,
      waitingTime: 0
    })));
  };

  // Add process dynamically
  const addProcess = () => {
    if (processes.length >= 7) {
      setLogs(prev => [...prev, 'Warning: Kernel process registers saturated (Max 7 processes).']);
      return;
    }

    const colors = [
      'bg-cyan-500 text-cyan-100',
      'bg-purple-500 text-purple-100',
      'bg-emerald-500 text-emerald-100',
      'bg-amber-500 text-amber-100',
      'bg-pink-500 text-pink-100',
      'bg-blue-500 text-blue-100',
      'bg-orange-500 text-orange-100',
    ];

    const pickColor = colors[processes.length % colors.length];

    const newProc: CPUProcess = {
      id: (processes.length + 1).toString(),
      name: newProcessName.trim() || `P${processes.length + 1}`,
      arrivalTime: newArrival,
      burstTime: newBurst,
      remainingTime: newBurst,
      completionTime: 0,
      turnaroundTime: 0,
      waitingTime: 0,
      color: pickColor
    };

    setProcesses(prev => [...prev, newProc]);
    setLogs(prev => [...prev, `Created process register ${newProc.name} [Arrival: ${newProc.arrivalTime}, Burst: ${newProc.burstTime}]`]);
    setNewProcessName(`P${processes.length + 2}`);
  };

  // Run CPU calculation in-memory and animate sequentially
  const runScheduler = () => {
    if (isRunning) {
      stopSim();
      return;
    }

    resetSim();
    setIsRunning(true);
    setLogs(prev => [...prev, `Starting kernel dispatcher execution: ${algo === 'rr' ? 'Round Robin (Q=' + quantum + ')' : 'Shortest Job First (SJF)'}...`]);

    const procCopy = processes.map(p => ({ ...p }));
    const calculatedGantt: GanttSegment[] = [];
    let time = 0;
    
    // Perform simulated OS algorithms
    if (algo === 'sjf') {
      // Non-preemptive Shortest Job First
      const completedIds = new Set<string>();
      
      while (completedIds.size < procCopy.length) {
        // Find processes currently available to run other than already completed
        const available = procCopy.filter(p => p.arrivalTime <= time && !completedIds.has(p.id));

        if (available.length === 0) {
          // If no processes arrived, idle CPU step
          const nextArrival = Math.min(...procCopy.filter(p => !completedIds.has(p.id)).map(p => p.arrivalTime));
          calculatedGantt.push({
            processName: 'IDLE',
            startTime: time,
            endTime: nextArrival,
            color: 'bg-zinc-800 text-zinc-500'
          });
          time = nextArrival;
          continue;
        }

        // Sort by shortest burst time
        available.sort((a, b) => a.burstTime - b.burstTime);
        const nextToRun = available[0];

        // Run process to completion
        const start = time;
        const end = time + nextToRun.burstTime;
        time = end;

        calculatedGantt.push({
          processName: nextToRun.name,
          startTime: start,
          endTime: end,
          color: nextToRun.color
        });

        const targetProc = procCopy.find(p => p.id === nextToRun.id);
        if (targetProc) {
          targetProc.completionTime = end;
          targetProc.turnaroundTime = end - targetProc.arrivalTime;
          targetProc.waitingTime = targetProc.turnaroundTime - targetProc.burstTime;
          targetProc.remainingTime = 0;
        }

        completedIds.add(nextToRun.id);
      }
    } else {
      // Round Robin loop
      let queue: CPUProcess[] = [];
      const visited = new Set<string>();
      let idleStart = -1;

      // Queue up initially arrived processes
      const addArrivedToQueue = (t: number) => {
        // Sort arrived by arrival time first
        const arrived = procCopy.filter(p => p.arrivalTime <= t && !visited.has(p.id));
        arrived.sort((a, b) => a.arrivalTime - b.arrivalTime);
        arrived.forEach(a => {
          queue.push(a);
          visited.add(a.id);
        });
      };

      addArrivedToQueue(time);

      while (queue.length > 0 || procCopy.some(p => p.remainingTime > 0)) {
        if (queue.length === 0) {
          if (idleStart === -1) idleStart = time;
          time++;
          addArrivedToQueue(time);
          continue;
        }

        if (idleStart !== -1) {
          calculatedGantt.push({
            processName: 'IDLE',
            startTime: idleStart,
            endTime: time,
            color: 'bg-zinc-800 text-zinc-500'
          });
          idleStart = -1;
        }

        const currentProc = queue.shift()!;
        const execTime = Math.min(quantum, currentProc.remainingTime);

        calculatedGantt.push({
          processName: currentProc.name,
          startTime: time,
          endTime: time + execTime,
          color: currentProc.color
        });

        time += execTime;
        currentProc.remainingTime -= execTime;

        // Add any newly arrived processes during execution window before re-queuing
        addArrivedToQueue(time);

        if (currentProc.remainingTime > 0) {
          queue.push(currentProc); // Re-queue
        } else {
          // Finished
          currentProc.completionTime = time;
          currentProc.turnaroundTime = time - currentProc.arrivalTime;
          currentProc.waitingTime = currentProc.turnaroundTime - currentProc.burstTime;
        }
      }
    }

    // Sequentially animate the calculated timeline
    let ganttIdx = 0;
    runningIntervalRef.current = window.setInterval(() => {
      if (ganttIdx >= calculatedGantt.length) {
        stopSim();
        setLogs(prev => [...prev, 'Gantt execution completed. Context switch records finalized.']);
        
        // Final calculations of averages
        const finalProc = procCopy.map(pc => ({
          ...pc,
          remainingTime: 0
        }));
        
        setProcesses(finalProc);
        setGantt(calculatedGantt);
        setCurrentTime(time);

        const totalWait = finalProc.reduce((acc, current) => acc + current.waitingTime, 0);
        const totalTAT = finalProc.reduce((acc, current) => acc + current.turnaroundTime, 0);
        setAvgWait(parseFloat((totalWait / finalProc.length).toFixed(2)));
        setAvgTurnaround(parseFloat((totalTAT / finalProc.length).toFixed(2)));
        return;
      }

      // Draw gantt segments incrementally
      const segment = calculatedGantt[ganttIdx];
      setGantt(prev => [...prev, segment]);
      setCurrentTime(segment.endTime);
      setLogs(prev => [...prev, `[Tick ${segment.startTime} -> ${segment.endTime}] Dispatched ${segment.processName}`]);

      // update processes active remaining times visually
      setProcesses(prev => prev.map(p => {
        if (p.name === segment.processName) {
          const runTimeSpent = segment.endTime - segment.startTime;
          const updatedRem = Math.max(0, p.remainingTime - runTimeSpent);
          
          // If completely finished, populate row details
          if (updatedRem === 0) {
            const calculatedTarget = procCopy.find(pc => pc.name === p.name);
            return {
              ...p,
              remainingTime: 0,
              completionTime: segment.endTime,
              turnaroundTime: calculatedTarget?.turnaroundTime || 0,
              waitingTime: calculatedTarget?.waitingTime || 0
            };
          }

          return { ...p, remainingTime: updatedRem };
        }
        return p;
      }));

      ganttIdx++;
    }, speedMs * 15);
  };

  const algorithmData = {
    rr: {
      name: 'Round Robin',
      timeComplexity: 'O(N * C)',
      preemptive: 'Yes',
      suitability: 'Time-sharing environments',
      principle: 'Ticks cyclic slices in a queue.'
    },
    sjf: {
      name: 'Shortest Job First',
      timeComplexity: 'O(N log N)',
      preemptive: 'No',
      suitability: 'Batch execution units',
      principle: 'Prioritizes shortest execution times.'
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto text-slate-100 select-none pb-24">
      {/* Parameters Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-5">
        
        {/* Core Controls */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="font-display font-medium text-xs tracking-wider uppercase text-emerald-400">Scheduler setup</span>
            <span className="font-mono text-[9px] text-zinc-500">[CONTROLS]</span>
          </div>

          {/* Algorithm Type */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-slate-400 uppercase">SCHEDULING ALGORITHM</label>
            <div className="grid grid-cols-2 gap-1.5 font-sans">
              {(['rr', 'sjf'] as const).map(item => (
                <button
                  key={item}
                  disabled={isRunning}
                  id={`btn-cpu-algo-${item}`}
                  onClick={() => {
                    setAlgo(item);
                    resetSim();
                  }}
                  className={`px-2 py-2 text-left rounded-xl text-xs font-medium border cursor-pointer ${
                    algo === item
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                      : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span className="font-mono uppercase text-[8px] block text-zinc-500">
                    {item === 'rr' ? 'PREEMPTIVE' : 'NON-PREEMPT'}
                  </span>
                  {item === 'rr' ? 'Round Robin' : 'SJF'}
                </button>
              ))}
            </div>
          </div>

          {/* Quantum Slider for Round Robin */}
          {algo === 'rr' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-2"
            >
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">TIME QUANTUM</span>
                <span className="text-emerald-400">{quantum} Ticks</span>
              </div>
              <input 
                type="range"
                min="1"
                max="8"
                step="1"
                value={quantum}
                disabled={isRunning}
                onChange={(e) => setQuantum(Number(e.target.value))}
                className="accent-emerald-400 bg-white/10 h-1 rounded-lg cursor-pointer animate-pulse"
              />
            </motion.div>
          )}

          {/* Speed range */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">TICK FREQUENCY</span>
              <span className="text-emerald-400">X{60 - speedMs}</span>
            </div>
            <input 
              type="range"
              min="10"
              max="55"
              step="5"
              value={speedMs}
              disabled={isRunning}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="accent-emerald-400 bg-white/10 h-1 rounded-lg cursor-pointer"
            />
          </div>

          {/* Dispatch CTAs */}
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={runScheduler}
              id="btn-run-cpu"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl font-mono text-xs text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isRunning ? 'HALT EXECUTION' : 'RUN CPU CORES'}</span>
            </button>

            <button
              onClick={() => resetSim()}
              disabled={isRunning}
              id="btn-reset-cpu"
              className="py-1.5 bg-zinc-950 border border-white/5 text-slate-300 font-mono text-[10px] rounded-lg hover:bg-white/[0.03] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>FLUSH REGISTERS</span>
            </button>
          </div>
        </div>

        {/* Dynamic creation form */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col gap-3 font-sans">
          <div className="text-xs uppercase text-slate-300 font-display font-medium text-emerald-400 font-mono">SPAWN PROCESS</div>
          
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] text-zinc-500">PROCESS IDENTIFIER</label>
            <input 
              type="text" 
              maxLength={4}
              value={newProcessName}
              disabled={isRunning}
              onChange={(e) => setNewProcessName(e.target.value)}
              className="bg-[#0b0b0d] border border-white/5 p-2 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-zinc-500">ARRIVAL (0-10)</label>
              <input 
                type="number" 
                min={0}
                max={10}
                value={newArrival}
                disabled={isRunning}
                onChange={(e) => setNewArrival(Math.max(0, Math.min(10, Number(e.target.value))))}
                className="bg-[#0b0b0d] border border-white/5 p-2 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-zinc-500">BURST (1-15)</label>
              <input 
                type="number" 
                min={1}
                max={15}
                value={newBurst}
                disabled={isRunning}
                onChange={(e) => setNewBurst(Math.max(1, Math.min(15, Number(e.target.value))))}
                className="bg-[#0b0b0d] border border-white/5 p-2 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <button
            onClick={addProcess}
            disabled={isRunning}
            id="btn-add-process"
            className="w-full py-2 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] rounded-xl font-mono text-[10px] text-white flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>QUEUE REGISTER</span>
          </button>
        </div>

      </div>

      {/* Main Core Display Screen */}
      <div className="flex-1 flex flex-col gap-5">
        
        {/* Statistics highlights */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: `${avgWait} cyc`, label: "AVERAGE WAIT TIME", color: "text-emerald-400", sub: "WT ESTIMATED" },
            { value: `${avgTurnaround} cyc`, label: "AVERAGE TURNAROUND", color: "text-purple-400", sub: "TAT ORIGINAL" },
            { value: isRunning ? '98.5%' : '0.0%', label: "CPU CORE SATURATION", color: "text-cyan-400", sub: "CYCLES DISPATCHED" }
          ].map((m, idx) => (
            <div key={idx} className="glass p-4 rounded-xl border border-white/[0.04]">
              <div className="text-[9px] font-mono text-slate-500 tracking-wider uppercase">{m.label}</div>
              <div className={`text-xl font-display font-semibold mt-1 ${m.color}`}>{m.value}</div>
              <div className="text-[8px] font-mono text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Live physical Gantt chart block */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] shadow-lg flex flex-col gap-3 relative min-h-[140px] justify-center bg-[#09090c]/90">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pb-2 border-b border-white/5">
            <span>CPU CORE EXECUTION GANTT TIMELINE</span>
            <span>CYCLES: {currentTime}</span>
          </div>

          <div className="flex items-stretch overflow-x-auto gap-[1.5px] bg-[#111116] border border-white/[0.04] p-1.5 rounded-xl h-20 min-w-full">
            {gantt.length === 0 ? (
              <div className="flex-1 flex items-center justify-center font-mono text-xs text-zinc-600">
                [ GANTT MAP EMPTY - TRIGGER SCHEDULER ABOVE ]
              </div>
            ) : (
              gantt.map((seg, idx) => {
                const burstDuration = seg.endTime - seg.startTime;
                return (
                  <motion.div
                    key={idx}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className={`flex flex-col items-center justify-center p-1 font-mono rounded-lg transition-colors origin-left ${seg.color}`}
                    style={{ flexGrow: burstDuration, minWidth: '40px' }}
                  >
                    <span className="text-xs font-bold">{seg.processName}</span>
                    <span className="text-[8px] opacity-80 mt-0.5">
                      {seg.startTime}-{seg.endTime}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Process registry list map */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] shadow-lg flex flex-col gap-2 overflow-x-auto">
          <div className="text-xs font-mono text-zinc-400 pb-1.5 border-b border-white/5">CPU TASK MANAGEMENT SPACE</div>
          
          <table className="w-full text-left font-mono text-[11px] border-collapse min-w-[450px]">
            <thead>
              <tr className="text-zinc-500 border-b border-white/5">
                <th className="py-2 font-medium">NAME</th>
                <th className="py-2 text-center font-medium">ARRIVAL (AT)</th>
                <th className="py-2 text-center font-medium">BURST (BT)</th>
                <th className="py-2 text-center font-medium">REMAINING</th>
                <th className="py-2 text-center font-medium">COMPLETED (CT)</th>
                <th className="py-2 text-center font-medium">TURNAROUND (TAT)</th>
                <th className="py-2 text-center font-medium">WAITING (WT)</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((proc) => {
                const finished = proc.remainingTime === 0 && currentTime > 0;
                return (
                  <tr 
                    key={proc.id} 
                    className={`border-b border-white/[0.04] py-1.5 transition-colors ${
                      proc.remainingTime > 0 && isRunning ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="py-2 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${proc.color.split(' ')[0]}`} />
                      <span className="font-bold text-white">{proc.name}</span>
                    </td>
                    <td className="py-2 text-center text-slate-300">{proc.arrivalTime}</td>
                    <td className="py-2 text-center text-slate-300">{proc.burstTime}</td>
                    <td className="py-2 text-center text-cyan-400 font-bold">{proc.remainingTime}</td>
                    <td className="py-2 text-center text-slate-300">{finished ? proc.completionTime : '-'}</td>
                    <td className="py-2 text-center text-slate-300">{finished ? proc.turnaroundTime : '-'}</td>
                    <td className="py-2 text-center text-emerald-400 font-semibold">{finished ? proc.waitingTime : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Real-time Logger Terminal */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] font-mono text-[11px] flex flex-col gap-1 relative shadow-md">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <span>CORE_DISPATCHER TERM_LOG</span>
            </span>
            <span className="text-slate-500">STD_OUT</span>
          </div>
          <div className="h-16 overflow-y-auto flex flex-col gap-0.5 pr-2">
            {logs.map((log, idx) => (
              <div key={idx} className="text-slate-400 flex items-start gap-1">
                <span className="text-emerald-500 select-none">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
