import React, { useState, useEffect } from 'react';
import { MemoryBlock, MemoryRequest, MemoryAlgo } from '../types';
import { motion } from 'motion/react';
import { 
  Play, 
  RotateCcw, 
  Plus, 
  Database, 
  Trash2, 
  Check, 
  Info, 
  RefreshCw, 
  TrendingUp, 
  Flame 
} from 'lucide-react';

export default function MemoryAllocator() {
  const [blocks, setBlocks] = useState<MemoryBlock[]>([
    { id: '1', size: 100, originalSize: 100, allocatedProcessId: null, startAddress: 0 },
    { id: '2', size: 500, originalSize: 500, allocatedProcessId: null, startAddress: 100 },
    { id: '3', size: 200, originalSize: 200, allocatedProcessId: null, startAddress: 600 },
    { id: '4', size: 300, originalSize: 300, allocatedProcessId: null, startAddress: 800 },
    { id: '5', size: 600, originalSize: 600, allocatedProcessId: null, startAddress: 1100 },
  ]);

  const [requests, setRequests] = useState<MemoryRequest[]>([]);
  const [requestSize, setRequestSize] = useState(150);
  const [logs, setLogs] = useState<string[]>(['Memory simulator initialized. Submit requests to verify First Fit mappings.']);
  const [procCount, setProcCount] = useState(1);

  // Statistics
  const [totalMemory, setTotalMemory] = useState(1700);
  const [allocatedMem, setAllocatedMem] = useState(0);
  const [internalFrag, setInternalFrag] = useState(0);

  // Calculate stats on change
  useEffect(() => {
    let allocated = 0;
    let fragmentation = 0;

    blocks.forEach(block => {
      if (block.allocatedProcessId && block.allocatedProcessSize) {
        allocated += block.allocatedProcessSize;
        fragmentation += (block.originalSize - block.allocatedProcessSize);
      }
    });

    setAllocatedMem(allocated);
    setInternalFrag(fragmentation);
  }, [blocks]);

  // Handle First Fit allocation request
  const allocateMemory = () => {
    const pId = `P_${procCount}`;
    setLogs(prev => [...prev, `Attempting allocation of ${pId} [Size: ${requestSize}KB] using First Fit...`]);

    let matchedBlockIndex = -1;
    const processSteps: string[] = [];

    // First Fit loop
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      processSteps.push(`Surveying Block ${block.id} (Size: ${block.originalSize}KB)`);

      if (block.allocatedProcessId !== null) {
        processSteps.push(`Block ${block.id} is occupied by ${block.allocatedProcessId}. Skipped.`);
        continue;
      }

      if (block.originalSize >= requestSize) {
        matchedBlockIndex = i;
        processSteps.push(`Block ${block.id} is sufficient (${block.originalSize}KB >= ${requestSize}KB). Block RESERVED!`);
        break;
      } else {
        processSteps.push(`Block ${block.id} is too small (${block.originalSize}KB < ${requestSize}KB). Skipped.`);
      }
    }

    if (matchedBlockIndex !== -1) {
      const matchedBlock = blocks[matchedBlockIndex];
      
      // Update blocks state
      setBlocks(prev => prev.map((b, idx) => {
        if (idx === matchedBlockIndex) {
          return {
            ...b,
            allocatedProcessId: pId,
            allocatedProcessSize: requestSize,
            size: b.originalSize - requestSize // unallocated remainder represents fragmentation
          };
        }
        return b;
      }));

      // Queue request logs
      const req: MemoryRequest = {
        id: pId,
        size: requestSize,
        status: 'allocated',
        allocatedBlockId: matchedBlock.id
      };
      setRequests(prev => [...prev, req]);
      setLogs(prev => [...prev, ...processSteps, `Success: ${pId} assigned to Block ${matchedBlock.id}. Internal Fragmentation: ${matchedBlock.originalSize - requestSize}KB.`]);
      setProcCount(c => c + 1);
    } else {
      const req: MemoryRequest = {
        id: pId,
        size: requestSize,
        status: 'failed',
        allocatedBlockId: null
      };
      setRequests(prev => [...prev, req]);
      setLogs(prev => [...prev, ...processSteps, `Failed: Out of Memory. Process ${pId} queued to pending state.`]);
    }
  };

  // Reset or clear allocations
  const resetSimulator = () => {
    setBlocks(b => b.map(block => ({
      ...block,
      allocatedProcessId: null,
      allocatedProcessSize: undefined,
      size: block.originalSize
    })));
    setRequests([]);
    setProcCount(1);
    setLogs(['All memory spaces compacted. Blocks restored to unallocated defaults.']);
  };

  // De-allocate specific block
  const deallocateBlock = (blockId: string) => {
    const target = blocks.find(b => b.id === blockId);
    if (!target || !target.allocatedProcessId) return;

    setLogs(prev => [...prev, `De-allocated slot Block ${blockId} freeing ${target.allocatedProcessId}.`]);
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          allocatedProcessId: null,
          allocatedProcessSize: undefined,
          size: b.originalSize
        };
      }
      return b;
    }));
  };

  const utilizationRate = totalMemory > 0 
    ? parseFloat(((allocatedMem / totalMemory) * 100).toFixed(1)) 
    : 0;

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto text-slate-100 select-none pb-24">
      {/* Parameters Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-5">
        
        {/* Core Controls */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="font-display font-medium text-xs tracking-wider uppercase text-orange-400">First-fit parameters</span>
            <span className="font-mono text-[9px] text-zinc-500">[CONTROLS]</span>
          </div>

          {/* Allocation input */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 font-sans">REQUEST SIZE</span>
              <span className="text-orange-400 font-bold">{requestSize} KB</span>
            </div>
            <input 
              type="range"
              min="30"
              max="450"
              step="10"
              value={requestSize}
              onChange={(e) => setRequestSize(Number(e.target.value))}
              className="accent-orange-500 bg-white/10 h-1 rounded-lg cursor-pointer animate-pulse"
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={allocateMemory}
              id="btn-allocate-mem"
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-rose-600 rounded-xl font-mono text-xs text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ALLOCATE {requestSize}KB</span>
            </button>

            <button
              onClick={resetSimulator}
              id="btn-clear-mem"
              className="py-1.5 bg-zinc-950 border border-white/5 text-slate-300 font-mono text-[10px] rounded-lg hover:bg-white/[0.03] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-orange-400" />
              <span>COMPACT ALL LIMITS</span>
            </button>
          </div>
        </div>

        {/* Algorithm details */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col gap-2.5 font-mono text-[11px]">
          <div className="text-xs uppercase text-slate-300 font-display font-medium text-orange-400">FIRST-FIT TELEMETRY</div>
          <div className="flex justify-between pb-1 border-b border-white/5">
            <span className="text-slate-500">ALGORITHM:</span>
            <span className="text-slate-200">First Fit Search</span>
          </div>
          <div className="flex justify-between pb-1 border-b border-white/5">
            <span className="text-slate-500">TIME EXPECTATION:</span>
            <span className="text-cyan-400">O(N) search index</span>
          </div>
          <div className="flex justify-between pb-1 border-b border-white/5">
            <span className="text-slate-500">ALLOC PATTERN:</span>
            <span className="text-purple-400">Left-to-Right scanning</span>
          </div>
          <p className="text-zinc-500 leading-relaxed font-sans text-[10px] mt-1.5">
            Allocates a process to the first free segment capable of mapping its boundary space. Very fast but prone to leaving unallocated remainder slots (Internal Fragmentation).
          </p>
        </div>
      </div>

      {/* Main Core Display Screen */}
      <div className="flex-1 flex flex-col gap-5">
        
        {/* Statistics highlights */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: `${allocatedMem} KB`, label: "ALLOCATED BOUNDARY", color: "text-orange-400", sub: "PHYSICAL RESERVED" },
            { value: `${internalFrag} KB`, label: "INTERNAL FRAGMENTATION", color: "text-rose-400", sub: "WASTED SLOTS" },
            { value: `${utilizationRate}%`, label: "TOTAL MEM UTILIZATION", color: "text-cyan-400", sub: "SYS MAP OCCUPIED" }
          ].map((m, idx) => (
            <div key={idx} className="glass p-4 rounded-xl border border-white/[0.04]">
              <div className="text-[9px] font-mono text-slate-500 tracking-wider uppercase">{m.label}</div>
              <div className={`text-xl font-display font-semibold mt-1 ${m.color}`}>{m.value}</div>
              <div className="text-[8px] font-mono text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Visual Memory Map diagram */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] shadow-lg flex flex-col gap-4 bg-[#09090c]/90">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pb-2 border-b border-white/5">
            <span>PHYSICAL TRANSISTOR MEMORY BLOCK MAPPINGS</span>
            <span>TOTAL ADDRESS REGISTER SPACE: 1700KB</span>
          </div>

          <div className="flex flex-col gap-3">
            {blocks.map((block) => {
              const isOccupied = block.allocatedProcessId !== null;
              const usedPercent = isOccupied && block.allocatedProcessSize 
                ? (block.allocatedProcessSize / block.originalSize) * 100 
                : 0;
              const fragSize = isOccupied && block.allocatedProcessSize 
                ? (block.originalSize - block.allocatedProcessSize) 
                : block.originalSize;

              return (
                <div 
                  key={block.id}
                  className="flex flex-col md:flex-row items-stretch md:items-center gap-3 font-mono text-xs text-slate-400 relative"
                >
                  {/* Address pointer offset */}
                  <div className="w-16 font-mono text-[10px] text-zinc-500 text-left md:text-right">
                    ADDR: {block.startAddress}K
                  </div>

                  {/* Visual segment progress bar with fragmentation styling */}
                  <div className="flex-1 bg-stone-900/60 border border-white/5 rounded-xl h-11 flex overflow-hidden relative shadow-inner">
                    {isOccupied ? (
                      <>
                        {/* Occupied memory proportional width */}
                        <div 
                          className="bg-orange-500/15 border-r border-orange-500/30 flex items-center px-3.5 text-orange-300 font-bold justify-between transition-all"
                          style={{ width: `${usedPercent}%` }}
                        >
                          <span>{block.allocatedProcessId}</span>
                          <span className="text-[10px] bg-orange-950/40 px-1.5 py-0.5 rounded text-orange-400 border border-orange-500/20">{block.allocatedProcessSize}KB</span>
                        </div>

                        {/* Internal fragmentation remainder width */}
                        <div 
                          className="flex-1 bg-rose-950/5 flex items-center px-3.5 text-rose-400/80 justify-between relative grid-bg-lines"
                        >
                          <span className="italic text-[10px] text-zinc-600">Fragmentation Offset</span>
                          <span className="text-[10px] text-rose-500 font-semibold">{fragSize}KB</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between px-4 text-zinc-500 italic text-[11.5px]">
                        <span>Free Block Slot {block.id}</span>
                        <span className="text-zinc-650 font-bold not-italic">{block.originalSize}KB</span>
                      </div>
                    )}
                  </div>

                  {/* Interaction release button */}
                  {isOccupied ? (
                    <button
                      onClick={() => deallocateBlock(block.id)}
                      id={`btn-dealloc-block-${block.id}`}
                      className="p-2 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all h-10 w-10 flex items-center justify-center cursor-pointer"
                      title="De-allocate Process"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-10 h-10 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-zinc-600 font-mono text-[9px]">
                      FREE
                    </div>
                  )}

                  {/* End pointer offset indicator */}
                  <div className="absolute right-14 -bottom-4 text-[8px] text-zinc-650 font-sans hidden md:block">
                    Segment ends: {block.startAddress + block.originalSize}K
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Requests status dashboard queue */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] shadow-lg flex flex-col gap-2">
          <div className="text-xs font-mono text-zinc-400 pb-1.5 border-b border-white/5">ALLOCATION STACK HISTOGRAM</div>
          {requests.length === 0 ? (
            <div className="py-6 text-center font-mono text-xs text-zinc-500">
              [ NO ALLOCATION ATTEMPTS REGISTERED ]
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-20 overflow-y-auto pr-1">
              {requests.map((r, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded-lg border font-mono text-[10px] flex flex-col gap-0.5 justify-between ${
                    r.status === 'allocated' 
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
                  }`}
                >
                  <div className="flex justify-between font-bold">
                    <span>{r.id}</span>
                    <span>{r.status.toUpperCase()}</span>
                  </div>
                  <div className="text-zinc-500">
                    Size: {r.size}KB {r.allocatedBlockId && `-> BLK ${r.allocatedBlockId}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Logger Terminal */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] font-mono text-[11px] flex flex-col gap-1 relative shadow-md">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping" />
              <span>MEM_ALLOCATOR TERM_LOG</span>
            </span>
            <span className="text-slate-500">STD_OUT</span>
          </div>
          <div className="h-16 overflow-y-auto flex flex-col gap-0.5 pr-2">
            {logs.map((log, idx) => (
              <div key={idx} className="text-slate-400 flex items-start gap-1">
                <span className="text-orange-500 select-none">&gt;</span>
                <span className="leading-5">{log}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
