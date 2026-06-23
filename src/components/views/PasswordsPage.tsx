import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Upload, Check, AlertCircle, Loader, Eye, EyeOff, Trash2 } from 'lucide-react'

interface Password {
  url: string
  username: string
  password: string
}

// Parses Chrome/Edge CSV password export
function parsePasswordsCsv(text: string): Password[] {
  const lines = text.split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const header = lines[0].toLowerCase()
  const urlIdx = header.split(',').findIndex((h: string) => h.includes('url') || h.includes('origin'))
  const userIdx = header.split(',').findIndex((h: string) => h.includes('username') || h.includes('user'))
  const passIdx = header.split(',').findIndex((h: string) => h.includes('password'))
  if (urlIdx < 0 || userIdx < 0 || passIdx < 0) return []
  const results: Password[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length > Math.max(urlIdx, userIdx, passIdx)) {
      results.push({
        url: cols[urlIdx]?.replace(/"/g, '').trim(),
        username: cols[userIdx]?.replace(/"/g, '').trim(),
        password: cols[passIdx]?.replace(/"/g, '').trim(),
      })
    }
  }
  return results.filter(p => p.url && p.username)
}

const STORAGE_KEY = 'optax_passwords'

export const PasswordsPage: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [passwords, setPasswords] = useState<Password[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPass, setShowPass] = useState<Record<number, boolean>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const save = (data: Password[]) => {
    setPasswords(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('loading')
    try {
      const text = await file.text()
      const parsed = parsePasswordsCsv(text)
      if (parsed.length === 0) throw new Error('Nenhuma senha encontrada. Verifique o formato do arquivo (CSV do Chrome/Edge).')
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

  const removePassword = (i: number) => {
    const next = passwords.filter((_, idx) => idx !== i)
    save(next)
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[#0d0d0f] overflow-y-auto custom-scrollbar p-12">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
            <Key size={20} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Gerenciador de Senhas</h1>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Importe e gerencie suas senhas localmente</p>
          </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white/50 hover:text-white transition-all">← Voltar</button>
        )}
        </div>

        {/* Import section */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 mb-6">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Importar do Chrome / Edge</p>
          <p className="text-[11px] text-white/30 mb-4 leading-relaxed">
            No Chrome: <span className="text-white/50">chrome://password-manager/passwords</span> → clique em ⚙ → Exportar senhas → salve o CSV.<br/>
            No Edge: <span className="text-white/50">edge://passwords</span> → ⋯ → Exportar senhas.
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          <button
            onClick={() => { setStatus('idle'); fileRef.current?.click() }}
            className="w-full py-3 rounded-xl border-2 border-dashed border-green-500/30 hover:border-green-500/60 bg-green-500/5 hover:bg-green-500/10 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            Selecionar arquivo CSV de senhas
          </button>
          <AnimatePresence>
            {status === 'loading' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-3 text-white/40 text-sm">
                <Loader size={16} className="animate-spin" /> Processando...
              </motion.div>
            )}
            {status === 'done' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-3 text-green-400 text-sm">
                <Check size={16} /> Senhas importadas com sucesso!
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-3 text-red-400 text-sm">
                <AlertCircle size={16} /> {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Password list */}
        {passwords.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">{passwords.length} senhas salvas (armazenadas localmente)</p>
            {passwords.map((p, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white/70 truncate">{p.url}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{p.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-white/30">
                        {showPass[i] ? p.password : '••••••••'}
                      </span>
                      <button onClick={() => setShowPass(prev => ({ ...prev, [i]: !prev[i] }))} className="text-white/20 hover:text-white/60 transition-colors">
                        {showPass[i] ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removePassword(i)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {passwords.length === 0 && status !== 'loading' && (
          <div className="text-center py-16 text-white/10">
            <Key size={48} strokeWidth={1} className="mx-auto mb-4" />
            <p className="text-[11px] font-bold uppercase tracking-widest">Nenhuma senha importada</p>
          </div>
        )}
      </div>
    </div>
  )
}
