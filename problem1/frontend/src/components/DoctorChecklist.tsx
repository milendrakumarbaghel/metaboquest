import { useState } from 'react'
import { topics } from '../data/topics'
import { storage } from '../services/storage'
import type { LearningTopic } from '../types'
export default function DoctorChecklist() {
  const [includeTopic, setIncludeTopic] = useState(false)
  const [status, setStatus] = useState('')
  const topic = topics.find(item => item.value === storage.get<LearningTopic>('completed-topic'))
  const text = ['Questions for my Steer consultation:', '• What assessments would help us understand my health?', '• What care options and ongoing support would suit my circumstances?', ...(includeTopic && topic ? [`• ${topic.question}`] : [])].join('\n')
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus('Checklist copied. You decide where to share it.') }
    catch { setStatus('Copy is unavailable here. Select and copy the checklist below.') }
  }
  return <section className="doctor-checklist" aria-labelledby="checklist-title"><span className="eyebrow">YOUR QUESTIONS. YOUR CHOICE.</span><h2 id="checklist-title">Take a better question to your doctor.</h2><p>Nothing here is sent to Steer automatically. Your quiz score does not establish treatment eligibility.</p>{topic && topic.value !== 'GENERAL' && <label className="consent-row"><input type="checkbox" checked={includeTopic} onChange={event => { setIncludeTopic(event.target.checked); setStatus('') }} />Include my chosen topic: {topic.label}</label>}<textarea aria-label="Doctor conversation checklist" value={text} readOnly rows={5} /><button className="button secondary" onClick={copy}>Copy my questions</button><p role="status">{status}</p></section>
}
