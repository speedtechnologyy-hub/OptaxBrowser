import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star } from 'lucide-react'

interface FavoriteEditDialogProps {
  isOpen: boolean
  url: string
  initialName: string
  isFavorite: boolean
  onSave: (name: string, url: string) => void
  onRemove: () => void
  onClose: () => void
}

export const FavoriteEditDialog: React.FC<FavoriteEditDialogProps> = ({
  isOpen, url, initialName, isFavorite, onSave, onRemove, onClose
}) => {
  const [name, setName] = useState(initialName)
  const [editUrl, setEditUrl] = useState(url)

  useEffect(() => {
    setName(initialName)
    setEditUrl(url)
  }, [initialName, url, isOpen])

  useEffect(() => {
    ;(window as any).electronAPI?.setFavEditOpen?.(isOpen)
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[9999] w-[320px] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
            style={{
              top: 50,
              right: 44,
              background: '#1e1e28',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[14px] font-bold text-white/90">Editar favorito</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>

            {/* Form */}
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-white/40 mb-1.5 block">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl text-[12px] outline-none border"
                  style={{
                    background: '#141420',
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: '#e0e0f0',
                    caretColor: '#6366f1'
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') { onSave(name, editUrl); onClose() } }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-white/40 mb-1.5 block">URL</label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-[12px] outline-none border"
                  style={{
                    background: '#141420',
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: '#e0e0f0',
                    caretColor: '#6366f1'
                  }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-white/40 mb-1.5 block">Pasta</label>
                <div
                  className="w-full px-3 py-2 rounded-xl text-[12px] flex items-center gap-2 border cursor-default"
                  style={{ background: '#141420', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4C2 3.45 2.45 3 3 3H6.5L8 4.5H13C13.55 4.5 14 4.95 14 5.5V12C14 12.55 13.55 13 13 13H3C2.45 13 2 12.55 2 12V4Z" fill="rgba(255,255,255,0.4)" />
                  </svg>
                  Barra de favoritos
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex items-center gap-2">
              <button
                onClick={() => { onRemove(); onClose() }}
                className="px-4 py-2 rounded-xl text-[12px] font-bold text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20"
              >
                Remover
              </button>
              <button
                onClick={() => { onSave(name, editUrl); onClose() }}
                className="flex-1 py-2 rounded-xl text-[12px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
