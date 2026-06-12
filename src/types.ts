export type TabType = 'home' | 'pathfinder' | 'sorting' | 'cpu' | 'memory' | 'comparison';

// Pathfinding Types
export interface GridNode {
  row: number;
  col: number;
  isStart: boolean;
  isEnd: boolean;
  isWall: boolean;
  isVisited: boolean;
  isShortestPath: boolean;
  distance: number;
  gScore?: number;
  fScore?: number;
  previousNode: GridNode | null;
}

// Sorting Types
export interface SortElement {
  value: number;
  state: 'default' | 'compare' | 'swap' | 'sorted';
}

export type SortAlgorithm = 'merge' | 'quick' | 'heap';

// CPU Scheduling Types
export interface CPUProcess {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  completionTime: number;
  waitingTime: number;
  turnaroundTime: number;
  color: string;
}

export interface GanttSegment {
  processName: string;
  startTime: number;
  endTime: number;
  color: string;
}

export type CPUSchedulerAlgo = 'rr' | 'sjf';

// Memory Allocation Types
export interface MemoryBlock {
  id: string;
  size: number;
  originalSize: number;
  allocatedProcessId: string | null;
  allocatedProcessSize?: number;
  startAddress: number;
}

export interface MemoryRequest {
  id: string;
  size: number;
  status: 'allocated' | 'failed' | 'pending';
  allocatedBlockId: string | null;
}

export type MemoryAlgo = 'first-fit';

// Real-time Metrics
export interface PerformanceMetrics {
  nodesVisited?: number;
  pathLength?: number;
  timeTakenMs: number;
  comparisons?: number;
  swaps?: number;
  cpuUtilization?: number;
  averageWaitingTime?: number;
  averageTurnaroundTime?: number;
  memoryUtilization?: number;
}
