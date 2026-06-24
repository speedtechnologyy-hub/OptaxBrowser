import React, { useState, useRef, useMemo } from 'react'
import { Key, Upload, Check, AlertCircle, Loader, Eye, EyeOff, Trash2, Search, ChevronRight, X } from 'lucide-react'

interface Password {
  url: string
  username: string
  password: string
}

function parsePasswordsCsv(text: string): Password[] {
  const lines = text.split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const header = lines[0].toLowerCase()
  const cols = header.split(',')
  const urlIdx = cols.findIndex((h: string) => h.includes('url') || h.includes('origin'))
  const userIdx = cols.findIndex((h: string) => h.includes('username') || h.includes('user'))
  const passIdx = cols.findIndex((h: string) => h.includes('password'))
  if (urlIdx < 0 || userIdx < 0 || passIdx < 0) return []
  const results: Password[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g) || lines[i].split(',')
    if (parts.length > Math.max(urlIdx, userIdx, passIdx)) {
      results.push({
        url: parts[urlIdx]?.replace(/^"|"$/g, '').trim(),
        username: parts[userIdx]?.replace(/^"|"$/g, '').trim(),
        password: parts[passIdx]?.replace(/^"|"$/g, '').trim(),
      })
    }
  }
  return results.filter(p => p.url && p.username)
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function getFavicon(url: string) {
  try { const u = new URL(url); return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32` } catch { return '' }
}

const STORAGE_KEY = 'optax_passwords'

export const PasswordsPage: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [passwords, setPasswords] = useState<Password[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Password | null>(null)
  const [showPass, setShowPass] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const save = (data: Password[]) => {
    setPasswords(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    ;(window as any).electronAPI?.send('save-passwords', data)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('loading')
    try {
      const text = await file.text()
      const parsed = parsePasswordsCsv(text)
      if (parsed.length === 0) throw new Error('Nenhuma senha encontrada. Verifique o formato CSV.')
      const merged = [...passwords]
      parsed.forEach(p => {
        if (!merged.find(x => x.url === p.url && x.username === p.username)) merged.push(p)
      })
      save(merged)
      setStatus('done')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus('error')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  // Group by domain
  const grouped = useMemo(() => {
    const filtered = passwords.filter(p =>
      !search || getDomain(p.url).includes(search.toLowerCase()) || p.username.toLowerCase().includes(search.toLowerCase())
    )
    const map = new Map<string, Password[]>()
    filtered.forEach(p => {
      const d = getDomain(p.url)
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(p)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [passwords, search])

  if (selected) {
    return (
      <div className="absolute inset-0 flex flex-col bg-[#0d0d0f]">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <button onClick={() => { setSelected(null); setShowPass(false) }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <img src={getFavicon(selected.url)} className="w-5 h-5 rounded" onError={e => (e.currentTarget.style.display='none')} />
          <span className="text-white/80 font-semibold text-sm">{getDomain(selected.url)}</span>
        </div>
        <div className="flex-1 p-8 max-w-xl mx-auto w-full">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">Nome de usuário</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8">
                <span className="flex-1 text-sm text-white/80">{selected.username}</span>
                <button onClick={() => navigator.clipboard.writeText(selected.username)} className="text-white/20 hover:text-white/60 transition-colors text-[11px]">Copiar</button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">Senha</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8">
                <span className="flex-1 text-sm text-white/80 font-mono">{showPass ? selected.password : '••••••••••'}</span>
                <button onClick={() => setShowPass(p => !p)} className="text-white/20 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => navigator.clipboard.writeText(selected.password)} className="text-white/20 hover:text-white/60 transition-colors text-[11px]">Copiar</button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">Site</label>
              <div className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8">
                <span className="text-sm text-white/50">{selected.url}</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => { save(passwords.filter(p => !(p.url === selected.url && p.username === selected.username))); setSelected(null) }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[12px] font-bold transition-all"
              >
                <Trash2 size={13} /> Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[#0d0d0f]">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 shrink-0">
        <Key size={18} className="text-white/30" />
        <h1 className="text-sm font-bold text-white/70">Gerenciador de Senhas</h1>
        {onClose && (
          <button onClick={onClose} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search + import */}
      <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3 shrink-0">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/8">
          <Search size={13} className="text-white/30 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar senhas"
            className="flex-1 bg-transparent text-sm text-white/70 placeholder-white/20 outline-none"
          />
        </div>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        <button
          onClick={() => { setStatus('idle'); fileRef.current?.click() }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 text-[12px] font-bold text-white/50 hover:text-white transition-all shrink-0"
        >
          {status === 'loading' ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
          Importar CSV
        </button>
        {status === 'done' && <span className="text-green-400 text-[11px] flex items-center gap-1"><Check size={12} />Importado</span>}
        {status === 'error' && <span className="text-red-400 text-[11px] flex items-center gap-1"><AlertCircle size={12} />{errorMsg}</span>}
      </div>

      {/* Count */}
      {passwords.length > 0 && (
        <div className="px-6 py-2 shrink-0">
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{passwords.length} senhas salvas</span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {grouped.length === 0 && (
          <div className="text-center py-20 text-white/10">
            <Key size={40} strokeWidth={1} className="mx-auto mb-3" />
            <p className="text-[11px] font-bold uppercase tracking-widest">
              {search ? 'Nenhuma senha encontrada' : 'Nenhuma senha importada'}
            </p>
          </div>
        )}
        {grouped.map(([domain, creds]) => (
          <div key={domain}>
            {creds.map((cred, i) => (
              <button
                key={i}
                onClick={() => { setSelected(cred); setShowPass(false) }}
                className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.03] transition-all text-left border-b border-white/[0.03] group"
              >
                <img src={getFavicon(cred.url)} className="w-5 h-5 rounded shrink-0" onError={e => (e.currentTarget.style.display='none')} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white/70 font-medium truncate">{domain}{creds.length > 1 ? ` (${i + 1}/${creds.length})` : ''}</p>
                  <p className="text-[11px] text-white/30 truncate mt-0.5">{cred.username}</p>
                </div>
                <ChevronRight size={14} className="text-white/10 group-hover:text-white/30 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
