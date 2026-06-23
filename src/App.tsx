import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { CommandPalette } from './components/palette/CommandPalette'
import { ContextMenu } from './components/menu/ContextMenu'
import { DownloadsPanel } from './components/downloads/DownloadsPanel'
import { HistoryPanel } from './components/history/HistoryPanel'
import { FavoritesPanel } from './components/favorites/FavoritesPanel'
import { FavoritesBar } from './components/favorites/FavoritesBar'
import { NewTabPage } from './components/views/NewTabPage'
import { Hub } from './components/views/Hub'
import { SettingsPage } from './components/views/SettingsPage'
import { ExtensionsPage } from './components/views/ExtensionsPage'
import { ImportPage } from './components/views/ImportPage'
import { PasswordsPage } from './components/views/PasswordsPage'
import { useBrowserStore } from './store/useBrowserStore'
import { MainMenu } from './components/menu/MainMenu'
import { HorizontalTabBar } from './components/layout/HorizontalTabBar'
import { FavoriteEditDialog } from './components/favorites/FavoriteEditDialog'

export default function App() {
  const {
    tabs, setTabs,
    activeTabId, setActiveTabId,
    history, setHistory,
    favorites, setFavorites,
    downloads, setDownloads,
    sidebarMode, setSidebarMode,
    showFavoritesBar, setShowFavoritesBar,
    showTabsBar, setShowTabsBar,
    favoriteNames, setFavoriteName,
    favBarIconOnly, setFavBarIconOnly,
    currentInternalPage, setCurrentInternalPage,
    splitTabId, setSplitTabId,
    splitRatio, setSplitRatio
  } = useBrowserStore()

  const [url, setUrl] = useState('https://google.com')
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{ version: string; downloaded: boolean } | null>(null)

  // OX menu is now a real BrowserWindow popup — just toggle it
  const openMenu = () => {
    ;(window as any).electronAPI?.showOxMenu()
    setIsMainMenuOpen(true)
  }
  const closeMenu = () => {
    setIsMainMenuOpen(false)
  }
  const [closedTabs, setClosedTabs] = useState<any[]>([])
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null)
  const [favEditOpen, setFavEditOpen] = useState(false)
  const [favEditAnchor, setFavEditAnchor] = useState<{ top: number; right: number } | undefined>()
  const [favEditTarget, setFavEditTarget] = useState<string | null>(null) // specific fav being edited
  const containerRef = useRef<HTMLDivElement>(null)
  const headerAreaRef = useRef<HTMLDivElement>(null)

  // FIX OX BUTTON: mede altura real do header+favbar e envia pro main process
  // A WebContentsView usa essa altura para não cobrir os controles
  useEffect(() => {
    const sendHeight = () => {
      const h = headerAreaRef.current?.getBoundingClientRect().height ?? 42
      ;(window as any).electronAPI?.setHeaderHeight(Math.round(h))
    }
    sendHeight()
    const obs = new ResizeObserver(sendHeight)
    if (headerAreaRef.current) obs.observe(headerAreaRef.current)
    return () => obs.disconnect()
  }, [])

  // Sync sidebar width
  useEffect(() => {
    const widths: Record<string, number> = { expanded: 240, compact: 64, hidden: 0 }
    ;(window as any).electronAPI?.setSidebarWidth(widths[sidebarMode])
  }, [sidebarMode])

  const toggleFavorite = (targetUrl: string) => {
    setFavorites((prev: string[]) => {
      const exists = prev.includes(targetUrl)
      if (exists) return prev.filter((u: string) => u !== targetUrl)
      return [...prev, targetUrl]
    })
  }

  // Sync Panel States
  useEffect(() => {
    const rightWidth = (isDownloadsOpen || isHistoryOpen || isFavoritesOpen) ? 320 : 0
    ;(window as any).electronAPI?.setPanelState(rightWidth)
  }, [isDownloadsOpen, isHistoryOpen, isFavoritesOpen])

  useEffect(() => {
    const isInternal = !!currentInternalPage || tabs.length === 0
    ;(window as any).electronAPI?.setInternalPageActive(isInternal)
  }, [currentInternalPage, tabs.length])

  // Refs para evitar stale closures nos listeners
  const activeTabIdRef = useRef(activeTabId)
  const isFocusedRef = useRef(isFocused)
  useEffect(() => { activeTabIdRef.current = activeTabId }, [activeTabId])
  useEffect(() => { isFocusedRef.current = isFocused }, [isFocused])

  // IPC Listeners — registrados UMA VEZ
  useEffect(() => {
    const cleanups: any[] = []
    const api = (window as any).electronAPI
    if (!api) return

    cleanups.push(api.onTabCreated((tabData: any) => {
      setTabs((prev: any[]) => {
        const exists = prev.find((t: any) => t.id === tabData.id)
        if (exists) return prev
        const newTabs = [...prev, { ...tabData, title: tabData.title || 'Nova Aba', url: tabData.url || '' }]
        if (tabData.active) setActiveTabId(tabData.id)
        return newTabs
      })
    }))

    cleanups.push(api.onTabUpdated((updatedInfo: any) => {
      setTabs((prev: any[]) => prev.map((tab: any) => {
        if (tab.id !== updatedInfo.id) return tab
        if (tab.id === activeTabIdRef.current && updatedInfo.url !== undefined && !isFocusedRef.current) {
          setUrl(updatedInfo.url)
        }
        return { ...tab, ...updatedInfo }
      }))
    }))

    cleanups.push(api.onDownloadUpdated((download: any) => {
      setDownloads((prev: any[]) => {
        const index = prev.findIndex((d: any) => d.id === download.id)
        if (index > -1) {
          const next = [...prev]
          next[index] = { ...next[index], ...download }
          return next
        }
        setIsDownloadsOpen(true)
        return [download, ...prev]
      })
    }))

    cleanups.push(api.onDownloadsCleared(() => setDownloads([])))

    cleanups.push(api.onInternalPage?.((page: string) => {
      if (page === 'history') setIsHistoryOpen(true)
      if (page === 'favorites') setIsFavoritesOpen(true)
      if (page === 'downloads') setIsDownloadsOpen(true)
    }))

    cleanups.push(api.onFocusUrl?.(() => setIsFocused(true)))

    cleanups.push(api.onRequestCloseTab?.((id: string) => closeTab(null, id)))

    cleanups.push(api.onTabSwitched?.((id: string) => setActiveTabId(id)))

    // Favorites popup window events
    cleanups.push(api.onNavigateTo?.((url: string) => handleNavigateURL(url)))
    cleanups.push(api.onOpenFavoritesPanel?.(() => setIsFavoritesOpen(true)))

    // OX menu popup events
    cleanups.push(api.onOxMenuClosed?.(() => setIsMainMenuOpen(false)))
    cleanups.push(api.onCreateNewTab?.(() => createTab()))
    cleanups.push(api.onReopenClosedTab?.(() => handleReopenTab()))
    cleanups.push(api.onOpenDownloadsPanel?.(() => setIsDownloadsOpen(true)))
    cleanups.push(api.onOpenHistoryPanel?.(() => setIsHistoryOpen(true)))

    // Auto updater events
    const onUpdateAvailable = (_: any, info: any) => setUpdateInfo({ version: info.version, downloaded: false })
    const onUpdateDownloaded = (_: any, info: any) => setUpdateInfo({ version: info.version, downloaded: true })
    const { ipcRenderer } = (window as any).require?.('electron') || {}
    if (ipcRenderer) {
      ipcRenderer.on('update-available', onUpdateAvailable)
      ipcRenderer.on('update-downloaded', onUpdateDownloaded)
      cleanups.push(() => {
        ipcRenderer.removeListener('update-available', onUpdateAvailable)
        ipcRenderer.removeListener('update-downloaded', onUpdateDownloaded)
      })
    }

    cleanups.push(api.onFavEditResult?.((data: any) => {
      if (data.action === 'save') {
        if (data.newUrl && data.newUrl !== data.oldUrl) {
          if (favorites.includes(data.oldUrl)) setFavorites((prev: string[]) => prev.filter((u: string) => u !== data.oldUrl))
          if (!favorites.includes(data.newUrl)) setFavorites((prev: string[]) => [...prev, data.newUrl])
          setFavoriteName(data.newUrl, data.name)
        } else {
          if (!favorites.includes(data.oldUrl)) setFavorites((prev: string[]) => [...prev, data.oldUrl])
          setFavoriteName(data.oldUrl, data.name)
        }
      } else if (data.action === 'remove') {
        setFavorites((prev: string[]) => prev.filter((u: string) => u !== data.oldUrl))
      }
    }))

    api.invoke('get-all-downloads').then((all: any) => {
      if (all) setDownloads(all)
    })

    return () => cleanups.forEach(fn => typeof fn === 'function' && fn())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync URL bar on tab switch
  useEffect(() => {
    const activeTab = tabs.find((t: any) => t.id === activeTabId)
    if (activeTab && !isFocused) setUrl(activeTab.url || '')
  }, [activeTabId, tabs, isFocused])

  const createTab = (initialUrl?: string) => {
    ;(window as any).electronAPI?.send('create-tab', initialUrl)
  }

  const switchTab = (id: string) => {
    setActiveTabId(id)
    ;(window as any).electronAPI?.switchTab(id)
  }

  const closeTab = (e?: React.MouseEvent | null, id?: string) => {
    if (e) e.stopPropagation()
    const targetId = id || activeTabId
    if (!targetId) return
    const tabToClose = tabs.find((t: any) => t.id === targetId)
    if (tabToClose) setClosedTabs((prev: any[]) => [tabToClose, ...prev].slice(0, 50))
    ;(window as any).electronAPI?.send('mute-tab', targetId)
    ;(window as any).electronAPI?.closeTab(targetId)
    setTabs((prev: any[]) => {
      const filtered = prev.filter((t: any) => t.id !== targetId)
      if (filtered.length === 0) {
        setActiveTabId('')
        setSplitTabId(null)
      } else if (activeTabId === targetId) {
        const nextTab = filtered[filtered.length - 1]
        setActiveTabId(nextTab.id)
        ;(window as any).electronAPI?.switchTab(nextTab.id)
      }
      return filtered
    })
  }

  const handleCloseOthers = (id: string) => {
    const others = tabs.filter((t: any) => t.id !== id && !t.pinned)
    others.forEach((t: any) => (window as any).electronAPI?.closeTab(t.id))
    setTabs(tabs.filter((t: any) => t.id === id || t.pinned))
    if (activeTabId !== id) {
      setActiveTabId(id)
      ;(window as any).electronAPI?.switchTab(id)
    }
  }

  const handleReopenTab = () => {
    if (closedTabs.length > 0) {
      const [last, ...rest] = closedTabs
      setClosedTabs(rest)
      createTab(last.url)
    }
  }

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTabs((prev: any[]) => prev.map((t: any) => t.id === id ? { ...t, pinned: !t.pinned } : t))
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 't') { e.preventDefault(); createTab() }
        if (e.key === 'w') { e.preventDefault(); activeTabId && closeTab(null, activeTabId) }
        if (e.key === 'k') { e.preventDefault(); setShowCommandPalette(prev => !prev) }
        if (e.key === 'j') { e.preventDefault(); setIsDownloadsOpen(prev => !prev) }
        if (e.key === 'h') { e.preventDefault(); setIsHistoryOpen(prev => !prev) }
        if (e.key === 'l') { e.preventDefault(); setIsFocused(true) }
        if (e.key === 'Tab') {
          e.preventDefault()
          if (tabs.length > 1) {
            const cur = tabs.findIndex((t: any) => t.id === activeTabId)
            const next = e.shiftKey ? (cur - 1 + tabs.length) % tabs.length : (cur + 1) % tabs.length
            switchTab(tabs[next].id)
          }
        }
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false)
        setIsMainMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId])

  // Split resize
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDraggingSplit || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const sidebarW = sidebarMode === 'expanded' ? 240 : sidebarMode === 'compact' ? 64 : 0
      const availW = rect.width - sidebarW
      if (availW > 0) {
        const ratio = Math.max(0.2, Math.min(0.8, (e.clientX - sidebarW) / availW))
        setSplitRatio(ratio)
        ;(window as any).electronAPI?.send('resize-split-view', ratio)
      }
    }
    const handleUp = () => setIsDraggingSplit(false)
    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDraggingSplit, sidebarMode])

  const handleNavigateURL = (urlStr: string) => {
    const finalUrl = urlStr.trim()
    if (!finalUrl) return
    if (finalUrl.startsWith('opta://')) {
      const page = finalUrl.replace('opta://', '')
      setCurrentInternalPage(page)
      ;(window as any).electronAPI?.setInternalPageActive(true)
    } else {
      setCurrentInternalPage(null)
      ;(window as any).electronAPI?.navigate(finalUrl)
      ;(window as any).electronAPI?.setInternalPageActive(false)
    }
    setIsFocused(false)
  }

  const handleNavigateEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNavigateURL(url)
  }

  const openPanel = (panel: 'downloads' | 'history' | 'favorites') => {
    if (panel === 'downloads') setIsDownloadsOpen(true)
    if (panel === 'history') setIsHistoryOpen(true)
    if (panel === 'favorites') setIsFavoritesOpen(true)
  }

  const activeTab = tabs.find((t: any) => t.id === activeTabId)
  const showNewTabPage = !currentInternalPage && (
    tabs.length === 0 || !activeTab?.url || activeTab?.url === 'about:blank' || activeTab?.url === ''
  )
  // FavoritesBar: sempre visível
  const showFavBar = true

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
      className="flex h-screen w-screen bg-[#0d0d0f] text-gray-100 overflow-hidden font-sans select-none antialiased"
    >
      <Sidebar
        sidebarMode={sidebarMode}
        tabs={tabs}
        setTabs={setTabs}
        activeTabId={activeTabId || ''}
        onSwitchTab={switchTab}
        onCloseTab={(e, id) => closeTab(e, id)}
        onCreateTab={createTab}
        onTogglePin={togglePin}
        onContextMenu={(e, id) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, tabId: id }) }}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-[#0d0d0f] relative z-10">
        <div ref={headerAreaRef}>
        <Header
            sidebarMode={sidebarMode}
            onToggleSidebar={() => setSidebarMode((prev: string) => prev === 'expanded' ? 'compact' : prev === 'compact' ? 'hidden' : 'expanded')}
            onGoBack={() => (window as any).electronAPI?.goBack()}
            onGoForward={() => (window as any).electronAPI?.goForward()}
            onReload={() => (window as any).electronAPI?.reload()}
            onSplitViewToggle={() => {
              if (splitTabId) {
                setSplitTabId(null)
                ;(window as any).electronAPI?.send('set-split-view', { enabled: false })
              } else if (tabs.length > 1) {
                const target = tabs.find((t: any) => t.id !== activeTabId)?.id || null
                setSplitTabId(target)
                ;(window as any).electronAPI?.send('set-split-view', { id: target, enabled: true })
              }
            }}
            isSplitEnabled={!!splitTabId}
            url={url}
            setUrl={setUrl}
            isFocused={isFocused}
            setIsFocused={setIsFocused}
            onNavigate={handleNavigateEvent}
            onToggleFavorite={(u) => {
              const realUrl = tabs.find((t: any) => t.id === activeTabId)?.url || u
              if (!favorites.includes(realUrl)) toggleFavorite(realUrl)
              const favName = favoriteNames[realUrl] || (() => { try { return new URL(realUrl).hostname.replace('www.','') } catch { return realUrl } })()
              ;(window as any).electronAPI?.showFavEditPopup(realUrl, favName, favorites.includes(realUrl))
            }}
            isFavorite={favorites.includes(tabs.find((t: any) => t.id === activeTabId)?.url || url)}
            mousePos={mousePos}
            onToggleDownloads={() => setIsDownloadsOpen(prev => !prev)}
            isAnyDownloading={downloads.some((d: any) => d.state === 'progressing')}
            onOpenHub={() => handleNavigateURL('opta://hub')}
            onOpenMenu={() => isMainMenuOpen ? closeMenu() : openMenu()}
            isMenuOpen={isMainMenuOpen}
            onOpenExtensions={() => handleNavigateURL('opta://extensions')}
          />

          {/* MainMenu agora é uma BrowserWindow popup — sem React menu aqui */}

        <FavoritesBar
          favorites={favorites}
          favoriteNames={favoriteNames}
          onNavigate={handleNavigateURL}
          onOpenFavorites={() => setIsFavoritesOpen(true)}
          onEditFavorite={(favUrl) => {
            const favName = favoriteNames[favUrl] || (() => { try { return new URL(favUrl).hostname.replace('www.','') } catch { return favUrl } })()
            ;(window as any).electronAPI?.showFavEditPopup(favUrl, favName, favorites.includes(favUrl))
          }}
          isVisible={showFavBar}
          iconOnly={favBarIconOnly}
        />
        {/* Tabs bar horizontal — shown when sidebar is not expanded */}
        <HorizontalTabBar
          isVisible={sidebarMode !== 'expanded' && showTabsBar}
          tabs={tabs}
          activeTabId={activeTabId || ''}
          onSwitchTab={switchTab}
          onCloseTab={(e, id) => closeTab(e, id)}
          onCreateTab={createTab}
        />
        </div>{/* end headerAreaRef */}

        {/* Loading Bar */}
        <div className="h-[1.5px] w-full bg-white/[0.03] relative overflow-hidden z-50">
          {activeTab?.loading && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent w-1/2"
            />
          )}
        </div>

        <main className="flex-1 relative overflow-hidden bg-[#0d0d0f]">
          {currentInternalPage === 'hub' && <Hub onNavigate={handleNavigateURL} onOpenPanel={openPanel} onClose={() => setCurrentInternalPage(null)} />}
          {currentInternalPage === 'settings' && (
            <SettingsPage
              sidebarMode={sidebarMode}
              setSidebarMode={setSidebarMode}
              showFavoritesBar={showFavoritesBar}
              setShowFavoritesBar={setShowFavoritesBar}
              showTabsBar={showTabsBar}
              setShowTabsBar={setShowTabsBar}
              favBarIconOnly={favBarIconOnly}
              setFavBarIconOnly={setFavBarIconOnly}
            />
          )}
          {currentInternalPage === 'extensions' && <ExtensionsPage onClose={() => setCurrentInternalPage(null)} />}
          {currentInternalPage === 'import' && (
            <ImportPage
              onNavigate={handleNavigateURL}
              onImportFavorites={(urls: string[]) => setFavorites((prev: string[]) => [...new Set([...prev, ...urls])])}
              onClose={() => setCurrentInternalPage(null)}
            />
          )}
          {currentInternalPage === 'passwords' && <PasswordsPage onClose={() => setCurrentInternalPage(null)} />}
          {showNewTabPage && <NewTabPage onNavigate={handleNavigateURL} onCreateTab={createTab} />}

          {splitTabId && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-white/5 hover:bg-purple-500/50 cursor-col-resize z-40 transition-colors"
              style={{ left: `calc(${splitRatio * 100}% - 0.5px)` }}
              onMouseDown={() => setIsDraggingSplit(true)}
            />
          )}
        </main>

        <DownloadsPanel isOpen={isDownloadsOpen} onClose={() => setIsDownloadsOpen(false)} downloads={downloads} />
        <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} onNavigate={handleNavigateURL} />
        <FavoritesPanel
          isOpen={isFavoritesOpen}
          onClose={() => setIsFavoritesOpen(false)}
          onNavigate={handleNavigateURL}
          favorites={favorites}
          onRemoveFavorite={(u: string) => setFavorites((prev: string[]) => prev.filter((x: string) => x !== u))}
          onImport={() => { setIsFavoritesOpen(false); handleNavigateURL('opta://import') }}
        />

        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          tabs={tabs}
          history={history}
          activeTabId={activeTabId || ''}
          onSwitchTab={switchTab}
          onCreateTab={createTab}
          onContextMenu={(e, id) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, tabId: id }) }}
        />

        <FavoriteEditDialog
          isOpen={favEditOpen}
          url={favEditTarget || tabs.find((t: any) => t.id === activeTabId)?.url || url}
          initialName={(() => { const u = favEditTarget || tabs.find((t: any) => t.id === activeTabId)?.url || url; return favoriteNames[u] || (() => { try { return new URL(u).hostname.replace('www.','') } catch { return '' } })() })()}
          isFavorite={favorites.includes(favEditTarget || tabs.find((t: any) => t.id === activeTabId)?.url || url)}
          onSave={(name, newUrl) => {
            const realUrl = favEditTarget || tabs.find((t: any) => t.id === activeTabId)?.url || url
            if (newUrl && newUrl !== realUrl) {
              if (favorites.includes(realUrl)) toggleFavorite(realUrl)
              if (!favorites.includes(newUrl)) toggleFavorite(newUrl)
              setFavoriteName(newUrl, name)
            } else {
              if (!favorites.includes(realUrl)) toggleFavorite(realUrl)
              setFavoriteName(realUrl, name)
            }
            setFavEditTarget(null)
          }}
          onRemove={() => {
            const realUrl = favEditTarget || tabs.find((t: any) => t.id === activeTabId)?.url || url
            if (favorites.includes(realUrl)) toggleFavorite(realUrl)
            setFavEditTarget(null)
          }}
          onClose={() => { setFavEditOpen(false); setFavEditTarget(null) }}
        />

        {contextMenu && (
          <ContextMenu
            state={{ x: contextMenu.x, y: contextMenu.y, tabId: contextMenu.tabId }}
            onClose={() => setContextMenu(null)}
            onCloseTab={(id) => closeTab(null, id)}
            onTogglePin={(id, e) => togglePin(id, e)}
            onDuplicateTab={(url) => createTab(url)}
            onCloseOthers={handleCloseOthers}
            tabs={tabs}
          />
        )}

        {/* Banner de atualização */}
        {updateInfo && (
          <div className="fixed bottom-4 right-4 z-[99999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
            style={{ background: '#1a1a2e', border: '1px solid rgba(168,85,247,0.3)', maxWidth: 340 }}>
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-white/90">
                {updateInfo.downloaded ? `Opta X v${updateInfo.version} pronto para instalar` : `Nova versão v${updateInfo.version} disponível`}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                {updateInfo.downloaded ? 'Feche e reabra o navegador para atualizar' : 'Baixando em background...'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {updateInfo.downloaded && (
                <button
                  onClick={() => (window as any).electronAPI?.send('install-update')}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                >
                  Instalar
                </button>
              )}
              <button
                onClick={() => setUpdateInfo(null)}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors text-[14px]"
              >×</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
