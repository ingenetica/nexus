import { create } from 'zustand'
import { Personality, SocialPlatform } from '../lib/types'
import { ipc } from '../lib/ipc'

interface PersonalityState {
  personalities: Personality[]
  platformAssignments: Partial<Record<SocialPlatform, string>>
  loading: boolean
  loadPersonalities: () => Promise<void>
  createPersonality: (data: Omit<Personality, 'id' | 'is_default' | 'created_at'>) => Promise<void>
  updatePersonality: (id: string, data: Partial<Omit<Personality, 'id' | 'is_default' | 'created_at'>>) => Promise<void>
  deletePersonality: (id: string) => Promise<string | null>
  setDefaultPersonality: (id: string) => Promise<void>
  assignPlatform: (platform: SocialPlatform, personalityId: string) => Promise<void>
  loadPlatformAssignments: () => Promise<void>
}

export const usePersonalityStore = create<PersonalityState>((set, get) => ({
  personalities: [],
  platformAssignments: {},
  loading: false,

  loadPersonalities: async () => {
    set({ loading: true })
    const result = await ipc().listPersonalities()
    if (result.success && result.data) {
      set({ personalities: result.data })
    }
    set({ loading: false })
  },

  createPersonality: async (data) => {
    await ipc().createPersonality(data)
    await get().loadPersonalities()
  },

  updatePersonality: async (id, data) => {
    await ipc().updatePersonality(id, data)
    await get().loadPersonalities()
  },

  deletePersonality: async (id) => {
    const result = await ipc().deletePersonality(id)
    if (!result.success) return result.error || 'Delete failed'
    await get().loadPersonalities()
    return null
  },

  setDefaultPersonality: async (id) => {
    await ipc().setDefaultPersonality(id)
    await get().loadPersonalities()
  },

  assignPlatform: async (platform, personalityId) => {
    await ipc().assignPlatformPersonality(platform, personalityId)
    await get().loadPlatformAssignments()
  },

  loadPlatformAssignments: async () => {
    const result = await ipc().getPlatformAssignments()
    if (result.success && result.data) {
      set({ platformAssignments: result.data })
    }
  },
}))
