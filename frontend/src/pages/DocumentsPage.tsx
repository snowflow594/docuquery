import { useCallback, useEffect, useRef, useState } from 'react'
import TopBar from '../components/TopBar'
import { type Document, documentsApi } from '../services/api'

const statusConfig = {
  ready: { label: 'Ready', dot: 'bg-[#006a61]', text: 'text-[#006a61]', pulse: false },
  processing: { label: 'Processing', dot: 'bg-[#497cff]', text: 'text-[#497cff]', pulse: true },
  failed: { label: 'Failed', dot: 'bg-[#ba1a1a]', text: 'text-[#ba1a1a]', pulse: false },
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadDocs = useCallback(async () => {
    try {
      const data = await documentsApi.list()
      setDocs(data)
    } catch { /* no-op */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadDocs() }, [loadDocs])

  useEffect(() => {
    if (docs.some(d => d.status === 'processing')) {
      const id = setInterval(loadDocs, 4000)
      return () => clearInterval(id)
    }
  }, [docs, loadDocs])

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) return
    setUploading(true)
    try {
      await documentsApi.upload(file, setUploadProgress)
      await loadDocs()
    } finally { setUploading(false); setUploadProgress(0) }
  }

  const handleDelete = async (id: string) => {
    await documentsApi.remove(id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="ml-[280px] pt-16 min-h-screen bg-[#f8f9ff]">
      <TopBar />
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[24px] font-bold text-[#0b1c30]">Document Management</h2>
            <p className="text-[14px] text-[#45464d]">Sube, indexa y gestiona tu corpus de documentos.</p>
          </div>
          <div className="bg-white px-4 py-2 border border-[#c6c6cd] rounded-lg flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-widest text-[#45464d]">Documentos</span>
            <span className="text-[14px] font-bold">{docs.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Upload + Config */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => inputRef.current?.click()}
              className={`bg-white border-2 border-dashed rounded-xl p-8 flex flex-col items-center text-center cursor-pointer transition-all ${
                isDragOver ? 'border-black bg-[#eff4ff]' : 'border-[#c6c6cd] hover:border-black'
              }`}
            >
              <div className="w-16 h-16 bg-[#e5eeff] rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-black text-[28px]">cloud_upload</span>
              </div>
              <h4 className="text-[16px] font-semibold text-[#0b1c30] mb-1">Drag &amp; drop PDF corpus</h4>
              <p className="text-[13px] text-[#45464d] max-w-[200px]">Hasta 50 MB por archivo</p>
              <span className="mt-4 text-[#497cff] text-[13px] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">attachment</span>
                Browse local filesystem
              </span>
            </div>

            <input ref={inputRef} type="file" accept=".pdf" className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />

            {uploading && (
              <div className="bg-white border border-[#c6c6cd] rounded-xl p-4">
                <div className="flex justify-between text-[12px] text-[#45464d] mb-2">
                  <span>Subiendo...</span><span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#e5eeff] rounded-full h-2">
                  <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="bg-white border border-[#c6c6cd] rounded-xl p-6 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#0b1c30]">Indexing Strategy</h4>
              <div>
                <label className="block text-[13px] text-[#45464d] mb-2">Chunk Size (chars)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min={200} max={2000} defaultValue={800} className="flex-1 accent-black" />
                  <span className="text-[12px] font-mono bg-[#e5eeff] px-2 py-1 border border-[#c6c6cd] rounded">800</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-[#45464d] mb-2">Chunk Overlap</label>
                <div className="flex items-center gap-4">
                  <input type="range" min={0} max={500} defaultValue={150} className="flex-1 accent-black" />
                  <span className="text-[12px] font-mono bg-[#e5eeff] px-2 py-1 border border-[#c6c6cd] rounded">150</span>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-[#c6c6cd]">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-[13px] font-medium">Enable OCR for scanned PDFs</span>
              </label>
              <button className="w-full py-2 border border-black text-black text-[11px] font-bold uppercase tracking-widest hover:bg-[#eff4ff] transition-colors rounded-lg">
                Apply Parameters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-[#c6c6cd] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#c6c6cd]">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#0b1c30]">Recently Uploaded Documents</h4>
            </div>
            {loading ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-[32px] animate-spin text-[#45464d]">progress_activity</span>
              </div>
            ) : docs.length === 0 ? (
              <div className="p-12 text-center text-[#45464d]">
                <span className="material-symbols-outlined text-[48px] opacity-30">description</span>
                <p className="text-[14px] mt-2 opacity-50">No hay documentos. Sube un PDF para comenzar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#eff4ff] border-b border-[#c6c6cd]">
                      {['Documento', 'Estado', 'Chunks', 'Fecha', 'Acc.'].map(h => (
                        <th key={h} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#45464d]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c6c6cd]">
                    {docs.map(doc => {
                      const s = statusConfig[doc.status] ?? statusConfig.failed
                      return (
                        <tr key={doc.id} className="hover:bg-[#eff4ff] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-[#497cff]">picture_as_pdf</span>
                              <span className="text-[14px] font-semibold truncate max-w-[180px]">{doc.filename}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`flex items-center gap-2 ${s.text}`}>
                              <span className={`w-2 h-2 rounded-full ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
                              <span className="text-[11px] font-mono uppercase">{s.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[12px] font-mono text-[#45464d]">{doc.total_chunks}</td>
                          <td className="px-6 py-4 text-[13px] text-[#45464d]">{fmt(doc.created_at)}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => handleDelete(doc.id)}
                              className="material-symbols-outlined text-[#76777d] hover:text-[#ba1a1a] transition-colors text-[20px]">
                              delete
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-6 py-3 border-t border-[#c6c6cd] bg-[#eff4ff]">
              <span className="text-[13px] text-[#45464d]">Total: {docs.length} documento{docs.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
