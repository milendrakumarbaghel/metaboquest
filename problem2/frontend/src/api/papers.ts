import { request, json, idPath } from './client'
import type { PaperView } from '../types'
export const papersApi = {
  upload: (file: File, title?: string) => { const body = new FormData(); body.append('file', file); if (title?.trim()) body.append('title', title.trim()); return request<PaperView>('/api/v1/papers/upload', { method: 'POST', body }) },
  fromUrl: (url: string, title?: string) => request<PaperView>('/api/v1/papers/from-url', json({ url, ...(title?.trim() ? { title: title.trim() } : {}) })),
  get: (id: string, signal?: AbortSignal) => request<PaperView>(`/api/v1/papers/${idPath(id)}`, { signal }),
}
