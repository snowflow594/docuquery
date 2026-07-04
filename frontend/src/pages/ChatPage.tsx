import { useEffect, useRef, useState } from 'react'
import TopBar from '../components/TopBar'
import { chatApi, type ChatMessage, type Source } from '../services/api'

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [previewSource, setPreviewSource] = useState<Source | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '56px'
    setLoading(true)
    try {
      const res = await chatApi.send(text, conversationId)
      setConversationId(res.conversation_id)
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer, sources: res.sources }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al procesar. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleSourceClick = (s: Source) => {
    setPreviewSource(prev => prev?.chunk_id === s.chunk_id ? null : s)
  }

  return (
    <div className="ml-[280px] pt-16 h-screen flex flex-col overflow-hidden">
      <TopBar />
      <main className="flex-1 flex overflow-hidden">
        <section className="flex-1 flex flex-col bg-[#f8f9ff] overflow-hidden border-r border-[#c6c6cd]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 && (
              <div data-tutorial="chat-empty-state" className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-[#dce9ff] rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-black text-[32px]">quick_reference_all</span>
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold text-[#0b1c30]">DocuQuery Technical Assistant</h2>
                  <p className="text-[14px] text-[#45464d] max-w-md mx-auto mt-1">
                    Haz preguntas sobre los documentos cargados o solicita extracción de datos.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] bg-[#131b2e] text-[#bec6e0] p-4 rounded-xl shadow-sm">
                    <p className="text-[14px]">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[85%] bg-white border border-[#c6c6cd] p-5 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-black">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                      <span className="text-[11px] font-bold uppercase tracking-widest">Assistant</span>
                    </div>
                    <p className="text-[14px] text-[#0b1c30] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#e5eeff]">
                        <span className="text-[10px] uppercase tracking-widest text-[#45464d] w-full">Fuentes</span>
                        {msg.sources.map((s: Source, si: number) => (
                          <button
                            key={si}
                            onClick={() => handleSourceClick(s)}
                            className={`flex items-center gap-1 px-3 py-1 border rounded-full transition-colors text-left ${
                              previewSource?.chunk_id === s.chunk_id
                                ? 'bg-[#131b2e] border-[#131b2e] text-white'
                                : 'bg-[#dce9ff] border-[#c6c6cd] hover:border-black'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                            <span className="text-[11px] font-mono">[{si + 1}] {s.filename}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#c6c6cd] p-4 rounded-xl shadow-sm flex items-center gap-2 text-[#45464d]">
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span className="text-[13px]">Procesando...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 bg-white border-t border-[#c6c6cd]">
            <div className="relative max-w-4xl mx-auto">
              <textarea
                data-tutorial="chat-input"
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); autoResize() }}
                onKeyDown={handleKeyDown}
                placeholder="Haz una pregunta sobre el documento..."
                rows={1}
                className="w-full pl-4 pr-14 py-4 bg-[#eff4ff] border border-[#c6c6cd] rounded-xl text-[14px] focus:ring-2 focus:ring-black focus:outline-none resize-none custom-scrollbar"
                style={{ minHeight: '56px', maxHeight: '200px' }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-2.5 rounded-lg disabled:opacity-40 transition-transform active:scale-90"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-[#45464d] uppercase tracking-widest">
              Powered by Claude · DocuQuery RAG
            </p>
          </div>
        </section>

        {/* Vista Previa panel */}
        <aside data-tutorial="preview-panel" className="w-[340px] bg-white flex-col shrink-0 hidden xl:flex border-l border-[#c6c6cd]">
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#c6c6cd]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-black">description</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">Vista Previa</span>
            </div>
            {previewSource && (
              <button onClick={() => setPreviewSource(null)} className="text-[#45464d] hover:text-black">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {previewSource ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-[#e5eeff] bg-[#f8f9ff]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[#497cff] text-[18px]">picture_as_pdf</span>
                  <span className="text-[13px] font-semibold text-[#0b1c30] truncate">{previewSource.filename}</span>
                </div>
                <div className="flex gap-3 mt-2">
                  <span className="text-[10px] font-mono bg-[#dce9ff] px-2 py-0.5 rounded text-[#45464d]">
                    chunk #{previewSource.chunk_index}
                  </span>
                  <span className="text-[10px] font-mono bg-[#e5eeff] px-2 py-0.5 rounded text-[#45464d]">
                    sim {(previewSource.similarity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-[#0b1c30] leading-relaxed whitespace-pre-wrap">{previewSource.content}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#f8f9ff]">
              <div className="text-center text-[#45464d]">
                <span className="material-symbols-outlined text-[48px] opacity-30">picture_as_pdf</span>
                <p className="text-[13px] mt-2 opacity-50">Haz click en una fuente<br />para ver el fragmento</p>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
