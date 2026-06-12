import React, { useState, useEffect, useRef } from 'react';
import { SortElement } from '../types';
import { motion } from 'motion/react';
import { 
  Play, 
  RotateCcw, 
  Award, 
  HelpCircle, 
  TrendingUp, 
  Flame, 
  Layers, 
  Hourglass, 
  Gauge, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function ComparisonArena() {
  const [arraySize, setArraySize] = useState(15);
  const [speedMs, setSpeedMs] = useState(40);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Arena prepared. Ready for high-performance algorithm speed runs.']);

  // Three arrays initialized, one for each algorithm
  const [quickEls, setQuickEls] = useState<SortElement[]>([]);
  const [mergeEls, setMergeEls] = useState<SortElement[]>([]);
  const [heapEls, setHeapEls] = useState<SortElement[]>([]);

  // Telemetries tracking
  const [quickStats, setQuickStats] = useState({ comps: 0, swaps: 0, time: 0, finished: false });
  const [mergeStats, setMergeStats] = useState({ comps: 0, swaps: 0, time: 0, finished: false });
  const [heapStats, setHeapStats] = useState({ comps: 0, swaps: 0, time: 0, finished: false });

  // Animation sequences
  const quickStepsRef = useRef<{ type: string, indices: number[], values?: number[] }[]>([]);
  const mergeStepsRef = useRef<{ type: string, indices: number[], values?: number[] }[]>([]);
  const heapStepsRef = useRef<{ type: string, indices: number[], values?: number[] }[]>([]);

  const quickIdxRef = useRef(0);
  const mergeIdxRef = useRef(0);
  const heapIdxRef = useRef(0);

  const initialArrayRef = useRef<number[]>([]);
  const timerIdRef = useRef<number | null>(null);

  // Initialize unified data source
  const resetArena = () => {
    stopDuel();

    const baseArray: number[] = [];
    const elementsTemplate: SortElement[] = [];

    for (let i = 0; i < arraySize; i++) {
      const val = Math.floor(Math.random() * 200) + 20; // 20 - 220 length
      baseArray.push(val);
      elementsTemplate.push({ value: val, state: 'default' });
    }

    initialArrayRef.current = [...baseArray];

    setQuickEls([...elementsTemplate]);
    setMergeEls([...elementsTemplate]);
    setHeapEls([...elementsTemplate]);

    setQuickStats({ comps: 0, swaps: 0, time: 0, finished: false });
    setMergeStats({ comps: 0, swaps: 0, time: 0, finished: false });
    setHeapStats({ comps: 0, swaps: 0, time: 0, finished: false });

    quickStepsRef.current = [];
    mergeStepsRef.current = [];
    heapStepsRef.current = [];

    quickIdxRef.current = 0;
    mergeIdxRef.current = 0;
    heapIdxRef.current = 0;

    setLogs(['Unified randomized source arrays populated and cached.']);
  };

  useEffect(() => {
    resetArena();
  }, [arraySize]);

  const stopDuel = () => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    setIsRunning(false);
  };

  // Pre-generate steps for concurrent synchronization anims
  const generateSteps = () => {
    const qSteps: typeof quickStepsRef.current = [];
    const mSteps: typeof mergeStepsRef.current = [];
    const hSteps: typeof heapStepsRef.current = [];

    const qCopy = [...initialArrayRef.current];
    const mCopy = [...initialArrayRef.current];
    const hCopy = [...initialArrayRef.current];

    // Quick
    runQuickSort(qCopy, 0, qCopy.length - 1, qSteps);
    for (let i = 0; i < qCopy.length; i++) qSteps.push({ type: 'sorted', indices: [i] });
    quickStepsRef.current = qSteps;

    // Merge
    runMergeSort(mCopy, 0, mCopy.length - 1, mSteps);
    for (let i = 0; i < mCopy.length; i++) mSteps.push({ type: 'sorted', indices: [i] });
    mergeStepsRef.current = mSteps;

    // Heap
    runHeapSort(hCopy, hSteps);
    for (let i = 0; i < hCopy.length; i++) hSteps.push({ type: 'sorted', indices: [i] });
    heapStepsRef.current = hSteps;
  };

  // Quick Sort Generator
  const runQuickSort = (arr: number[], low: number, high: number, steps: any[]) => {
    if (low < high) {
      const pIdx = partition(arr, low, high, steps);
      runQuickSort(arr, low, pIdx - 1, steps);
      runQuickSort(arr, pIdx + 1, high, steps);
    }
  };

  const partition = (arr: number[], low: number, high: number, steps: any[]): number => {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      steps.push({ type: 'compare', indices: [j, high] });
      if (arr[j] < pivot) {
        i++;
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
        steps.push({ type: 'swap', indices: [i, j], values: [arr[i], arr[j]] });
      }
    }
    const temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    steps.push({ type: 'swap', indices: [i + 1, high], values: [arr[i + 1], arr[high]] });
    return i + 1;
  };

  // Merge Sort Generator
  const runMergeSort = (arr: number[], low: number, high: number, steps: any[]) => {
    if (low < high) {
      const mid = Math.floor((low + high) / 2);
      runMergeSort(arr, low, mid, steps);
      runMergeSort(arr, mid + 1, high, steps);
      merge(arr, low, mid, high, steps);
    }
  };

  const merge = (arr: number[], low: number, mid: number, high: number, steps: any[]) => {
    const temp: number[] = [];
    let i = low;
    let j = mid + 1;
    while (i <= mid && j <= high) {
      steps.push({ type: 'compare', indices: [i, j] });
      if (arr[i] <= arr[j]) {
        temp.push(arr[i++]);
      } else {
        temp.push(arr[j++]);
      }
    }
    while (i <= mid) temp.push(arr[i++]);
    while (j <= high) temp.push(arr[j++]);
    for (let k = 0; k < temp.length; k++) {
      arr[low + k] = temp[k];
      steps.push({ type: 'overwrite', indices: [low + k], values: [temp[k]] });
    }
  };

  // Heap Sort Generator
  const runHeapSort = (arr: number[], steps: any[]) => {
    const n = arr.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(arr, n, i, steps);
    for (let i = n - 1; i > 0; i--) {
      const temp = arr[0];
      arr[0] = arr[i];
      arr[i] = temp;
      steps.push({ type: 'swap', indices: [0, i], values: [arr[0], arr[i]] });
      heapify(arr, i, 0, steps);
    }
  };

  const heapify = (arr: number[], n: number, i: number, steps: any[]) => {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < n) {
      steps.push({ type: 'compare', indices: [left, largest] });
      if (arr[left] > arr[largest]) largest = left;
    }
    if (right < n) {
      steps.push({ type: 'compare', indices: [right, largest] });
      if (arr[right] > arr[largest]) largest = right;
    }
    if (largest !== i) {
      const swap = arr[i];
      arr[i] = arr[largest];
      arr[largest] = swap;
      steps.push({ type: 'swap', indices: [i, largest], values: [arr[i], arr[largest]] });
      heapify(arr, n, largest, steps);
    }
  };

  // DUEL EXECUTION TIMING LOOP
  const executeDuel = () => {
    if (isRunning) {
      stopDuel();
      return;
    }

    if (quickStepsRef.current.length === 0) {
      generateSteps();
      setLogs(prev => [...prev, `Steps calculated. Arrays calibrated. Launching speed duels on unified structures.`]);
    }

    setIsRunning(true);

    timerIdRef.current = window.setInterval(() => {
      let activeAnimations = false;

      // 1. ANIMATE QUICK
      const qIdx = quickIdxRef.current;
      const qSteps = quickStepsRef.current;
      if (qIdx < qSteps.length) {
        activeAnimations = true;
        const step = qSteps[qIdx];
        setQuickEls(prev => handleSingleStep(prev, step));
        setQuickStats(s => updateStatMetrics(s, step, speedMs));
        quickIdxRef.current++;
      } else if (!quickStats.finished) {
        setQuickStats(s => ({ ...s, finished: true }));
        setQuickEls(prev => prev.map(el => ({ ...el, state: 'sorted' })));
        setLogs(prev => [...prev, 'Quick Sort finished execution.']);
      }

      // 2. ANIMATE MERGE
      const mIdx = mergeIdxRef.current;
      const mSteps = mergeStepsRef.current;
      if (mIdx < mSteps.length) {
        activeAnimations = true;
        const step = mSteps[mIdx];
        setMergeEls(prev => handleSingleStep(prev, step));
        setMergeStats(s => updateStatMetrics(s, step, speedMs));
        mergeIdxRef.current++;
      } else if (!mergeStats.finished) {
        setMergeStats(s => ({ ...s, finished: true }));
        setMergeEls(prev => prev.map(el => ({ ...el, state: 'sorted' })));
        setLogs(prev => [...prev, 'Merge Sort finished execution.']);
      }

      // 3. ANIMATE HEAP
      const hIdx = heapIdxRef.current;
      const hSteps = heapStepsRef.current;
      if (hIdx < hSteps.length) {
        activeAnimations = true;
        const step = hSteps[hIdx];
        setHeapEls(prev => handleSingleStep(prev, step));
        setHeapStats(s => updateStatMetrics(s, step, speedMs));
        heapIdxRef.current++;
      } else if (!heapStats.finished) {
        setHeapStats(s => ({ ...s, finished: true }));
        setHeapEls(prev => prev.map(el => ({ ...el, state: 'sorted' })));
        setLogs(prev => [...prev, 'Heap Sort finished execution.']);
      }

      if (!activeAnimations) {
        stopDuel();
        const results = [
          { name: 'Quick Sort', score: quickStats.time },
          { name: 'Merge Sort', score: mergeStats.time },
          { name: 'Heap Sort', score: heapStats.time }
        ];
        results.sort((a, b) => a.score - b.score);
        setLogs(prev => [...prev, `Duel finalized. Victor: ${results[0].name.toUpperCase()} (in ${results[0].score}ms)`]);
      }
    }, speedMs);
  };

  // Helper step processing
  const handleSingleStep = (prev: SortElement[], step: any): SortElement[] => {
    const nextEls: SortElement[] = prev.map(el => ({ ...el, state: 'default' }));
    if (step.type === 'compare') {
      step.indices.forEach((id: number) => {
        if (nextEls[id]) nextEls[id].state = 'compare';
      });
    } else if (step.type === 'swap') {
      const [idA, idB] = step.indices;
      if (step.values && nextEls[idA] && nextEls[idB]) {
        nextEls[idA].value = step.values[0];
        nextEls[idB].value = step.values[1];
        nextEls[idA].state = 'swap';
        nextEls[idB].state = 'swap';
      }
    } else if (step.type === 'overwrite') {
      const [idA] = step.indices;
      if (step.values && nextEls[idA]) {
        nextEls[idA].value = step.values[0];
        nextEls[idA].state = 'swap';
      }
    } else if (step.type === 'sorted') {
      step.indices.forEach((id: number) => {
        if (nextEls[id]) nextEls[id].state = 'sorted';
      });
    }
    return nextEls;
  };

  const updateStatMetrics = (s: any, step: any, speed: number) => {
    let comps = s.comps;
    let swaps = s.swaps;
    if (step.type === 'compare') comps++;
    if (step.type === 'swap' || step.type === 'overwrite') swaps++;
    return {
      ...s,
      comps,
      swaps,
      time: parseFloat((s.time + speed / 10).toFixed(1))
    };
  };

  // Winner calculation
  const getWinnerBadge = () => {
    if (!quickStats.finished || !mergeStats.finished || !heapStats.finished) return null;
    const scores = [
      { name: 'Quick Sort', time: quickStats.time, color: 'text-purple-400' },
      { name: 'Merge Sort', time: mergeStats.time, color: 'text-cyan-400' },
      { name: 'Heap Sort', time: heapStats.time, color: 'text-emerald-400' }
    ];
    scores.sort((a, b) => a.time - b.time);
    return scores[0];
  };

  const winner = getWinnerBadge();

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto text-slate-100 select-none pb-24">
      {/* Parameters Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-5">
        
        {/* Core Settings */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="font-display font-medium text-xs tracking-wider uppercase text-pink-400">Duel arena setup</span>
            <span className="font-mono text-[9px] text-zinc-500">[CONTROLS]</span>
          </div>

          {/* Sizing Range */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">SAMPLE FOOTPRINT</span>
              <span className="text-pink-400 font-bold">{arraySize} Columns</span>
            </div>
            <input 
              type="range"
              min="10"
              max="25"
              step="1"
              value={arraySize}
              disabled={isRunning}
              onChange={(e) => setArraySize(Number(e.target.value))}
              className="accent-pink-500 bg-white/10 h-1 rounded-lg cursor-pointer"
            />
          </div>

          {/* Speed range */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">EXEC INTERVAL</span>
              <span className="text-pink-400 font-bold">{speedMs}ms</span>
            </div>
            <input 
              type="range"
              min="20"
              max="150"
              step="10"
              value={speedMs}
              onChange={(e) => {
                setSpeedMs(Number(e.target.value));
                if (isRunning) {
                  stopDuel();
                  setTimeout(() => executeDuel(), 50);
                }
              }}
              className="accent-pink-500 bg-white/10 h-1 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={executeDuel}
              id="btn-run-duel"
              className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 rounded-xl font-mono text-xs text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isRunning ? 'SUSPEND OPERATION' : 'TRIGGER SPEED DUELS'}</span>
            </button>

            <button
              onClick={resetArena}
              disabled={isRunning}
              id="btn-reset-arena"
              className="py-1.5 w-full bg-zinc-950 border border-white/5 text-slate-300 font-mono text-[10px] rounded-lg hover:bg-white/[0.03] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-pink-500" />
              <span>ALIGN INPUT ARRAYS</span>
            </button>
          </div>
        </div>

        {/* Winner plaque details */}
        {winner ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 text-amber-300 font-mono text-[11.5px] flex flex-col gap-2 align-items-center relative overflow-hidden"
          >
            {/* Pulsing light */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 blur-xl rounded-full" />
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-1">
              <Award className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="font-display font-bold uppercase tracking-wider text-amber-400">DUEL HIGHLIGHT</span>
            </div>
            <span>FASTEST REGISTER: <span className="text-white font-bold">{winner.name}</span></span>
            <span>CLOCK SATURATION: <span className="font-bold text-white">{winner.time}ms</span></span>
            <p className="font-sans text-[10.5px] text-amber-200/70 leading-relaxed mt-1">
              Quick and Merge processes outperform depending on partition balances, but Quick consistently wins on localized hardware mapping caches.
            </p>
          </motion.div>
        ) : (
          <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col gap-2.5 font-mono text-[11px]">
            <div className="text-xs uppercase text-slate-300 font-display font-medium text-pink-500">ARENA PARAMETERS</div>
            <div className="flex justify-between pb-1 border-b border-white/5">
              <span className="text-slate-500">INPUT SOURCE:</span>
              <span className="text-slate-300">Synchronized identical</span>
            </div>
            <div className="flex justify-between pb-1 border-b border-white/5">
              <span className="text-slate-500">CO-ROUTINES:</span>
              <span className="text-cyan-400">3 Parallel pipelines</span>
            </div>
            <p className="text-zinc-500 leading-relaxed font-sans text-[10px] mt-1.5">
              Launches discrete sorting executions concurrently. Monitors runtime clock registers, structural comparison index nodes, and swapping movements instantly.
            </p>
          </div>
        )}
      </div>

      {/* Main Core Parallel Displays */}
      <div className="flex-1 flex flex-col gap-5">
        
        {/* Three equal columns for Side-by-Side arrays */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Quick Sort Column */}
          <div className="glass p-4 rounded-2xl border border-white/[0.05] bg-[#101016]/80 flex flex-col h-[320px] justify-between relative shadow-md">
            <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-2">
              <span className="text-purple-400 uppercase font-bold tracking-wider">Quick Sort</span>
              <span className={quickStats.finished ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {quickStats.finished ? '[SKIPPED]' : '[RUNNING]'}
              </span>
            </div>

            {/* Quick Micro Bars map */}
            <div className="flex-1 flex items-end justify-center gap-1 p-2 h-[150px] bg-black/20 rounded-xl my-3">
              {quickEls.map((el, idx) => {
                let col = 'bg-slate-600';
                if (el.state === 'compare') col = 'bg-cyan-400';
                if (el.state === 'swap') col = 'bg-purple-500';
                if (el.state === 'sorted') col = 'bg-emerald-400';
                return (
                  <div 
                    key={idx}
                    className={`flex-1 rounded-t-[2px] transition-all duration-75 ${col}`}
                    style={{ height: `${(el.value / 220) * 100}%` }}
                  />
                );
              })}
            </div>

            {/* Comparative telemetries */}
            <div className="font-mono text-[9.5px] text-slate-400 flex flex-col gap-1 border-t border-white/5 pt-2">
              <div className="flex justify-between">
                <span>COMPS:</span>
                <span className="text-purple-300 font-semibold">{quickStats.comps}</span>
              </div>
              <div className="flex justify-between">
                <span>SWAPS:</span>
                <span className="text-pink-300 font-semibold">{quickStats.swaps}</span>
              </div>
              <div className="flex justify-between">
                <span>LATENCY:</span>
                <span className="text-cyan-300 font-bold">{quickStats.time}ms</span>
              </div>
            </div>
          </div>

          {/* Merge Sort Column */}
          <div className="glass p-4 rounded-2xl border border-white/[0.05] bg-[#101016]/80 flex flex-col h-[320px] justify-between relative shadow-md">
            <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-2">
              <span className="text-cyan-400 uppercase font-bold tracking-wider">Merge Sort</span>
              <span className={mergeStats.finished ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {mergeStats.finished ? '[SKIPPED]' : '[RUNNING]'}
              </span>
            </div>

            {/* Merge Micro Bars map */}
            <div className="flex-1 flex items-end justify-center gap-1 p-2 h-[150px] bg-black/20 rounded-xl my-3">
              {mergeEls.map((el, idx) => {
                let col = 'bg-slate-600';
                if (el.state === 'compare') col = 'bg-cyan-400';
                if (el.state === 'swap') col = 'bg-purple-500';
                if (el.state === 'sorted') col = 'bg-emerald-400';
                return (
                  <div 
                    key={idx}
                    className={`flex-1 rounded-t-[2px] transition-all duration-75 ${col}`}
                    style={{ height: `${(el.value / 220) * 100}%` }}
                  />
                );
              })}
            </div>

            {/* Comparative telemetries */}
            <div className="font-mono text-[9.5px] text-slate-400 flex flex-col gap-1 border-t border-white/5 pt-2">
              <div className="flex justify-between">
                <span>COMPS:</span>
                <span className="text-purple-300 font-semibold">{mergeStats.comps}</span>
              </div>
              <div className="flex justify-between">
                <span>SWAPS:</span>
                <span className="text-pink-300 font-semibold">{mergeStats.swaps}</span>
              </div>
              <div className="flex justify-between">
                <span>LATENCY:</span>
                <span className="text-cyan-300 font-bold">{mergeStats.time}ms</span>
              </div>
            </div>
          </div>

          {/* Heap Sort Column */}
          <div className="glass p-4 rounded-2xl border border-white/[0.05] bg-[#101016]/80 flex flex-col h-[320px] justify-between relative shadow-md">
            <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-2">
              <span className="text-emerald-400 uppercase font-bold tracking-wider">Heap Sort</span>
              <span className={heapStats.finished ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {heapStats.finished ? '[SKIPPED]' : '[RUNNING]'}
              </span>
            </div>

            {/* Heap Micro Bars map */}
            <div className="flex-1 flex items-end justify-center gap-1 p-2 h-[150px] bg-black/20 rounded-xl my-3">
              {heapEls.map((el, idx) => {
                let col = 'bg-slate-600';
                if (el.state === 'compare') col = 'bg-cyan-400';
                if (el.state === 'swap') col = 'bg-purple-500';
                if (el.state === 'sorted') col = 'bg-emerald-400';
                return (
                  <div 
                    key={idx}
                    className={`flex-1 rounded-t-[2px] transition-all duration-75 ${col}`}
                    style={{ height: `${(el.value / 220) * 100}%` }}
                  />
                );
              })}
            </div>

            {/* Comparative telemetries */}
            <div className="font-mono text-[9.5px] text-slate-400 flex flex-col gap-1 border-t border-white/5 pt-2">
              <div className="flex justify-between">
                <span>COMPS:</span>
                <span className="text-purple-300 font-semibold">{heapStats.comps}</span>
              </div>
              <div className="flex justify-between">
                <span>SWAPS:</span>
                <span className="text-pink-300 font-semibold">{heapStats.swaps}</span>
              </div>
              <div className="flex justify-between">
                <span>LATENCY:</span>
                <span className="text-cyan-300 font-bold">{heapStats.time}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Logger Terminal */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] font-mono text-[11px] flex flex-col gap-1 relative shadow-md">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping" />
              <span>ARENA_DUEL TERM_LOG</span>
            </span>
            <span className="text-slate-500">STD_OUT</span>
          </div>
          <div className="h-16 overflow-y-auto flex flex-col gap-0.5 pr-2">
            {logs.map((log, idx) => (
              <div key={idx} className="text-slate-400 flex items-start gap-1">
                <span className="text-pink-500 select-none">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
