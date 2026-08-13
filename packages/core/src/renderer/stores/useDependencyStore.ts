import { create } from 'zustand'

export type DependencyStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface DependencyInfo {
  id: string
  name: string
  status: DependencyStatus
  error?: string
}

interface DependencyStore {
  dependencies: Record<string, DependencyInfo>
  setDependencyStatus: (id: string, status: DependencyStatus, error?: string) => void
  initDependency: (id: string, name: string) => void
}

export const useDependencyStore = create<DependencyStore>((set) => ({
  dependencies: {},
  
  initDependency: (id, name) => set((state) => ({
    dependencies: {
      ...state.dependencies,
      [id]: { id, name, status: 'idle' }
    }
  })),

  setDependencyStatus: (id, status, error) => set((state) => {
    const existing = state.dependencies[id]
    if (!existing) return state
    return {
      dependencies: {
        ...state.dependencies,
        [id]: { ...existing, status, error }
      }
    }
  }),
}))
