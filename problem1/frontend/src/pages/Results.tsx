import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Outcome, ReviewContext } from '../types'
import { loadResult, resetQuiz } from '../services/quiz'
import { storage, tokenKey } from '../services/storage'
import { safeUrl } from '../services/config'
import { Arrow, EmptyState, ErrorNotice, Icon, Loading } from '../components/ui'
const ShareSheet = lazy(() => import('../components/ShareSheet'))
export default function Results() {
  const { attemptId = '' } = useParams()
  const [outcome, setOutcome] = useState<Outcome>()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<unknown>()
  const [share, setShare] = useState(false)
  const [generation, setGeneration] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    loadResult(attemptId, controller.signal).then(value => { if (!controller.signal.aborted) { setOutcome(value); setLoaded(true) } }).catch(e => { if (!controller.signal.aborted) setError(e) })
    return () => controller.abort()
  }, [attemptId, generation])
  if (error) return <section className="state-panel"><h1>Your discovery is worth another look.</h1><ErrorNotice error={error} retry={() => { setError(undefined); setGeneration(n => n + 1) }} /><Link className="inline-link" to="/play" onClick={() => resetQuiz()}>Play a fresh quiz →</Link></section>
  if (!loaded) return <Loading text="Unwrapping your result…" />
  if (!outcome) return <EmptyState title="This result belongs to its browser tab.">For privacy, results need the original tab’s access key. If that session has ended, play again to make a new discovery.</EmptyState>
  const { data } = outcome
  const review = storage.get<ReviewContext>(`review:${attemptId}`)
  const feedback = review ? [...data.feedback].sort((a, b) => review.questions.findIndex(q => q.id === a.questionId) - review.questions.findIndex(q => q.id === b.questionId)) : data.feedback
  const motif = data.profile.code === 'MYTH_BUSTER' ? 'trophy' : data.profile.code === 'SMART_STRATEGIST' ? 'spark' : 'compass'
  const canChallenge = outcome.kind === 'connected' && !!storage.get<string>(tokenKey(attemptId))
  return <div className="results-page"><div className="result-topline"><Link className="text-button" to="/play" onClick={() => resetQuiz()}>↻ Play again</Link><span className="eyebrow">YOUR METABOQUEST MOMENT</span><a className="text-button" href="#answer-review">View answers ↓</a></div><section className="result-grid"><div className="achievement-card"><span className="eyebrow">CURIOSITY LOOKS GOOD ON YOU</span><div className={`achievement-seal ${data.profile.code.toLowerCase()}`}><span className="seal-spark spark-left">✦</span><Icon name={motif} /><span className="seal-spark spark-right">✧</span></div><p className="result-intro">Meet your quiz alter ego.</p><h1>{data.profile.title}</h1><p>{data.profile.description}</p><div className="score-row"><div><span className="score-number">{data.score}<small> / {data.maxScore}</small></span><span>Knowledge points</span></div><div><strong>{data.correctAnswers}<small> / {data.totalQuestions}</small></strong><span>Correct answers</span></div></div><span className="result-verification">{outcome.kind === 'local' ? 'Local playable result · Unverified' : 'Scored by the MetaboQuest quiz service'}</span></div>
    <div className="result-next"><span className="eyebrow">THE BEST PART? PASS IT ON.</span><h2>A little wiser. <br /><em>Now make it social.</em></h2><p>A new perspective is even better when you share it. Invite a friend to discover theirs.</p>{canChallenge ? <button className="button" onClick={() => setShare(true)}>Challenge a friend <Arrow /></button> : <p className="small">{outcome.kind === 'local' ? 'Friend challenges are available in connected mode.' : 'Challenge creation needs the original result access key. This browser could not retain it.'}</p>}<button className="button secondary" onClick={() => setShare(true)}>Share result <Arrow /></button><Link className="inline-link" to="/explore">Explore Steer <Arrow /></Link>{review?.challenge && <div className="comparison"><strong>You: {data.score} · Your friend: {review.challenge.creatorScore}</strong><p>A friendly comparison of quiz points. No winner is recorded.</p></div>}<div className="educational-note"><Icon name="book" /><p>{data.disclaimer}</p></div></div></section>
    <section className="review-section" id="answer-review"><div className="section-heading"><div><span className="eyebrow">THE SCIENCE BEHIND YOUR SCORE</span><h2>A few things to take with you.</h2></div><span>{data.totalQuestions} small discoveries</span></div>{feedback.map((item, index) => { const question = review?.questions.find(q => q.id === item.questionId); const answer = question?.options.find(o => o.id === review?.answers[item.questionId]); return <details key={item.questionId} className="review-item"><summary><span className="review-index">0{index + 1}</span><span>{question?.questionText ?? `Question ${index + 1} — the explanation`}</span><span className={`review-badge ${item.correct ? 'correct' : ''}`}>{item.correct ? '✓ Correct' : '↗ A new insight'}</span><span className="disclosure" aria-hidden="true">+</span></summary><div className="review-body">{answer && <p className="your-answer">Your answer: {answer.text}</p>}<p>{item.explanation}</p><h3>Explore the evidence</h3>{item.sources.map(source => <div className="source" key={source.url}>{safeUrl(source.url) ? <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <Arrow /></a> : <span>{source.title}</span>}<small>{source.organization}{source.publicationDate ? ` · ${source.publicationDate}` : ''}</small></div>)}</div></details> })}</section>
    {share && <Suspense fallback={<p role="status">Preparing sharing options…</p>}><ShareSheet outcome={outcome} close={() => setShare(false)} /></Suspense>}</div>
}
