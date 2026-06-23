import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Download, 
  History, 
  Star, 
  Puzzle, 
  Terminal, 
  Monitor as WindowIcon, 
  Plus, 
  RotateCw, 
  ArrowLeftRight, 
  Key, 
  RefreshCw, 
  Info, 
  LogOut 
} from 'lucide-react'

interface MainMenuProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: string) => void
  onAction: (action: string) => void
}

export const MainMenu: React.FC<MainMenuProps> = ({ isOpen, onClose, onNavigate, onAction }) => {
  const menuItems = [
    { icon: Settings, label: 'Configurações', action: () => onNavigate('opta://settings') },
    { icon: Download, label: 'Downloads', action: () => onAction('open-downloads') },
    { icon: History, label: 'Histórico', action: () => onAction('open-history') },
    { icon: Star, label: 'Favoritos', action: () => onAction('open-favorites') },
    { icon: Puzzle, label: 'Extensões', action: () => onNavigate('opta://extensions') },
    { separator: true },
    { icon: Terminal, label: 'DevTools', action: () => onAction('devtools') },
    { icon: WindowIcon, label: 'Nova Janela', action: () => onAction('new-window') },
    { icon: Plus, label: 'Nova Aba', action: () => onAction('new-tab') },
    { icon: RotateCw, label: 'Reabrir Aba Fechada', action: () => onAction('reopen-closed') },
    { separator: true },
    { icon: ArrowLeftRight, label: 'Importar Dados', action: () => onNavigate('opta://import') },
    { icon: Key, label: 'Gerenciador de Senhas', action: () => onNavigate('opta://passwords') },
    { icon: RefreshCw, label: 'Atualizações', action: () => onAction('check-updates') },
    { icon: Info, label: 'Sobre o Opta X', action: () => onNavigate('opta://about') },
    { separator: true },
    { icon: RefreshCw, label: 'Reiniciar Navegador', action: () => onAction('restart'), danger: true },
    { icon: LogOut, label: 'Sair', action: () => onAction('quit'), danger: true },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[99998]" onClick={onClose} style={{ background: "transparent" }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
            className="fixed top-[44px] right-[4px] z-[99999] w-64 bg-[#0d0d0f]/98 border border-white/8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] rounded-2xl overflow-hidden"
          >
            <div className="p-2 custom-scrollbar max-h-[80vh] overflow-y-auto">
              {menuItems.map((item, index) => {
                if (item.separator) {
                  return <div key={index} className="h-[1px] bg-white/5 my-1 mx-2" />
                }
                const Icon = item.icon!
                return (
                  <button
                    key={index}
                    onClick={() => { item.action?.(); onClose(); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group active:scale-95
                      ${item.danger ? 'hover:bg-red-500/10 text-red-400/70 hover:text-red-400' : 'hover:bg-white/5 text-white/60 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${item.danger ? 'bg-red-500/5 group-hover:bg-red-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                        <Icon size={14} />
                      </div>
                      <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
            
            <div className="bg-white/[0.02] px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Opta X Browser</span>
                <span className="text-[8px] text-white/10">Version 1.0.0 (Neon)</span>
              </div>
              <div className="w-6 h-6 rounded-lg bg-opta-purple/10 flex items-center justify-center border border-opta-purple/20">
                <div className="w-1.5 h-1.5 bg-opta-purple rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,1)]" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
