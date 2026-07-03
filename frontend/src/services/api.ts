import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export interface Document {
  id: number
  filename: string
  status: 'processing' | 'ready' | 'failed'
  chunk_count: number
  created_at: string
  file_size?: number
}

export interface Source {
  document_id: number
  filename: string
  chunk_index: number
  similarity: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

export interface Conversation {
  id: number
  title: string
  created_at: string
  messages: ChatMessage[]
}

export interface ChatResponse {
  response: string
  sources: Source[]
  conversation_id: number
}

export const documentsApi = {
  list: () => api.get<Document[]>('/documents/').then(r => r.data),
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<Document>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    }).then(r => r.data)
  },
  remove: (id: number) => api.delete(`/documents/${id}`),
}

export const chatApi = {
  conversations: () => api.get<Conversation[]>('/chat/conversations').then(r => r.data),
  send: (message: string, conversationId?: number, documentIds?: number[]) =>
    api.post<ChatResponse>('/chat/', {
      message,
      conversation_id: conversationId,
      document_ids: documentIds,
    }).then(r => r.data),
}
