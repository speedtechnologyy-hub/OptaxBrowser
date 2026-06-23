import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, Globe, ExternalLink, Trash2, Upload } from 'lucide-react'

interface FavoritesPanelProps {
  isOpen: boolean
  onClose: () => void
  favorites: string[]
  onRemoveFavorite: (url: string) => void
  onNavigate: (url: string) => void
  onImport: () => void
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onNavigate,
  onImport
}) => {
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
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20">
                  <Star size={20} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-white/90">Favoritos</h2>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Seus sites essenciais</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-2xl text-white/20 hover:text-white transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-8 pb-6">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">Importar dados</h3>
                <button 
                  onClick={() => { onImport(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 border border-white/[0.02] text-[10px] font-bold text-white/50 hover:text-white transition-all uppercase tracking-wider"
                >
                  <Upload size={13} />
                  Importar de outro navegador
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 space-y-2 py-4">
              {favorites.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10 gap-6">
                  <Star size={64} strokeWidth={1} />
                  <span className="text-[12px] font-black uppercase tracking-[0.3em] text-center">Nenhum favorito salvo</span>
                </div>
              ) : (
                favorites.map((url, i) => {
                  let hostname = url
                  try { hostname = new URL(url).hostname } catch {}
                  return (
                    <motion.div 
                      key={url}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-2xl border border-white/[0.03] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all group flex items-center gap-4 relative overflow-hidden"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center shrink-0 border border-white/[0.03]">
                        <Globe size={18} className="text-white/20 group-hover:text-yellow-400/50 transition-colors" />
                      </div>
                      
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onNavigate(url); onClose(); }}>
                        <h3 className="text-[12px] font-bold text-white/70 truncate group-hover:text-white transition-colors">{url}</h3>
                        <span className="text-[9px] font-bold text-white/20 truncate uppercase tracking-tight">{hostname}</span>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => onRemoveFavorite(url)}
                          className="p-2 hover:bg-red-500/10 text-white/10 hover:text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button 
                          onClick={() => { onNavigate(url); onClose(); }}
                          className="p-2 hover:bg-white/10 text-white/10 hover:text-white rounded-lg transition-all"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>

            <div className="p-8 border-t border-white/[0.03] bg-white/[0.01]">
              <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em] text-center">
                Total de {favorites.length} favoritos
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
