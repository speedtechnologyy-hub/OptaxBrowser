import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Globe, Layout, Clock, Star } from 'lucide-react'

interface NewTabPageProps {
  onNavigate: (url: string) => void
  onCreateTab: () => void
}

export const NewTabPage: React.FC<NewTabPageProps> = ({ onNavigate, onCreateTab }) => {
  const [query, setQuery] = React.useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) onNavigate(query)
  }

  const shortcuts = [
    { name: 'Google', url: 'https://google.com', favicon: 'https://www.google.com/s2/favicons?domain=google.com&sz=64' },
    { name: 'YouTube', url: 'https://youtube.com', favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64' },
    { name: 'GitHub', url: 'https://github.com', favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64' },
    { name: 'Gmail', url: 'https://mail.google.com', favicon: 'https://www.google.com/s2/favicons?domain=mail.google.com&sz=64' },
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0d0f] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-2xl px-8 flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_20px_50px_rgba(168,85,247,0.3)] mb-12">
          <Globe size={40} className="text-white" />
        </div>

        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">Opta X</h1>
        <p className="text-white/20 text-xs font-bold uppercase tracking-[0.4em] mb-12">Navegação de Próxima Geração</p>

        <form onSubmit={handleSearch} className="w-full relative group mb-12">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="PARA ONDE VAMOS HOJE?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-[24px] py-6 pl-16 pr-6 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.05] transition-all tracking-widest uppercase shadow-2xl"
            autoFocus
          />
        </form>

        <div className="grid grid-cols-4 gap-6 w-full mb-12">
          {shortcuts.map((s, i) => (
            <motion.button
              key={s.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onNavigate(s.url)}
              className="flex flex-col items-center gap-4 p-6 rounded-[24px] bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                <img src={(s as any).favicon} alt={s.name} className="w-7 h-7 object-contain" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">{s.name}</span>
            </motion.button>
          ))}
        </div>

        <button 
          onClick={onCreateTab}
          className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black text-white/40 hover:text-white transition-all uppercase tracking-[0.2em]"
        >
          <Plus size={14} />
          Nova Guia
        </button>
      </motion.div>

      <div className="absolute bottom-12 flex gap-12 opacity-20">
        <div className="flex items-center gap-2">
          <Clock size={12} />
          <span className="text-[8px] font-black uppercase tracking-widest">Alt+Left Voltar</span>
        </div>
        <div className="flex items-center gap-2">
          <Layout size={12} />
          <span className="text-[8px] font-black uppercase tracking-widest">Ctrl+T Nova Aba</span>
        </div>
        <div className="flex items-center gap-2">
          <Star size={12} />
          <span className="text-[8px] font-black uppercase tracking-widest">Ctrl+D Favorito</span>
        </div>
      </div>
    </div>
  )
}
