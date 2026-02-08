import { create } from 'zustand'
import { LLMConfig } from '../lib/types'
import { DEFAULT_LLM_CONFIG } from '../lib/constants'
import { ipc } from '../lib/ipc'

interface LinkedInConfig {
  clientId: string
  clientSecret: string
}

interface FacebookConfig {
  appId: string
  appSecret: string
}

interface SettingsState {
  llmConfig: LLMConfig
  linkedInConfig: LinkedInConfig
  facebookConfig: FacebookConfig
  loading: boolean
  dirty: boolean
  linkedInDirty: boolean
  facebookDirty: boolean
  setLLMConfig: (config: Partial<LLMConfig>) => void
  loadLLMConfig: () => Promise<void>
  saveLLMConfig: () => Promise<void>
  setLinkedInConfig: (config: Partial<LinkedInConfig>) => void
  loadLinkedInConfig: () => Promise<void>
  saveLinkedInConfig: () => Promise<void>
  setFacebookConfig: (config: Partial<FacebookConfig>) => void
  loadFacebookConfig: () => Promise<void>
  saveFacebookConfig: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  llmConfig: DEFAULT_LLM_CONFIG,
  linkedInConfig: { clientId: '', clientSecret: '' },
  facebookConfig: { appId: '', appSecret: '' },
  loading: false,
  dirty: false,
  linkedInDirty: false,
  facebookDirty: false,

  setLLMConfig: (config) => {
    set((state) => ({
      llmConfig: { ...state.llmConfig, ...config },
      dirty: true,
    }))
  },

  loadLLMConfig: async () => {
    set({ loading: true })
    const result = await ipc().getLLMConfig()
    if (result.success && result.data) {
      set({ llmConfig: result.data, dirty: false })
    }
    set({ loading: false })
  },

  saveLLMConfig: async () => {
    const { llmConfig } = get()
    await ipc().setLLMConfig(llmConfig)
    set({ dirty: false })
  },

  setLinkedInConfig: (config) => {
    set((state) => ({
      linkedInConfig: { ...state.linkedInConfig, ...config },
      linkedInDirty: true,
    }))
  },

  loadLinkedInConfig: async () => {
    const result = await ipc().getLinkedInConfig()
    if (result.success && result.data) {
      set({ linkedInConfig: result.data, linkedInDirty: false })
    }
  },

  saveLinkedInConfig: async () => {
    const { linkedInConfig } = get()
    await ipc().setLinkedInConfig(linkedInConfig)
    set({ linkedInDirty: false })
  },

  setFacebookConfig: (config) => {
    set((state) => ({
      facebookConfig: { ...state.facebookConfig, ...config },
      facebookDirty: true,
    }))
  },

  loadFacebookConfig: async () => {
    const result = await ipc().getFacebookConfig()
    if (result.success && result.data) {
      set({ facebookConfig: result.data, facebookDirty: false })
    }
  },

  saveFacebookConfig: async () => {
    const { facebookConfig } = get()
    await ipc().setFacebookConfig(facebookConfig)
    set({ facebookDirty: false })
  },
}))
