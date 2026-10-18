import { storage } from './storage'
const mode = import.meta.env.VITE_APP_MODE ?? 'connected'
if (mode !== 'connected' && mode !== 'standalone') throw new Error('VITE_APP_MODE must be connected or standalone')
export const config = {
  mode: (storage.get('offline-fallback') === true ? 'standalone' : mode) as 'connected' | 'standalone',
  apiBase: (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://metaboquest-problem1-backendxx.onrender.com' : '')).replace(/\/$/, ''),
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
  // Origin and path only: no query string or fragment is ever carried to Steer.
  const plain = (link: string) => { const url = new URL(link); return url.origin + (url.pathname === '/' ? '' : url.pathname) }
  return plain(target && new URL(target).origin === new URL(fallback).origin ? target : fallback)
}
