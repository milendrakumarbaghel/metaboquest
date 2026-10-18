import type { LearningTopic } from '../types'
import { topics } from '../data/topics'
export default function TopicTakeaway({ topic }: { topic?: LearningTopic }) {
  const focus = topics.find(item => item.value === (topic ?? 'GENERAL')) ?? topics[topics.length - 1]
  const general = focus.value === 'GENERAL'
  return <section className="topic-takeaway" aria-labelledby="topic-takeaway-title"><span className="eyebrow">{general ? 'YOUR KEY TAKEAWAY' : 'YOUR KEY TAKEAWAY · YOUR DOUBT'}</span><h2 id="topic-takeaway-title">{general ? 'The big picture' : focus.label}</h2><p>{focus.takeaway}</p><p className="small">Educational only, not medical advice.</p><a className="inline-link" href="#steer-handoff" onClick={event => { event.preventDefault(); const target = document.getElementById('steer-handoff'); target?.scrollIntoView({ behavior: 'auto' }); target?.focus() }}>Want a doctor to look at your own numbers? ↓</a></section>
}
