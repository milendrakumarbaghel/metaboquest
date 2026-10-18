import { useCallback } from 'react'
import { useApp, type ToastMessage } from '../context/store'
let sequence = 0
export function useToast() {
  const { dispatch } = useApp()
  return useCallback((text: string, type: ToastMessage['type'] = 'info') => dispatch({ type: 'toast', toast: { id: ++sequence, text, type } }), [dispatch])
}
