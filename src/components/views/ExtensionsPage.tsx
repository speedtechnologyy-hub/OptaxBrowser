import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Puzzle, ExternalLink, Search, Star, Download, ChevronRight, Globe, Code2, Upload, Check, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'

const FEATURED = [
  { id: 'ublock', name: 'uBlock Origin', desc: 'Bloqueador de anúncios eficiente e leve', rating: 4.9, users: '10M+', category: 'Produtividade', icon: '🛡️', url: 'https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm' },
  { id: 'bitwarden', name: 'Bitwarden', desc: 'Gerenciador de senhas gratuito e seguro', rating: 4.8, users: '3M+', category: 'Segurança', icon: '🔐', url: 'https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb' },
  { id: 'todoist', name: 'Todoist', desc: 'Lista de tarefas e gerenciador de projetos', rating: 4.7, users: '2M+', category: 'Produtividade', icon: '✅', url: 'https://chrome.google.com/webstore/detail/todoist-for-chrome/jldhpllghnbhlbpcmnajkpdmadaolakh' },
  { id: 'grammarly', name: 'Grammarly', desc: 'Correção de gramática e ortografia em inglês', rating: 4.7, users: '10M+', category: 'Escrita', icon: '✍️', url: 'https://chrome.google.com/webstore/detail/grammarly-grammar-checker/kbfnbcaeplbcioakkpcpgfkobkghlhen' },
  { id: 'darkreader', name: 'Dark Reader', desc: 'Modo escuro para todos os sites', rating: 4.8, users: '5M+', category: 'Aparência', icon: '🌙', url: 'https://chrome.google.com/webstore/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh' },
  { id: 'lastpass', name: 'LastPass', desc: 'Gerenciador de senhas com preenchimento automático', rating: 4.5, users: '5M+', category: 'Segurança', icon: '🔑', url: 'https://chrome.google.com/webstore/detail/lastpass-free-password-ma/hdokiejnpimakedhajhdlcegeplioahd' },
  { id: 'notion', name: 'Notion Web Clipper', desc: 'Salve páginas web diretamente no Notion', rating: 4.6, users: '1M+', category: 'Produtividade', icon: '📝', url: 'https://chrome.google.com/webstore/detail/notion-web-clipper/knheggckgoiihginacbkhaalnibhilkk' },
  { id: 'colorpick', name: 'ColorPick Eyedropper', desc: 'Selecione cores de qualquer lugar na tela', rating: 4.6, users: '2M+', category: 'Design', icon: '🎨', url: 'https://chrome.google.com/webstore/detail/colorpick-eyedropper/ohcpnigalekghcmgcdcenkpelffpdolg' },
  { id: 'honey', name: 'Honey', desc: 'Cupons e descontos automáticos nas compras', rating: 4.5, users: '10M+', category: 'Compras', icon: '🍯', url: 'https://chrome.google.com/webstore/detail/honey-automatic-coupons-r/bmnlcjabgnpnenekpadlanbbkooimhnj' },
]

const CATEGORIES = ['Todos', 'Produtividade', 'Segurança', 'Aparência', 'Escrita', 'Design', 'Compras']

interface DevExtension {
  id: string
  name: string
  path: string
  enabled: boolean
  version: string
}

interface ExtensionsPageProps {
  onClose?: () => void
}

export const ExtensionsPage: React.FC<ExtensionsPageProps> = ({ onClose }) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [installed, setInstalled] = useState<string[]>([])
  const [devMode, setDevMode] = useState(false)

  const [pinnedIds, setPinnedIds] = useState<string[]>([])

  // Load saved dev extensions and pinned state on mount
  React.useEffect(() => {
    const api = (window as any).electronAPI
    api?.getDevExtensions?.().then((exts: any[]) => {
      if (exts?.length) { setDevExtensions(exts); setDevMode(true) }
    })
    // Load real pinned extension IDs from electron-store
    api?.getPinnedExtensions?.().then((ids: string[]) => {
      if (ids?.length) setPinnedIds(ids)
    })
  }, [])
  const [devExtensions, setDevExtensions] = useState<DevExtension[]>([])
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [loadMsg, setLoadMsg] = useState('')

  const filtered = FEATURED.filter(e =>
    (category === 'Todos' || e.category === category) &&
    (e.name.toLowerCase().includes(search.toLowerCase()) || e.desc.toLowerCase().includes(search.toLowerCase()))
  )

  const handleInstall = (ext: typeof FEATURED[0]) => {
    ;(window as any).electronAPI?.navigate(ext.url)
    setInstalled(prev => [...prev, ext.id])
  }

  const handleLoadDevExtension = async () => {
    setLoadStatus('loading')
    try {
      const result = await (window as any).electronAPI?.invoke('load-dev-extension')
      if (result?.success) {
        setDevExtensions(prev => [...prev, {
          id: result.id,
          name: result.name || 'Extensão carregada',
          path: result.path,
          enabled: true,
          version: result.version || '1.0.0'
        }])
        setLoadStatus('success')
        setLoadMsg(`"${result.name || 'Extensão'}" carregada com sucesso!`)
      } else {
        setLoadStatus('error')
        setLoadMsg(result?.error || 'Erro ao carregar extensão. Verifique se a pasta contém um manifest.json válido.')
      }
    } catch {
      setLoadStatus('error')
      setLoadMsg('Erro ao carregar extensão.')
    }
    setTimeout(() => setLoadStatus('idle'), 4000)
  }

  const toggleDevExt = (id: string) => {
    setDevExtensions(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e))
  }

  const removeDevExt = (id: string) => {
    setDevExtensions(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[#0d0d0f] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="px-10 pt-10 pb-6 shrink-0">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Puzzle size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Extensões</h1>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Chrome Web Store — Extensões populares</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Dev mode toggle */}
            <button
              onClick={() => setDevMode(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all
                ${devMode ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-white/5 border-white/5 text-white/40 hover:text-white/70 hover:bg-white/10'}`}
            >
              <Code2 size={13} />
              Modo desenvolvedor
              {devMode ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            </button>
            {onClose && (
              <button onClick={onClose} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-bold text-white/50 hover:text-white transition-all">
                ← Voltar
              </button>
            )}
            <button
              onClick={() => (window as any).electronAPI?.navigate('https://chrome.google.com/webstore/category/extensions')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-bold text-white/50 hover:text-white transition-all"
            >
              <Globe size={13} />
              Chrome Web Store
              <ExternalLink size={11} />
            </button>
          </div>
        </div>

        {/* Dev mode panel */}
        <AnimatePresence>
          {devMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[13px] font-bold text-orange-300">Modo Desenvolvedor</h3>
                    <p className="text-[11px] text-white/30 mt-0.5">Carregue extensões locais não publicadas (.crx ou pasta com manifest.json)</p>
                  </div>
                  <button
                    onClick={handleLoadDevExtension}
                    disabled={loadStatus === 'loading'}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 text-[11px] font-bold transition-all disabled:opacity-50"
                  >
                    <Upload size={13} />
                    Carregar extensão não compactada
                  </button>
                </div>

                <AnimatePresence>
                  {loadStatus !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium mb-3
                        ${loadStatus === 'success' ? 'bg-green-500/10 text-green-400' : loadStatus === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/40'}`}
                    >
                      {loadStatus === 'loading' && <div className="w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" />}
                      {loadStatus === 'success' && <Check size={13} />}
                      {loadStatus === 'error' && <AlertCircle size={13} />}
                      {loadStatus === 'loading' ? 'Carregando extensão...' : loadMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {devExtensions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Extensões instaladas ({devExtensions.length})</p>
                    {devExtensions.map(ext => (
                      <div key={ext.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                          <Code2 size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-white/80">{ext.name}</p>
                          <p className="text-[10px] text-white/25 truncate">{ext.path}</p>
                        </div>
                        <span className="text-[9px] text-white/20">v{ext.version}</span>
                        <button
                          onClick={() => toggleDevExt(ext.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all
                            ${ext.enabled ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}
                        >
                          {ext.enabled ? 'Ativo' : 'Inativo'}
                        </button>
                        <button
                          onClick={async () => {
                            const api = (window as any).electronAPI
                            // Get real loaded extension ID from Electron
                            const loaded: any[] = await api?.getLoadedExtensions?.() || []
                            const realExt = loaded.find((e: any) => e.name === ext.name || e.id.includes(ext.id))
                            const realId = realExt?.id || ext.id
                            const next = pinnedIds.includes(realId)
                              ? pinnedIds.filter(p => p !== realId)
                              : [...pinnedIds, realId]
                            setPinnedIds(next)
                            api?.setPinnedExtensions?.(next)
                          }}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
                            pinnedIds.includes(ext.id) || pinnedIds.some(id => id.includes(ext.id))
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-white/5 text-white/25 hover:text-white/60'
                          }`}
                          title="Fixar na barra de ferramentas"
                        >
                          📌
                        </button>
                        <button onClick={() => removeDevExt(ext.id)} className="text-white/20 hover:text-red-400 transition-colors text-[10px]">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Buscar extensões..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[12px] outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#e0e0f0' }}
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all
                ${category === cat ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-10 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((ext, i) => (
              <motion.div key={ext.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}
                className="p-5 rounded-2xl border border-white/[0.05] hover:border-purple-500/20 hover:bg-white/[0.04] transition-all group flex flex-col gap-3"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shrink-0">{ext.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold text-white/90 truncate">{ext.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-yellow-400 font-bold">★ {ext.rating}</span>
                      <span className="text-[9px] text-white/20">·</span>
                      <span className="text-[9px] text-white/30">{ext.users}</span>
                      <span className="text-[9px] text-white/20">·</span>
                      <span className="text-[9px] text-purple-400/70 font-bold uppercase">{ext.category}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-white/35 leading-relaxed">{ext.desc}</p>
                <div className="flex items-center gap-2 mt-auto">
                  <button onClick={() => handleInstall(ext)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5
                      ${installed.includes(ext.id) ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}>
                    {installed.includes(ext.id) ? <><Star size={11} className="fill-green-400" /> Abrindo loja...</> : <><Download size={11} /> Instalar</>}
                  </button>
                  <button onClick={() => (window as any).electronAPI?.navigate(ext.url)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/10">
            <Puzzle size={48} strokeWidth={1} className="mx-auto mb-4" />
            <p className="text-[12px] font-bold uppercase tracking-widest">Nenhuma extensão encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
