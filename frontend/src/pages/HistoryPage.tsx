import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { chatApi, type Conversation } from '../services/api'

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    chatApi.conversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = conversations.filter(c =>
    (c.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.messages ?? []).some(m => m.content.toLowerCase().includes(search.toLowerCase()))
  )

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const totalQueries = conversations.reduce((a, c) => a + (c.messages ?? []).filter(m => m.role === 'user').length, 0)
  const avgMsgs = conversations.length
    ? Math.round(conversations.reduce((a, c) => a + (c.messages ?? []).length, 0) / conversations.length)
    : 0

  return (
    <div className="ml-[280px] pt-16 min-h-screen bg-[#f8f9ff]">
      <TopBar />
      <div className="max-w-6xl mx-auto p-8 space-y-6">
        {/* Analytics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 border border-[#c6c6cd] rounded-xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#45464d] mb-2">Total Queries</p>
            <h3 className="text-[36px] font-bold text-black leading-none">{totalQueries}</h3>
          </div>
          <div className="bg-white p-6 border border-[#c6c6cd] rounded-xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#45464d] mb-2">Conversations</p>
            <h3 className="text-[36px] font-bold text-black leading-none">{conversations.length}</h3>
          </div>
          <div className="bg-white p-6 border border-[#c6c6cd] rounded-xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#45464d] mb-2">Avg. Messages</p>
            <h3 className="text-[36px] font-bold text-black leading-none">{avgMsgs}</h3>
            <div className="w-full bg-[#e5eeff] h-1.5 rounded-full mt-4">
              <div className="bg-[#006a61] h-full rounded-full" style={{ width: `${Math.min(avgMsgs * 10, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* History table */}
        <div className="bg-white border border-[#c6c6cd] rounded-xl shadow-sm">
          <div className="p-6 border-b border-[#c6c6cd] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-[20px] font-semibold text-[#0b1c30]">Query History</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#76777d] text-[18px]">search</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="border border-[#c6c6cd] rounded-lg pl-9 pr-4 py-2 text-[13px] w-64 focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="Search history..."
                />
              </div>
              <button className="flex items-center gap-2 border border-[#c6c6cd] rounded-lg px-4 py-2 text-[13px] hover:bg-[#eff4ff] transition-colors">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-[32px] animate-spin text-[#45464d]">progress_activity</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-[#45464d]">
                <span className="material-symbols-outlined text-[48px] opacity-30">history</span>
                <p className="text-[14px] mt-2 opacity-50">No hay historial de conversaciones aún.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#eff4ff] text-[11px] font-bold uppercase tracking-widest text-[#45464d] border-b border-[#c6c6cd]">
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Conversación</th>
                    <th className="px-6 py-4">Mensajes</th>
                    <th className="px-6 py-4">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]">
                  {filtered.map(conv => (
                    <tr key={conv.id} className="hover:bg-[#eff4ff] transition-colors cursor-pointer">
                      <td className="px-6 py-5 align-top whitespace-nowrap">
                        <div>
                          <p className="text-[13px] font-medium">{fmt(conv.created_at)}</p>
                          <p className="text-[12px] text-[#45464d] opacity-60">{fmtTime(conv.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top max-w-sm">
                        <p className="text-[13px] font-medium line-clamp-2">
                          {conv.title || (conv.messages ?? []).find(m => m.role === 'user')?.content || 'Sin título'}
                        </p>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className="text-[12px] font-mono text-[#45464d]">{(conv.messages ?? []).length}</span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <button className="text-black hover:underline text-[13px] font-semibold">Ver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-6 border-t border-[#c6c6cd] flex items-center justify-between">
            <span className="text-[13px] text-[#45464d]">
              Mostrando {filtered.length} de {conversations.length} conversaciones
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
