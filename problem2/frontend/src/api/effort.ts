import { request, idPath } from './client'
import type { HumanEffortView } from '../types'
export const getEffort = (id: string, signal?: AbortSignal) => request<HumanEffortView>(`/api/v1/packages/${idPath(id)}/effort`, { signal })
