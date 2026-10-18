import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import QuizTimer from '../components/QuizTimer'
import Play from '../pages/Play'
import { completeQuiz, saveDraft, startQuiz } from '../services/quiz'
import { questionResponse, result, session } from './fixtures'
import type { QuizDraft } from '../types'

vi.mock('../services/quiz', () => ({
  startQuiz: vi.fn(),
  completeQuiz: vi.fn(),
  resetQuiz: vi.fn(),
  saveDraft: vi.fn(),
  switchToOfflineEdition: vi.fn(),
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(completeQuiz).mockReset()
  vi.mocked(saveDraft).mockClear()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function draft(): QuizDraft {
  return {
    mode: 'connected', sessionId: session.sessionId,
    questions: questionResponse.questions, answers: {}, index: 0,
    startedAt: Date.now(),
  }
}

function renderQuiz() {
  return render(<StrictMode><MemoryRouter initialEntries={['/play']}><Routes>
    <Route path="/play" element={<Play />} />
    <Route path="/results/:attemptId" element={<h1>Quiz complete</h1>} />
  </Routes></MemoryRouter></StrictMode>)
}

async function advanceQuestion() {
  fireEvent.click(screen.getAllByRole('radio')[1])
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Check answer/ })) })
  fireEvent.click(screen.getByRole('button', { name: /Next question/ }))
}

describe('Quiz countdown', () => {
  it('shows every second from 60 to 0, announces expiry, and stops its interval', () => {
    const onExpire = vi.fn()
    render(<StrictMode><QuizTimer onExpire={onExpire} /></StrictMode>)
    const timer = screen.getByRole('timer', { name: 'Time remaining' })
    expect(timer).toHaveTextContent('60s')
    expect(vi.getTimerCount()).toBe(1)
    for (let seconds = 59; seconds >= 0; seconds--) {
      act(() => { vi.advanceTimersByTime(1000) })
      expect(timer).toHaveTextContent(`${seconds}s`)
    }
    expect(screen.getByRole('alert')).toHaveTextContent('Time’s up! Your quiz time has ended.')
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(timer).toHaveTextContent('0s')
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('cleans up the interval on unmount', () => {
    const view = render(<QuizTimer />)
    act(() => { vi.advanceTimersByTime(3000) })
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('starts only once the first question is displayed', async () => {
    let resolve!: (value: QuizDraft) => void
    vi.mocked(startQuiz).mockReturnValue(new Promise(value => { resolve = value }))
    renderQuiz()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(15000) })
    await act(async () => { resolve(draft()) })
    expect(screen.getByRole('heading', { name: questionResponse.questions[0].questionText })).toBeVisible()
    expect(screen.getByRole('timer')).toHaveTextContent('60s')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('timer')).toHaveTextContent('59s')
  })

  it('continues across all questions, then locks the unanswered current question without submitting', async () => {
    vi.mocked(startQuiz).mockResolvedValue(draft())
    vi.mocked(completeQuiz).mockResolvedValue({ kind: 'connected', data: result })
    await act(async () => { renderQuiz() })
    act(() => { vi.advanceTimersByTime(10000) })
    await advanceQuestion()
    expect(screen.getByRole('timer')).toHaveTextContent('50s')
    act(() => { vi.advanceTimersByTime(10000) })
    await advanceQuestion()
    expect(screen.getByRole('timer')).toHaveTextContent('40s')
    act(() => { vi.advanceTimersByTime(40000) })
    expect(screen.getByRole('alert')).toHaveTextContent('Time’s up! Your quiz time has ended.')
    expect(screen.getByRole('heading', { name: questionResponse.questions[2].questionText })).toBeVisible()
    expect(completeQuiz).not.toHaveBeenCalled()
    expect(screen.getAllByRole('radio')[1]).toBeDisabled()
    const saves = vi.mocked(saveDraft).mock.calls.length
    fireEvent.click(screen.getAllByRole('radio')[1])
    expect(screen.getAllByRole('radio')[1]).not.toBeChecked()
    expect(screen.getByRole('button', { name: /Check answer/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled()
    expect(screen.queryByRole('heading', { name: /Spot on|Good to know/ })).not.toBeInTheDocument()
    expect(saveDraft).toHaveBeenCalledTimes(saves)
    expect(completeQuiz).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Exit quiz/ })).toBeEnabled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([false, true])('locks a selected answer at expiry (already checked: %s)', async checked => {
    vi.mocked(startQuiz).mockResolvedValue(draft())
    await act(async () => { renderQuiz() })
    fireEvent.click(screen.getAllByRole('radio')[1])
    if (checked) await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Check answer/ })) })
    const action = screen.getByRole('button', { name: checked ? /Next question/ : /Check answer/ })
    act(() => { vi.advanceTimersByTime(59000) })
    expect(action).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const saves = vi.mocked(saveDraft).mock.calls.length
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('alert')).toBeVisible()
    expect(action).toBeDisabled()
    fireEvent.click(action)
    expect(screen.getByRole('heading', { name: questionResponse.questions[0].questionText })).toBeVisible()
    expect(screen.getAllByRole('radio')[1]).toBeChecked()
    expect(screen.getAllByRole('radio').every(radio => (radio as HTMLInputElement).disabled || radio.closest('fieldset')?.disabled)).toBe(true)
    expect(saveDraft).toHaveBeenCalledTimes(saves)
    expect(completeQuiz).not.toHaveBeenCalled()
    if (!checked) expect(screen.queryByRole('heading', { name: /Spot on|Good to know/ })).not.toBeInTheDocument()
  })

  it('disables final submission when time expires on the last checked question', async () => {
    const current = draft()
    current.index = 2
    current.answers = Object.fromEntries(current.questions.map(q => [q.id, q.options[1].id]))
    current.checked = Object.fromEntries(current.questions.map(q => [q.id, true]))
    vi.mocked(startQuiz).mockResolvedValue(current)
    await act(async () => { renderQuiz() })
    const submit = screen.getByRole('button', { name: /See my results/ })
    expect(submit).toBeEnabled()
    act(() => { vi.advanceTimersByTime(60000) })
    expect(submit).toBeDisabled()
    fireEvent.click(submit)
    expect(completeQuiz).not.toHaveBeenCalled()
    expect(saveDraft).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: current.questions[2].questionText })).toBeVisible()
  })

  it('cleans up a running countdown when the quiz completes early', async () => {
    const current = draft()
    current.index = 2
    current.answers = Object.fromEntries(current.questions.map(q => [q.id, q.options[1].id]))
    current.pending = { sessionId: current.sessionId, answers: current.questions.map(q => ({ questionId: q.id, selectedOptionId: current.answers[q.id] })) }
    vi.mocked(startQuiz).mockResolvedValue(current)
    vi.mocked(completeQuiz).mockResolvedValue({ kind: 'connected', data: result })
    await act(async () => { renderQuiz() })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('timer')).toHaveTextContent('55s')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /See my results/ })) })
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })
})
