import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { PublicChallenge } from '../types'
import { api, ApiError } from '../services/api'
import { config } from '../services/config'
import { track } from '../services/analytics'
import { resetQuiz } from '../services/quiz'
import { Arrow, EmptyState, ErrorNotice, Icon, Loading } from '../components/ui'
export default function ChallengePage() {
  const { challengeCode = '' } = useParams()
  const [challenge, setChallenge] = useState<PublicChallenge>()
  const [error, setError] = useState<unknown>()
  const [generation, setGeneration] = useState(0)
  const valid = /^[A-Za-z0-9_-]{16}$/.test(challengeCode)
  useEffect(() => { if (!valid || config.mode === 'standalone') return; const controller = new AbortController(); api.challenge(challengeCode, controller.signal).then(value => { if (!controller.signal.aborted) { setChallenge(value); track('FRIEND_CHALLENGE_OPENED', { challengeCode }) } }).catch(e => { if (!controller.signal.aborted) setError(e) }); return () => controller.abort() }, [challengeCode, valid, generation])
  if (config.mode === 'standalone') return <EmptyState title="A little friendly curiosity.">This standalone edition can’t retrieve public challenges. Play the local quiz for an unverified result.</EmptyState>
  if (!valid || (error instanceof ApiError && [400, 404, 410].includes(error.status)) || (challenge && !challenge.active)) return <EmptyState title="This invitation has had its moment.">The challenge may have expired, or the link may be incomplete. There’s always a new discovery waiting.</EmptyState>
  if (error) return <section className="state-panel"><h1>Let’s find your invitation.</h1><ErrorNotice error={error} retry={() => { setError(undefined); setGeneration(n => n + 1) }} /></section>
  if (!challenge) return <Loading text="Opening your invitation…" />
  return <section className="invitation-page"><div className="invitation-art"><span>YOU’RE INVITED</span><div className="invitation-seal"><Icon name="friends" /></div><span>TO A LITTLE FRIENDLY CURIOSITY</span></div><div className="invitation-copy"><span className="eyebrow">GOOD KNOWLEDGE TRAVELS</span><h1>You’ve been <br /><em>challenged!</em></h1><div className="friend-score"><strong>{challenge.creatorScore}</strong><div><span>Your friend’s knowledge score</span><h2>{challenge.achievement}</h2></div></div><p>{challenge.message}</p><p className="small">Three questions. Your own fresh perspective.</p><Link className="button" to="/play" onClick={() => resetQuiz(challenge)}>Accept challenge <Arrow /></Link><p className="small">A friendly score comparison. No account needed.</p></div></section>
}
