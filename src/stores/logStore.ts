import { create } from 'zustand'
import { LogEntry, LogLevel, LogCategory } from '../lib/types'
import { ipc } from '../lib/ipc'

const MAX_ENTRIES = 500

interface LogStoreState {
  entries: LogEntry[]
  filterLevel: LogLevel | 'all'
  filterCategory: LogCategory | 'all'
  paused: boolean
  setFilterLevel: (level: LogLevel | 'all') => void
  setFilterCategory: (category: LogCategory | 'all') => void
  togglePaused: () => void
  clear: () => void
  init: () => () => void
}

export const useLogStore = create<LogStoreState>((set, get) => ({
  entries: [],
  filterLevel: 'all',
  filterCategory: 'all',
  paused: false,

  setFilterLevel: (level) => set({ filterLevel: level }),
  setFilterCategory: (category) => set({ filterCategory: category }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  clear: () => set({ entries: [] }),

  init: () => {
    const unsub = ipc().onLogEntry((entry: LogEntry) => {
      if (get().paused) return
      set((s) => ({
        entries: [...s.entries.slice(-(MAX_ENTRIES - 1)), entry],
      }))
    })
    return unsub
  },
}))
