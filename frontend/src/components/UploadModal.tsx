import { useRef, useState } from 'react'
import { documentsApi } from '../services/api'

interface UploadModalProps {
  onClose: () => void
  onUploaded: () => void
}

export default function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [uploaded, setUploaded] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se aceptan archivos PDF.')
      return
    }
    setError('')
    setUploading(true)
    try {
      await documentsApi.upload(file, setProgress)
      setUploaded(true)
      onUploaded()
      setTimeout(onClose, 2500)
    } catch {
      setError('Error al subir el archivo. Intenta de nuevo.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#45464d] hover:text-black">
          <span className="material-symbols-outlined">close</span>
        </button>

        {uploaded ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-[#e6f4f1] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[#006a61] text-[36px]">check_circle</span>
            </div>
            <h3 className="text-[18px] font-semibold text-[#0b1c30]">¡Archivo recibido!</h3>
            <p className="text-[14px] text-[#45464d] mt-2">
              Tu documento se está indexando en segundo plano.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-[13px] text-[#497cff]">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              <span>Procesando...</span>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-[24px] font-bold text-[#0b1c30] mb-1">Upload PDF</h2>
            <p className="text-[14px] text-[#45464d] mb-6">
              El documento será procesado e indexado automáticamente.
            </p>

            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragOver ? 'border-black bg-[#eff4ff]' : 'border-[#c6c6cd] hover:border-black'
              }`}
            >
              <span className="material-symbols-outlined text-black text-[48px] mb-3">cloud_upload</span>
              <p className="text-[16px] font-semibold text-[#0b1c30]">Arrastra tu PDF aquí</p>
              <p className="text-[13px] text-[#45464d] mt-1">o haz clic para seleccionar</p>
              <p className="text-[11px] text-[#76777d] mt-3 uppercase tracking-widest">Máx. 5 MB</p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />

            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between text-[12px] text-[#45464d] mb-1">
                  <span>Subiendo...</span><span>{progress}%</span>
                </div>
                <div className="w-full bg-[#e5eeff] rounded-full h-2">
                  <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {error && <p className="mt-3 text-[13px] text-[#ba1a1a]">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
