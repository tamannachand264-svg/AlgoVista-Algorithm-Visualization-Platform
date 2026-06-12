import React, { useState, useEffect, useRef } from 'react';
import { GridNode, PerformanceMetrics } from '../types';
import { motion } from 'motion/react';
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  Info, 
  Check, 
  Gauge, 
  TrendingUp, 
  Activity, 
  Map, 
  Layers, 
  HelpCircle 
} from 'lucide-react';

const ROWS = 15;
const COLS = 35;

export default function PathfindingVisualizer() {
  const [grid, setGrid] = useState<GridNode[][]>([]);
  const [startNode, setStartNode] = useState({ row: 3, col: 5 });
  const [endNode, setEndNode] = useState({ row: 11, col: 29 });
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [dragMode, setDragMode] = useState<'none' | 'start' | 'end'>('none');
  const [activeAlgorithm, setActiveAlgorithm] = useState<'dijkstra' | 'astar' | 'bfs' | 'dfs'>('astar');
  const [isRunning, setIsRunning] = useState(false);
  const [speedMs, setSpeedMs] = useState(15);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    nodesVisited: 0,
    pathLength: 0,
    timeTakenMs: 0
  });
  const [logs, setLogs] = useState<string[]>(['System initialized. Choose an algorithm and click Visualize.']);
  
  // Keep trace of running intervals/timeouts to clear them
  const timeoutsRef = useRef<number[]>([]);

  // Initialize/Reset grid
  const initGrid = (clearAll = true) => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
    setIsRunning(false);

    const newGrid: GridNode[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const currentRow: GridNode[] = [];
      for (let c = 0; c < COLS; c++) {
        // If clearAll, remove walls. Otherwise keep them.
        const isWallNode = !clearAll && grid[r] && grid[r][c]?.isWall;
        currentRow.push({
          row: r,
          col: c,
          isStart: r === startNode.row && c === startNode.col,
          isEnd: r === endNode.row && c === endNode.col,
          isWall: !!isWallNode,
          isVisited: false,
          isShortestPath: false,
          distance: Infinity,
          previousNode: null,
          gScore: Infinity,
          fScore: Infinity
        });
      }
      newGrid.push(currentRow);
    }
    setGrid(newGrid);
    setMetrics({ nodesVisited: 0, pathLength: 0, timeTakenMs: 0 });
  };

  useEffect(() => {
    initGrid();
    return () => {
      timeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, [startNode, endNode]);

  // Handle Wall Generation/Dragging Start & End Nodes
  const handleMouseDown = (row: number, col: number) => {
    if (isRunning) return;
    setIsMousePressed(true);

    if (row === startNode.row && col === startNode.col) {
      setDragMode('start');
      return;
    }
    if (row === endNode.row && col === endNode.col) {
      setDragMode('end');
      return;
    }

    // Toggle wall
    toggleWall(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isMousePressed || isRunning) return;

    if (dragMode === 'start') {
      if (row === endNode.row && col === endNode.col) return;
      if (row === startNode.row && col === startNode.col) return;
      setStartNode({ row, col });
      return;
    }
    if (dragMode === 'end') {
      if (row === startNode.row && col === startNode.col) return;
      if (row === endNode.row && col === endNode.col) return;
      setEndNode({ row, col });
      return;
    }

    toggleWall(row, col);
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
    setDragMode('none');
  };

  const toggleWall = (row: number, col: number) => {
    if ((row === startNode.row && col === startNode.col) || (row === endNode.row && col === endNode.col)) return;
    setGrid(prev => prev.map((r, rIdx) => 
      r.map((node, cIdx) => {
        if (rIdx === row && cIdx === col) {
          return { ...node, isWall: !node.isWall };
        }
        return node;
      })
    ));
  };

  // Generate Maze (Simple automated wall placing)
  const generateRandomMaze = () => {
    if (isRunning) return;
    setLogs(prev => [...prev, 'Generating cyber grid topological obstacles...']);
    const newGrid = grid.map(r => r.map(node => {
      if (node.isStart || node.isEnd) return { ...node, isWall: false };
      return { ...node, isWall: Math.random() < 0.28 };
    }));
    setGrid(newGrid);
  };

  // Dijkstra Algorithm Core logic
  const runDijkstra = (gridCopy: GridNode[][]): { visited: GridNode[], path: GridNode[] } => {
    const visitedInOrder: GridNode[] = [];
    const startObj = gridCopy[startNode.row][startNode.col];
    const endObj = gridCopy[endNode.row][endNode.col];
    
    startObj.distance = 0;
    const unvisitedNodes = getAllNodes(gridCopy);

    while (unvisitedNodes.length > 0) {
      sortNodesByDistance(unvisitedNodes);
      const closestNode = unvisitedNodes.shift();

      if (!closestNode) break;
      if (closestNode.isWall) continue;
      if (closestNode.distance === Infinity) break;

      closestNode.isVisited = true;
      visitedInOrder.push(closestNode);

      if (closestNode.row === endObj.row && closestNode.col === endObj.col) {
        break;
      }

      updateUnvisitedNeighbors(closestNode, gridCopy);
    }

    const shortestPath: GridNode[] = [];
    let current: GridNode | null = gridCopy[endNode.row][endNode.col];
    const visitedSet = new Set<string>();
    while (current !== null) {
      const key = `${current.row}-${current.col}`;
      if (visitedSet.has(key)) break;
      visitedSet.add(key);
      shortestPath.unshift(current);
      current = current.previousNode;
    }

    return { 
      visited: visitedInOrder, 
      path: shortestPath.length > 0 && shortestPath[0].isStart ? shortestPath : [] 
    };
  };

  // A* Algorithm Core Logic
  const runAStar = (gridCopy: GridNode[][]): { visited: GridNode[], path: GridNode[] } => {
    const visitedInOrder: GridNode[] = [];
    const openSet: GridNode[] = [];
    const startObj = gridCopy[startNode.row][startNode.col];
    const endObj = gridCopy[endNode.row][endNode.col];

    startObj.gScore = 0;
    startObj.fScore = manhattanDistance(startObj, endObj);
    startObj.distance = 0;
    openSet.push(startObj);

    while (openSet.length > 0) {
      sortNodesByFScore(openSet);
      const current = openSet.shift();

      if (!current) break;
      if (current.isWall) continue;

      current.isVisited = true;
      visitedInOrder.push(current);

      if (current.row === endObj.row && current.col === endObj.col) {
        break;
      }

      const neighbors = getNeighbors(current, gridCopy);
      for (const neighbor of neighbors) {
        if (neighbor.isWall) continue;

        // Skip start node as a neighbor to avoid trace loops back to the beginning
        if (neighbor.row === startNode.row && neighbor.col === startNode.col) continue;

        const currentGScore = (current.gScore === undefined || current.gScore === Infinity) ? 0 : current.gScore;
        const tentativeGScore = currentGScore + 1;
        const neighborGScore = neighbor.gScore === undefined ? Infinity : neighbor.gScore;

        if (tentativeGScore < neighborGScore) {
          neighbor.previousNode = current;
          neighbor.gScore = tentativeGScore;
          neighbor.fScore = tentativeGScore + manhattanDistance(neighbor, endObj);
          neighbor.distance = tentativeGScore; // For consistency in tracking

          if (!openSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    const shortestPath: GridNode[] = [];
    let current: GridNode | null = gridCopy[endNode.row][endNode.col];
    const visitedSet = new Set<string>();
    while (current !== null) {
      const key = `${current.row}-${current.col}`;
      if (visitedSet.has(key)) break;
      visitedSet.add(key);
      shortestPath.unshift(current);
      current = current.previousNode;
    }

    return { 
      visited: visitedInOrder, 
      path: shortestPath.length > 0 && shortestPath[0].isStart ? shortestPath : [] 
    };
  };

  // BFS Algorithm
  const runBFS = (gridCopy: GridNode[][]): { visited: GridNode[], path: GridNode[] } => {
    const visitedInOrder: GridNode[] = [];
    const queue: GridNode[] = [];
    const startObj = gridCopy[startNode.row][startNode.col];
    const endObj = gridCopy[endNode.row][endNode.col];

    startObj.isVisited = true;
    queue.push(startObj);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      if (current.isWall) continue;

      visitedInOrder.push(current);

      if (current.row === endObj.row && current.col === endObj.col) {
        break;
      }

      const neighbors = getNeighbors(current, gridCopy);
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited && !neighbor.isWall) {
          neighbor.isVisited = true;
          neighbor.previousNode = current;
          queue.push(neighbor);
        }
      }
    }

    const shortestPath: GridNode[] = [];
    let current: GridNode | null = gridCopy[endNode.row][endNode.col];
    const visitedSet = new Set<string>();
    while (current !== null) {
      const key = `${current.row}-${current.col}`;
      if (visitedSet.has(key)) break;
      visitedSet.add(key);
      shortestPath.unshift(current);
      current = current.previousNode;
    }

    return { 
      visited: visitedInOrder, 
      path: shortestPath.length > 0 && shortestPath[0].isStart ? shortestPath : [] 
    };
  };

  // DFS Algorithm
  const runDFS = (gridCopy: GridNode[][]): { visited: GridNode[], path: GridNode[] } => {
    const visitedInOrder: GridNode[] = [];
    const stack: GridNode[] = [];
    const startObj = gridCopy[startNode.row][startNode.col];
    const endObj = gridCopy[endNode.row][endNode.col];

    stack.push(startObj);

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) break;
      if (current.isWall) continue;

      if (!current.isVisited) {
        current.isVisited = true;
        visitedInOrder.push(current);

        if (current.row === endObj.row && current.col === endObj.col) {
          break;
        }

        const neighbors = getNeighbors(current, gridCopy);
        // Reverse so we explore up/right first for layout elegance
        for (const neighbor of neighbors.reverse()) {
          if (!neighbor.isVisited && !neighbor.isWall) {
            neighbor.previousNode = current;
            stack.push(neighbor);
          }
        }
      }
    }

    const shortestPath: GridNode[] = [];
    let current: GridNode | null = gridCopy[endNode.row][endNode.col];
    const visitedSet = new Set<string>();
    while (current !== null) {
      const key = `${current.row}-${current.col}`;
      if (visitedSet.has(key)) break;
      visitedSet.add(key);
      shortestPath.unshift(current);
      current = current.previousNode;
    }

    return { 
      visited: visitedInOrder, 
      path: shortestPath.length > 0 && shortestPath[0].isStart ? shortestPath : [] 
    };
  };

  // Helpers for Pathfinder Algos
  const getAllNodes = (gridCopy: GridNode[][]): GridNode[] => {
    const nodes: GridNode[] = [];
    for (const r of gridCopy) {
      for (const node of r) {
        nodes.push(node);
      }
    }
    return nodes;
  };

  const sortNodesByDistance = (unvisitedNodes: GridNode[]) => {
    unvisitedNodes.sort((a, b) => a.distance - b.distance);
  };

  const sortNodesByFScore = (openSet: GridNode[]) => {
    openSet.sort((a, b) => (a.fScore || Infinity) - (b.fScore || Infinity));
  };

  const updateUnvisitedNeighbors = (node: GridNode, gridCopy: GridNode[][]) => {
    const neighbors = getNeighbors(node, gridCopy);
    for (const neighbor of neighbors) {
      const tentativeDistance = node.distance + 1;
      if (tentativeDistance < neighbor.distance) {
        neighbor.distance = tentativeDistance;
        neighbor.previousNode = node;
      }
    }
  };

  const getNeighbors = (node: GridNode, gridCopy: GridNode[][]): GridNode[] => {
    const neighbors: GridNode[] = [];
    const { row, col } = node;
    if (row > 0) neighbors.push(gridCopy[row - 1][col]);
    if (row < ROWS - 1) neighbors.push(gridCopy[row + 1][col]);
    if (col > 0) neighbors.push(gridCopy[row][col - 1]);
    if (col < COLS - 1) neighbors.push(gridCopy[row][col + 1]);
    return neighbors;
  };

  const manhattanDistance = (node: GridNode, end: GridNode): number => {
    return Math.abs(node.row - end.row) + Math.abs(node.col - end.col);
  };

  // Perform full visual cascade animation inside React
  const visualizePathfinder = () => {
    if (isRunning) return;
    initGrid(false); // Clean previous route markers but keep obstacles!
    setIsRunning(true);
    setLogs(prev => [...prev, `Starting simulation: ${activeAlgorithm.toUpperCase()} execution...`]);

    // Work on a copy of the grid for pathfinding calculation
    const gridCopy = grid.map(r => r.map(node => ({
      ...node,
      isVisited: false,
      isShortestPath: false,
      distance: Infinity,
      previousNode: null,
      gScore: Infinity,
      fScore: Infinity
    })));

    const startTime = performance.now();
    let result: { visited: GridNode[], path: GridNode[] };

    if (activeAlgorithm === 'dijkstra') {
      result = runDijkstra(gridCopy);
    } else if (activeAlgorithm === 'astar') {
      result = runAStar(gridCopy);
    } else if (activeAlgorithm === 'bfs') {
      result = runBFS(gridCopy);
    } else {
      result = runDFS(gridCopy);
    }

    const { visited, path } = result;

    if (visited.length === 0) {
      setLogs(prev => [...prev, 'Warning: No topological visited routes calculated.']);
      setIsRunning(false);
      return;
    }

    const timeTakenMs = performance.now() - startTime;

    // Animate Visited Nodes
    visited.forEach((node, idx) => {
      const timeout = window.setTimeout(() => {
        setGrid(prev => prev.map((r, rIdx) => 
          r.map((cNode, cIdx) => {
            if (rIdx === node.row && cIdx === node.col) {
              return { ...cNode, isVisited: true };
            }
            return cNode;
          })
        ));

        // Update realtimes metrics incrementally
        setMetrics(m => ({
          ...m,
          nodesVisited: idx + 1,
          timeTakenMs: parseFloat(timeTakenMs.toFixed(2))
        }));
      }, idx * speedMs);

      timeoutsRef.current.push(timeout);
    });

    // Animate Target shortest path
    const totalVisitTime = visited.length * speedMs;
    const pathTimeout = window.setTimeout(() => {
      if (path.length === 0) {
        setLogs(prev => [...prev, 'Simulation completed: Target UNREACHABLE block configuration.']);
        setIsRunning(false);
        return;
      }

      setLogs(prev => [...prev, `Path found! Shortest path length: ${path.length} hops.`]);

      path.forEach((node, idx) => {
        const nodeTimeout = window.setTimeout(() => {
          setGrid(prev => prev.map((r, rIdx) => 
            r.map((cNode, cIdx) => {
              if (rIdx === node.row && cIdx === node.col) {
                return { ...cNode, isShortestPath: true };
              }
              return cNode;
            })
          ));

          setMetrics(m => ({
            ...m,
            pathLength: idx + 1
          }));

          if (idx === path.length - 1) {
            setIsRunning(false);
          }
        }, idx * (speedMs * 1.5));
        timeoutsRef.current.push(nodeTimeout);
      });
    }, totalVisitTime);

    timeoutsRef.current.push(pathTimeout);
  };

  const algorithmData = {
    astar: {
      name: 'A* Search',
      time: 'O(E log V)',
      space: 'O(V)',
      desc: 'Heuristic-driven shortest-path traversal. Ideal for geographical grids.'
    },
    dijkstra: {
      name: "Dijkstra's Algo",
      time: 'O(E + V log V)',
      space: 'O(V)',
      desc: 'Uniform-cost search traversing layer-by-layer. Guarantees absolute shortest path.'
    },
    bfs: {
      name: 'Breadth-First Search',
      time: 'O(V + E)',
      space: 'O(V)',
      desc: 'Explores adjacent neighbors first. Guaranteed shortest path on unweighted grids.'
    },
    dfs: {
      name: 'Depth-First Search',
      time: 'O(V + E)',
      space: 'O(V)',
      desc: 'Explores deeply down a single path before backtracking. Does not guarantee shortest paths.'
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto text-slate-100 select-none pb-24">
      {/* Sidebar controls */}
      <div className="w-full md:w-80 flex flex-col gap-5">
        
        {/* Core Controls Module */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="font-display font-medium text-xs tracking-wider uppercase text-cyan-400">Pathfinder Controls</span>
            <span className="font-mono text-[9px] text-zinc-500">[CONTROLS]</span>
          </div>

          {/* Algorithm selects */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] text-slate-400 uppercase">SELECT ALGORITHM</label>
            <div className="grid grid-cols-2 gap-1.5 font-sans">
              {(['astar', 'dijkstra', 'bfs', 'dfs'] as const).map(algo => (
                <button
                  key={algo}
                  disabled={isRunning}
                  id={`btn-algo-${algo}`}
                  onClick={() => {
                    setActiveAlgorithm(algo);
                    setLogs(prev => [...prev, `Selected ${algo.toUpperCase()} algorithm`]);
                  }}
                  className={`px-2 py-2 text-left rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                    activeAlgorithm === algo
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                      : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span className="font-mono uppercase text-[9px] block text-zinc-500">
                    {algo === 'astar' ? 'Fast' : algo === 'dijkstra' ? 'Standard' : 'Blind'}
                  </span>
                  {algo === 'astar' ? 'A* Search' : algo === 'dijkstra' ? 'Dijkstra' : algo === 'bfs' ? 'BFS' : 'DFS'}
                </button>
              ))}
            </div>
          </div>

          {/* Speed slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">ANIMATION DELAY</span>
              <span className="text-cyan-400">{speedMs}ms</span>
            </div>
            <input 
              type="range"
              min="5"
              max="150"
              step="5"
              value={speedMs}
              disabled={isRunning}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="accent-cyan-400 bg-white/10 h-1 rounded-lg cursor-pointer"
            />
          </div>

          {/* Core CTAs */}
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={visualizePathfinder}
              disabled={isRunning}
              id="btn-visualize-run"
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-mono text-xs text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>RUN {activeAlgorithm.toUpperCase()}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={generateRandomMaze}
                disabled={isRunning}
                id="btn-generate-maze"
                className="py-1.5 bg-white/[0.03] border border-white/10 text-slate-300 font-mono text-[10px] rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                GEN MAZE
              </button>

              <button
                onClick={() => initGrid(true)}
                disabled={isRunning}
                id="btn-reset-grid"
                className="py-1.5 bg-zinc-950 border border-white/5 text-rose-400 font-mono text-[10px] rounded-lg hover:bg-rose-950/20 hover:border-rose-900/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET ALL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Algorithm details */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col gap-3 font-mono text-[11px]">
          <div className="text-xs uppercase text-slate-300 font-display font-medium text-cyan-400">ALGORITHM TELEMETRY</div>
          <div className="flex justify-between pb-1 border-b border-white/5">
            <span className="text-slate-500">NAME:</span>
            <span className="text-slate-200">{algorithmData[activeAlgorithm].name}</span>
          </div>
          <div className="flex justify-between pb-1 border-b border-white/5">
            <span className="text-slate-500">TIME EXP:</span>
            <span className="text-cyan-400">{algorithmData[activeAlgorithm].time}</span>
          </div>
          <div className="flex justify-between pb-1 border-b border-white/5">
            <span className="text-slate-500">SPACE EXP:</span>
            <span className="text-purple-400">{algorithmData[activeAlgorithm].space}</span>
          </div>
          <p className="text-zinc-500 leading-relaxed font-sans text-[10px] mt-1">
            {algorithmData[activeAlgorithm].desc}
          </p>
        </div>
      </div>

      {/* Main Interactive Canvas Grid Area */}
      <div className="flex-1 flex flex-col gap-5">
        
        {/* Performance metrics dashboard */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: metrics.nodesVisited || 0, label: "NODES EXPLORED", color: "text-cyan-400", sub: "TOTAL VISITED" },
            { value: metrics.pathLength ? `${metrics.pathLength} blocks` : 'Infinity', label: "PATH DISTANCE", color: "text-amber-400", sub: "HOP OFFSET" },
            { value: `${metrics.timeTakenMs || 0}ms`, label: "CPU LOGIC LATENCY", color: "text-purple-400", sub: "CALCULATED" }
          ].map((m, idx) => (
            <div key={idx} className="glass p-4 rounded-xl border border-white/[0.04]">
              <div className="text-[9px] font-mono text-slate-500 tracking-wider uppercase">{m.label}</div>
              <div className={`text-xl font-display font-semibold mt-1 ${m.color}`}>{m.value}</div>
              <div className="text-[8px] font-mono text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Interactive Grid Card */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] flex flex-col items-center shadow-lg relative">
          
          {/* Instructions Legend */}
          <div className="w-full flex flex-wrap justify-between gap-3 text-[10px] font-mono mb-4 border-b border-white/5 pb-3">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-cyan-400 border border-cyan-300 rounded" /> Start</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-purple-600 border border-purple-500 rounded" /> End</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-neutral-800 border border-white/10 rounded" /> Wall Obstacles</span>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-cyan-950/40 border border-cyan-800/40 rounded" /> Visited</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded" /> Shortest Path</span>
            </div>
            <div className="text-zinc-500">[ DRAG START/END NODES OR HOLD DOWN MOUSE TO DRAW WALLS ]</div>
          </div>

          <div 
            className="grid gap-[1.5px] bg-black/40 p-2.5 rounded-xl border border-white/5 shadow-inner overflow-x-auto w-full max-w-full justify-center"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(13px, 1fr))` }}
            onMouseLeave={handleMouseUp}
          >
            {grid.map((rowArr, rIdx) => 
              rowArr.map((node, cIdx) => {
                let cellColor = 'bg-stone-900/60 hover:bg-white/[0.04] border border-white/[0.04]';
                let animationClass = '';

                if (node.isWall) {
                  cellColor = 'bg-neutral-800 border border-neutral-700 shadow-[inset_0_0_8px_rgba(0,0,0,0.8)]';
                } else if (node.isStart) {
                  cellColor = 'bg-cyan-400 border border-cyan-200 cursor-grab active:cursor-grabbing glow-cyan';
                } else if (node.isEnd) {
                  cellColor = 'bg-purple-600 border border-purple-400 cursor-grab active:cursor-grabbing glow-purple';
                } else if (node.isShortestPath) {
                  cellColor = 'bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-300';
                  animationClass = 'transition-all duration-300 scale-102';
                } else if (node.isVisited) {
                  cellColor = 'bg-[#0f1f3a] border border-[#162a4d]';
                  animationClass = 'transition-all duration-150 scale-98';
                }

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    id={`grid-cell-${rIdx}-${cIdx}`}
                    onMouseDown={() => handleMouseDown(rIdx, cIdx)}
                    onMouseEnter={() => handleMouseEnter(rIdx, cIdx)}
                    onMouseUp={handleMouseUp}
                    className={`aspect-square w-4 h-4 md:w-[15px] md:h-[15px] rounded-[3px] cursor-pointer ${cellColor} ${animationClass} flex items-center justify-center`}
                  >
                    {node.isStart && <span className="font-mono text-[8px] font-bold text-black">S</span>}
                    {node.isEnd && <span className="font-mono text-[8px] font-bold text-white">E</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-time Logger Terminal */}
        <div className="glass p-5 rounded-2xl border border-white/[0.05] font-mono text-[11px] flex flex-col gap-2 shadow-md relative">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              <span>ALGOVISTA TERM_LOG</span>
            </span>
            <span className="text-slate-500">STD_OUT</span>
          </div>
          <div className="h-28 overflow-y-auto flex flex-col gap-1 pr-2">
            {logs.map((log, idx) => (
              <div key={idx} className="text-slate-400 flex items-start gap-1">
                <span className="text-cyan-500 select-none">&gt;</span>
                <span className="leading-5">{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
