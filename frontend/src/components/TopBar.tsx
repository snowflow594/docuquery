import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { searchApi, type Source } from '../services/api'

export default function TopBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Source[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [expanded, setExpanded] = useState<Source | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
        setExpanded(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q || q.length < 3 || searching) return
    setSearching(true)
    setExpanded(null)
    try {
      const data = await searchApi.query(q)
      setResults(data.results)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
      setShowResults(true)
    }
  }

  return (
    <header className="fixed top-0 right-0 left-[280px] h-16 bg-white flex justify-between items-center px-4 border-b border-[#c6c6cd] z-40">
      <div className="flex items-center gap-8">
        <span className="text-[20px] font-bold text-[#0b1c30]">DocuQuery Professional</span>
        <nav className="hidden lg:flex items-center gap-6">
          {[
            { label: 'Dashboard', to: '/', end: true },
            { label: 'Workspaces', to: '/documents', end: false },
            { label: 'Analytic Logs', to: '/history', end: false },
          ].map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `text-[11px] font-bold uppercase tracking-widest pb-1 transition-colors ${
                  isActive ? 'text-black border-b-2 border-black' : 'text-[#45464d] hover:text-black'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Semantic search */}
        <div ref={containerRef} className="relative hidden sm:block">
          <form onSubmit={handleSearch}>
            <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] text-[20px] ${searching ? 'animate-spin' : ''}`}>
              {searching ? 'progress_activity' : 'search'}
            </span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              className="pl-10 pr-4 py-1.5 bg-[#eff4ff] border border-[#c6c6cd] rounded-full text-[13px] w-64 focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Buscar en documentos..."
              type="text"
            />
          </form>

          {showResults && (
            <div className="absolute top-full right-0 mt-2 w-[480px] bg-white border border-[#c6c6cd] rounded-xl shadow-xl z-50 overflow-hidden">
              {results.length === 0 ? (
                <div className="p-6 text-center text-[#45464d]">
                  <span className="material-symbols-outlined text-[32px] opacity-30">search_off</span>
                  <p className="text-[13px] mt-2 opacity-60">Sin resultados para "{query}"</p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-[#e5eeff] flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#45464d]">
                      {results.length} resultado{results.length !== 1 ? 's' : ''} — "{query}"
                    </span>
                    <button onClick={() => { setShowResults(false); setExpanded(null) }} className="text-[#45464d] hover:text-black">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto custom-scrollbar divide-y divide-[#e5eeff]">
                    {results.map((r) => (
                      <div key={r.chunk_id}>
                        <button
                          onClick={() => setExpanded(expanded?.chunk_id === r.chunk_id ? null : r)}
                          className="w-full text-left px-4 py-3 hover:bg-[#f8f9ff] transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-[#497cff] text-[16px] shrink-0">picture_as_pdf</span>
                              <span className="text-[13px] font-semibold text-[#0b1c30] truncate">{r.filename}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-[10px] font-mono bg-[#e5eeff] px-2 py-0.5 rounded text-[#45464d]">
                                chunk #{r.chunk_index}
                              </span>
                              <span className="text-[10px] font-mono bg-[#dce9ff] px-2 py-0.5 rounded text-[#497cff] font-bold">
                                {(r.similarity * 100).toFixed(0)}%
                              </span>
                              <span className="material-symbols-outlined text-[16px] text-[#45464d]">
                                {expanded?.chunk_id === r.chunk_id ? 'expand_less' : 'expand_more'}
                              </span>
                            </div>
                          </div>
                          <p className="text-[12px] text-[#45464d] line-clamp-2 text-left">{r.content}</p>
                        </button>

                        {expanded?.chunk_id === r.chunk_id && (
                          <div className="px-4 pb-4 bg-[#f8f9ff] border-t border-[#e5eeff]">
                            <p className="text-[12px] text-[#0b1c30] leading-relaxed whitespace-pre-wrap mt-3">{r.content}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <NavLink
          to="/"
          className="bg-black text-white px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest"
        >
          New Query
        </NavLink>
      </div>
    </header>
  )
}
