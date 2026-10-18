export const demo = new URLSearchParams(window.location.search).get('demo') === 'true'
const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://metaboquest-problem2-backend.onrender.com' : '')).replace(/\/$/, '')
const keys: Record<'pipeline' | 'review', string> = {
  pipeline: (import.meta.env.VITE_PIPELINE_API_KEY || 'demo-pipeline-key').trim(),
  review: (import.meta.env.VITE_REVIEW_API_KEY || 'demo-review-key').trim()
}
export class ApiError extends Error {
  status: number
  constructor(message: string, status = 0) { super(message); this.name = 'ApiError'; this.status = status }
}
export function message(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.' }
export function apiUrl(path: string) { return `${base}${path}` }
export function safeLink(value: string | undefined): string | undefined {
  if (!value) return undefined
  try { const url = new URL(value, `${base || window.location.origin}/`); if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href } catch { /* Invalid links stay noninteractive. */ }
}
export async function request<T>(path: string, options: RequestInit = {}, auth: 'pipeline' | 'review' | 'none' = 'pipeline'): Promise<T> {
  if (demo) return (await import('../mockData')).demoRequest<T>(path, options)
  const apiKey = auth !== 'none' ? (keys[auth] || (auth === 'review' ? 'demo-review-key' : 'demo-pipeline-key')) : ''
  if (auth !== 'none' && !apiKey) throw new ApiError(`Configure VITE_${auth.toUpperCase()}_API_KEY in .env.local and restart Vite.`, 401)
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
  options.signal?.addEventListener('abort', abort, { once: true })
  const timeout = window.setTimeout(abort, 120000)
  try {
    const headers = new Headers(options.headers)
    if (auth !== 'none') headers.set('X-API-Key', apiKey)
    headers.set('Accept', 'application/json')
    const response = await fetch(apiUrl(path), { ...options, headers, signal: controller.signal, credentials: 'omit' })
    window.dispatchEvent(new CustomEvent('studio-connectivity', { detail: true }))
    if (!response.ok) {
      let detail = ''
      try {
        const body: unknown = await response.json()
        if (body && typeof body === 'object') {
          const problem = body as Record<string, unknown>
          const explanation = typeof problem.message === 'string' ? problem.message : problem.error
          if (typeof explanation === 'string') detail = explanation.slice(0, 500)
        }
      } catch { /* Do not expose raw HTML or stack traces. */ }
      throw new ApiError(detail || (response.status === 401 || response.status === 403 ? 'Access denied. Check the configured API key for this action.' : `The service returned ${response.status}. Please retry or check the backend configuration.`), response.status)
    }
    if (response.status === 204) return undefined as T
    return await response.json() as T
  } catch (error) {
    if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
    if (error instanceof ApiError) throw error
    if (controller.signal.aborted) throw new ApiError('The request timed out. Check the server before repeating this operation.')
    window.dispatchEvent(new CustomEvent('studio-connectivity', { detail: false }))
    throw new ApiError('Unable to reach the backend. Check that the service is running and retry.')
  } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort) }
}
export const json = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const idPath = (id: string) => encodeURIComponent(id)
