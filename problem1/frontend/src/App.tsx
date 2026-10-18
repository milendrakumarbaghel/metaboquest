import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import { Dialog, EmptyState, Loading } from './components/ui'
import { config } from './services/config'
import { storage } from './services/storage'
import './App.css'
import './styles/learning.css'
const Topic = lazy(() => import('./pages/Topic'))
const Play = lazy(() => import('./pages/Play'))
const Results = lazy(() => import('./pages/Results'))
const Challenge = lazy(() => import('./pages/Challenge'))
const Explore = lazy(() => import('./pages/Explore'))
function Shell() {
  const location = useLocation()
  const [privacy, setPrivacy] = useState(false)
  const [consent, setConsent] = useState(() => storage.get('analytics-consent') === true)
  useEffect(() => { window.scrollTo(0, 0); document.getElementById('main')?.focus(); document.title = `${location.pathname === '/' ? 'A little curiosity. A healthier conversation.' : 'Play, learn, discover'} — MetaboQuest by Steer` }, [location.pathname])
  const playing = location.pathname === '/play'
  return <><a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a><div className="site-wrap"><header className="header">{playing ? <span className="wordmark" aria-label="Steer">steer<span>↗</span></span> : <Link className="wordmark" to="/" aria-label="Steer home">steer<span>↗</span></Link>}<span className="header-caption">A little curiosity. <br />A healthier conversation.</span><nav aria-label="Main navigation">{playing ? <span className="nav-label">THE KNOWLEDGE QUIZ</span> : <><Link className={location.pathname === '/explore' ? 'active' : ''} to="/explore">About Steer <span aria-hidden="true">↗</span></Link><Link className="nav-play" to="/topic">Take the quiz <span aria-hidden="true">→</span></Link></>}</nav></header>
    {config.mode === 'standalone' && <div className="mode-banner">Standalone edition · Local results are unverified</div>}
    <main id="main" tabIndex={-1}><Suspense fallback={<Loading />}><Routes><Route path="/" element={<Landing />} /><Route path="/topic" element={<Topic />} /><Route path="/play" element={<Play />} /><Route path="/results/:attemptId" element={<Results />} /><Route path="/challenge/:challengeCode" element={<Challenge />} /><Route path="/explore" element={<Explore />} /><Route path="*" element={<EmptyState title="A little off the beaten path.">This page isn’t here, but your next discovery is just three questions away.</EmptyState>} /></Routes></Suspense></main>
    <footer className="footer"><div><Link className="footer-brand" to={playing ? '/play' : '/'}>MetaboQuest<span> by Steer</span></Link><p>A knowledge quiz. Not a health assessment.</p></div><div className="footer-end"><span>MADE FOR CURIOUS MINDS</span><button className="text-button" onClick={() => setPrivacy(true)}>Privacy & analytics</button></div></footer></div>
    {privacy && <Dialog title="Your curiosity. Your choice." close={() => setPrivacy(false)}><p>No account, medical history, or contact details are needed to play.</p><p>In connected mode, your chosen educational topic and quiz answers are stored by the quiz service, but are not sent to Steer’s website or added to public challenge links. Quiz progress and private result access are saved in this browser tab’s session storage. Result access is lost when the tab’s session ends. Public challenge links share your quiz score and achievement.</p><label className="consent-option"><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); storage.set('analytics-consent', e.target.checked) }} /><span>Allow optional gameplay analytics<small>Send gameplay events, timings, and sharing channels to help improve the quiz. If you allow analytics, the name of the topic you pick (for example “muscle”) is counted anonymously with gameplay events. It is never sent to Steer’s website or added to challenge links. You can turn this off anytime.</small></span></label><p className="small">Optional analytics are off by default. {config.mode === 'standalone' && 'Standalone mode sends no analytics.'}</p><button className="button" onClick={() => setPrivacy(false)}>Done <span aria-hidden="true">✓</span></button></Dialog>}
  </>
}
export default function App() { const Router = import.meta.env.MODE === 'playable' ? HashRouter : BrowserRouter; return <Router><Shell /></Router> }
