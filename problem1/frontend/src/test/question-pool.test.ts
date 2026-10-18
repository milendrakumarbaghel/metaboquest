import { describe, expect, it, vi } from 'vitest'
import { questionPool, questionTopics, revealAnswer, scoreLocal, selectQuestions } from '../data/approved'
import { topics } from '../data/topics'

describe('Standalone question selection', () => {
  it('selects three distinct questions without modifying the bank', () => {
    const before = questionPool.map(q => q.id)
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = selectQuestions()
    vi.mocked(Math.random).mockReturnValue(0.99)
    const second = selectQuestions()
    expect(new Set(first.map(q => q.id)).size).toBe(3)
    expect(first.map(q => q.id)).not.toEqual(second.map(q => q.id))
    expect(questionPool.map(q => q.id)).toEqual(before)
    expect(questionPool).toHaveLength(37)
  })

  it.each(topics.filter(t => t.value !== 'GENERAL'))('draws three questions about $value', ({ value }) => {
    const selected = selectQuestions(value)
    expect(selected).toHaveLength(3)
    expect(new Set(selected.map(q => q.id)).size).toBe(3)
    expect(selected.every(q => questionTopics.get(q.id) === value)).toBe(true)
    expect(scoreLocal({}, selected).data.feedback.every(f => f.sources.length && f.explanation)).toBe(true)
  })

  it('covers three different concerns in surprise mode', () => {
    expect(new Set(selectQuestions().map(q => questionTopics.get(q.id))).size).toBe(3)
  })

  it('scores only the selected questions and matches feedback by ID', () => {
    const selected = [...questionPool].reverse().slice(0, 3)
    const answers = Object.fromEntries(selected.map(q => [q.id, revealAnswer(q.id, q.options[0].id)!.correctOptionId]))
    const result = scoreLocal(answers, selected).data
    expect(result.score).toBe(300)
    expect(result.maxScore).toBe(300)
    expect(result.totalQuestions).toBe(3)
    expect(result.feedback.map(f => f.questionId)).toEqual(selected.map(q => q.id))
    expect(result.feedback.every(f => f.correct && f.sources.length > 0)).toBe(true)
  })
})
