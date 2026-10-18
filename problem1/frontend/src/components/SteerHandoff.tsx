import { Arrow } from './ui'
import { storage } from '../services/storage'
import { steerDestination } from '../services/config'
import { track } from '../services/analytics'
import type { Result } from '../types'
const steps = [
  { title: 'Diagnostics first', text: 'Comprehensive tests, including a gut microbiome test and a DEXA body-composition scan, so decisions start from your own data.' },
  { title: 'Doctor consult', text: 'A physician or endocrinologist reviews your results and decides whether the programme fits. GLP-1 therapy is prescribed only when it is clinically right.' },
  { title: 'Continuous care', text: 'A dedicated doctor, a care manager and a behavioural dietician stay with you. Daily check-ins happen on WhatsApp, and an AI coach turns meals, weight and lab results into progress trends.' },
  { title: 'Habits that last', text: 'Diet, fitness and mental-health support sit alongside the medicine, with a focus on protecting muscle and a personalised long-term maintenance plan.' },
]
// Sends nothing to Steer: the link is the bare website address, with no topic, answers, score or query string.
export default function SteerHandoff({ variant }: { variant: 'results' | 'explore' }) {
  const destination = steerDestination(storage.get<Result['nextStep']>('next-step')?.ctaUrl)
  const click = (ctaContext: string) => () => track('CTA_CLICKED', { destination: 'STEER_WEBSITE', ctaContext })
  return <section className="steer-handoff" id="steer-handoff" tabIndex={-1} aria-labelledby="steer-handoff-title"><span className="eyebrow">WHAT HAPPENS AFTER A QUIZ</span><h2 id="steer-handoff-title">Want a doctor to look at your own numbers?</h2><p className="handoff-sub">Steer is India’s doctor-led metabolic health club. Nothing from this quiz is sent to Steer.</p>
    <ol className="handoff-steps">{steps.map(step => <li key={step.title}><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
    <div className="handoff-actions"><a className="button" href={destination} target="_blank" rel="noopener noreferrer" onClick={click(`${variant}_programme_fit`)}>See if the programme fits you <Arrow /></a><a className="button secondary" href={destination} target="_blank" rel="noopener noreferrer" onClick={click(`${variant}_talk_to_doctor`)}>Talk to a Steer doctor <Arrow /></a></div>
    <p className="handoff-note">Opens Steer’s website in a new tab. Your topic, answers and score are not shared. Programme details come from Steer’s brief; confirm services and suitability with Steer.</p></section>
}
