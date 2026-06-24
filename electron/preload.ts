const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (url: string) => ipcRenderer.send('navigate', url),
  goBack: () => ipcRenderer.send('go-back'),
  goForward: () => ipcRenderer.send('go-forward'),
  reload: () => ipcRenderer.send('reload'),
  createTab: (url?: string) => ipcRenderer.send('create-tab', url),
  switchTab: (id: string) => ipcRenderer.send('switch-tab', id),
  closeTab: (id: string) => ipcRenderer.send('close-tab', id),
  getHistory: () => ipcRenderer.invoke('get-history'),
  importBrowserData: (browser: string) => ipcRenderer.invoke('import-browser-data', browser),
  importFromFile: () => ipcRenderer.invoke('import-from-file'),
  onTabCreated: (callback: (tab: any) => void) => {
    const listener = (_event: any, tab: any) => callback(tab)
    ipcRenderer.on('tab-created', listener)
    return () => ipcRenderer.removeListener('tab-created', listener)
  },
  onTabUpdated: (callback: (tab: any) => void) => {
    const listener = (_event: any, tab: any) => callback(tab)
    ipcRenderer.on('tab-updated', listener)
    return () => ipcRenderer.removeListener('tab-updated', listener)
  },
  onDownloadUpdated: (callback: (download: any) => void) => {
    const listener = (_event: any, download: any) => callback(download)
    ipcRenderer.on('download-updated', listener)
    return () => ipcRenderer.removeListener('download-updated', listener)
  },
  onDownloadsCleared: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('downloads-cleared', listener)
    return () => ipcRenderer.removeListener('downloads-cleared', listener)
  },
  onInternalPage: (callback: (page: string) => void) => {
    const listener = (_event: any, page: string) => callback(page)
    ipcRenderer.on('open-internal-page', listener)
    return () => ipcRenderer.removeListener('open-internal-page', listener)
  },
  onFocusUrl: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('focus-url', listener)
    return () => ipcRenderer.removeListener('focus-url', listener)
  },
  onRequestCloseTab: (callback: (id: string) => void) => {
    const listener = (_event: any, id: string) => callback(id)
    ipcRenderer.on('request-close-tab', listener)
    return () => ipcRenderer.removeListener('request-close-tab', listener)
  },
  onTabSwitched: (callback: (id: string) => void) => {
    const listener = (_event: any, id: string) => callback(id)
    ipcRenderer.on('tab-switched', listener)
    return () => ipcRenderer.removeListener('tab-switched', listener)
  },
  setPanelState: (rightWidth: number) => ipcRenderer.send('set-panel-state', { rightWidth }),
  setInternalPageActive: (active: boolean) => ipcRenderer.send('set-internal-page-active', active),
  setSidebarWidth: (width: number) => ipcRenderer.send('set-sidebar-width', width),
  setHeaderHeight: (height: number) => ipcRenderer.send('set-header-height', height),
  setMenuOpen: (open: boolean) => ipcRenderer.send('set-menu-open', open),
  setFavEditOpen: (open: boolean) => ipcRenderer.send('set-fav-edit-open', open),
  getDevExtensions: () => ipcRenderer.invoke('get-dev-extensions'),
  showFavPopup: (items: any[], x: number, y: number) => ipcRenderer.invoke('show-fav-popup', { items, x, y }),
  showFavEditPopup: (url: string, name: string, isFavorite: boolean) => ipcRenderer.invoke('show-fav-edit-popup', { url, name, isFavorite }),
  onFavEditResult: (cb: (data: any) => void) => {
    ipcRenderer.on('fav-edit-result', (_e: any, data: any) => cb(data))
    return () => ipcRenderer.removeAllListeners('fav-edit-result')
  },
  onNavigateTo: (cb: (url: string) => void) => {
    ipcRenderer.on('navigate-to', (_e: any, url: string) => cb(url))
    return () => ipcRenderer.removeAllListeners('navigate-to')
  },
  onOpenFavoritesPanel: (cb: () => void) => {
    ipcRenderer.on('open-favorites-panel', () => cb())
    return () => ipcRenderer.removeAllListeners('open-favorites-panel')
  },
  showOxMenu: () => ipcRenderer.invoke('show-ox-menu'),
  onOxMenuClosed: (cb: () => void) => {
    ipcRenderer.on('ox-menu-closed', () => cb())
    return () => ipcRenderer.removeAllListeners('ox-menu-closed')
  },
  onCreateNewTab: (cb: () => void) => {
    ipcRenderer.on('create-new-tab', () => cb())
    return () => ipcRenderer.removeAllListeners('create-new-tab')
  },
  onReopenClosedTab: (cb: () => void) => {
    ipcRenderer.on('reopen-closed-tab', () => cb())
    return () => ipcRenderer.removeAllListeners('reopen-closed-tab')
  },
  onOpenDownloadsPanel: (cb: () => void) => {
    ipcRenderer.on('open-downloads-panel', () => cb())
    return () => ipcRenderer.removeAllListeners('open-downloads-panel')
  },
  onOpenHistoryPanel: (cb: () => void) => {
    ipcRenderer.on('open-history-panel', () => cb())
    return () => ipcRenderer.removeAllListeners('open-history-panel')
  },
  getLoadedExtensions: () => ipcRenderer.invoke('get-loaded-extensions'),
  getPinnedExtensions: () => ipcRenderer.invoke('get-pinned-extensions'),
  setPinnedExtensions: (ids: string[]) => ipcRenderer.send('set-pinned-extensions', ids),
  onPinnedExtensionsUpdated: (cb: (ids: string[]) => void) => {
    ipcRenderer.on('pinned-extensions-updated', (_: any, ids: string[]) => cb(ids))
    return () => ipcRenderer.removeAllListeners('pinned-extensions-updated')
  },
  onExtensionInstalled: (cb: (info: any) => void) => {
    ipcRenderer.on('extension-installed', (_: any, info: any) => cb(info))
    return () => ipcRenderer.removeAllListeners('extension-installed')
  },
  onExtensionInstalling: (cb: (info: any) => void) => {
    ipcRenderer.on('extension-installing', (_: any, info: any) => cb(info))
    return () => ipcRenderer.removeAllListeners('extension-installing')
  },
  windowControl: (action: string) => ipcRenderer.send('window-control', action),
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
})
