export interface Tab {
  id: string
  url: string
  title: string
  favicon?: string
  active: boolean
  loading?: boolean
  isAudible?: boolean
  pinned?: boolean
}

export type SidebarMode = 'expanded' | 'compact' | 'hidden'

export interface HistoryItem {
  title: string
  url: string
}

export interface ContextMenuState {
  x: number
  y: number
  tabId: string
}

export interface DownloadItem {
  id: string
  name: string
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'paused'
  receivedBytes: number
  totalBytes: number
  startTime: number
}
