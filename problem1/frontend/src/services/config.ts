const mode = import.meta.env.VITE_APP_MODE ?? 'connected'
if (mode !== 'connected' && mode !== 'standalone') throw new Error('VITE_APP_MODE must be connected or standalone')
export const config = {
  mode: mode as 'connected' | 'standalone',
  apiBase: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
  steerUrl: import.meta.env.VITE_STEER_URL || 'https://steerclub.com',
}
export function safeUrl(value: string, allowLocal = false): string | undefined {
  try {
    const url = new URL(value)
    if (url.username || url.password) return undefined
    if (url.protocol === 'https:' || (allowLocal && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) return value
  } catch { /* Invalid destinations are never rendered as links. */ }
}
export function steerDestination(value?: string): string {
  const fallback = safeUrl(config.steerUrl) ?? 'https://steerclub.com'
  const target = value && safeUrl(value)
  return target && new URL(target).origin === new URL(fallback).origin ? target : fallback
}
