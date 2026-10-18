import { Link, useNavigate } from 'react-router-dom'
import { topics } from '../data/topics'
import { chooseTopic } from '../services/quiz'
export default function TopicPicker() {
  const navigate = useNavigate()
  return <>
    <ul className="topic-list" aria-label="Choose the doubt closest to yours">{topics.map(item => <li key={item.value}><button type="button" className="topic-button" onClick={() => { chooseTopic(item.value); navigate('/play') }}><span>{item.label}</span><span aria-hidden="true">→</span></button></li>)}</ul>
    <Link className="inline-link" to="/play" onClick={() => chooseTopic('GENERAL')}>Skip, surprise me <span aria-hidden="true">→</span></Link>
  </>
}
