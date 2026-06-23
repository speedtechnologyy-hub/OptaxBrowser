import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Monitor, Palette, Search, Globe, Power, Download, Shield, ChevronRight, Check } from 'lucide-react'

type SidebarMode = 'expanded' | 'compact' | 'hidden'

interface SettingsPageProps {
  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode) => void
  showFavoritesBar: boolean
  setShowFavoritesBar: (show: boolean | ((prev: boolean) => boolean)) => void
  showTabsBar: boolean
  setShowTabsBar: (show: boolean | ((prev: boolean) => boolean)) => void
  favBarIconOnly: boolean
  setFavBarIconOnly: (v: boolean) => void
}

const SECTIONS = [
  { id: 'startup', label: 'Inicialização', icon: Power },
  { id: 'interface', label: 'Interface', icon: Monitor },
  { id: 'appearance', label: 'Aparência', icon: Palette },
  { id: 'search', label: 'Mecanismo de pesquisa', icon: Search },
  { id: 'privacy', label: 'Privacidade e segurança', icon: Shield },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'language', label: 'Idiomas', icon: Globe },
]

const SEARCH_ENGINES = [
  { id: 'google', name: 'Google', url: 'https://google.com/search?q=' },
  { id: 'bing', name: 'Bing', url: 'https://bing.com/search?q=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  { id: 'brave', name: 'Brave Search', url: 'https://search.brave.com/search?q=' },
]

const Radio = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'border-blue-500 bg-blue-500' : 'border-white/20 hover:border-white/40'}`}>
    {checked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
  </button>
)

const Toggle = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`w-10 h-5 rounded-full transition-all relative ${checked ? 'bg-blue-500' : 'bg-white/15'}`}>
    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
  </button>
)

export const SettingsPage: React.FC<SettingsPageProps> = ({ sidebarMode, setSidebarMode, showFavoritesBar, setShowFavoritesBar, showTabsBar, setShowTabsBar, favBarIconOnly, setFavBarIconOnly }) => {
  const [activeSection, setActiveSection] = useState('startup')
  const [startupMode, setStartupModeState] = useState<'newtab' | 'continue' | 'specific'>('newtab')
  const [startupUrl, setStartupUrlState] = useState('https://google.com')
  const [searchEngine, setSearchEngine] = useState('google')
  const [darkMode, setDarkMode] = useState(true)
  const [clearOnExit, setClearOnExit] = useState(false)
  const [downloadPath, setDownloadPath] = useState('Padrão (Downloads)')
  const [askDownload, setAskDownload] = useState(false)

  // Load persisted settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('opta-settings')
    if (saved) {
      try {
        const s = JSON.parse(saved)
        if (s.startupMode) setStartupModeState(s.startupMode)
        if (s.startupUrl) setStartupUrlState(s.startupUrl)
        if (s.searchEngine) setSearchEngine(s.searchEngine)
        if (s.clearOnExit !== undefined) setClearOnExit(s.clearOnExit)
        if (s.askDownload !== undefined) setAskDownload(s.askDownload)
      } catch {}
    }
  }, [])

  const saveSettings = (patch: object) => {
    const current = (() => { try { return JSON.parse(localStorage.getItem('opta-settings') || '{}') } catch { return {} } })()
    const next = { ...current, ...patch }
    localStorage.setItem('opta-settings', JSON.stringify(next))
    // Notify main process
    ;(window as any).electronAPI?.send('save-setting', next)
  }

  const setStartupMode = (mode: 'newtab' | 'continue' | 'specific') => {
    setStartupModeState(mode)
    saveSettings({ startupMode: mode })
  }

  const setStartupUrl = (url: string) => {
    setStartupUrlState(url)
    saveSettings({ startupUrl: url })
  }

  const Row = ({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.04] last:border-0">
      <div>
        <p className="text-[13px] font-medium text-white/80">{label}</p>
        {desc && <p className="text-[11px] text-white/30 mt-0.5">{desc}</p>}
      </div>
      <div className="ml-4 shrink-0">{right}</div>
    </div>
  )

  return (
    <div className="absolute inset-0 flex bg-[#0d0d0f]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-white/[0.05] pt-6 overflow-y-auto" style={{ background: '#0a0a0d' }}>
        <div className="flex items-center gap-3 px-5 mb-6">
          <Settings size={18} className="text-white/40" />
          <span className="text-[13px] font-bold text-white/70">Configurações</span>
        </div>
        {SECTIONS.map(s => {
          const Icon = s.icon
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all ${activeSection === s.id ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'}`}
            >
              <Icon size={14} />
              <span className="text-[12px] font-medium">{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-xl">

          {activeSection === 'startup' && (
            <div>
              <h2 className="text-[18px] font-bold text-white/80 mb-6">Inicialização</h2>
              <div className="p-4 rounded-2xl" style={{ background: '#111116', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { id: 'newtab', label: 'Abrir nova guia', desc: 'Começa sempre com uma nova aba em branco' },
                  { id: 'continue', label: 'Continuar de onde você parou', desc: 'Reabre as abas da sessão anterior' },
                  { id: 'specific', label: 'Abrir uma página específica', desc: 'Define uma URL personalizada ao iniciar' },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center gap-3 py-3.5 border-b border-white/[0.04] last:border-0">
                    <Radio checked={startupMode === opt.id} onClick={() => setStartupMode(opt.id as any)} />
                    <div>
                      <p className="text-[13px] font-medium text-white/75">{opt.label}</p>
                      <p className="text-[11px] text-white/30">{opt.desc}</p>
                    </div>
                  </div>
                ))}
                {startupMode === 'specific' && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <label className="text-[11px] text-white/40 font-medium uppercase tracking-wider">URL de inicialização</label>
                    <input
                      type="text"
                      value={startupUrl}
                      onChange={e => setStartupUrl(e.target.value)}
                      className="w-full mt-2 px-3 py-2 rounded-lg text-[12px] outline-none"
                      style={{ background: '#1a1a22', border: '1px solid rgba(255,255,255,0.08)', color: '#e0e0f0' }}
                      placeholder="https://exemplo.com"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'interface' && (
            <div>
              <h2 className="text-[18px] font-bold text-white/80 mb-6">Interface</h2>
              <div className="p-4 rounded-2xl" style={{ background: '#111116', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Row label="Modo da sidebar" desc="Como as abas são exibidas" right={
                  <div className="flex gap-1">
                    {(['expanded', 'compact', 'hidden'] as SidebarMode[]).map(m => (
                      <button key={m} onClick={() => setSidebarMode(m)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                          ${sidebarMode === m ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60'}`}>
                        {m === 'expanded' ? 'Larga' : m === 'compact' ? 'Slim' : 'Oculta'}
                      </button>
                    ))}
                  </div>
                } />
                <Row label="Barra de favoritos" desc="Exibir barra de acesso rápido abaixo da URL" right={
                  <Toggle checked={showFavoritesBar} onClick={() => setShowFavoritesBar((p: boolean) => !p)} />
                } />
                <Row label="Barra de abas (sidebar oculta)" desc="Mostrar barra de abas em linha quando sidebar não estiver expandida" right={
                  <Toggle checked={showTabsBar} onClick={() => setShowTabsBar((p: boolean) => !p)} />
                } />
                <Row label="Favoritos: somente ícones" desc="Mostrar apenas o ícone do site, sem texto, na barra de favoritos" right={
                  <Toggle checked={favBarIconOnly} onClick={() => setFavBarIconOnly(!favBarIconOnly)} />
                } />
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div>
              <h2 className="text-[18px] font-bold text-white/80 mb-6">Aparência</h2>
              <div className="p-4 rounded-2xl" style={{ background: '#111116', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Row label="Tema escuro" desc="Interface com fundo escuro" right={
                  <Toggle checked={darkMode} onClick={() => setDarkMode(p => !p)} />
                } />
                <Row label="Fonte do sistema" desc="Usar fonte padrão do sistema operacional" right={
                  <Toggle checked={false} onClick={() => {}} />
                } />
              </div>
            </div>
          )}

          {activeSection === 'search' && (
            <div>
              <h2 className="text-[18px] font-bold text-white/80 mb-6">Mecanismo de pesquisa</h2>
              <div className="p-4 rounded-2xl" style={{ background: '#111116', border: '1px solid rgba(255,255,255,0.06)' }}>
                {SEARCH_ENGINES.map(eng => (
                  <div key={eng.id} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
                    <Radio checked={searchEngine === eng.id} onClick={() => setSearchEngine(eng.id)} />
                    <span className="text-[13px] text-white/70 font-medium">{eng.name}</span>
                    {searchEngine === eng.id && <Check size={13} className="ml-auto text-blue-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div>
              <h2 className="text-[18px] font-bold text-white/80 mb-6">Privacidade e segurança</h2>
              <div className="p-4 rounded-2xl" style={{ background: '#111116', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Row label="Limpar dados ao sair" desc="Remove histórico e cookies ao fechar o navegador" right={
                  <Toggle checked={clearOnExit} onClick={() => setClearOnExit(p => !p)} />
                } />
                <Row label="Bloquear rastreadores" desc="Proteção básica contra rastreamento" right={
                  <Toggle checked={true} onClick={() => {}} />
                } />
                <div className="pt-3 mt-2 border-t border-white/[0.04]">
                  <button className="text-[12px] text-red-400 hover:text-red-300 transition-colors font-medium">
                    Limpar dados de navegação agora...
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'downloads' && (
            <div>
              <h2 className="text-[18px] font-bold text-white/80 mb-6">Downloads</h2>
              <div className="p-4 rounded-2xl" style={{ background: '#111116', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Row label="Local de download" desc={downloadPath} right={
                  <button
                    onClick={async () => {
                      const result = await (window as any).electronAPI?.invoke('select-download-path')
                      if (result) setDownloadPath(result)
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/50 hover:text-white transition-all border border-white/[0.06]"
                  >
                    Alterar...
                  </button>
                } />
                <Row label="Perguntar onde salvar" desc="Abrir diálogo de salvar a cada download" right={
                  <Toggle checked={askDownload} onClick={() => setAskDownload(p => !p)} />
                } />
              </div>
            </div>
          )}

          {activeSection === 'language' && (
            <div>
              <h2 className="text-[18px] font-bold text-white/80 mb-6">Idiomas</h2>
              <div className="p-4 rounded-2xl" style={{ background: '#111116', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Row label="Idioma do navegador" desc="Português (Brasil)" right={
                  <div className="flex items-center gap-1 text-white/30">
                    <span className="text-[11px]">PT-BR</span>
                    <ChevronRight size={12} />
                  </div>
                } />
                <Row label="Oferecer tradução" desc="Sugerir tradução para páginas em outros idiomas" right={
                  <Toggle checked={true} onClick={() => {}} />
                } />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
