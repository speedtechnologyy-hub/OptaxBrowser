import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, CheckCircle, AlertCircle, FolderOpen, Play, Pause, Trash2, FileText } from 'lucide-react'


import type { DownloadItem } from '../../types'

interface DownloadsPanelProps {
  isOpen: boolean
  onClose: () => void
  downloads: DownloadItem[]
}

export const DownloadsPanel: React.FC<DownloadsPanelProps> = ({
  isOpen,
  onClose,
  downloads
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 z-[70] bg-[#0d0d0f]/95 border-l border-white/5 shadow-[-20px_0_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/[0.03]">
              <div className="flex items-center gap-3">
                <Download size={18} className="text-purple-500" />
                <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-white/80">Downloads</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {downloads.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                  <Download size={48} strokeWidth={1} />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-center">Nenhum download<br/>encontrado</span>
                </div>
              ) : (
                downloads.map(item => (
                  <div 
                    key={item.id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] group hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-colors
                        ${item.state === 'completed' ? 'bg-green-500/10 text-green-500 shadow-green-500/5' : 
                          item.state === 'progressing' ? 'bg-blue-500/10 text-blue-500 shadow-blue-500/5' : 
                          'bg-red-500/10 text-red-500 shadow-red-500/5'}`}>
                        {item.state === 'completed' ? <CheckCircle size={20} /> : 
                         item.state === 'progressing' ? <Download size={20} className="animate-bounce" /> :
                         <AlertCircle size={20} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[12px] font-bold text-white/90 truncate group-hover:text-white transition-colors">{item.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-tight">
                            {item.state === 'completed' ? formatBytes(item.totalBytes) : `${formatBytes(item.receivedBytes)} / ${formatBytes(item.totalBytes)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {item.state === 'progressing' && (
                      <div className="mt-4 space-y-3">
                        <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.receivedBytes / (item.totalBytes || 1)) * 100}%` }}
                            className="h-full bg-opta-gradient shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-black text-white/10 uppercase tracking-tighter">
                          <span>{Math.round((item.receivedBytes / (item.totalBytes || 1)) * 100)}%</span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => (window as any).electronAPI?.send('download-action', { id: item.id, action: 'pause' })}
                              className="hover:text-white transition-colors"
                            >
                              <Pause size={10} />
                            </button>
                            <button 
                              onClick={() => (window as any).electronAPI?.send('download-action', { id: item.id, action: 'cancel' })}
                              className="hover:text-red-400 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {item.state === 'paused' && (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[9px] font-black text-yellow-500/50 uppercase tracking-widest">Pausado</span>
                        <div className="flex items-center gap-2">
                           <button 
                              onClick={() => (window as any).electronAPI?.send('download-action', { id: item.id, action: 'resume' })}
                              className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-all"
                           >
                              <Play size={10} />
                           </button>
                           <button 
                              onClick={() => (window as any).electronAPI?.send('download-action', { id: item.id, action: 'cancel' })}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                           >
                              <X size={10} />
                           </button>
                        </div>
                      </div>
                    )}

                    {(item.state === 'completed' || item.state === 'cancelled' || item.state === 'interrupted') && (
                      <div className="mt-3 flex gap-2">
                        <button 
                          onClick={() => (window as any).electronAPI?.send('download-action', { id: item.id, action: 'open-folder' })}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/40 hover:text-white transition-all uppercase tracking-tight flex items-center justify-center gap-2"
                        >
                          <FolderOpen size={10} /> Pasta
                        </button>
                        {item.state === 'completed' && (
                          <button 
                            onClick={() => (window as any).electronAPI?.send('download-action', { id: item.id, action: 'open-file' })}
                            className="flex-1 py-1.5 rounded-lg bg-opta-purple/10 hover:bg-opta-purple/20 text-[10px] font-bold text-opta-purple hover:text-white transition-all uppercase tracking-tight flex items-center justify-center gap-2"
                          >
                            <FileText size={10} /> Abrir
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-white/[0.03] bg-white/[0.01]">
              <button 
                className="w-full py-3 rounded-xl bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.05] hover:border-red-500/20 text-[10px] font-black text-white/30 hover:text-red-400 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 group"
                onClick={() => (window as any).electronAPI?.send('download-action', { action: 'clear-history' })}
              >
                <Trash2 size={12} className="opacity-40 group-hover:opacity-100" />
                Limpar Histórico
              </button>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
