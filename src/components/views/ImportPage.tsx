import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftRight, Check, Loader, Globe, Upload, FileJson, AlertCircle } from 'lucide-react'

interface ImportPageProps {
  onNavigate: (url: string) => void
  onImportFavorites?: (urls: string[]) => void
  onClose?: () => void
}

type Browser = 'chrome' | 'edge' | 'firefox' | 'opera'
type Method = 'file' | 'auto'

const browsers: { id: Browser; name: string; color: string; fileHint: string }[] = [
  { id: 'chrome', name: 'Google Chrome', color: 'text-yellow-400', fileHint: 'Exporte em chrome://bookmarks → ⋮ → Exportar favoritos' },
  { id: 'edge', name: 'Microsoft Edge', color: 'text-blue-400', fileHint: 'Exporte em edge://favorites → ⋮ → Exportar favoritos' },
  { id: 'firefox', name: 'Firefox', color: 'text-orange-400', fileHint: 'Exporte em Favoritos → Gerenciar → Importar e Fazer backup → Exportar HTML' },
  { id: 'opera', name: 'Opera', color: 'text-red-400', fileHint: 'Exporte em opera://bookmarks → Importar/exportar → Exportar para HTML' },
]

// Parses Chrome/Edge JSON bookmark export
function parseBookmarksJson(json: any): string[] {
  const urls: string[] = []
  function walk(node: any) {
    if (!node) return
    if (node.type === 'url' && node.url && node.url.startsWith('http')) urls.push(node.url)
    if (node.type === 'folder' && node.children) node.children.forEach(walk)
    if (node.roots) Object.values(node.roots).forEach(walk)
    if (Array.isArray(node)) node.forEach(walk)
  }
  walk(json)
  return [...new Set(urls)]
}

// Parses Firefox/Chrome HTML bookmark export
function parseBookmarksHtml(html: string): string[] {
  const urls: string[] = []
  const matches = html.matchAll(/href="(https?:\/\/[^"]+)"/gi)
  for (const m of matches) urls.push(m[1])
  return [...new Set(urls)]
}

export const ImportPage: React.FC<ImportPageProps> = ({ onNavigate, onImportFavorites, onClose }) => {
  const [selected, setSelected] = useState<Browser | null>(null)
  const [method, setMethod] = useState<Method>('file')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ bookmarks: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('loading')
    try {
      const text = await file.text()
      let urls: string[] = []

      if (file.name.endsWith('.json')) {
        const json = JSON.parse(text)
        urls = parseBookmarksJson(json)
      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        urls = parseBookmarksHtml(text)
      } else {
        throw new Error('Formato não suportado. Use .json ou .html')
      }

      if (urls.length === 0) throw new Error('Nenhum favorito encontrado no arquivo.')

      onImportFavorites?.(urls)
      setResult({ bookmarks: urls.length })
      setStatus('done')
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao ler arquivo.')
      setStatus('error')
    }
    // Reset input
    if (fileRef.current) fileRef.current.value = ''
  }

  const reset = () => { setStatus('idle'); setResult(null); setErrorMsg('') }

  const selectedBrowser = browsers.find(b => b.id === selected)

  return (
    <div className="absolute inset-0 flex flex-col bg-[#0d0d0f] overflow-y-auto custom-scrollbar p-12">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <ArrowLeftRight size={20} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Importar Dados</h1>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Favoritos de outros navegadores via arquivo</p>
          </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white/50 hover:text-white transition-all">← Voltar</button>
        )}
        </div>

        {/* Selecionar navegador */}
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">1. Selecione o navegador de origem</p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {browsers.map(b => (
            <motion.button
              key={b.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelected(b.id); reset() }}
              className={`p-5 rounded-2xl border flex items-center gap-4 transition-all text-left
                ${selected === b.id
                  ? 'bg-purple-500/10 border-purple-500/30'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                }`}
            >
              <Globe size={20} className={b.color} />
              <span className="text-sm font-bold text-white/70">{b.name}</span>
              {selected === b.id && <Check size={14} className="ml-auto text-purple-400" />}
            </motion.button>
          ))}
        </div>

        {/* Instruções + import via arquivo */}
        <AnimatePresence mode="wait">
          {selected && status === 'idle' && (
            <motion.div key="instructions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">2. Exporte e importe o arquivo</p>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 mb-4">
                <div className="flex items-start gap-3">
                  <FileJson size={16} className="text-purple-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-white/50 leading-relaxed">{selectedBrowser?.fileHint}</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".json,.html,.htm" className="hidden" onChange={handleFileImport} />
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileRef.current?.click()}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 hover:bg-purple-500/10 text-white font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3"
              >
                <Upload size={18} />
                Selecionar arquivo (.json ou .html)
              </motion.button>
            </motion.div>
          )}

          {status === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3 py-8 text-white/40">
              <Loader size={20} className="animate-spin" />
              <span className="text-sm font-bold">Processando arquivo...</span>
            </motion.div>
          )}

          {status === 'done' && result && (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20 text-center space-y-3"
            >
              <Check size={32} className="text-green-400 mx-auto" />
              <p className="text-white font-bold text-sm">Importação concluída!</p>
              <p className="text-white/40 text-xs">{result.bookmarks} favoritos importados com sucesso</p>
              <button onClick={reset} className="mt-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-bold transition-all">
                Importar mais
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-center space-y-3"
            >
              <AlertCircle size={32} className="text-red-400 mx-auto" />
              <p className="text-red-400 font-bold text-sm">{errorMsg}</p>
              <button onClick={reset} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-bold transition-all">
                Tentar novamente
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
