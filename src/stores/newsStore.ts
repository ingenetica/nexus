import { create } from 'zustand'
import { Article, NewsSource, SocialPlatform } from '../lib/types'
import { ipc } from '../lib/ipc'

interface GeneratedPost {
  content: string
  hashtags: string
  articleId: string
}

interface NewsState {
  sources: NewsSource[]
  articles: Article[]
  loading: boolean
  scraping: boolean
  searchQuery: string
  selectedSourceId: string | null
  minScore: number
  savedOnly: boolean
  generatingForArticle: string | null
  generatedPost: GeneratedPost | null
  generationError: string | null
  generatedPlatform: SocialPlatform | null
  setSearchQuery: (q: string) => void
  setSelectedSourceId: (id: string | null) => void
  setMinScore: (score: number) => void
  setSavedOnly: (saved: boolean) => void
  loadSources: () => Promise<void>
  addSource: (source: Omit<NewsSource, 'id' | 'created_at'>) => Promise<void>
  deleteSource: (id: string) => Promise<void>
  toggleSource: (id: string, enabled: boolean) => Promise<void>
  toggleSaved: (id: string) => Promise<void>
  loadArticles: () => Promise<void>
  scrapeSource: (sourceId: string) => Promise<void>
  scrapeAll: () => Promise<void>
  generatePost: (articleId: string, platform?: SocialPlatform) => Promise<void>
  clearGeneratedPost: () => void
}

export const useNewsStore = create<NewsState>((set, get) => ({
  sources: [],
  articles: [],
  loading: false,
  scraping: false,
  searchQuery: '',
  selectedSourceId: null,
  minScore: 0,
  savedOnly: false,
  generatingForArticle: null,
  generatedPost: null,
  generationError: null,
  generatedPlatform: null,

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedSourceId: (id) => set({ selectedSourceId: id }),
  setMinScore: (score) => set({ minScore: score }),
  setSavedOnly: (saved) => set({ savedOnly: saved }),

  loadSources: async () => {
    const result = await ipc().getSources()
    if (result.success && result.data) {
      set({ sources: result.data })
    }
  },

  addSource: async (source) => {
    const result = await ipc().addSource(source)
    if (result.success) {
      await get().loadSources()
    }
  },

  deleteSource: async (id) => {
    const result = await ipc().deleteSource(id)
    if (result.success) {
      await get().loadSources()
    }
  },

  toggleSource: async (id, enabled) => {
    await ipc().toggleSource(id, enabled)
    await get().loadSources()
  },

  toggleSaved: async (id) => {
    const result = await ipc().toggleSaved(id)
    if (result.success && result.data) {
      set((state) => ({
        articles: state.articles.map(a => a.id === id ? { ...a, saved: result.data!.saved } : a),
      }))
    }
  },

  loadArticles: async () => {
    set({ loading: true })
    const { searchQuery, selectedSourceId, minScore, savedOnly } = get()
    const result = await ipc().getArticles({
      search: searchQuery || undefined,
      sourceId: selectedSourceId || undefined,
      minScore: minScore > 0 ? minScore : undefined,
      savedOnly: savedOnly || undefined,
    })
    if (result.success && result.data) {
      set({ articles: result.data })
    }
    set({ loading: false })
  },

  scrapeSource: async (sourceId) => {
    set({ scraping: true })
    await ipc().scrapeSource(sourceId)
    await get().loadArticles()
    set({ scraping: false })
  },

  scrapeAll: async () => {
    set({ scraping: true })
    const { sources } = get()
    for (const source of sources.filter(s => s.enabled)) {
      await ipc().scrapeSource(source.id)
    }
    await get().loadArticles()
    set({ scraping: false })
  },

  generatePost: async (articleId, platform) => {
    set({ generatingForArticle: articleId, generatedPost: null, generationError: null, generatedPlatform: platform || 'linkedin' })
    const result = await ipc().generatePost(articleId, platform)
    if (result.success && result.data) {
      set({ generatedPost: result.data, generatingForArticle: null })
    } else {
      set({ generationError: result.error || 'Generation failed', generatingForArticle: null })
    }
  },

  clearGeneratedPost: () => set({ generatedPost: null, generationError: null, generatedPlatform: null }),
}))
