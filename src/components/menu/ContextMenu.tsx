import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, Plus, X, Copy, VolumeX, Globe } from 'lucide-react'
import type { ContextMenuState, Tab } from '../../types'

interface ContextMenuProps {
  state: ContextMenuState | null
  onClose: () => void
  onTogglePin: (id: string, e: any) => void
  onDuplicateTab: (url?: string) => void
  onCloseTab: (id: string) => void
  onCloseOthers: (id: string) => void
  tabs: Tab[]

}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  onClose,
  onTogglePin,
  onDuplicateTab,
  onCloseTab,
  onCloseOthers,
  tabs
}) => {

  if (!state) return null

  const targetTab = tabs.find(t => t.id === state.tabId)

  return (
    <AnimatePresence>
      {state && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ 
              top: Math.min(state.y, window.innerHeight - 250), 
              left: Math.min(state.x, window.innerWidth - 200) 
            }}
            className="fixed z-[101] w-52 bg-[#0d0d0f]/90 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden backdrop-blur-3xl"
          >
            <div className="px-2 py-2">
              <div className="px-3 py-2 mb-1 border-b border-white/[0.03]">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 truncate">
                  {targetTab?.title || 'Aba'}
                </p>
              </div>

              <button 
                onClick={() => { onTogglePin(state.tabId, { stopPropagation: () => {} } as any); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group active:scale-95"
              >
                <Pin size={14} className={`transition-colors ${targetTab?.pinned ? 'text-purple-400' : 'text-white/20 group-hover:text-white/40'}`} />
                {targetTab?.pinned ? 'Desafixar Aba' : 'Fixar Aba'}
              </button>

              <button 
                onClick={() => { onDuplicateTab(targetTab?.url); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group active:scale-95"
              >
                <Plus size={14} className="text-white/20 group-hover:text-white/40" />
                Duplicar Aba
              </button>

              <button 
                onClick={() => { navigator.clipboard.writeText(targetTab?.url || ''); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group active:scale-95"
              >
                <Copy size={14} className="text-white/20 group-hover:text-white/40" />
                Copiar URL
              </button>

              <button 
                onClick={() => {
                  if (targetTab) {
                    (window as any).electronAPI?.send('toggle-mute', { id: state.tabId, muted: !targetTab.isAudible });
                  }
                  onClose()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group active:scale-95"
              >
                <VolumeX size={14} className={`transition-colors ${targetTab?.isAudible ? 'text-white/20 group-hover:text-white/40' : 'text-purple-400'}`} />
                {targetTab?.isAudible ? 'Silenciar Aba' : 'Ativar Áudio'}
              </button>


              <div className="h-[1px] bg-white/[0.03] my-1.5 mx-2" />
              
              <button 
                onClick={() => { onCloseTab(state.tabId); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group active:scale-95"
              >
                <X size={14} className="text-red-400/20 group-hover:text-red-400" />
                Fechar Aba
              </button>

              <button 
                onClick={() => { onCloseOthers(state.tabId); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/30 hover:text-white/60 hover:bg-white/5 rounded-xl transition-all group active:scale-95"
              >
                <X size={14} className="text-white/10 group-hover:text-white/40" />
                Fechar Outras
              </button>

            </div>
            
            <div className="bg-white/[0.02] px-3 py-2 flex items-center justify-between">
               <Globe size={10} className="text-white/10" />
               <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">CONTEXT MENU</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
