import { useRef } from 'react'
import { useApp } from '../context/store'
import { message } from '../api/client'
import { useToast } from './useToast'
export function useOperation(key: string) {
  const { state, dispatch } = useApp(); const toast = useToast(); const locked = useRef(false)
  async function run(action: () => Promise<void>) {
    if (locked.current) return
    locked.current = true; dispatch({ type: 'loading', key, value: true }); dispatch({ type: 'error', key, value: null })
    try { await action() } catch (e) { dispatch({ type: 'error', key, value: message(e) }); toast(message(e), 'error') }
    finally { locked.current = false; dispatch({ type: 'loading', key, value: false }) }
  }
  return { run, busy: !!state.loading[key], error: state.errors[key] }
}
