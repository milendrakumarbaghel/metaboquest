import { useEffect } from 'react'
import { useApp, type ToastMessage } from '../context/store'
function Item({ toast }: { toast: ToastMessage }) {
  const { dispatch } = useApp()
  useEffect(() => { const timer = setTimeout(() => dispatch({ type: 'dismiss', id: toast.id }), 4000); return () => clearTimeout(timer) }, [toast.id, dispatch])
  return <div className={`toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}><span>{toast.text}</span><button aria-label="Dismiss notification" onClick={() => dispatch({ type: 'dismiss', id: toast.id })}>×</button></div>
}
export default function Toast() { const { state } = useApp(); return <div className="toasts">{state.toasts.map(t => <Item key={t.id} toast={t} />)}</div> }
