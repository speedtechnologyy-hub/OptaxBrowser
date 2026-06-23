import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, X, Search, Globe, Trash2, Clock } from 'lucide-react'

interface HistoryEntry {
  url: string
  title: string
  timestamp: number
}

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (url: string) => void
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  const loadHistory = async () => {
    const data = await (window as any).electronAPI?.getHistory()
    if (data) setHistory(data)
  }

  const filteredHistory = history.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (ts: number) => {
    const date = new Date(ts)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (ts: number) => {
    const date = new Date(ts)
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] z-[70] bg-[#0d0d0f]/95 border-l border-white/5 shadow-[-40px_0_100px_rgba(0,0,0,0.9)] backdrop-blur-3xl flex flex-col"
          >
            <div className="p-8 pb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-white/90">Histórico</h2>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Sua jornada digital</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-2xl text-white/20 hover:text-white transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-8 mb-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input 
                  type="text"
                  placeholder="BUSCAR NO HISTÓRICO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500/30 focus:bg-white/[0.05] transition-all tracking-wider"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 space-y-2 pb-8">
              {filteredHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10 gap-6">
                  <History size={64} strokeWidth={1} />
                  <span className="text-[12px] font-black uppercase tracking-[0.3em] text-center">Nenhum registro<br/>encontrado</span>
                </div>
              ) : (
                filteredHistory.map((entry, i) => (
                  <motion.div 
                    key={entry.timestamp + i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    onClick={() => {
                      onNavigate(entry.url)
                      onClose()
                    }}
                    className="p-4 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all cursor-pointer group flex items-center gap-4 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center shrink-0 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all border border-white/[0.03]">
                      <Globe size={18} className="opacity-40 group-hover:opacity-100" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[12px] font-bold text-white/70 truncate group-hover:text-white transition-colors">{entry.title || entry.url}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-white/20 truncate uppercase tracking-tight">{new URL(entry.url).hostname}</span>
                        <div className="w-0.5 h-0.5 bg-white/10 rounded-full" />
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-tight">{formatTime(entry.timestamp)}</span>
                      </div>
                    </div>

                    <div className="text-[9px] font-black text-white/10 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all flex flex-col items-end">
                      <Clock size={10} className="mb-1" />
                      {formatDate(entry.timestamp)}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-white/[0.03] bg-white/[0.01] flex gap-3">
              <button 
                className="flex-1 py-4 rounded-2xl bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.05] hover:border-red-500/20 text-[10px] font-black text-white/30 hover:text-red-400 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95"
                onClick={() => { (window as any).electronAPI?.send("clear-history"); setHistory([]); }}
              >
                <Trash2 size={14} />
                Limpar Tudo
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
