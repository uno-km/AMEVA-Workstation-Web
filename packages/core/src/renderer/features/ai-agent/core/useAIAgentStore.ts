/**
 * ============================================================================
 * @file useAIAgentStore.ts
 * @system AMEVA OS Desktop Workstation - AI Intelligence Core
 * @location packages/core/src/renderer/features/ai-agent/core/useAIAgentStore.ts
 * @role Global Zustand Store for AI Agent Sessions, Messages & State
 * ============================================================================
 */

import { create } from 'zustand';
import type { AgentMessage, InsertSuggestion, EditSuggestion } from '../types';

interface AIAgentStoreState {
  messages: AgentMessage[];
  isStreaming: boolean;
  activeEngineType: 'webllm' | 'remote' | 'electron';
  modelId: string;
  isReady: boolean;
  statusMessage: string;

  // Actions
  setMessages: (messages: AgentMessage[] | ((prev: AgentMessage[]) => AgentMessage[])) => void;
  addMessage: (message: AgentMessage) => void;
  updateMessage: (id: string, partial: Partial<AgentMessage>) => void;
  clearMessages: () => void;
  setIsStreaming: (streaming: boolean) => void;
  setActiveEngineType: (type: 'webllm' | 'remote' | 'electron') => void;
  setModelId: (modelId: string) => void;
  setIsReady: (ready: boolean) => void;
  setStatusMessage: (msg: string) => void;

  // Suggestion Actions
  updateInsertSuggestionStatus: (msgId: string, suggestionIndex: number, status: 'accepted' | 'rejected') => void;
  updateEditSuggestionStatus: (msgId: string, status: 'accepted' | 'rejected') => void;
}

export const useAIAgentStore = create<AIAgentStoreState>((set) => ({
  messages: [],
  isStreaming: false,
  activeEngineType: 'webllm',
  modelId: 'default',
  isReady: false,
  statusMessage: '온디바이스 AI 준비 중...',

  setMessages: (updater) => set((state) => ({
    messages: typeof updater === 'function' ? updater(state.messages) : updater
  })),

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg]
  })),

  updateMessage: (id, partial) => set((state) => ({
    messages: state.messages.map((m) => (m.id === id ? { ...m, ...partial } : m))
  })),

  clearMessages: () => set({ messages: [] }),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setActiveEngineType: (type) => set({ activeEngineType: type }),
  setModelId: (modelId) => set({ modelId }),
  setIsReady: (ready) => set({ isReady: ready }),
  setStatusMessage: (msg) => set({ statusMessage: msg }),

  updateInsertSuggestionStatus: (msgId, suggestionIndex, status) => set((state) => ({
    messages: state.messages.map((m) => {
      if (m.id !== msgId || !m.insertSuggestions) return m;
      const nextSuggestions = [...m.insertSuggestions];
      if (nextSuggestions[suggestionIndex]) {
        nextSuggestions[suggestionIndex] = { ...nextSuggestions[suggestionIndex], status };
      }
      return { ...m, insertSuggestions: nextSuggestions };
    })
  })),

  updateEditSuggestionStatus: (msgId, status) => set((state) => ({
    messages: state.messages.map((m) => {
      if (m.id !== msgId || !m.editSuggestion) return m;
      return { ...m, editSuggestion: { ...m.editSuggestion, status } };
    })
  }))
}));
