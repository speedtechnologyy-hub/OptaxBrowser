import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, RotateCw, PanelLeft, Columns, Search, ShieldCheck, Star, Download, LayoutDashboard, Puzzle } from 'lucide-react'
import type { SidebarMode } from '../../types'

interface HeaderProps {
  sidebarMode: SidebarMode
  onToggleSidebar: () => void
  onGoBack: () => void
  onGoForward: () => void
  onReload: () => void
  onSplitViewToggle: () => void
  isSplitEnabled: boolean
  url: string
  setUrl: (val: string) => void
  isFocused: boolean
  setIsFocused: (val: boolean) => void
  onNavigate: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onToggleFavorite: (url: string) => void
  isFavorite: boolean
  mousePos: { x: number, y: number }
  onToggleDownloads: () => void
  isAnyDownloading: boolean
  onOpenHub: () => void
  onOpenMenu: () => void
  isMenuOpen: boolean
  onOpenExtensions: () => void
}

export const Header: React.FC<HeaderProps> = ({
  sidebarMode, onToggleSidebar, onGoBack, onGoForward, onReload,
  onSplitViewToggle, isSplitEnabled, url, setUrl, isFocused, setIsFocused,
  onNavigate, onToggleFavorite, isFavorite, mousePos,
  onToggleDownloads, isAnyDownloading, onOpenHub, onOpenMenu, isMenuOpen, onOpenExtensions
}) => {
  const [pinnedExts, setPinnedExts] = useState<{id:string,name:string,iconUrl:string}[]>([])

  useEffect(() => {
    const api = (window as any).electronAPI
    const load = async () => {
      try {
        const [loaded, pinned]: [any[], string[]] = await Promise.all([
          api?.getLoadedExtensions?.() || [],
          api?.getPinnedExtensions?.() || []
        ])
        const pinnedList = loaded.filter((e: any) => pinned.includes(e.id))
        setPinnedExts(pinnedList)
      } catch {}
    }
    load()
    const cleanup = api?.onPinnedExtensionsUpdated?.(async () => { await load() })
    const interval = setInterval(load, 3000)
    return () => { cleanup?.(); clearInterval(interval) }
  }, [])

  return (
    <div
      className="h-[42px] flex items-center px-3 gap-2 shrink-0"
      style={{ 
        WebkitAppRegion: 'drag',
        background: '#0d0d0f',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      } as any}
    >
      {/* Traffic Lights */}
      <div className="flex items-center gap-1.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={() => (window as any).electronAPI?.windowControl('close')} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 active:scale-95 transition-all" />
        <button onClick={() => (window as any).electronAPI?.windowControl('minimize')} className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 active:scale-95 transition-all" />
        <button onClick={() => (window as any).electronAPI?.windowControl('maximize')} className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 active:scale-95 transition-all" />
      </div>

      <div className="w-px h-4 bg-white/10 shrink-0" />

      {/* Sidebar toggle */}
      <button
        style={{ WebkitAppRegion: 'no-drag' } as any}
        onClick={onToggleSidebar}
        className={`p-1.5 rounded-md transition-all shrink-0 ${sidebarMode !== 'hidden' ? 'text-white/25 hover:text-white/80 hover:bg-white/5' : 'text-blue-400 bg-blue-500/10'}`}
      >
        <PanelLeft size={14} />
      </button>

      {/* Nav buttons */}
      <div className="flex items-center shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={onGoBack} className="p-1.5 text-white/35 hover:text-white/80 rounded-md hover:bg-white/5 transition-all active:scale-95"><ChevronLeft size={15} /></button>
        <button onClick={onGoForward} className="p-1.5 text-white/35 hover:text-white/80 rounded-md hover:bg-white/5 transition-all active:scale-95"><ChevronRight size={15} /></button>
        <button onClick={onReload} className="p-1.5 text-white/35 hover:text-white/80 rounded-md hover:bg-white/5 transition-all active:scale-95"><RotateCw size={13} /></button>
        <button onClick={onOpenHub} className="p-1.5 text-white/35 hover:text-blue-400 rounded-md hover:bg-blue-500/5 transition-all active:scale-95"><LayoutDashboard size={13} /></button>
      </div>

      <div className="flex items-center gap-1 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={onSplitViewToggle} className={`p-1.5 rounded-md transition-all ${isSplitEnabled ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}>
          <Columns size={13} />
        </button>
        <button onClick={onToggleDownloads} className={`p-1.5 rounded-md transition-all relative ${isAnyDownloading ? 'text-purple-400 bg-purple-400/10' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}>
          <Download size={13} />
          {isAnyDownloading && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />}
        </button>
      </div>

      {/* URL Bar */}
      <div className="flex-1 h-full flex items-center min-w-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="relative w-full group">
          {/* Background — sempre escuro para garantir contraste */}
          <div
            className="absolute inset-0 rounded-lg pointer-events-none transition-all duration-200"
            style={{
              background: isFocused ? '#1c1c24' : '#18181f',
              boxShadow: isFocused 
                ? '0 0 0 1.5px rgba(99,102,241,0.6)' 
                : '0 0 0 1px rgba(255,255,255,0.08)'
            }}
          />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search size={11} style={{ color: isFocused ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.3)' }} />
          </div>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={onNavigate}
            onFocus={e => { setIsFocused(true); e.target.select() }}
            onBlur={() => setIsFocused(false)}
            placeholder="Pesquisar ou digitar endereço..."
            spellCheck={false}
            className="relative w-full h-[28px] pl-8 pr-16 bg-transparent outline-none text-[12px] font-normal placeholder:text-white/20"
            style={{ 
              color: '#e8e8f0',
              caretColor: 'rgba(99,102,241,0.9)',
              WebkitTextFillColor: '#e8e8f0'
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none" style={{ pointerEvents: 'auto' }}>
            <ShieldCheck size={11} style={{ color: isFocused ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.15)' }} />
            <div className="w-px h-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <button
              onMouseDown={e => {
              e.preventDefault()
              onToggleFavorite(url)
            }}
              className="p-1 rounded transition-all hover:scale-110 active:scale-95"
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star
                size={12}
                style={{
                  color: isFavorite ? '#facc15' : 'rgba(255,255,255,0.3)',
                  fill: isFavorite ? '#facc15' : 'none',
                  transition: 'all 0.15s'
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Extension icons — pinned real extensions */}
      <div className="flex items-center gap-0.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {pinnedExts.map(ext => (
          <button
            key={ext.id}
            title={ext.name}
            onClick={async () => {
              // Try to open the extension popup
              const api = (window as any).electronAPI
              const result = await api?.invoke('open-extension-popup', { extId: ext.id })
              if (!result?.success) onOpenExtensions()
            }}
            className="w-[26px] h-[26px] flex items-center justify-center rounded-md hover:bg-white/[0.08] transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            {ext.iconUrl
              ? <img src={ext.iconUrl} className="w-4 h-4 rounded" onError={e => (e.currentTarget.style.display='none')} />
              : <span className="text-[13px]">🧩</span>
            }
          </button>
        ))}
        <button
          onClick={onOpenExtensions}
          className="w-[26px] h-[26px] flex items-center justify-center rounded-md hover:bg-white/[0.08] transition-colors"
          title="Extensões"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <Puzzle size={13} />
        </button>
      </div>

      {/* OX button — inline style apenas, sem z-index wrapper */}
      <button
        style={{ WebkitAppRegion: 'no-drag', flexShrink: 0 } as any}
        onClick={onOpenMenu}
        className={`w-[28px] h-[28px] rounded-lg border text-[9px] font-black flex items-center justify-center transition-all active:scale-95
          ${isMenuOpen 
            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
            : 'border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
          }`}
      >
        OX
      </button>
    </div>
  )
}
