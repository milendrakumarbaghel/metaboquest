import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Question, QuizDraft, Source } from '../types'
import { completeQuiz, resetQuiz, saveDraft, startQuiz, switchToOfflineEdition } from '../services/quiz'
import { config, safeUrl } from '../services/config'
import { ApiError } from '../services/api'
import { track } from '../services/analytics'
import { Dialog, ErrorNotice, Icon, Loading } from '../components/ui'
import QuizTimer from '../components/QuizTimer'
type Reveal = (questionId: string, optionId: string) => { correct: boolean; correctOptionId: string; explanation: string; sources: Source[] } | undefined
const loadReveal = () => import('../data/approved').then(module => module.revealAnswer as Reveal)
const types = { MYTH_OR_FACT: 'Myth or fact', MULTIPLE_CHOICE: 'Multiple choice', SCENARIO_BASED: 'A real-life scenario' }
const categories = { GLP1_AWARENESS: 'GLP-1 awareness', METABOLIC_HEALTH: 'Metabolic health', TREATMENT_SAFETY: 'Treatment safety', HEALTHY_HABITS: 'Healthy habits', DOCTOR_LED_CARE: 'Doctor-led care', NUTRITION: 'Nutrition' }
export default function Play() {
  const [draft, setDraft] = useState<QuizDraft>()
  const [error, setError] = useState<unknown>()
  const [busy, setBusy] = useState(false)
  const [exit, setExit] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [reveal, setReveal] = useState<Reveal>()
  const [expired, setExpired] = useState(false)
  const expiredRef = useRef(false)
  const expire = useCallback(() => { expiredRef.current = true; setExpired(true) }, [])
  const lock = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const navigate = useNavigate()
  useEffect(() => { let active = true; startQuiz().then(value => { if (active) { setDraft(value); setError(undefined) } }).catch(e => { if (active) setError(e) }); return () => { active = false } }, [generation])
  useEffect(() => { let active = true; loadReveal().then(value => { if (active) setReveal(() => value) }).catch(() => { /* Without the answer key the check step is skipped. */ }); return () => { active = false } }, [])
  const questionIndex = draft?.index
  useEffect(() => { if (questionIndex !== undefined) heading.current?.focus() }, [questionIndex])
  useEffect(() => { if (!draft || !Object.keys(draft.answers).length) return; const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }; window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler) }, [draft])
  function update(value: QuizDraft) { saveDraft(value); setDraft(value) }
  async function submit() {
    if (!draft || lock.current || expiredRef.current) return
    const pending = draft.pending ?? { sessionId: draft.sessionId, answers: draft.questions.map(q => ({ questionId: q.id, selectedOptionId: draft.answers[q.id] })) }
    if (pending.answers.some(a => !a.selectedOptionId)) return
    lock.current = true; setBusy(true); setError(undefined)
    const frozen = { ...draft, pending }; update(frozen)
    try { const result = await completeQuiz(frozen); navigate(`/results/${result.data.attemptId}`, { replace: true }) }
    catch (e) { lock.current = false; setBusy(false); setError(e) }
  }
  // Step one of two: lock the pick and show the myth-vs-fact explanation. Unknown questions skip straight on.
  async function check(current: QuizDraft, question: Question) {
    if (expiredRef.current) return
    const picked = current.answers[question.id]
    const known = (await loadReveal().catch(() => undefined))?.(question.id, picked)
    if (expiredRef.current) return
    if (!known) { next(current); return }
    update({ ...current, checked: { ...current.checked, [question.id]: true } })
  }
  function next(current: QuizDraft) { if (expiredRef.current) return; if (current.index === current.questions.length - 1 || current.pending) void submit(); else update({ ...current, index: current.index + 1 }) }
  function restart() { expiredRef.current = false; setExpired(false); resetQuiz(); setDraft(undefined); setError(undefined); setGeneration(n => n + 1) }
  const fatal = error instanceof ApiError && [400, 404, 409, 422].includes(error.status)
  if (!draft) return error ? <section className="state-panel"><h1>Let’s take a breath.</h1><ErrorNotice error={error} retry={fatal ? restart : () => { setError(undefined); setGeneration(n => n + 1) }} /><p>Connected mode needs the quiz service to start.</p>{config.mode === 'connected' && <div className="offline-offer"><button className="button secondary" onClick={() => { switchToOfflineEdition(); window.location.reload() }}>Play the offline edition instead</button><p className="small">Runs in your browser with the bundled questions. Results are scored locally and are unverified.</p></div>}</section> : <Loading text="Preparing your three questions…" />
  const question = draft.questions[draft.index]
  const last = draft.index === draft.questions.length - 1
  const picked = draft.answers[question.id]
  const checked = !!draft.checked?.[question.id]
  const info = checked && picked ? reveal?.(question.id, picked) : undefined
  const skipCheck = !!draft.pending || (!!reveal && !reveal(question.id, picked ?? ''))
  const needsCheck = !checked && !skipCheck
  let streak = 0
  draft.questions.slice(0, draft.index + 1).forEach(q => { if (!draft.checked?.[q.id]) return; const r = reveal?.(q.id, draft.answers[q.id] ?? ''); streak = r?.correct ? streak + 1 : 0 })
  const correctText = info && question.options.find(o => o.id === info.correctOptionId)?.text
  const source = info?.sources.find(item => safeUrl(item.url))
  return <section className="quiz-page"><div className="quiz-topline"><button className="text-button" onClick={() => expired ? navigate('/') : setExit(true)} disabled={busy}>← Exit quiz</button><span className="quiz-brand">MetaboQuest<span>✳</span></span><span className="small">{draft.index + 1} / {draft.questions.length}</span></div><div className="quiz-grid"><div className="quiz-main"><QuizTimer key={draft.sessionId} onExpire={expire} /><div className="progress-heading"><span>Question {draft.index + 1} of {draft.questions.length}</span><span>{categories[question.category]}</span></div><progress aria-label="Quiz progress" value={draft.index + 1} max={draft.questions.length} />
    <ol className="step-markers" aria-hidden="true">{draft.questions.map((q, index) => <li key={q.id} className={index === draft.index ? 'current' : index < draft.index || draft.checked?.[q.id] ? 'done' : ''}>{index + 1}/{draft.questions.length}</li>)}</ol>
    <div className="question-content" key={question.id}><span className="pill question-type"><Icon name={question.type === 'MYTH_OR_FACT' ? 'spark' : 'book'} />{types[question.type]}</span><h1 ref={heading} tabIndex={-1} id="question-title">{question.questionText}</h1><fieldset className="answers" disabled={expired || busy || !!draft.pending || checked} aria-labelledby="question-title"><legend className="sr-only">Choose one answer</legend>{question.options.map((option, index) => { const right = !!info && option.id === info.correctOptionId; const wrong = !!info && option.id === picked && !info.correct; return <label key={option.id} className={`answer-card ${picked === option.id ? 'selected' : ''} ${right ? 'is-right' : ''} ${wrong ? 'is-wrong' : ''}`}><input type="radio" name={question.id} value={option.id} checked={picked === option.id} onChange={() => { if (expiredRef.current) return; update({ ...draft, answers: { ...draft.answers, [question.id]: option.id } }); track('QUESTION_ANSWERED', { questionId: question.id }, draft.sessionId) }} /><span className="answer-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span><span>{option.text}</span>{right && <span className="answer-tag">Correct answer</span>}{wrong && <span className="answer-tag">Your answer</span>}<span className="answer-check" aria-hidden="true">{picked === option.id ? '✓' : ''}</span></label> })}</fieldset></div>
    <div className="feedback-region" role="status" aria-live="polite">{info && <div className={`feedback-panel ${info.correct ? 'right' : 'learn'}`}><h2>{info.correct ? '✓ Spot on' : '↗ Good to know'}</h2>{streak >= 2 && <span className="streak-chip">{streak} in a row</span>}{!info.correct && correctText && <p className="feedback-better"><strong>Better answer:</strong> {correctText}</p>}<p>{info.explanation}</p>{source && <p className="small">Source: <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span className="sr-only"> (opens in a new tab)</span></a> · {source.organization}</p>}</div>}</div>
    <div aria-live="polite" className="sr-only">Question {draft.index + 1} of {draft.questions.length}{busy ? '. Submitting your answers.' : ''}</div>
    {!!error && <ErrorNotice error={error} retry={fatal || expired ? undefined : submit} />}
    {draft.pending && !busy && !fatal && !expired && <p className="small">Your submitted answers are saved and locked. {error ? 'Try again sends the exact same answers safely.' : 'Continue to recover your result safely.'}</p>}
    <div className="quiz-controls">{draft.index > 0 && !draft.pending ? <button className="text-button" disabled={expired} onClick={() => update({ ...draft, index: draft.index - 1 })}>← Previous</button> : <span className="small">{expired ? 'Quiz ended' : needsCheck ? 'Choose one answer, then check it' : 'Choose one answer'}</span>}{fatal ? <button className="button" onClick={restart}>Start a fresh quiz →</button> : <button className="button" disabled={expired || !picked || busy || !!error} onClick={() => needsCheck ? void check(draft, question) : next(draft)}>{busy ? 'Finding your result…' : needsCheck ? 'Check answer' : last || draft.pending ? 'See my results' : 'Next question'} {!busy && <span aria-hidden="true">→</span>}</button>}</div></div>
    <aside className="quiz-aside"><div className="orb"><Icon name="compass" /></div><span className="eyebrow">FOLLOW YOUR CURIOSITY</span><h2>Every question <br />is a small <br /><em>discovery.</em></h2><p>Go with what you know. <br />We’ll explore the science together after your final answer.</p><div className="aside-bottom"><span>01 — 03</span><span>✳</span></div></aside></div>
    {exit && <Dialog title="Pause your curiosity?" close={() => setExit(false)}><p>Your answers stay saved in this tab so you can pick up where you left off.</p><div className="dialog-actions"><button className="button" onClick={() => setExit(false)}>Keep playing</button><button className="button secondary" onClick={() => navigate('/')}>Save & exit</button></div></Dialog>}
  </section>
}
