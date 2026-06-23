import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, Plus, RotateCw } from 'lucide-react'
import type { Tab, HistoryItem } from '../../types'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  tabs: Tab[]
  history: HistoryItem[]
  activeTabId: string
  onSwitchTab: (id: string) => void
  onCreateTab: (url?: string) => void
  onContextMenu: (e: React.MouseEvent, tabId: string) => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tabs,
  history,
  activeTabId,
  onSwitchTab,
  onCreateTab,
  onContextMenu
}) => {
  const [commandInput, setCommandInput] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const isUrl = (str: string) => {
    return /^https?:\/\//.test(str) || (str.includes('.') && !str.includes(' '));
  }

  const filteredTabs = tabs.filter(t => {
    if (!commandInput) return true;
    const query = commandInput.toLowerCase();
    return t.title?.toLowerCase().includes(query) || t.url?.toLowerCase().includes(query);
  }).sort((a, b) => {
    const query = commandInput.toLowerCase();
    const aTitle = a.title?.toLowerCase() || '';
    const bTitle = b.title?.toLowerCase() || '';
    if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1;
    if (!aTitle.startsWith(query) && bTitle.startsWith(query)) return 1;
    return 0;
  });

  const totalItems = 1 + filteredTabs.length + (commandInput ? 0 : history.length)

  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalItems)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAction()
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, totalItems, commandInput, filteredTabs, history])

  const handleAction = () => {
    if (commandInput && isUrl(commandInput)) {
      const targetUrl = commandInput.startsWith('http') ? commandInput : `https://${commandInput}`;
      onCreateTab(targetUrl);
    } else if (selectedIndex === 0) {
      onCreateTab();
    } else if (selectedIndex <= filteredTabs.length) {
      onSwitchTab(filteredTabs[selectedIndex - 1].id);
    } else {
      const historyIndex = selectedIndex - filteredTabs.length - 1;
      if (history[historyIndex]) onCreateTab(history[historyIndex].url);
    }
    onClose();
    setCommandInput('');
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.98, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: -10 }}
            className="w-full max-w-[550px] bg-[#0d0d0f]/95 border border-white/5 rounded-2xl shadow-[0_40px_120px_rgba(0,0,0,1)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center px-5 py-4 border-b border-white/[0.03] gap-4">
              <Search size={18} className="text-white/10" />
              <input 
                autoFocus
                type="text" 
                placeholder="Commands, Tabs, History..."
                className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder:text-white/5 font-semibold tracking-tight"
                value={commandInput}
                onChange={e => { setCommandInput(e.target.value); setSelectedIndex(0); }}
              />
              <kbd className="px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.05] text-[9px] text-white/20 font-black">ESC</kbd>
            </div>
            
            <div className="py-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="px-5 py-2 text-[9px] font-black text-white/5 uppercase tracking-[0.2em] mb-1">Ações Rápidas</div>
              
              {commandInput && isUrl(commandInput) && (
                <div 
                  onClick={handleAction}
                  onMouseEnter={() => setSelectedIndex(0)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all duration-300 group relative
                    ${selectedIndex === 0 ? 'bg-purple-500/10 border-l-2 border-purple-500' : 'hover:bg-white/[0.01]'}`}
                >
                  <div className="w-4 h-4 shrink-0 flex items-center justify-center text-purple-400">
                    <Globe size={16} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className={`text-[13px] font-bold tracking-tight ${selectedIndex === 0 ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>Ir para "{commandInput}"</span>
                    <span className="text-[10px] text-white/10 font-bold uppercase tracking-tight">Navegação Direta</span>
                  </div>
                </div>
              )}

              {!isUrl(commandInput) && (
                <div 
                  onClick={() => { onCreateTab(); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(0)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all duration-300 group relative
                    ${selectedIndex === 0 ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'hover:bg-white/[0.01]'}`}
                >
                  <div className="w-4 h-4 shrink-0 flex items-center justify-center text-indigo-400">
                    <Plus size={16} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className={`text-[13px] font-bold tracking-tight ${selectedIndex === 0 ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>Nova Aba</span>
                    <span className="text-[10px] text-white/10 font-bold uppercase tracking-tight">Sessão Opta X</span>
                  </div>
                </div>
              )}

              <div className="mx-5 my-2 h-[1px] bg-white/[0.03]" />
              <div className="px-5 py-2 text-[9px] font-black text-white/5 uppercase tracking-[0.2em] mb-1">
                {commandInput ? 'Resultados da Busca' : 'Abas Abertas'}
              </div>

              {filteredTabs.map((tab, idx) => (
                <div 
                  key={tab.id}
                  onClick={() => { onSwitchTab(tab.id); onClose(); }}
                  onContextMenu={(e) => onContextMenu(e, tab.id)}
                  onMouseEnter={() => setSelectedIndex(idx + 1)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all duration-300 group relative
                    ${selectedIndex === idx + 1 ? 'bg-white/[0.05] border-l-2 border-white/20' : 'hover:bg-white/[0.01]'}`}
                >
                  <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                    <img src={tab.favicon || ''} className="w-full h-full object-contain opacity-30 group-hover:opacity-100 transition-opacity" alt="" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-[13px] truncate tracking-tight ${selectedIndex === idx + 1 || tab.id === activeTabId ? 'font-bold text-white' : 'font-semibold text-white/30 group-hover:text-white/80'}`}>
                      {tab.title || 'Nova Aba'}
                    </span>
                    <span className="text-[10px] text-white/5 truncate font-medium">{tab.url}</span>
                  </div>
                  {tab.id === activeTabId && <div className="w-1.5 h-1.5 bg-blue-500/40 rounded-full" />}
                </div>
              ))}
              
              {!commandInput && history.length > 0 && (
                <>
                  <div className="mx-5 my-2 h-[1px] bg-white/[0.03]" />
                  <div className="px-5 py-2 text-[9px] font-black text-white/5 uppercase tracking-[0.2em] mb-1">Histórico Recente</div>
                  {history.map((h, idx) => {
                    const isSelected = selectedIndex === filteredTabs.length + 1 + idx;
                    return (
                      <div 
                        key={`hist-${idx}`}
                        onClick={() => { onCreateTab(h.url); onClose(); }}
                        onMouseEnter={() => setSelectedIndex(filteredTabs.length + 1 + idx)}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-300 group relative
                          ${isSelected ? 'bg-purple-500/10 border-l-2 border-purple-500' : 'hover:bg-white/[0.01]'}`}
                      >
                        <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center text-white/20">
                          <RotateCw size={12} className={isSelected ? 'text-purple-400' : ''} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className={`text-[12px] truncate font-medium ${isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`}>{h.title}</span>
                          <span className="text-[9px] text-white/10 truncate">{h.url}</span>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
            <div className="px-5 py-3 bg-white/[0.01] border-t border-white/[0.03] flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 grayscale opacity-30">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white font-bold">↵</kbd>
                    <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Open</span>
                  </div>
                  <div className="flex items-center gap-1.5 grayscale opacity-30">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white font-bold">↑↓</kbd>
                    <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Navigate</span>
                  </div>
               </div>
               <span className="text-[10px] font-black italic text-indigo-500/40 tracking-tighter">Opta Command</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
