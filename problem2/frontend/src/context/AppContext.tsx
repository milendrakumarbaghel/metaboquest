import { useEffect, useReducer, type ReactNode } from 'react'
import { AppContext, initialState, reducer } from './store'
import { demo } from '../api/client'
import { papersApi } from '../api/papers'
import { packagesApi } from '../api/packages'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => {
    let active = true
    if (demo) {
      void import('../mockData').then(({ samplePaper, samplePackage }) => {
        if (active) {
          dispatch({ type: 'paper', paper: samplePaper, select: true })
          dispatch({ type: 'package', pkg: samplePackage, activate: true })
        }
      }).catch(() => {
        if (active) dispatch({ type: 'error', key: 'demo', value: 'The sample data could not load. Refresh to retry.' })
      })
    } else {
      const controller = new AbortController()
      void Promise.allSettled([
        papersApi.list(controller.signal),
        packagesApi.list(undefined, controller.signal)
      ]).then(([papersRes, packagesRes]) => {
        if (!active || controller.signal.aborted) return
        if (papersRes.status === 'fulfilled' && papersRes.value.length > 0) {
          dispatch({ type: 'papers', papers: papersRes.value })
        }
        if (packagesRes.status === 'fulfilled' && packagesRes.value.length > 0) {
          packagesRes.value.forEach((pkg, index) => {
            dispatch({ type: 'package', pkg, activate: index === 0 })
          })
        }
      }).catch(() => {
        /* Ignore on initial boot if backend is starting */
      })
      const connectivity = (event: Event) => dispatch({ type: 'offline', value: !(event as CustomEvent<boolean>).detail })
      window.addEventListener('studio-connectivity', connectivity)
      return () => { active = false; controller.abort(); window.removeEventListener('studio-connectivity', connectivity) }
    }
    const connectivity = (event: Event) => dispatch({ type: 'offline', value: !(event as CustomEvent<boolean>).detail })
    window.addEventListener('studio-connectivity', connectivity)
    return () => { active = false; window.removeEventListener('studio-connectivity', connectivity) }
  }, [])
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}
