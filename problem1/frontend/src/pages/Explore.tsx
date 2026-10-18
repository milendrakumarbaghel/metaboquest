import { Link } from 'react-router-dom'
import Illustration from '../components/Illustration'
import DoctorChecklist from '../components/DoctorChecklist'
import SteerHandoff from '../components/SteerHandoff'
import { Arrow } from '../components/ui'
export default function Explore() {
  return <><section className="explore-hero"><div><span className="eyebrow">BEYOND THE QUIZ · WITH STEER</span><h1>Curious about <br />your own <br /><em>metabolic health?</em></h1><p className="hero-description">Real care starts with understanding your body.</p><p>Explore a doctor-led programme built for Indian bodies and everyday life. A consultation—not a quiz—helps assess whether it fits.</p></div><div className="explore-art"><Illustration /><span className="art-tag">UNDERSTANDING COMES FIRST.</span></div></section>
    <SteerHandoff variant="explore" />
    <DoctorChecklist />
    <div className="explore-bottom"><p>Your quiz score reflects knowledge, not your health or suitability for treatment.</p><Link className="inline-link" to="/topic">Choose another topic <Arrow /></Link></div></>
}
