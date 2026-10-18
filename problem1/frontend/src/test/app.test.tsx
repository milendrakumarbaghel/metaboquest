import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { questionResponse, session, result, challenge, publicChallenge } from './fixtures'
import { config } from '../services/config'
import { storage, tokenKey } from '../services/storage'
import type { Result, Submission } from '../types'
let fetchMock: ReturnType<typeof vi.fn>
function response(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }) }
function mount(path = '/') { window.history.replaceState({}, '', path); return render(<StrictMode><App /></StrictMode>) }
beforeEach(() => {
  config.mode = 'connected'
  fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith('/sessions')) return response(session, 201)
    if (url.includes('/questions?')) return response(questionResponse)
    if (url.endsWith('/submit')) return response(result)
    if (url.includes('/results/')) return response(result)
    if (url.endsWith('/challenges')) return response(challenge, 201)
    if (url.includes('/challenges/')) return response(publicChallenge)
    return response({ accepted: true }, 201)
  })
  vi.stubGlobal('fetch', fetchMock)
})
async function answerQuiz(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < 3; i++) {
    await screen.findByRole('heading', { name: questionResponse.questions[i].questionText })
    const radios = screen.getAllByRole('radio')
    await user.click(radios[1])
    await user.click(screen.getByRole('button', { name: /Check answer/ }))
    await screen.findByRole('heading', { name: /Spot on|Good to know/ })
    if (i < 2) await user.click(screen.getByRole('button', { name: /Next question/ }))
  }
}
describe('Connected experience', () => {
  it('sends only the selected educational topic when starting a new quiz', async () => {
    const user = userEvent.setup(); mount()
    await user.click(screen.getByRole('link', { name: /Bust the myths/ }))
    await user.click(await screen.findByRole('button', { name: /What about side effects\?/ }))
    await screen.findByRole('heading', { name: questionResponse.questions[0].questionText })
    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/sessions')) as unknown as [string, RequestInit]
    expect(JSON.parse(call[1].body as string)).toEqual({ topic: 'SIDE_EFFECTS' })
    expect(storage.get('learning-topic')).toBe('SIDE_EFFECTS')
  })

  it('includes the concern in a doctor checklist only with explicit selection', async () => {
    const user = userEvent.setup(); storage.set('completed-topic', 'MUSCLE'); mount('/explore')
    const text = await screen.findByRole('textbox', { name: 'Doctor conversation checklist' })
    const checkbox = screen.getByRole('checkbox', { name: /Include my chosen topic/ })
    expect(checkbox).not.toBeChecked()
    expect((text as HTMLTextAreaElement).value).not.toContain('body-composition')
    await user.click(checkbox)
    expect((text as HTMLTextAreaElement).value).toContain('body-composition')
    await user.click(checkbox)
    expect((text as HTMLTextAreaElement).value).not.toContain('body-composition')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('starts from the landing CTA, submits exactly once, keeps tokens private and renders backend review', async () => {
    const user = userEvent.setup(); mount()
    expect(screen.getByRole('heading', { name: 'GLP-1: how much is fact, and how much is fear?' })).toBeVisible()
    await user.click(screen.getByRole('link', { name: /Bust the myths/ }))
    await user.click(await screen.findByRole('link', { name: /Skip, surprise me/ }))
    await answerQuiz(user)
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '3')
    expect(screen.queryByText(result.feedback[0].explanation)).not.toBeInTheDocument()
    await user.dblClick(screen.getByRole('button', { name: /See my results/ }))
    await screen.findByRole('heading', { name: result.profile.title })
    const writes = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/submit'))
    expect(writes).toHaveLength(1)
    const payload = JSON.parse((writes[0] as unknown as [string, RequestInit])[1].body as string) as Submission
    expect(payload).toEqual({ sessionId: session.sessionId, answers: questionResponse.questions.map(q => ({ questionId: q.id, selectedOptionId: q.options[1].id })) })
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/sessions'))).toHaveLength(1)
    expect(storage.get(tokenKey(result.attemptId))).toBe(result.resultToken)
    expect(window.location.href).not.toContain(result.resultToken)
    expect(document.body.innerHTML).not.toContain(result.resultToken)
    expect(screen.getByText(result.disclaimer)).toBeVisible()
    fireEvent.click(screen.getByText(questionResponse.questions[0].questionText))
    expect(within(screen.getByRole('region', { name: 'What to remember' })).getByText(result.feedback[0].explanation)).toBeVisible()
    expect(screen.getByRole('link', { name: /Prescription Medications/ })).toHaveAttribute('href', result.feedback[0].sources[0].url)
    await user.click(screen.getByRole('button', { name: /Challenge a friend/ }))
    const link = await screen.findByRole('textbox', { name: /Public challenge link/ })
    expect(link).toHaveValue(challenge.challengeUrl)
    expect(document.body.innerHTML).not.toContain(result.resultToken)
    const challengeWrite = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/challenges')) as unknown as [string, RequestInit]
    expect(JSON.parse(challengeWrite[1].body as string)).toEqual({ attemptId: result.attemptId, resultToken: result.resultToken })
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/analytics/'))).toHaveLength(0)
  })
  it('supports keyboard radio selection and preserves answers when navigating back', async () => {
    const user = userEvent.setup(); mount('/play')
    const radios = await screen.findAllByRole('radio')
    act(() => radios[0].focus()); await user.keyboard('[ArrowDown]')
    expect(radios[1]).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Check answer/ }))
    await user.click(screen.getByRole('button', { name: /Next question/ }))
    await user.click(screen.getByRole('button', { name: /Previous/ }))
    expect(screen.getAllByRole('radio')[1]).toBeChecked()
  })
  it('freezes answers after an uncertain submission and retries the identical payload', async () => {
    let submits = 0
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/sessions')) return response(session)
      if (url.includes('/questions?')) return response(questionResponse)
      if (url.endsWith('/submit')) { if (++submits === 1) throw new TypeError('network'); return response({ ...result, attemptId: 'retry-result' }) }
      return response({})
    })
    const user = userEvent.setup(); mount('/play'); await answerQuiz(user)
    await user.click(screen.getByRole('button', { name: /See my results/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('saved answers')
    expect(screen.getAllByRole('radio')[0]).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByRole('heading', { name: result.profile.title })
    const writes = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/submit')) as unknown as [string, RequestInit][]
    expect(writes).toHaveLength(2); expect(writes[0][1].body).toBe(writes[1][1].body)
  })
  it('shows a helpful connected error without silently starting a local quiz', async () => {
    fetchMock.mockRejectedValue(new TypeError('network')); mount('/play')
    expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t reach')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('recovers after a lost response and refresh using the frozen saved draft', async () => {
    const draft = { mode: 'connected', sessionId: session.sessionId, questions: questionResponse.questions, answers: Object.fromEntries(questionResponse.questions.map(q => [q.id, q.options[1].id])), index: 2, startedAt: Date.now(), pending: { sessionId: session.sessionId, answers: questionResponse.questions.map(q => ({ questionId: q.id, selectedOptionId: q.options[1].id })) } }
    storage.set('draft', draft); mount('/play')
    expect((await screen.findAllByRole('radio'))[0]).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /See my results/ }))
    await screen.findByRole('heading', { name: result.profile.title })
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/sessions'))).toBe(false)
  })
  it.each(['CURIOUS_EXPLORER', 'SMART_STRATEGIST', 'MYTH_BUSTER'] as const)('renders backend profile %s without calculating score bands', async code => {
    const id = `profile-${code}`
    storage.set(tokenKey(id), 'private-test-capability')
    const custom: Result = { ...result, attemptId: id, score: 17, profile: { code, title: `Backend title ${code}`, description: 'Backend-owned description.' } }
    fetchMock.mockImplementation(async () => response(custom)); mount(`/results/${id}`)
    expect(await screen.findByRole('heading', { name: custom.profile.title })).toBeVisible()
    expect(screen.getByText(custom.profile.description)).toBeVisible()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('?token=private-test-capability'))).toBe(true)
    expect(window.location.search).toBe('')
  })
  it('does not fetch private results without the capability', async () => {
    mount('/results/missing-capability')
    expect(await screen.findByRole('heading', { name: /belongs to its browser tab/ })).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('loads a public invitation and starts a new quiz with public context', async () => {
    const user = userEvent.setup(); mount(`/challenge/${challenge.challengeCode}`)
    expect(await screen.findByRole('heading', { name: /You’ve been challenged/ })).toBeVisible()
    expect(screen.getByText(publicChallenge.message)).toBeVisible()
    await user.click(screen.getByRole('link', { name: /Accept challenge/ }))
    await screen.findAllByRole('radio')
    expect(storage.get('invitation')).toEqual(publicChallenge)
  })
  it('handles expired challenges', async () => {
    fetchMock.mockResolvedValue(response({}, 404)); mount(`/challenge/${challenge.challengeCode}`)
    expect(await screen.findByRole('heading', { name: /had its moment/ })).toBeVisible()
  })
  it('rejects malformed challenge codes without a request', async () => {
    mount('/challenge/invalid'); expect(await screen.findByRole('heading', { name: /had its moment/ })).toBeVisible(); expect(fetchMock).not.toHaveBeenCalled()
  })
  it('hands off to the configured trusted destination', async () => {
    storage.set('next-step', { ctaText: 'Explore Steer', ctaUrl: 'https://untrusted.example/steer' }); mount('/explore')
    expect(await screen.findByRole('link', { name: /See if the programme fits you/ })).toHaveAttribute('href', 'https://steerclub.com')
    expect(screen.getByRole('link', { name: /See if the programme fits you/ })).toHaveAttribute('rel', 'noopener noreferrer')
  })
  it('requires explicit analytics consent in the accessible privacy dialog', async () => {
    const user = userEvent.setup(); mount(); await user.click(screen.getByRole('button', { name: /Privacy/ }))
    const dialog = screen.getByRole('dialog'); const toggle = within(dialog).getByRole('checkbox')
    expect(toggle).not.toBeChecked(); await user.click(toggle); expect(storage.get('analytics-consent')).toBe(true)
    await user.click(within(dialog).getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('link', { name: /Bust the myths/ })); await user.click(await screen.findByRole('link', { name: /Skip, surprise me/ })); await screen.findAllByRole('radio')
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/analytics/events'))).toBe(true))
  })
})
it('completes standalone play without any backend requests and labels the outcome', async () => {
  config.mode = 'standalone'; const user = userEvent.setup(); mount('/play')
  for (let i = 0; i < 3; i++) {
    await screen.findByText(`Question ${i + 1} of 3`, { selector: '.progress-heading span' })
    await user.click(screen.getAllByRole('radio')[1])
    await user.click(screen.getByRole('button', { name: /Check answer/ }))
    if (i < 2) await user.click(await screen.findByRole('button', { name: /Next question/ }))
  }
  await user.click(await screen.findByRole('button', { name: /See my results/ }))
  expect(await screen.findByText('Local playable result · Unverified')).toBeVisible()
  expect(screen.getByText(/Friend challenges are available in connected mode/)).toBeVisible()
  expect(fetchMock).not.toHaveBeenCalled()
  config.mode = 'connected'
})
