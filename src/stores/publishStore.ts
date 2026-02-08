import { create } from 'zustand'
import { Post, PostStatus, SocialAccount } from '../lib/types'
import { ipc } from '../lib/ipc'

interface PublishState {
  posts: Post[]
  accounts: SocialAccount[]
  loading: boolean
  filterStatus: PostStatus | 'all'
  setFilterStatus: (status: PostStatus | 'all') => void
  loadPosts: () => Promise<void>
  createPost: (post: Partial<Post>) => Promise<void>
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>
  deletePost: (id: string) => Promise<void>
  publishPost: (id: string) => Promise<void>
  schedulePost: (id: string, scheduledAt: string) => Promise<void>
  loadAccounts: () => Promise<void>
  connectLinkedIn: () => Promise<void>
  connectInstagram: () => Promise<void>
  connectFacebook: () => Promise<void>
  disconnectAccount: (id: string) => Promise<void>
}

export const usePublishStore = create<PublishState>((set, get) => ({
  posts: [],
  accounts: [],
  loading: false,
  filterStatus: 'all',

  setFilterStatus: (status) => set({ filterStatus: status }),

  loadPosts: async () => {
    set({ loading: true })
    const { filterStatus } = get()
    const result = await ipc().getPosts(filterStatus === 'all' ? undefined : filterStatus)
    if (result.success && result.data) {
      set({ posts: result.data })
    }
    set({ loading: false })
  },

  createPost: async (post) => {
    await ipc().createPost(post)
    await get().loadPosts()
  },

  updatePost: async (id, updates) => {
    await ipc().updatePost(id, updates)
    await get().loadPosts()
  },

  deletePost: async (id) => {
    await ipc().deletePost(id)
    await get().loadPosts()
  },

  publishPost: async (id) => {
    await ipc().publishPost(id)
    await get().loadPosts()
  },

  schedulePost: async (id, scheduledAt) => {
    await ipc().schedulePost(id, scheduledAt)
    await get().loadPosts()
  },

  loadAccounts: async () => {
    const result = await ipc().getAccounts()
    if (result.success && result.data) {
      set({ accounts: result.data })
    }
  },

  connectLinkedIn: async () => {
    const result = await ipc().connectLinkedIn()
    if (!result.success) {
      throw new Error(result.error || 'LinkedIn connection failed. Check your OAuth credentials in Settings.')
    }
    await get().loadAccounts()
  },

  connectInstagram: async () => {
    const result = await ipc().connectInstagram()
    if (!result.success) {
      throw new Error(result.error || 'Instagram connection failed. Check your Facebook App credentials in Settings.')
    }
    await get().loadAccounts()
  },

  connectFacebook: async () => {
    const result = await ipc().connectFacebook()
    if (!result.success) {
      throw new Error(result.error || 'Facebook connection failed. Check your Facebook App credentials in Settings.')
    }
    await get().loadAccounts()
  },

  disconnectAccount: async (id) => {
    await ipc().disconnectAccount(id)
    await get().loadAccounts()
  },
}))
