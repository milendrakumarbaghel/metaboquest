import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from '../services/api'
import { config, safeUrl, steerDestination } from '../services/config'
import { track } from '../services/analytics'
import { storage } from '../services/storage'
import { copyLink, nativeShare } from '../services/sharing'
beforeEach(() => { config.mode = 'connected' })
describe('API safety', () => {
  it('retries transient reads once', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError()).mockResolvedValueOnce(new Response('{}'))
    vi.stubGlobal('fetch', fetch); await expect(request('/read')).resolves.toEqual({}); expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('never automatically retries writes', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError()); vi.stubGlobal('fetch', fetch)
    await expect(request('/write', { method: 'POST' })).rejects.toBeInstanceOf(ApiError); expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('normalizes rate limiting and preserves Retry-After', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429, headers: { 'Retry-After': '30' } })))
    const before = Date.now(); await request('/read').catch(e => { expect(e.status).toBe(429); expect(e.retryAt).toBeGreaterThanOrEqual(before + 30000) })
  })
  it('cancels requests from the caller without retries', async () => {
    const controller = new AbortController(); controller.abort(); const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    await expect(request('/read', { signal: controller.signal })).rejects.toHaveProperty('name', 'AbortError'); expect(fetch).not.toHaveBeenCalled()
  })
  it('only sends consented, allowlisted analytics', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}')); vi.stubGlobal('fetch', fetch)
    track('RESULT_SHARED', { channel: 'clipboard' }); expect(fetch).not.toHaveBeenCalled()
    storage.set('analytics-consent', true); track('RESULT_SHARED', { channel: 'clipboard', resultToken: 'must-not-send', health: 'must-not-send' })
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ eventType: 'RESULT_SHARED', consentGranted: true, metadata: { channel: 'clipboard' } })
  })
  it('blocks unsafe destinations and preserves exact trusted links', () => {
    expect(safeUrl('javascript:alert(1)')).toBeUndefined(); expect(safeUrl('https://user:password@example.com')).toBeUndefined()
    expect(steerDestination('https://steerclub.com/about')).toBe('https://steerclub.com/about')
    expect(steerDestination('https://steerclub.com.evil.test')).toBe('https://steerclub.com')
  })
})
describe('Sharing fallbacks', () => {
  it('uses native sharing when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined); vi.stubGlobal('navigator', { share })
    expect(await nativeShare({ url: 'https://example.com' })).toBe('shared'); expect(share).toHaveBeenCalledWith({ url: 'https://example.com' })
  })
  it('falls back to clipboard when native sharing is missing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined); vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect(await nativeShare({ url: 'https://example.com' })).toBe('copied'); expect(writeText).toHaveBeenCalledWith('https://example.com')
  })
  it('provides manual copying after permission denial', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    expect(await copyLink('https://example.com')).toBe(false); expect(await nativeShare({ url: 'https://example.com' })).toBe('manual')
  })
  it('does not copy automatically when a native share is cancelled', async () => {
    const writeText = vi.fn(); vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')), clipboard: { writeText } })
    expect(await nativeShare({ url: 'https://example.com' })).toBe('cancelled'); expect(writeText).not.toHaveBeenCalled()
  })
})
