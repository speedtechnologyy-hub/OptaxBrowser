import { create } from 'zustand'
import type { Tab, DownloadItem, SidebarMode } from '../types'


interface BrowserState {
  // Tabs
  tabs: Tab[]
  activeTabId: string | null
  setTabs: (tabs: Tab[] | ((prev: Tab[]) => Tab[])) => void
  setActiveTabId: (id: string | null) => void
  
  // Downloads
  downloads: DownloadItem[]
  setDownloads: (downloads: DownloadItem[] | ((prev: DownloadItem[]) => DownloadItem[])) => void
  
  // Favorites
  favorites: string[]
  setFavorites: (favorites: string[] | ((prev: string[]) => string[])) => void
  
  // History
  history: { title: string, url: string }[]
  setHistory: (history: { title: string, url: string }[] | ((prev: { title: string, url: string }[]) => { title: string, url: string }[])) => void
  
  // UI State
  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode | ((prev: SidebarMode) => SidebarMode)) => void
  showFavoritesBar: boolean
  setShowFavoritesBar: (show: boolean | ((prev: boolean) => boolean)) => void
  showTabsBar: boolean
  setShowTabsBar: (show: boolean | ((prev: boolean) => boolean)) => void
  pinnedExtensions: string[]
  setPinnedExtensions: (exts: string[]) => void
  favoriteNames: Record<string, string>
  setFavoriteName: (url: string, name: string) => void
  favBarIconOnly: boolean
  setFavBarIconOnly: (v: boolean) => void
  currentInternalPage: string | null

  setCurrentInternalPage: (page: string | null) => void
  
  // Split View
  splitTabId: string | null
  setSplitTabId: (id: string | null) => void
  splitRatio: number
  setSplitRatio: (ratio: number) => void
}

export const useBrowserStore = create<BrowserState>((set) => ({
  // Tabs initial state
  tabs: [],
  activeTabId: null,
  setTabs: (tabs) => set((state) => ({ 
    tabs: typeof tabs === 'function' ? tabs(state.tabs) : tabs 
  })),
  setActiveTabId: (id) => set({ activeTabId: id }),
  
  // Downloads
  downloads: [],
  setDownloads: (downloads) => set((state) => ({ 
    downloads: typeof downloads === 'function' ? downloads(state.downloads) : downloads 
  })),
  
  // Favorites
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  setFavorites: (favorites) => set((state) => {
    const next = typeof favorites === 'function' ? favorites(state.favorites) : favorites
    localStorage.setItem('favorites', JSON.stringify(next))
    return { favorites: next }
  }),
  
  // History
  history: [],
  setHistory: (history) => set((state) => ({ 
    history: typeof history === 'function' ? history(state.history) : history 
  })),
  
  // UI State
  sidebarMode: (localStorage.getItem('sidebarMode') as SidebarMode) || 'expanded',
  setSidebarMode: (mode) => set((state) => {
    const next = typeof mode === 'function' ? mode(state.sidebarMode) : mode
    localStorage.setItem('sidebarMode', next)
    return { sidebarMode: next }
  }),
  showFavoritesBar: localStorage.getItem('showFavoritesBar') !== 'false', // default true
  showTabsBar: localStorage.getItem('showTabsBar') !== 'false',
  pinnedExtensions: JSON.parse(localStorage.getItem('pinnedExtensions') || '[]'),
  favoriteNames: JSON.parse(localStorage.getItem('favoriteNames') || '{}'),
  favBarIconOnly: localStorage.getItem('favBarIconOnly') === 'true', // default true - show tabs bar when sidebar hidden
  setShowFavoritesBar: (show) => set((state) => {
    const next = typeof show === 'function' ? show(state.showFavoritesBar) : show
    localStorage.setItem('showFavoritesBar', String(next))
    return { showFavoritesBar: next }
  }),
  setShowTabsBar: (show) => set((state) => {
    const next = typeof show === 'function' ? show(state.showTabsBar) : show
    localStorage.setItem('showTabsBar', String(next))
    return { showTabsBar: next }
  }),
  setPinnedExtensions: (exts) => {
    localStorage.setItem('pinnedExtensions', JSON.stringify(exts))
    set({ pinnedExtensions: exts })
  },
  setFavoriteName: (url, name) => set((state) => {
    const next = { ...state.favoriteNames, [url]: name }
    localStorage.setItem('favoriteNames', JSON.stringify(next))
    return { favoriteNames: next }
  }),
  setFavBarIconOnly: (v) => {
    localStorage.setItem('favBarIconOnly', String(v))
    set({ favBarIconOnly: v })
  },

  currentInternalPage: null,
  setCurrentInternalPage: (page) => set({ currentInternalPage: page }),
  
  // Split View
  splitTabId: null,
  setSplitTabId: (id) => set({ splitTabId: id }),
  splitRatio: 0.5,
  setSplitRatio: (ratio) => set({ splitRatio: ratio }),
}))
