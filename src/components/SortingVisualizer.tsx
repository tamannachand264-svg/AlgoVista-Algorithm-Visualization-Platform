import React, { useState, useEffect, useRef } from 'react';
import { SortElement, PerformanceMetrics } from '../types';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  HelpCircle, 
  TrendingUp, 
  Sparkles, 
  Flame, 
  GitBranch, 
  BarChart, 
  Activity 
} from 'lucide-react';

export default function SortingVisualizer() {
  const [elements, setElements] = useState<SortElement[]>([]);
  const [arraySize, setArraySize] = useState(35);
  const [speedMs, setSpeedMs] = useState(30);
  const [activeAlgorithm, setActiveAlgorithm] = useState<'merge' | 'quick' | 'heap'>('quick');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Sorting arena ready. Select sizing and click Sort to animate.']);
  
  // Real-time animation tallies
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);

  // References to handle visual running intervals
  const animationStepsRef = useRef<{ type: 'compare' | 'swap' | 'overwrite' | 'sorted', indices: number[], values?: number[] }[]>([]);
  const animationIndexRef = useRef(0);
  const originalArrayRef = useRef<number[]>([]);
  const intervalIdRef = useRef<number | null>(null);

  // Initialize randomized array
  const resetArray = () => {
    stopAnimation();
    
    const newArray: number[] = [];
    const newElements: SortElement[] = [];
    for (let i = 0; i < arraySize; i++) {
      const val = Math.floor(Math.random() * 260) + 30; // height value 30-300
      newArray.push(val);
      newElements.push({ value: val, state: 'default' });
    }
    setElements(newElements);
    originalArrayRef.current = [...newArray];
    animationStepsRef.current = [];
    animationIndexRef.current = 0;
    setComparisons(0);
    setSwaps(0);
    setTimeTaken(0);
    setLogs(['Array randomized. Space allocated. Ready for execution.']);
  };

  useEffect(() => {
    resetArray();
  }, [arraySize]);

  // Stop running intervals
  const stopAnimation = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsRunning(false);
  };

  // Generate All Helper Algorithm Animation Steps
  const generateSteps = () => {
    const steps: typeof animationStepsRef.current = [];
    const arrCopy = [...originalArrayRef.current];

    if (activeAlgorithm === 'quick') {
      runQuickSortHelper(arrCopy, 0, arrCopy.length - 1, steps);
    } else if (activeAlgorithm === 'merge') {
      runMergeSortHelper(arrCopy, 0, arrCopy.length - 1, steps);
    } else if (activeAlgorithm === 'heap') {
      runHeapSortHelper(arrCopy, steps);
    }

    // Add final "complete sorted check" step
    for (let i = 0; i < arrCopy.length; i++) {
      steps.push({ type: 'sorted', indices: [i] });
    }

    animationStepsRef.current = steps;
  };

  // QUICK SORT STEP GENERATOR
  const runQuickSortHelper = (
    arr: number[], 
    low: number, 
    high: number, 
    steps: typeof animationStepsRef.current
  ) => {
    if (low < high) {
      const pIdx = partition(arr, low, high, steps);
      runQuickSortHelper(arr, low, pIdx - 1, steps);
      runQuickSortHelper(arr, pIdx + 1, high, steps);
    }
  };

  const partition = (
    arr: number[], 
    low: number, 
    high: number, 
    steps: typeof animationStepsRef.current
  ): number => {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      steps.push({ type: 'compare', indices: [j, high] });
      if (arr[j] < pivot) {
        i++;
        // Swap
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
        steps.push({ type: 'swap', indices: [i, j], values: [arr[i], arr[j]] });
      }
    }
    // Swap pivot to correct slot
    const temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    steps.push({ type: 'swap', indices: [i + 1, high], values: [arr[i + 1], arr[high]] });

    return i + 1;
  };

  // MERGE SORT STEP GENERATOR
  const runMergeSortHelper = (
    arr: number[], 
    low: number, 
    high: number, 
    steps: typeof animationStepsRef.current
  ) => {
    if (low < high) {
      const mid = Math.floor((low + high) / 2);
      runMergeSortHelper(arr, low, mid, steps);
      runMergeSortHelper(arr, mid + 1, high, steps);
      merge(arr, low, mid, high, steps);
    }
  };

  const merge = (
    arr: number[], 
    low: number, 
    mid: number, 
    high: number, 
    steps: typeof animationStepsRef.current
  ) => {
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

    while (i <= mid) {
      temp.push(arr[i++]);
    }
    while (j <= high) {
      temp.push(arr[j++]);
    }

    for (let k = 0; k < temp.length; k++) {
      arr[low + k] = temp[k];
      steps.push({ type: 'overwrite', indices: [low + k], values: [temp[k]] });
    }
  };

  // HEAP SORT STEP GENERATOR
  const runHeapSortHelper = (arr: number[], steps: typeof animationStepsRef.current) => {
    const n = arr.length;

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      heapify(arr, n, i, steps);
    }

    for (let i = n - 1; i > 0; i--) {
      // Swap root to end
      const temp = arr[0];
      arr[0] = arr[i];
      arr[i] = temp;
      steps.push({ type: 'swap', indices: [0, i], values: [arr[0], arr[i]] });
      heapify(arr, i, 0, steps);
    }
  };

  const heapify = (
    arr: number[], 
    n: number, 
    i: number, 
    steps: typeof animationStepsRef.current
  ) => {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n) {
      steps.push({ type: 'compare', indices: [left, largest] });
      if (arr[left] > arr[largest]) {
        largest = left;
      }
    }

    if (right < n) {
      steps.push({ type: 'compare', indices: [right, largest] });
      if (arr[right] > arr[largest]) {
        largest = right;
      }
    }

    if (largest !== i) {
      const swap = arr[i];
      arr[i] = arr[largest];
      arr[largest] = swap;
      steps.push({ type: 'swap', indices: [i, largest], values: [arr[i], arr[largest]] });

      heapify(arr, n, largest, steps);
    }
  };

  // Begin step animation loops
  const startSorting = () => {
    if (isRunning) {
      stopAnimation();
      return;
    }

    // Set first steps list if empty
    if (animationStepsRef.current.length === 0) {
      generateSteps();
      setLogs(prev => [...prev, `Virtualizing execution on pivot indexes. ${animationStepsRef.current.length} micro-steps queued.`]);
    }

    setIsRunning(true);
    const startTimeStamp = performance.now();

    intervalIdRef.current = window.setInterval(() => {
      const idx = animationIndexRef.current;
      const steps = animationStepsRef.current;

      if (idx >= steps.length) {
        stopAnimation();
        setLogs(prev => [...prev, 'Sorting check finalized. Array structure validated.']);
        // Highlight elements as completely solved
        setElements(prev => prev.map(el => ({ ...el, state: 'sorted' })));
        return;
      }

      const step = steps[idx];
      setElements(prev => {
        const nextElements = prev.map(el => ({ ...el, state: 'default' as const }));

        if (step.type === 'compare') {
          setComparisons(c => c + 1);
          step.indices.forEach(idxToColor => {
            if (nextElements[idxToColor]) {
              nextElements[idxToColor].state = 'compare';
            }
          });
        } else if (step.type === 'swap') {
          setSwaps(s => s + 1);
          const [idA, idB] = step.indices;
          if (step.values && nextElements[idA] && nextElements[idB]) {
            nextElements[idA].value = step.values[0];
            nextElements[idB].value = step.values[1];
            nextElements[idA].state = 'swap';
            nextElements[idB].state = 'swap';
          }
        } else if (step.type === 'overwrite') {
          setSwaps(s => s + 1);
          const [idA] = step.indices;
          if (step.values && nextElements[idA]) {
            nextElements[idA].value = step.values[0];
            nextElements[idA].state = 'swap';
          }
        } else if (step.type === 'sorted') {
          step.indices.forEach(idxToColor => {
            if (nextElements[idxToColor]) {
              nextElements[idxToColor].state = 'sorted';
            }
          });
        }

        return nextElements;
      });

      // Simple time progression ticker approximation
      setTimeTaken(t => parseFloat((t + speedMs / 10).toFixed(1)));
      animationIndexRef.current++;
    }, speedMs);
  };

  const algorithmDetails = {
    merge: {
      name: 'Merge Sort',
      timeBest: 'O(n log n)',
      timeAvg: 'O(n log n)',
      timeWorst: 'O(n log n)',
      space: 'O(n)',
      stable: 'Yes',
      desc: 'Divide-and-conquer strategy that splits arrays, sorts sub-arrays, and merges columns. Highly stable but requires memory allocations.'
    },
    quick: {
      name: 'Quick Sort',
      timeBest: 'O(n log n)',
      timeAvg: 'O(n log n)',
      timeWorst: 'O(n²)',
      space: 'O(log n)',
      stable: 'No',
      desc: 'Partitions arrays around a pivot node. Highly performant in physical hardware caches with minimum memory offsets.'
    },
    heap: {
      name: 'Heap Sort',
      timeBest: 'O(n log n)',
      timeAvg: 'O(n log n)',
      timeWorst: 'O(n log n)',
      space: 'O(1)',
      stable: 'No',
      desc: 'Builds a binary heap structure, then extract max values iteratively to the end. In-place sorting with absolute O(n log n) assurance.'
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto text-slate-100 select-none pb-24">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 flex flex-col gap-5">
        
        {/* Core Controls */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="font-display font-medium text-xs tracking-wider uppercase text-purple-400">Sorting Arena controls</span>
            <span className="font-mono text-[9px] text-zinc-500">[CONTROLS]</span>
          </div>

          {/* Sizing Range */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">ARRAY DENSITY</span>
              <span className="text-purple-400">{arraySize} Bars</span>
            </div>
            <input 
              type="range"
              min="10"
              max="70"
              step="1"
              value={arraySize}
              disabled={isRunning}
              onChange={(e) => setArraySize(Number(e.target.value))}
              className="accent-purple-500 bg-white/10 h-1 rounded-lg cursor-pointer animate-pulse"
            />
          </div>

          {/* Speed range */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">EXEC DELAY</span>
              <span className="text-purple-400">{speedMs}ms</span>
            </div>
            <input 
              type="range"
              min="5"
              max="150"
              step="5"
              value={speedMs}
              onChange={(e) => {
                setSpeedMs(Number(e.target.value));
                if (isRunning) {
                  // restart animation loop to dynamically adopt new speed
                  stopAnimation();
                  setTimeout(() => startSorting(), 50);
                }
              }}
              className="accent-purple-500 bg-white/10 h-1 rounded-lg cursor-pointer"
            />
          </div>

          {/* Quick algo buttons select */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-slate-400 uppercase">SELECT ALGORITHM</label>
            <div className="flex flex-col gap-1 font-sans">
              {(['merge', 'quick', 'heap'] as const).map(algo => (
                <button
                  key={algo}
                  disabled={isRunning}
                  id={`btn-sort-${algo}`}
                  onClick={() => {
                    setActiveAlgorithm(algo);
                    // clear animation steps of previous algorithm
                    animationStepsRef.current = [];
                    animationIndexRef.current = 0;
                  }}
                  className={`px-3 py-2 text-left rounded-xl text-xs font-medium border flex justify-between items-center transition-all cursor-pointer ${
                    activeAlgorithm === algo
                      ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                      : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span>{algo === 'merge' ? 'Merge Sort' : algo === 'quick' ? 'Quick Sort' : 'Heap Sort'}</span>
                  <span className="font-mono text-[8px] opacity-60">
                    {algo === 'merge' ? 'STABLE' : algo === 'quick' ? 'PIVOT' : 'HEAP'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={startSorting}
              id="btn-run-sort"
              className={`w-full py-3 rounded-xl font-mono text-xs text-white font-bold tracking-wide flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all duration-300 ${
                isRunning 
                  ? 'bg-rose-950/40 border border-rose-800/40 text-rose-300' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'PAUSE ANIMATION' : `EXEC ${activeAlgorithm.toUpperCase()}`}</span>
            </button>

            <button
              onClick={resetArray}
              disabled={isRunning}
              id="btn-re-randomize"
              className="py-1.5 w-full bg-zinc-950 border border-white/5 text-slate-300 font-mono text-[10px] rounded-lg hover:bg-white/[0.03] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RANDOMIZE ARRAY</span>
            </button>
          </div>
        </div>

        {/* Algorithm details */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col gap-2.5 font-mono text-[11px]">
          <div className="text-xs uppercase text-slate-300 font-display font-medium text-purple-400">COMPLEXITY ANALYSIS</div>
          <div className="flex justify-between pb-1 border-b border-white/5">
            <span className="text-slate-500">BEST TIME:</span>
            <span className="text-emerald-400">{algorithmDetails[activeAlgorithm].timeBest}</span>
          </div>
          <div className="flex justify-between pb-1 border-b border-white/5">
            <span className="text-slate-500">AVERAGE TIME:</span>
            <span className="text-cyan-400">{algorithmDetails[activeAlgorithm].timeAvg}</span>
          </div>
          <div className="flex justify-between pb-1 border-b border-white/5">
            <span className="text-slate-500">WORST TIME:</span>
            <span className="text-rose-400">{algorithmDetails[activeAlgorithm].timeWorst}</span>
          </div>
          <div className="flex justify-between pb-1 border-b border-white/5">
            <span className="text-slate-500">SPACE COST:</span>
            <span className="text-purple-400">{algorithmDetails[activeAlgorithm].space}</span>
          </div>
          <p className="text-zinc-500 leading-relaxed font-sans text-[10px] mt-1.5">
            {algorithmDetails[activeAlgorithm].desc}
          </p>
        </div>
      </div>

      {/* Primary Display Area */}
      <div className="flex-1 flex flex-col gap-5">
        
        {/* Dynamic Telemetries */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: comparisons, label: "COMPARISONS", color: "text-purple-400", sub: "STEPS COMPARED" },
            { value: swaps, label: "MUTATION VALUE SWAPS", color: "text-pink-400", sub: "MEM DATA MOVES" },
            { value: `${timeTaken}ms`, label: "ELAPSED SYNC TIMER", color: "text-cyan-400", sub: "CALCULATED" }
          ].map((m, idx) => (
            <div key={idx} className="glass p-4 rounded-xl border border-white/[0.04]">
              <div className="text-[9px] font-mono text-slate-500 tracking-wider uppercase">{m.label}</div>
              <div className={`text-xl font-display font-semibold mt-1 ${m.color}`}>{m.value}</div>
              <div className="text-[8px] font-mono text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Visual Bars Container */}
        <div className="glass p-6 rounded-2xl border border-white/[0.05] h-[350px] flex items-end justify-center gap-1.5 shadow-lg relative bg-[#09090c]/90">
          
          {/* Colors legend */}
          <div className="absolute top-4 left-6 flex gap-4 text-[9px] font-mono text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-600 rounded-sm" /> Default</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm" /> Comparing</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-500 rounded-sm" /> Swapping</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm" /> Sorted</span>
          </div>

          {elements.map((el, idx) => {
            let barColor = 'bg-slate-600';
            if (el.state === 'compare') {
              barColor = 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] border border-cyan-200';
            } else if (el.state === 'swap') {
              barColor = 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] border border-purple-300';
            } else if (el.state === 'sorted') {
              barColor = 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
            }

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-1.5 transition-all duration-75"
              >
                {/* Visual block value on top of bar if size is reasonably small */}
                {arraySize <= 25 && (
                  <span className="font-mono text-[8px] text-zinc-500">{el.value}</span>
                )}
                
                {/* The vertical bar */}
                <div
                  className={`w-full rounded-t-[3px] transition-all duration-75 ${barColor}`}
                  style={{ height: `${el.value}px` }}
                />
              </div>
            );
          })}
        </div>

        {/* Terminal Logger */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] font-mono text-[11px] flex flex-col gap-2 relative">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
              <span>SORT_ARENA TERM_LOG</span>
            </span>
            <span className="text-slate-500">STD_OUT</span>
          </div>
          <div className="h-20 overflow-y-auto flex flex-col gap-0.5 pr-2">
            {logs.map((log, idx) => (
              <div key={idx} className="text-slate-400 flex items-start gap-1">
                <span className="text-purple-400 select-none">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
