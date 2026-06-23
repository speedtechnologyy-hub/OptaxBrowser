import React from 'react'
import { motion } from 'framer-motion'
import { 
  Download, 
  History, 
  Star, 
  Settings, 
  Puzzle, 
  Import, 
  Shield, 
  Keyboard,
  Layout,
  ExternalLink,
  ChevronRight,
  Key
} from 'lucide-react'

interface HubProps {
  onNavigate: (url: string) => void
  onOpenPanel: (panel: 'downloads' | 'history' | 'favorites') => void
  onClose?: () => void
}

export const Hub: React.FC<HubProps> = ({ onNavigate, onOpenPanel, onClose }) => {
  const categories = [
    { id: 'downloads', name: 'Downloads', icon: <Download size={24} />, desc: 'Arquivos baixados recentemente', path: 'panel://downloads' },
    { id: 'history', name: 'Histórico', icon: <History size={24} />, desc: 'Páginas que você visitou', path: 'panel://history' },
    { id: 'favorites', name: 'Favoritos', icon: <Star size={24} />, desc: 'Seus sites preferidos', path: 'panel://favorites' },
    { id: 'extensions', name: 'Extensões', icon: <Puzzle size={24} />, desc: 'Instalar extensões do Chrome', path: 'opta://extensions' },
    { id: 'passwords', name: 'Senhas', icon: <Key size={24} />, desc: 'Importar e gerenciar senhas', path: 'opta://passwords' },
    { id: 'import', name: 'Importar', icon: <Import size={24} />, desc: 'Migrar dados de outros browsers', path: 'opta://import' },
    { id: 'settings', name: 'Configurações', icon: <Settings size={24} />, desc: 'Personalizar sua experiência', path: 'opta://settings' },
  ]

  return (
    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-12 bg-[#0d0d0f]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto w-full"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Shield size={20} />
            </div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Central Opta X</h1>
          </div>
          {onClose && (
            <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] text-[12px] font-bold text-white/40 hover:text-white transition-all">
              ← Voltar
            </button>
          )}
        </div>
        <p className="text-white/20 text-xs font-bold uppercase tracking-[0.3em] mb-10">Seu browser, sob controle total.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                if (cat.path.startsWith('panel://')) {
                  onOpenPanel(cat.path.replace('panel://', '') as any)
                  return
                }
                onNavigate(cat.path)
              }}
              className="group relative p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-purple-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="text-white/20 group-hover:text-purple-400 transition-colors">
                  {cat.icon}
                </div>
                <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                  <ChevronRight size={14} className="text-white" />
                </div>
              </div>
              <h3 className="text-lg font-black text-white/90 mb-2 tracking-tight group-hover:text-white">{cat.name}</h3>
              <p className="text-white/30 text-[11px] font-bold leading-relaxed uppercase tracking-widest">{cat.desc}</p>

              {/* Decorative Glow */}
              <div className="absolute inset-0 rounded-[32px] bg-purple-500/0 group-hover:bg-purple-500/[0.02] blur-xl transition-all" />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-8 rounded-[32px] bg-white/[0.01] border border-white/5">
            <h4 className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] mb-8">Atalhos do Sistema</h4>
            <div className="space-y-4">
              {[
                { icon: <Keyboard size={14} />, label: 'Nova Aba', key: 'Ctrl + T' },
                { icon: <Keyboard size={14} />, label: 'Downloads', key: 'Ctrl + J' },
                { icon: <Keyboard size={14} />, label: 'Histórico', key: 'Ctrl + H' },
                { icon: <Keyboard size={14} />, label: 'Inspecionar', key: 'F12' },
              ].map(shortcut => (
                <div key={shortcut.label} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center gap-3 text-white/30 group-hover:text-white/60 transition-colors">
                    {shortcut.icon}
                    <span className="text-[11px] font-bold uppercase tracking-widest">{shortcut.label}</span>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-purple-400/60 uppercase tracking-tighter">{shortcut.key}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-[32px] bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em] mb-4">Dica de Produtividade</h4>
              <p className="text-xl font-bold text-white mb-8 tracking-tight leading-snug">O Split View deixa você trabalhar em <span className="text-purple-400">duas telas</span> simultâneas.</p>
              <button 
                onClick={() => onNavigate('https://google.com')}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors"
              >
                Experimentar Agora <ExternalLink size={14} />
              </button>
            </div>
            <Layout size={120} className="absolute -bottom-10 -right-10 text-white/[0.03] rotate-12 group-hover:rotate-6 transition-all duration-700" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
