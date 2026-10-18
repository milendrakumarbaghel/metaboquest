import { useEffect, useState } from 'react'
import type { Outcome } from '../types'
import { Dialog, ErrorNotice, Icon } from './ui'
import { getOrCreateChallenge } from '../services/quiz'
import { safeUrl } from '../services/config'
import { copyLink, nativeShare, shareDisclaimer } from '../services/sharing'
import { track } from '../services/analytics'
export default function ShareSheet({ outcome, close }: { outcome: Outcome; close: () => void }) {
  const portable = window.location.protocol === 'file:'
  const [url, setUrl] = useState(outcome.kind === 'local' && !portable ? `${window.location.origin}/` : '')
  const [error, setError] = useState<unknown>()
  const [status, setStatus] = useState('')
  const [generation, setGeneration] = useState(0)
  const [working, setWorking] = useState(false)
  useEffect(() => {
    if (outcome.kind === 'local') return
    let active = true
    getOrCreateChallenge(outcome.data.attemptId).then(challenge => { if (!safeUrl(challenge.challengeUrl, true)) throw new Error('Unavailable'); if (active) setUrl(challenge.challengeUrl) }).catch(e => { if (active) setError(e) })
    return () => { active = false }
  }, [outcome, generation])
  const { data } = outcome
  const text = `${data.profile.title} — ${data.score}/${data.maxScore} knowledge score on MetaboQuest${outcome.kind === 'local' ? ' (local, unverified)' : ''}. ${shareDisclaimer}`
  async function share() {
    if (working) return
    setWorking(true)
    const result = await nativeShare({ title: 'MetaboQuest by Steer', text, url })
    setStatus(result === 'shared' ? 'Shared!' : result === 'copied' ? 'Link copied. Share it wherever you like.' : result === 'manual' ? 'Select and copy the link below to share it.' : 'Sharing cancelled. Your link is ready whenever you are.')
    if (result === 'shared' || result === 'copied') track('RESULT_SHARED', { channel: result === 'shared' ? 'native' : 'clipboard' })
    setWorking(false)
  }
  async function copy() { const copied = await copyLink(url); setStatus(copied ? 'Link copied. Pass a little curiosity along.' : 'Clipboard unavailable. Select and copy the link below.'); if (copied) track('RESULT_SHARED', { channel: 'clipboard' }) }
  async function download() { if (working) return; setWorking(true); try { await (await import('../services/download')).downloadCard(data.profile.title, `${data.score} / ${data.maxScore}`, outcome.kind === 'local'); setStatus('Your PNG download is ready.'); track('RESULT_SHARED', { channel: 'png' }) } catch { setStatus('We couldn’t create the image. You can still copy or share the link.') } finally { setWorking(false) } }
  return <Dialog title="Good knowledge travels." close={close}><p>Send a little “aha!” to someone you know.</p><div className="share-preview"><span className="eyebrow">STEER · METABOQUEST</span><Icon name="trophy" /><h3>{data.profile.title}</h3><strong>{data.score} <span>/ {data.maxScore}</span></strong><small>{outcome.kind === 'local' ? 'Local playable result · Unverified' : 'Knowledge score'}</small><small>{shareDisclaimer}</small></div>
    {outcome.kind === 'local' && <p className="small">{portable ? 'This file has no public link. Download your result image or send the HTML file to a friend.' : 'Local results can share an invitation to play. Friend challenges need a connected result.'}</p>}
    {!url && !error && outcome.kind !== 'local' && <p role="status">Creating your public challenge link…</p>}{!!error && <ErrorNotice error={error} retry={() => { setError(undefined); setGeneration(n => n + 1) }} />}
    {url && <><label className="link-label" htmlFor="share-link">{outcome.kind === 'local' ? 'Quiz link' : 'Public challenge link'}</label><input id="share-link" className="share-url" value={url} readOnly onFocus={e => e.target.select()} /><div className="share-actions"><button className="button" aria-disabled={working || undefined} onClick={() => void share()}>Share result ↗</button><button className="button secondary" onClick={() => void copy()}>Copy link</button><a className="button secondary" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer" onClick={() => track('RESULT_SHARED', { channel: 'whatsapp' })}>WhatsApp ↗</a><button className="button secondary" aria-disabled={working || undefined} onClick={() => void download()}>Download PNG ↓</button></div><p className="small">If a sharing app doesn’t open, copy the link above.</p></>}
    {!url && <button className="button secondary" aria-disabled={working || undefined} onClick={() => void download()}>Download result PNG ↓</button>}<p className="share-status" role="status">{status}</p></Dialog>
}
