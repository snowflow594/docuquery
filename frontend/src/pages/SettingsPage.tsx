import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { documentsApi, healthApi } from '../services/api'

type ReindexState = 'idle' | 'loading' | 'done' | 'error'

interface SystemEvent {
  time: string
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR'
  message: string
}

const levelColor: Record<string, string> = {
  INFO: 'text-[#006a61]',
  DEBUG: 'text-[#497cff]',
  WARN: 'text-[#b45309]',
  ERROR: 'text-[#ba1a1a]',
}

export default function SettingsPage() {
  const [docCount, setDocCount] = useState(0)
  const [autoIndex, setAutoIndex] = useState(true)
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [reindexState, setReindexState] = useState<ReindexState>('idle')
  const [reindexedCount, setReindexedCount] = useState(0)
  const [events, setEvents] = useState<SystemEvent[]>([
    { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'FastAPI server started successfully' },
    { time: new Date().toLocaleTimeString(), level: 'DEBUG', message: 'Query execution: 0.243s | Cosine similarity > 0.82' },
    { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'PostgreSQL connection pool synced. Active: 5 Idle: 3' },
  ])

  useEffect(() => {
    documentsApi.list().then(docs => setDocCount(docs.length)).catch(() => {})
    healthApi.check()
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('error'))
  }, [])

  const handleReindex = async () => {
    setReindexState('loading')
    try {
      const result = await documentsApi.reindex()
      setReindexedCount(result.reindexed)
      setReindexState('done')
    } catch {
      setReindexState('error')
    }
  }

  useEffect(() => {
    const id = setInterval(() => {
      setEvents(prev => [
        { time: new Date().toLocaleTimeString(), level: 'DEBUG', message: 'Cache heartbeat acknowledged. Health: 100%' },
        ...prev.slice(0, 5),
      ])
    }, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="ml-[280px] pt-16 min-h-screen bg-[#f8f9ff]">
      <TopBar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[36px] font-bold text-[#0b1c30]">System Performance</h2>
            <p className="text-[14px] text-[#45464d]">Diagnósticos en tiempo real y configuración.</p>
          </div>
          {apiStatus === 'checking' && (
            <span className="px-3 py-1 bg-[#e5eeff] text-[#45464d] text-[12px] font-mono rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#45464d] animate-pulse" />
              Checking...
            </span>
          )}
          {apiStatus === 'ok' && (
            <span className="px-3 py-1 bg-[#86f2e4] text-[#006f66] text-[12px] font-mono rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#006a61]" />
              API Operational
            </span>
          )}
          {apiStatus === 'error' && (
            <span className="px-3 py-1 bg-[#fde8e8] text-[#ba1a1a] text-[12px] font-mono rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
              API Unreachable
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Tech Stack */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: 'terminal', title: 'FastAPI', sub: 'Application Server', stat: 'Active', extra: 'Port 8000' },
              { icon: 'database', title: 'pgvector', sub: 'PostgreSQL DB', stat: `${docCount} docs`, extra: 'Docker :5433' },
              { icon: 'memory', title: 'Embedder', sub: 'Transformer Model', stat: 'all-MiniLM-L6-v2', extra: '384 dims' },
            ].map(c => (
              <div key={c.title} className="bg-white p-5 border border-[#c6c6cd] rounded-xl hover:shadow-md hover:border-black transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="material-symbols-outlined text-[#bec6e0]">{c.icon}</span>
                  <span className="text-[11px] font-mono text-[#45464d]">{c.extra}</span>
                </div>
                <h3 className="text-[20px] font-semibold text-[#0b1c30]">{c.title}</h3>
                <p className="text-[13px] text-[#45464d] mt-1">{c.sub}</p>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-[#006a61]">{c.stat}</p>
              </div>
            ))}
          </div>

          {/* Usage */}
          <div className="md:col-span-4 bg-white p-6 border border-[#c6c6cd] rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#45464d]">Documentos Indexados</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-[36px] font-bold">{docCount}</span>
                <span className="text-[13px] text-[#45464d]">docs</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="w-full bg-[#e5eeff] rounded-full h-2">
                <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${Math.min(docCount * 5, 100)}%` }} />
              </div>
              <p className="text-[11px] font-mono text-[#45464d]">Sistema activo y listo</p>
            </div>
          </div>

          {/* Events Log */}
          <div className="md:col-span-7 bg-white border border-[#c6c6cd] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#c6c6cd]">
              <h3 className="text-[20px] font-semibold">Recent System Events</h3>
            </div>
            <div className="p-4 space-y-1 font-mono text-[12px]">
              {events.map((ev, i) => (
                <div key={i} className="flex gap-4 items-start py-2 border-b border-dashed border-[#c6c6cd] last:border-0">
                  <span className="text-[#45464d] whitespace-nowrap">{ev.time}</span>
                  <span className={`font-bold ${levelColor[ev.level]}`}>[{ev.level}]</span>
                  <span className="flex-1 text-[#0b1c30]">{ev.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Config */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white p-6 border border-[#c6c6cd] rounded-xl space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#45464d]">Instance Configuration</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium">Automatic Indexing</p>
                  <p className="text-[13px] text-[#45464d]">Indexar al subir documentos</p>
                </div>
                <button
                  onClick={() => setAutoIndex(v => !v)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${autoIndex ? 'bg-[#006a61]' : 'bg-[#c6c6cd]'}`}
                >
                  <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoIndex ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium">Search Strictness</p>
                  <p className="text-[13px] text-[#45464d]">Threshold: 0.75</p>
                </div>
                <input type="range" className="accent-black w-24" defaultValue={75} />
              </div>
              <button
                onClick={handleReindex}
                disabled={reindexState === 'loading'}
                className="w-full py-2 border border-[#c6c6cd] text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#eff4ff] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reindexState === 'loading' && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                )}
                {reindexState === 'loading' ? 'Re-indexing...' : 'Re-index Database'}
              </button>
              {reindexState === 'done' && (
                <p className="text-[11px] text-[#006a61] font-mono text-center">
                  ✓ {reindexedCount} chunks re-indexados
                </p>
              )}
              {reindexState === 'error' && (
                <p className="text-[11px] text-[#ba1a1a] font-mono text-center">
                  Error al re-indexar. Intenta de nuevo.
                </p>
              )}
            </div>

            <div className="bg-black text-white p-6 rounded-xl relative overflow-hidden">
              <h3 className="text-[20px] font-semibold mb-2">DocuQuery RAG</h3>
              <p className="text-[13px] opacity-70 mb-4">Backend activo: FastAPI + pgvector + Claude.</p>
              <button className="px-6 py-2 bg-white text-black text-[11px] font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity">
                Ver Documentación
              </button>
              <div className="absolute -right-8 -bottom-8 opacity-10">
                <span className="material-symbols-outlined text-[120px]">rocket_launch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
