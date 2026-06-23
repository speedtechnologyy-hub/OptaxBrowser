import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, X, Plus } from 'lucide-react'

interface Tab {
  id: string
  title?: string
  url?: string
  favicon?: string
  loading?: boolean
  pinned?: boolean
}

interface HorizontalTabBarProps {
  isVisible: boolean
  tabs: Tab[]
  activeTabId: string
  onSwitchTab: (id: string) => void
  onCloseTab: (e: React.MouseEvent, id: string) => void
  onCreateTab: () => void
}

export const HorizontalTabBar: React.FC<HorizontalTabBarProps> = ({
  isVisible, tabs, activeTabId, onSwitchTab, onCloseTab, onCreateTab
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 36, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0"
          style={{ background: '#0d0d0f', borderBottom: '1px solid rgba(255,255,255,0.06)', WebkitAppRegion: 'no-drag', overflow: 'hidden' } as any}
        >
          <div
            className="h-[36px] flex items-center px-2 gap-1 overflow-x-auto no-scrollbar"
            style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'auto' } as any}
          >
            {tabs.map(tab => (
              <motion.button
                key={tab.id}
                layout
                onClick={(e) => { e.stopPropagation(); onSwitchTab(tab.id); }}
                style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' } as any}
                className={`flex items-center gap-1.5 px-2.5 h-[28px] rounded-lg shrink-0 transition-all group max-w-[160px] relative
                  ${tab.id === activeTabId
                    ? 'bg-white/10 text-white/90'
                    : 'text-white/35 hover:bg-white/[0.06] hover:text-white/70'
                  }`}
              >
                {tab.loading ? (
                  <div className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin shrink-0" />
                ) : tab.favicon ? (
                  <img src={tab.favicon} alt="" className="w-3.5 h-3.5 rounded-sm shrink-0 object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <Globe size={12} className="shrink-0 opacity-50" />
                )}
                <span className="text-[11px] font-medium truncate">{tab.title || 'Nova Aba'}</span>
                <button
                  onClick={e => { e.stopPropagation(); onCloseTab(e, tab.id) }}
                  className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all ml-0.5 shrink-0 text-white/60"
                >
                  <X size={9} />
                </button>
              </motion.button>
            ))}
            <button
              onClick={(e) => { e.stopPropagation(); onCreateTab(); }}
              style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' } as any}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.07] text-white/20 hover:text-white/60 transition-all shrink-0"
            >
              <Plus size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
