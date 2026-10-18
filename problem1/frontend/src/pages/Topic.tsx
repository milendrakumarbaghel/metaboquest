import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import TopicPicker from '../components/TopicPicker'
import { config } from '../services/config'
import { resetQuiz } from '../services/quiz'
import { storage } from '../services/storage'
import type { QuizDraft } from '../types'
export default function Topic() {
  const heading = useRef<HTMLHeadingElement>(null)
  const [resume, setResume] = useState(() => { const saved = storage.get<QuizDraft>('draft'); return saved?.mode === config.mode && !!saved.questions?.length && Object.keys(saved.answers ?? {}).length > 0 })
  // Queued so it runs after the app shell has moved focus to <main> on navigation.
  useEffect(() => { queueMicrotask(() => heading.current?.focus()) }, [])
  return <section className="topic-page">
    <span className="eyebrow">STEP 1 OF 3 · PICK A DOUBT</span>
    <h1 ref={heading} tabIndex={-1}>What makes you unsure about GLP-1?</h1>
    <p className="topic-sub">Pick the doubt closest to yours. It only chooses which questions you see. It is not a medical assessment.</p>
    {resume && <div className="resume-panel" role="group" aria-label="Saved quiz"><p>You have a quiz in progress in this tab.</p><div><Link className="button" to="/play">Continue your quiz <span aria-hidden="true">→</span></Link><button type="button" className="button secondary" onClick={() => { resetQuiz(); setResume(false) }}>Start over</button></div></div>}
    <TopicPicker />
  </section>
}
