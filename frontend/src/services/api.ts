import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export interface Document {
  id: string
  filename: string
  status: 'processing' | 'ready' | 'failed'
  total_chunks: number
  created_at: string
}

export interface Source {
  chunk_id: string
  document_id: string
  filename: string
  content: string
  chunk_index: number
  similarity: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  created_at?: string
}

export interface Conversation {
  id: string
  title: string | null
  created_at: string
  messages: ChatMessage[]
}

export interface ChatResponse {
  answer: string
  sources: Source[]
  conversation_id: string
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
  remove: (id: string) => api.delete(`/documents/${id}`),
  reindex: () => api.post<{ reindexed: number }>('/documents/reindex').then(r => r.data),
}

export const searchApi = {
  query: (q: string, topK = 5) =>
    api.post<{ query: string; results: Source[] }>('/search/', { query: q, top_k: topK }).then(r => r.data),
}

export const chatApi = {
  conversations: () => api.get<Conversation[]>('/chat/conversations').then(r => r.data),
  getConversation: (id: string) => api.get<Conversation>(`/chat/conversations/${id}`).then(r => r.data),
  send: (query: string, conversationId?: string, documentId?: string) =>
    api.post<ChatResponse>('/chat/', {
      query,
      conversation_id: conversationId ?? null,
      document_id: documentId ?? null,
    }).then(r => r.data),
}

export const healthApi = {
  check: () => api.get<{ status: string }>('/health').then(r => r.data),
}
