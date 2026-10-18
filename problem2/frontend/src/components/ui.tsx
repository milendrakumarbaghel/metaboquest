import { useEffect, useRef, type ReactNode } from 'react'
export function Badge({ value }: { value: string }) { return <span className={`badge badge-${value.toLowerCase()}`}>{value.replaceAll('_', ' ')}</span> }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="empty"><span className="empty-mark" aria-hidden="true">✳</span><h2>{title}</h2><p>{children}</p></div> }
export function Skeleton({ label = 'Loading…' }: { label?: string }) { return <div role="status" className="skeleton-wrap"><span>{label}</span><div className="skeleton" /><div className="skeleton short" /><div className="skeleton" /></div> }
export function InlineError({ text, retry }: { text?: string | null; retry?: () => void }) { return text ? <div className="error" role="alert"><span>{text}</span>{retry && <button className="secondary" onClick={retry}>Retry</button>}</div> : null }
export function Dialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const dialog = ref.current!; dialog.showModal(); return () => { dialog.close(); previous?.focus() } }, [])
  return <dialog ref={ref} aria-labelledby="modal-title" onCancel={close}><div className="dialog-head"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={close}>×</button></div>{children}</dialog>
}
