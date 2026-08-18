/**
 * @file useDocumentSummaryStore.ts
 * @system AMEVA OS Desktop Workstation - Document Summary Store
 * @location packages/core/src/renderer/stores/useDocumentSummaryStore.ts
 * @role Global Store for Multi-Document Map-Reduce AI Summaries with FIFO Queue & Deck Management
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - 여러 개의 PDF/DOCX/PPTX 문서에 대해 백그라운드 AI 요약 태스크를 생성하고,
 *   GPU VRAM 보호를 위해 선입선출(FIFO) 큐를 통해 순차 실행한다.
 * - 모달 전환, 최소화, 고아 태스크 감지 시 큐가 영구 동결(Deadlock)되는 현상을 방지하기 위해
 *   타임아웃 감지 및 강제 즉시 실행(`forceStartTask`), 자동 전진(`advanceQueue`)을 보장한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 문서 요약 태스크 등록, 진행률 및 실시간 로그 관리, 하단 덱(Deck) UI 상태 동기화.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 태스크 완료, 오류, 중단 시 반드시 `advanceQueue()`를 호출하여 대기 중인 다음 작업의 실행을 재개할 것.
 */

import { create } from 'zustand';

export interface MapReduceLogItem {
  id: string;
  time: string;
  stage: 'queued' | 'system' | 'extracting' | 'mapping' | 'reducing' | 'synthesizing' | 'done' | 'error';
  message: string;
  detail?: string;
}

export interface MapReduceProgress {
  stage: 'extracting' | 'mapping' | 'reducing' | 'synthesizing' | 'done' | 'error' | 'queued';
  progressPercent: number;
  currentStep: number;
  totalSteps: number;
  message: string;
  streamingChunk?: string;
}

export interface DocumentSummaryTask {
  id: string;
  fileId?: string;
  blockId?: string;
  fileName: string;
  docType: 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'hwpx' | 'txt';
  numPages: number;
  progressPercent: number;
  stage: 'queued' | 'extracting' | 'mapping' | 'reducing' | 'synthesizing' | 'done' | 'error';
  queuePosition?: number;
  statusMessage: string;
  reportResult: string;
  logs: MapReduceLogItem[];
  createdAt: number;
  updatedAt: number;
  abortController?: AbortController;
}

interface DocumentSummaryStoreState {
  tasks: Record<string, DocumentSummaryTask>;
  activeModalTaskId: string | null;
  isDeckExpanded: boolean;
  activeRunningTaskId: string | null;
  taskQueue: string[];

  registerSummaryTask: (params: {
    id: string;
    fileId?: string;
    blockId?: string;
    fileName: string;
    docType?: DocumentSummaryTask['docType'];
    numPages?: number;
    abortController?: AbortController;
  }) => { isQueued: boolean; queuePosition: number };

  advanceQueue: () => void;
  forceStartTask: (taskId: string) => void;
  updateProgress: (taskId: string, progress: Partial<MapReduceProgress>) => void;
  appendLog: (taskId: string, log: MapReduceLogItem) => void;
  setReportResult: (taskId: string, reportResult: string) => void;
  setTaskDone: (taskId: string, finalReport: string) => void;
  setTaskError: (taskId: string, errorMsg: string) => void;
  abortTask: (taskId: string) => void;
  removeTask: (taskId: string) => void;
  clearAllTasks: () => void;

  openModalForTask: (taskId: string) => void;
  closeModal: () => void;
  toggleDeckExpanded: () => void;
  setDeckExpanded: (isDeckExpanded: boolean) => void;
  syncWithEditorBlocks: (activeBlockIds: string[]) => void;
}

export const useDocumentSummaryStore = create<DocumentSummaryStoreState>((set, get) => ({
  tasks: {},
  activeModalTaskId: null,
  isDeckExpanded: false,
  activeRunningTaskId: null,
  taskQueue: [],

  registerSummaryTask: ({ id, fileId, blockId, fileName, docType = 'pdf', numPages, abortController }) => {
    const state = get();
    const existing = state.tasks[id];
    
    if (existing?.abortController && existing.stage !== 'done' && existing.stage !== 'error') {
      try { existing.abortController.abort(); } catch {}
    }

    const currentRunning = state.activeRunningTaskId;
    const runningTask = currentRunning ? state.tasks[currentRunning] : null;
    
    // 25초 이상 업데이트가 없거나 종료된 태스크는 실행 중으로 간주하지 않음 (데드락 방어)
    const isRunningActive = !!runningTask && 
      runningTask.stage !== 'done' && 
      runningTask.stage !== 'error' && 
      (Date.now() - (runningTask.updatedAt || 0)) < 25000;

    const isAnotherRunning = isRunningActive && currentRunning !== id;

    let isQueued = false;
    let queuePosition = 0;
    let initialStage: DocumentSummaryTask['stage'] = 'extracting';
    let initialMessage = '대용량 문서 3단계 맵리듀스 파이프라인 가동 준비 중...';
    let newTaskQueue = [...state.taskQueue.filter(tid => tid !== id)];

    if (isAnotherRunning) {
      isQueued = true;
      newTaskQueue.push(id);
      queuePosition = newTaskQueue.length;
      initialStage = 'queued';
      initialMessage = `프로세스 대기 큐 등록됨 (선입선출 #${queuePosition}번 대기 중)`;
    }

    const newTask: DocumentSummaryTask = {
      id,
      fileId,
      blockId,
      fileName,
      docType,
      numPages: numPages || 1,
      progressPercent: isQueued ? 0 : 5,
      stage: initialStage,
      queuePosition: isQueued ? queuePosition : undefined,
      statusMessage: initialMessage,
      reportResult: '',
      logs: isQueued ? [{
        id: `log_q_${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        stage: 'system',
        message: `다른 문서 분석이 진행 중입니다. FIFO 대기 큐 #${queuePosition}번에 등록되었습니다.`
      }] : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      abortController
    };

    set((s) => ({
      tasks: { ...s.tasks, [id]: newTask },
      taskQueue: newTaskQueue,
      activeRunningTaskId: isAnotherRunning ? s.activeRunningTaskId : id,
      activeModalTaskId: id
    }));

    return { isQueued, queuePosition };
  },

  forceStartTask: (taskId: string) => {
    const state = get();
    const task = state.tasks[taskId];
    if (!task) return;

    // 기존 실행 중인 다른 작업이 있다면 abort
    if (state.activeRunningTaskId && state.activeRunningTaskId !== taskId) {
      const prev = state.tasks[state.activeRunningTaskId];
      if (prev?.abortController) {
        try { prev.abortController.abort(); } catch {}
      }
    }

    const nextQueue = state.taskQueue.filter(id => id !== taskId);
    const updatedTasks = { ...state.tasks };
    updatedTasks[taskId] = {
      ...task,
      stage: 'extracting',
      queuePosition: undefined,
      progressPercent: 5,
      statusMessage: '즉시 분석을 시작합니다...',
      updatedAt: Date.now()
    };

    set({
      tasks: updatedTasks,
      taskQueue: nextQueue,
      activeRunningTaskId: taskId,
      activeModalTaskId: taskId
    });

    window.dispatchEvent(new CustomEvent('ameva:summary-queue-start', { detail: { taskId } }));
  },

  advanceQueue: () => {
    const state = get();
    let nextQueue = [...state.taskQueue];
    let nextTaskId: string | null = null;

    while (nextQueue.length > 0) {
      const candidate = nextQueue.shift()!;
      const candidateTask = state.tasks[candidate];
      if (candidateTask && candidateTask.stage === 'queued') {
        nextTaskId = candidate;
        break;
      }
    }

    if (nextTaskId) {
      const targetTask = state.tasks[nextTaskId];
      const updatedTasks = { ...state.tasks };
      nextQueue.forEach((tid, idx) => {
        if (updatedTasks[tid]) {
          updatedTasks[tid] = {
            ...updatedTasks[tid],
            queuePosition: idx + 1,
            statusMessage: `프로세스 대기 큐 대기 중 (선입선출 #${idx + 1}번)`
          };
        }
      });

      if (targetTask) {
        updatedTasks[nextTaskId] = {
          ...targetTask,
          stage: 'extracting',
          queuePosition: undefined,
          progressPercent: 5,
          statusMessage: '선입선출 큐 순번에 도달하여 분석을 시작합니다...',
          updatedAt: Date.now()
        };
      }

      set({
        tasks: updatedTasks,
        taskQueue: nextQueue,
        activeRunningTaskId: nextTaskId
      });

      window.dispatchEvent(new CustomEvent('ameva:summary-queue-start', { detail: { taskId: nextTaskId } }));
    } else {
      set({
        activeRunningTaskId: null,
        taskQueue: []
      });
    }
  },

  updateProgress: (taskId, progress) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            stage: progress.stage || task.stage,
            progressPercent: progress.progressPercent !== undefined ? progress.progressPercent : task.progressPercent,
            statusMessage: progress.message || task.statusMessage,
            updatedAt: Date.now()
          }
        }
      };
    });
  },

  appendLog: (taskId, log) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            logs: [...task.logs, log],
            updatedAt: Date.now()
          }
        }
      };
    });
  },

  setReportResult: (taskId, reportResult) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            reportResult,
            updatedAt: Date.now()
          }
        }
      };
    });
  },

  setTaskError: (taskId, errorMsg) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            stage: 'error',
            statusMessage: `분석 실패: ${errorMsg}`,
            updatedAt: Date.now()
          }
        }
      };
    });
    if (get().activeRunningTaskId === taskId) {
      setTimeout(() => get().advanceQueue(), 50);
    }
  },

  setTaskDone: (taskId, finalReport) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            stage: 'done',
            progressPercent: 100,
            statusMessage: '대용량 문서 3단계 맵리듀스 분석 완료',
            reportResult: finalReport || task.reportResult,
            updatedAt: Date.now()
          }
        }
      };
    });
    if (get().activeRunningTaskId === taskId) {
      setTimeout(() => get().advanceQueue(), 50);
    }
  },

  abortTask: (taskId) => {
    const task = get().tasks[taskId];
    if (task?.abortController) {
      try {
        task.abortController.abort();
      } catch {}
    }
    set((state) => {
      const current = state.tasks[taskId];
      if (!current) return state;
      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...current,
            stage: 'error',
            statusMessage: '사용자에 의해 분석이 중단되었습니다.',
            updatedAt: Date.now()
          }
        },
        taskQueue: state.taskQueue.filter(id => id !== taskId)
      };
    });
    if (get().activeRunningTaskId === taskId) {
      setTimeout(() => get().advanceQueue(), 50);
    }
  },

  removeTask: (taskId) => {
    const task = get().tasks[taskId];
    if (task?.abortController) {
      try {
        task.abortController.abort();
      } catch {}
    }
    const isCurrent = get().activeRunningTaskId === taskId;
    set((state) => {
      const newTasks = { ...state.tasks };
      delete newTasks[taskId];
      return {
        tasks: newTasks,
        taskQueue: state.taskQueue.filter(id => id !== taskId),
        activeModalTaskId: state.activeModalTaskId === taskId ? null : state.activeModalTaskId
      };
    });
    if (isCurrent) {
      setTimeout(() => get().advanceQueue(), 50);
    }
  },

  clearAllTasks: () => {
    const tasks = get().tasks;
    Object.values(tasks).forEach((t) => {
      if (t.abortController) {
        try {
          t.abortController.abort();
        } catch {}
      }
    });
    set({ tasks: {}, activeModalTaskId: null, activeRunningTaskId: null, taskQueue: [] });
  },

  openModalForTask: (taskId) => set({ activeModalTaskId: taskId }),
  closeModal: () => set({ activeModalTaskId: null }),
  toggleDeckExpanded: () => set((state) => ({ isDeckExpanded: !state.isDeckExpanded })),
  setDeckExpanded: (isDeckExpanded) => set({ isDeckExpanded }),

  syncWithEditorBlocks: (activeBlockIds) => {
    const activeSet = new Set(activeBlockIds);
    const currentTasks = get().tasks;
    let hasChanges = false;
    const newTasks = { ...currentTasks };

    Object.entries(currentTasks).forEach(([taskId, task]) => {
      if (task.blockId && !activeSet.has(task.blockId)) {
        if (task.abortController) {
          try {
            task.abortController.abort();
          } catch {}
        }
        delete newTasks[taskId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      set((state) => ({
        tasks: newTasks,
        activeModalTaskId: state.activeModalTaskId && !newTasks[state.activeModalTaskId] ? null : state.activeModalTaskId
      }));
    }
  }
}));
