import type { Outcome, QuizDraft, Result, ReviewContext, PublicChallenge, Challenge } from '../types'
import { api, ApiError } from './api'
import { config } from './config'
import { storage, tokenKey } from './storage'
import { track } from './analytics'
const results = new Map<string, Outcome>()
let starting: Promise<QuizDraft> | undefined
export function saveDraft(draft: QuizDraft) { storage.set('draft', draft) }
export function resetQuiz(challenge?: PublicChallenge) {
  storage.remove('draft'); storage.remove('starting-session')
  if (challenge) storage.set('invitation', challenge); else storage.remove('invitation')
}
export function startQuiz(): Promise<QuizDraft> {
  const saved = storage.get<QuizDraft>('draft')
  if (saved?.mode === config.mode && saved.questions?.length) return Promise.resolve(saved)
  if (starting) return starting
  starting = (async () => {
    let sessionId: string
    let questions: QuizDraft['questions']
    if (config.mode === 'standalone') {
      sessionId = `local-${crypto.randomUUID()}`
      questions = (await import('../data/approved')).questions
    } else {
      sessionId = storage.get<string>('starting-session') ?? (await api.start()).sessionId
      storage.set('starting-session', sessionId)
      const response = await api.questions(sessionId)
      if (!response.questions?.length || response.totalQuestions !== response.questions.length || response.questions.some(q => q.options.length < 2)) throw new ApiError(503)
      questions = response.questions
    }
    const draft: QuizDraft = { mode: config.mode, sessionId, questions, answers: {}, index: 0, startedAt: Date.now(), challenge: storage.get<PublicChallenge>('invitation') }
    saveDraft(draft)
    track('GAME_STARTED', { source: draft.challenge ? 'challenge' : 'landing', platform: 'web' }, sessionId)
    return draft
  })().finally(() => { starting = undefined })
  return starting
}
export function retainResult(result: Result): Outcome {
  const { resultToken, ...data } = result
  if (resultToken) storage.set(tokenKey(data.attemptId), resultToken)
  const outcome: Outcome = { kind: 'connected', data }
  results.set(data.attemptId, outcome)
  return outcome
}
export async function completeQuiz(draft: QuizDraft): Promise<Outcome> {
  const outcome = config.mode === 'standalone' ? (await import('../data/approved')).scoreLocal(draft.answers) : retainResult(await api.submit(draft.pending!))
  const context: ReviewContext = { questions: draft.questions, answers: draft.answers, challenge: draft.challenge }
  storage.set(`review:${outcome.data.attemptId}`, context)
  if (outcome.kind === 'local') storage.set(`local-result:${outcome.data.attemptId}`, outcome)
  results.set(outcome.data.attemptId, outcome)
  storage.set('next-step', outcome.data.nextStep)
  track('GAME_COMPLETED', { durationMs: Date.now() - draft.startedAt }, draft.sessionId)
  resetQuiz()
  return outcome
}
export async function loadResult(id: string, signal?: AbortSignal): Promise<Outcome | undefined> {
  if (results.has(id)) return results.get(id)
  if (config.mode === 'standalone') return storage.get<Outcome>(`local-result:${id}`)
  const token = storage.get<string>(tokenKey(id))
  if (!token) return undefined
  return retainResult(await api.result(id, token, signal))
}
const creating = new Map<string, Promise<Challenge>>()
export function getOrCreateChallenge(id: string): Promise<Challenge> {
  const cached = storage.get<Challenge>(`challenge:${id}`)
  if (cached && Date.parse(cached.expiresAt) > Date.now()) return Promise.resolve(cached)
  const pending = creating.get(id)
  if (pending) return pending
  const token = storage.get<string>(tokenKey(id))
  if (!token) return Promise.reject(new ApiError(404))
  const task = api.createChallenge(id, token).then(challenge => { storage.set(`challenge:${id}`, challenge); track('FRIEND_CHALLENGE_CREATED'); return challenge }).finally(() => creating.delete(id))
  creating.set(id, task)
  return task
}
