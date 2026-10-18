import { config } from './config'
import { request } from './api'
import { storage } from './storage'
const keys = { GAME_STARTED: ['source', 'platform'], QUESTION_ANSWERED: ['questionId', 'responseTimeMs'], GAME_COMPLETED: ['durationMs'], RESULT_SHARED: ['channel'], FRIEND_CHALLENGE_CREATED: [], FRIEND_CHALLENGE_OPENED: ['challengeCode'], CTA_CLICKED: ['destination', 'ctaContext'], TOPIC_SELECTED: ['topic'] } as const
export type EventType = keyof typeof keys
export function track(eventType: EventType, metadata: Record<string, string | number | boolean> = {}, sessionId?: string) {
  if (config.mode !== 'connected' || storage.get('analytics-consent') !== true) return
  const allowed: readonly string[] = keys[eventType]
  const clean = Object.fromEntries(Object.entries(metadata).filter(([key, value]) => allowed.includes(key) && (typeof value !== 'string' || value.length <= 100)))
  void request('/api/v1/analytics/events', { method: 'POST', body: { eventType, metadata: clean, consentGranted: true, ...(sessionId ? { sessionId } : {}) } }).catch(() => { /* Analytics never interrupts play. */ })
}
