import { Link } from 'react-router-dom'
import Illustration from '../components/Illustration'
import { Arrow, Icon } from '../components/ui'
import { storage } from '../services/storage'
import { steerDestination } from '../services/config'
import { track } from '../services/analytics'
import type { Result } from '../types'
export default function Explore() {
  const nextStep = storage.get<Result['nextStep']>('next-step')
  const destination = steerDestination(nextStep?.ctaUrl)
  return <><section className="explore-hero"><div><span className="eyebrow">BEYOND THE QUIZ · WITH STEER</span><h1>Curious about <br />your own <br /><em>metabolic health?</em></h1><p className="hero-description">Real care starts with understanding your body.</p><p>Take your curiosity a little further. Explore Steer and learn about its approach to doctor-led metabolic care.</p><a className="button" href={destination} target="_blank" rel="noopener noreferrer" onClick={() => track('CTA_CLICKED', { destination: 'STEER_WEBSITE' })}>{nextStep?.ctaText || 'Explore Steer'} <Arrow /></a><span className="external-note">Opens Steer’s website in a new tab</span></div><div className="explore-art"><Illustration /><span className="art-tag">UNDERSTANDING COMES FIRST.</span></div></section><section className="care-section"><div className="section-heading"><div><span className="eyebrow">A MORE THOUGHTFUL CONVERSATION</span><h2>Care starts with the whole picture.</h2></div></div><div className="care-grid">{[{ title: 'Medical assessment', text: 'A conversation with a qualified clinician.', icon: 'compass' }, { title: 'Personalized care', text: 'Space for individual needs and questions.', icon: 'heart' }, { title: 'Nutrition & lifestyle', text: 'Everyday habits as part of the conversation.', icon: 'book' }, { title: 'Long-term guidance', text: 'Support and follow-up over time.', icon: 'friends' }].map((item, index) => <article key={item.title}><span className="care-number">0{index + 1}</span><Icon name={item.icon as 'compass' | 'heart' | 'book' | 'friends'} /><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section><div className="explore-bottom"><p>Your quiz score reflects knowledge, not your health or suitability for treatment.</p><Link className="inline-link" to="/play">A little more curiosity? Play again <Arrow /></Link></div></>
}
