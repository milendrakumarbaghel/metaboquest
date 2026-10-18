import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, errorMessage } from '../services/api'
export function Arrow() { return <span aria-hidden="true">↗</span> }
export function Icon({ name }: { name: 'book' | 'spark' | 'friends' | 'compass' | 'trophy' | 'heart' }) {
  const paths = { book: <><path d="M12 6C8 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-6-1-10 2Z" /><path d="M12 6v15" /></>, spark: <path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z" />, friends: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 6" /></>, compass: <><circle cx="12" cy="12" r="10" /><path d="m16 8-2 6-6 2 2-6 6-2Z" /></>, trophy: <><path d="M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4m-4 2v7m-5 0h10" /></>, heart: <path d="M12 21 3 12C-3 5 6-2 12 5c6-7 15 0 9 7l-9 9Z" /> }
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
export function Loading({ text = 'Getting things ready…' }: { text?: string }) { return <div className="state-panel" role="status"><span className="loading-mark" aria-hidden="true">✳</span><h1>{text}</h1><p>A little curiosity goes a long way.</p></div> }
export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  const [now, setNow] = useState(Date.now)
  const retryAt = error instanceof ApiError ? error.retryAt : 0
  useEffect(() => { if (retryAt <= Date.now()) return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [retryAt])
  const seconds = Math.max(0, Math.ceil((retryAt - now) / 1000))
  return <div className="error-notice"><p role="alert">{errorMessage(error)}</p>{retry && <button className="button secondary" disabled={seconds > 0} onClick={retry}>{seconds ? `Try again in ${seconds}s` : 'Try again'}</button>}</div>
}
export function EmptyState({ title, children }: { title: string; children: ReactNode }) { return <section className="state-panel"><span className="eyebrow">A SMALL DETOUR</span><Icon name="compass" /><h1>{title}</h1><p>{children}</p><Link className="button" to="/topic">Play a new quiz <Arrow /></Link></section> }
// Keep Tab and Shift+Tab cycling inside the modal instead of escaping to the browser chrome.
function trapTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
  const first = items[0], end = items[items.length - 1]
  if (!first || !end) return
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); end.focus() }
  else if (!event.shiftKey && (document.activeElement === end || !event.currentTarget.contains(document.activeElement))) { event.preventDefault(); first.focus() }
}
export function Dialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const dialog = ref.current!; dialog.showModal(); return () => { dialog.close(); previous?.focus() } }, [])
  return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onCancel={close} onKeyDown={trapTab} onClick={e => { if (e.target === e.currentTarget) { const box = e.currentTarget.getBoundingClientRect(); if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) close() } }}><div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={close}>×</button></div>{children}</dialog>
}
