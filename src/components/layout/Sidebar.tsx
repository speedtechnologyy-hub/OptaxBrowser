import React from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Plus, Globe, Volume2, Pin, X } from 'lucide-react'
import type { Tab, SidebarMode } from '../../types'

interface SidebarProps {
  sidebarMode: SidebarMode
  tabs: Tab[]
  setTabs: (tabs: Tab[]) => void
  activeTabId: string
  onSwitchTab: (id: string) => void
  onCloseTab: (e: React.MouseEvent | null, id: string) => void
  onCreateTab: (url?: string) => void
  onTogglePin: (id: string, e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent, id: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarMode,
  tabs,
  setTabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onCreateTab,
  onTogglePin,
  onContextMenu
}) => {
  const sidebarWidth = sidebarMode === 'expanded' ? 240 : sidebarMode === 'compact' ? 64 : 0

  return (
    <motion.div 
      animate={{ width: sidebarWidth, opacity: sidebarMode === 'hidden' ? 0 : 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 1 }}
      className="flex flex-col pt-10 bg-[#09090b] border-r border-white/5 shrink-0 relative h-full z-40"
      style={{ WebkitAppRegion: 'drag', overflow: 'hidden' } as any}
    >
      <div className={`flex items-center justify-between mb-5 px-4 ${sidebarMode === 'compact' ? 'flex-col gap-6' : ''}`} style={{ WebkitAppRegion: 'no-drag' } as any}>
        {sidebarMode === 'expanded' ? (
          <div className="flex items-center gap-3">
             <div className="w-5 h-5 bg-opta-gradient rounded-[5px] flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-purple-500/20">O</div>
             <span className="text-[10px] font-black tracking-[0.15em] text-white/70 uppercase">Opta X</span>
          </div>
        ) : (
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-7 h-7 bg-opta-gradient rounded-[7px] flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-purple-500/20"
          >O</motion.div>
        )}
        <button 
          onClick={() => onCreateTab()}
          className="p-1.5 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-all active:scale-95"
        >
          <Plus size={sidebarMode === 'expanded' ? 14 : 18} />
        </button>
      </div>

      {/* Pinned Tabs */}
      {tabs.some(t => t.pinned) && (
        <div className={`flex flex-wrap gap-2 mb-4 px-3 ${sidebarMode === 'compact' ? 'flex-col items-center' : ''}`} style={{ WebkitAppRegion: 'no-drag' } as any}>
          <AnimatePresence>
            {tabs.filter(t => t.pinned).map(tab => (
              <motion.div
                key={tab.id}
                layout
                whileHover={{ scale: 1.15, backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSwitchTab(tab.id)}
                onContextMenu={(e) => onContextMenu(e, tab.id)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 relative group
                  ${tab.id === activeTabId 
                    ? 'bg-purple-500/10 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(168,85,247,0.2)] text-purple-400' 
                    : 'bg-white/[0.02] text-white/20 hover:text-white/60'
                  }`}
                title={tab.title}
              >
                <img src={tab.favicon || ''} className="w-4 h-4 object-contain opacity-70 group-hover:opacity-100 transition-opacity" alt="" />
                {tab.id === activeTabId && (
                  <motion.div 
                    layoutId="pinnedActive"
                    className="absolute -bottom-1 w-1 h-1 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,1)]" 
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Tab List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <Reorder.Group 
          axis="y" 
          values={tabs.filter(t => !t.pinned)} 
          onReorder={(newOrder) => {
            const pinned = tabs.filter(t => t.pinned)
            setTabs([...pinned, ...newOrder])
          }}
          className="px-3 space-y-1 py-2"
        >
          <AnimatePresence initial={false}>
            {tabs.filter(t => !t.pinned).map((tab) => (
              <Reorder.Item
                key={tab.id}
                value={tab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => onSwitchTab(tab.id)}
                onContextMenu={(e) => onContextMenu(e, tab.id)}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-500 mx-2
                  ${tab.id === activeTabId 
                    ? 'bg-purple-500/10 text-white shadow-[0_4px_25px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(168,85,247,0.1)]' 
                    : 'text-white/30 hover:bg-white/[0.02] hover:text-white/60'
                  }
                  ${sidebarMode === 'compact' ? 'justify-center px-0 h-10 mx-0' : ''}`}
              >
                {tab.id === activeTabId && sidebarMode !== 'hidden' && (
                  <motion.div 
                    layoutId="activeGlow"
                    className="absolute -left-[1px] w-[2px] h-4 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                  />
                )}

                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 2 }}
                  className="shrink-0 w-4 h-4 flex items-center justify-center relative"
                >
                  {tab.loading ? (
                    <div className="w-3.5 h-3.5 border border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                  ) : tab.favicon ? (
                    <img src={tab.favicon} alt="" className="w-full h-full object-contain rounded-sm opacity-90 transition-opacity group-hover:opacity-100" />
                  ) : (
                    <Globe size={14} className="opacity-20 group-hover:opacity-40 transition-opacity" />
                  )}
                  
                  {sidebarMode === 'compact' && tab.id === activeTabId && (
                    <div className="absolute -right-0.5 -bottom-0.5 w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)] border border-[#09090b]" />
                  )}
                </motion.div>

                {/* Modo expandido: título + pin + fechar */}
                {sidebarMode === 'expanded' && (
                  <>
                    <div className="flex-1 min-w-0 relative">
                      <span className={`block text-[11.5px] transition-colors duration-500 truncate ${tab.id === activeTabId ? 'font-bold text-white' : 'font-semibold text-white/40 group-hover:text-white/60'}`}>
                        {tab.title || 'Nova Aba'}
                      </span>
                    </div>
                    {tab.isAudible && (
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="text-purple-400/60 shrink-0"
                      >
                        <Volume2 size={11} />
                      </motion.div>
                    )}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => onTogglePin(tab.id, e)}
                        className="p-1 rounded-md hover:bg-white/10 text-white/20 hover:text-purple-400 transition-all"
                        title="Fixar aba"
                      >
                        <Pin size={11} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onCloseTab(e, tab.id) }}
                        className="p-1 rounded-md hover:bg-white/10 text-white/20 hover:text-red-400 transition-all"
                        title="Fechar aba"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </>
                )}

                {/* Modo compacto: botão fechar aparece no hover */}
                {sidebarMode === 'compact' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCloseTab(e, tab.id) }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex transition-all shadow-md"
                    title="Fechar aba"
                  >
                    <X size={8} />
                  </button>
                )}
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none z-10" />
    </motion.div>
  )
}
