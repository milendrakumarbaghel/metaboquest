import { useEffect } from 'react'
import { useApp } from '../context/store'
import { packagesApi } from '../api/packages'
import { message } from '../api/client'
export function usePollBatch() {
  const { state, dispatch } = useApp()
  const id = state.batch?.id; const running = state.batch?.status === 'RUNNING'
  useEffect(() => {
    if (!id || !running) return
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const batch = await packagesApi.getBatch(id!, controller.signal)
        if (controller.signal.aborted) return
        dispatch({ type: 'batch', batch }); dispatch({ type: 'error', key: 'batch-poll', value: null })
        if (batch.status === 'RUNNING') timer = setTimeout(() => void poll(), 3000)
      } catch (e) { if (!controller.signal.aborted) { dispatch({ type: 'error', key: 'batch-poll', value: message(e) }); timer = setTimeout(() => void poll(), 3000) } }
    }
    timer = setTimeout(() => void poll(), 3000)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [id, running, dispatch])
}
