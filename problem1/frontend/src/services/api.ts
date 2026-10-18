import type { Session, Questions, Submission, Result, Challenge, PublicChallenge } from '../types'
import { config } from './config'
export class ApiError extends Error {
  status: number
  retryAt: number
  constructor(status = 0, retryAt = 0) { super('Request could not be completed'); this.name = 'ApiError'; this.status = status; this.retryAt = retryAt }
}
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'A little breather. Too many requests arrived at once. Please wait before trying again.'
    if (error.status === 422) return 'This session has expired or could not accept these answers. Start a fresh quiz when you’re ready.'
    if (error.status === 409) return 'This session has already been completed. Please start a fresh quiz.'
    if ([400, 404].includes(error.status)) return 'We couldn’t find an active session or result here. You can always start a fresh quiz.'
  }
  return 'We couldn’t reach the quiz service. Check your connection and try again. Your saved answers are still here.'
}
export async function request<T>(path: string, options: { body?: unknown; method?: 'GET' | 'POST'; signal?: AbortSignal } = {}): Promise<T> {
  const method = options.method ?? 'GET'
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController()
    const abort = () => controller.abort()
    if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
    options.signal?.addEventListener('abort', abort, { once: true })
    const timeout = setTimeout(abort, 12000)
    try {
      const response = await fetch(`${config.apiBase}${path}`, { method, signal: controller.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', headers: options.body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' }, body: options.body === undefined ? undefined : JSON.stringify(options.body) })
      if (!response.ok) {
        const retry = response.headers.get('Retry-After')
        const seconds = retry !== null ? Number(retry) : NaN
        const retryAt = retry ? (Number.isFinite(seconds) ? Date.now() + seconds * 1000 : Date.parse(retry)) : 0
        throw new ApiError(response.status, Number.isFinite(retryAt) ? retryAt : 0)
      }
      return await response.json() as T
    } catch (error) {
      if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
      const normalized = error instanceof ApiError ? error : new ApiError()
      if (method !== 'GET' || attempt >= 1 || (normalized.status !== 0 && normalized.status < 500)) throw normalized
    } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort) }
    await new Promise(resolve => setTimeout(resolve, 400))
  }
}
export const api = {
  start: () => request<Session>('/api/v1/quiz/sessions', { method: 'POST' }),
  questions: (id: string, signal?: AbortSignal) => request<Questions>(`/api/v1/quiz/questions?sessionId=${encodeURIComponent(id)}`, { signal }),
  submit: (body: Submission) => request<Result>('/api/v1/quiz/submit', { method: 'POST', body }),
  result: (id: string, token: string, signal?: AbortSignal) => request<Result>(`/api/v1/quiz/results/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, { signal }),
  createChallenge: (attemptId: string, resultToken: string) => request<Challenge>('/api/v1/challenges', { method: 'POST', body: { attemptId, resultToken } }),
  challenge: (code: string, signal?: AbortSignal) => request<PublicChallenge>(`/api/v1/challenges/${encodeURIComponent(code)}`, { signal }),
}
