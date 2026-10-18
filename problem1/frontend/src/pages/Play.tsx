import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { QuizDraft } from '../types'
import { completeQuiz, resetQuiz, saveDraft, startQuiz } from '../services/quiz'
import { ApiError } from '../services/api'
import { track } from '../services/analytics'
import { Dialog, ErrorNotice, Icon, Loading } from '../components/ui'
const types = { MYTH_OR_FACT: 'Myth or fact', MULTIPLE_CHOICE: 'Multiple choice', SCENARIO_BASED: 'A real-life scenario' }
const categories = { GLP1_AWARENESS: 'GLP-1 awareness', METABOLIC_HEALTH: 'Metabolic health', TREATMENT_SAFETY: 'Treatment safety', HEALTHY_HABITS: 'Healthy habits', DOCTOR_LED_CARE: 'Doctor-led care', NUTRITION: 'Nutrition' }
export default function Play() {
  const [draft, setDraft] = useState<QuizDraft>()
  const [error, setError] = useState<unknown>()
  const [busy, setBusy] = useState(false)
  const [exit, setExit] = useState(false)
  const [generation, setGeneration] = useState(0)
  const lock = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const navigate = useNavigate()
  useEffect(() => { let active = true; startQuiz().then(value => { if (active) { setDraft(value); setError(undefined) } }).catch(e => { if (active) setError(e) }); return () => { active = false } }, [generation])
  const questionIndex = draft?.index
  useEffect(() => { if (questionIndex !== undefined) heading.current?.focus() }, [questionIndex])
  useEffect(() => { if (!draft || !Object.keys(draft.answers).length) return; const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }; window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler) }, [draft])
  function update(value: QuizDraft) { saveDraft(value); setDraft(value) }
  async function submit() {
    if (!draft || lock.current) return
    const pending = draft.pending ?? { sessionId: draft.sessionId, answers: draft.questions.map(q => ({ questionId: q.id, selectedOptionId: draft.answers[q.id] })) }
    if (pending.answers.some(a => !a.selectedOptionId)) return
    lock.current = true; setBusy(true); setError(undefined)
    const frozen = { ...draft, pending }; update(frozen)
    try { const result = await completeQuiz(frozen); navigate(`/results/${result.data.attemptId}`, { replace: true }) }
    catch (e) { setError(e) }
    finally { lock.current = false; setBusy(false) }
  }
  function restart() { resetQuiz(); setDraft(undefined); setError(undefined); setGeneration(n => n + 1) }
  const fatal = error instanceof ApiError && [400, 404, 409, 422].includes(error.status)
  if (!draft) return error ? <section className="state-panel"><h1>Let’s take a breath.</h1><ErrorNotice error={error} retry={fatal ? restart : () => { setError(undefined); setGeneration(n => n + 1) }} /><p>Connected mode needs the quiz service to start.</p></section> : <Loading text="Preparing your three questions…" />
  const question = draft.questions[draft.index]
  const last = draft.index === draft.questions.length - 1
  return <section className="quiz-page"><div className="quiz-topline"><button className="text-button" onClick={() => setExit(true)} disabled={busy}>← Exit quiz</button><span className="quiz-brand">MetaboQuest<span>✳</span></span><span className="small">{draft.index + 1} / {draft.questions.length}</span></div><div className="quiz-grid"><div className="quiz-main"><div className="progress-heading"><span>Question {draft.index + 1} of {draft.questions.length}</span><span>{categories[question.category]}</span></div><progress aria-label="Quiz progress" value={draft.index + 1} max={draft.questions.length} />
    <div className="question-content" key={question.id}><span className="pill question-type"><Icon name={question.type === 'MYTH_OR_FACT' ? 'spark' : 'book'} />{types[question.type]}</span><h1 ref={heading} tabIndex={-1} id="question-title">{question.questionText}</h1><fieldset className="answers" disabled={busy || !!draft.pending} aria-labelledby="question-title"><legend className="sr-only">Choose one answer</legend>{question.options.map((option, index) => <label key={option.id} className={`answer-card ${draft.answers[question.id] === option.id ? 'selected' : ''}`}><input type="radio" name={question.id} value={option.id} checked={draft.answers[question.id] === option.id} onChange={() => { update({ ...draft, answers: { ...draft.answers, [question.id]: option.id } }); track('QUESTION_ANSWERED', { questionId: question.id }, draft.sessionId) }} /><span className="answer-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span><span>{option.text}</span><span className="answer-check" aria-hidden="true">{draft.answers[question.id] === option.id ? '✓' : ''}</span></label>)}</fieldset></div>
    <div aria-live="polite" className="sr-only">Question {draft.index + 1} of {draft.questions.length}{busy ? '. Submitting your answers.' : ''}</div>
    {!!error && <ErrorNotice error={error} retry={fatal ? undefined : submit} />}
    {draft.pending && !busy && !fatal && <p className="small">Your submitted answers are saved and locked. {error ? 'Try again sends the exact same answers safely.' : 'Continue to recover your result safely.'}</p>}
    <div className="quiz-controls">{draft.index > 0 && !draft.pending ? <button className="text-button" onClick={() => update({ ...draft, index: draft.index - 1 })}>← Previous</button> : <span className="small">Choose one answer</span>}{fatal ? <button className="button" onClick={restart}>Start a fresh quiz →</button> : <button className="button" disabled={!draft.answers[question.id] || busy || !!error} onClick={() => last || draft.pending ? void submit() : update({ ...draft, index: draft.index + 1 })}>{busy ? 'Finding your result…' : last || draft.pending ? 'See my results' : 'Next question'} {!busy && <span aria-hidden="true">→</span>}</button>}</div></div>
    <aside className="quiz-aside"><div className="orb"><Icon name="compass" /></div><span className="eyebrow">FOLLOW YOUR CURIOSITY</span><h2>Every question <br />is a small <br /><em>discovery.</em></h2><p>Go with what you know. <br />We’ll explore the science together after your final answer.</p><div className="aside-bottom"><span>01 — 03</span><span>✳</span></div></aside></div>
    {exit && <Dialog title="Pause your curiosity?" close={() => setExit(false)}><p>Your answers stay saved in this tab so you can pick up where you left off.</p><div className="dialog-actions"><button className="button" onClick={() => setExit(false)}>Keep playing</button><button className="button secondary" onClick={() => navigate('/')}>Save & exit</button></div></Dialog>}
  </section>
}
