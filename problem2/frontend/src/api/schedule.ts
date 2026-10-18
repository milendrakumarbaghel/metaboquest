import { request, json, idPath } from './client'
import type { ScheduleInput, ScheduledPostView } from '../types'
export const scheduleApi = {
  get: (id: string, signal?: AbortSignal) => request<ScheduledPostView | undefined>(`/api/v1/packages/${idPath(id)}/schedule`, { signal }),
  save: (id: string, input: ScheduleInput) => request<ScheduledPostView>(`/api/v1/packages/${idPath(id)}/schedule`, json(input)),
  publish: (id: string) => request<ScheduledPostView>(`/api/v1/packages/${idPath(id)}/publish`, { method: 'POST' }),
}
