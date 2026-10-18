import { Link } from 'react-router-dom'
import Illustration from '../components/Illustration'
import { Arrow, Icon } from '../components/ui'
export default function Landing() {
  return <>
    <section className="landing-hero"><div className="hero-copy">
      <div className="eyebrow brand-kicker"><span className="mini-spark">✳</span> METABOQUEST · BY STEER</div>
      <div className="pill"><span className="live-dot" />3 questions · about 60 seconds</div>
      <h1 className="hook-title">GLP-1: how much is fact, and how much is <em>fear?</em></h1>
      <p className="hero-description">Heard it in a WhatsApp forward or over family dinner? Test it before you trust it.</p>
      <ul className="teaser-chips" aria-label="Things people say"><li>“It’s only for diabetics.”</li><li>“I’ll lose muscle.”</li><li>“The weight always comes back.”</li></ul>
      <div className="hero-action"><Link className="button primary-large" to="/topic">Bust the myths in 60 seconds <span aria-hidden="true">→</span></Link><span className="reassurance">No signup. Educational only, not medical advice.</span></div>
    </div><div className="hero-art"><span className="art-note">A little “aha!” <br /><em>looks good on you.</em><svg viewBox="0 0 90 60" aria-hidden="true"><path d="M3 4c70-10 80 32 29 43m0 0 18 5m-18-5 9-15" /></svg></span><Illustration /><div className="art-tag"><span aria-hidden="true">✦</span> YOUR NEXT AHA MOMENT AWAITS</div></div></section>
    <section className="benefits" aria-label="What’s in it for you"><div className="benefits-intro"><span className="eyebrow">A SMALL QUIZ.</span><h2>A fresh perspective.</h2></div>{[{ icon: 'book' as const, title: 'Learn real facts', text: 'Evidence, made easy.' }, { icon: 'spark' as const, title: 'Bust common myths', text: 'Swap assumptions for insights.' }, { icon: 'friends' as const, title: 'Challenge friends', text: 'Good knowledge travels.' }].map(item => <div className="benefit" key={item.title}><Icon name={item.icon} /><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}</section>
    <section className="landing-bottom"><p>Not a test of your health. <br /><em>A little exercise for your curiosity.</em></p><Link className="inline-link" to="/explore">Meet the thinking behind Steer <Arrow /></Link></section>
  </>
}
