import { request, json, idPath, apiUrl } from './client'
import type { BatchView, GenerateInput, PackageView } from '../types'
export const packagesApi = {
  list: (paperId?: string, signal?: AbortSignal) => request<PackageView[]>(`/api/v1/packages${paperId ? `?paperId=${idPath(paperId)}` : ''}`, { signal }),
  generate: (id: string, input: GenerateInput) => request<PackageView>(`/api/v1/papers/${idPath(id)}/generate`, json({ ...input, language: 'en' })),
  get: (id: string, signal?: AbortSignal) => request<PackageView>(`/api/v1/packages/${idPath(id)}`, { signal }),
  batch: (paperIds: string[], input: GenerateInput) => request<BatchView>('/api/v1/batches', json({ paperIds, ...input, language: 'en' })),
  getBatch: (id: string, signal?: AbortSignal) => request<BatchView>(`/api/v1/batches/${idPath(id)}`, { signal }),
  canva: (id: string) => request<unknown>(`/api/v1/packages/${idPath(id)}/export/canva`, {}, 'none'),
}
export const mediaUrl = (id: string, suffix: string) => apiUrl(`/api/v1/packages/${idPath(id)}/${suffix}`)
