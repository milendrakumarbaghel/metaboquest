import { useEffect, useReducer, type ReactNode } from 'react'
import { AppContext, initialState, reducer } from './store'
import { demo } from '../api/client'
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => {
    let active = true
    if (demo) void import('../mockData').then(({ samplePaper, samplePackage }) => { if (active) { dispatch({ type: 'paper', paper: samplePaper, select: true }); dispatch({ type: 'package', pkg: samplePackage, activate: true }) } }).catch(() => { if (active) dispatch({ type: 'error', key: 'demo', value: 'The sample data could not load. Refresh to retry.' }) })
    const connectivity = (event: Event) => dispatch({ type: 'offline', value: !(event as CustomEvent<boolean>).detail })
    window.addEventListener('studio-connectivity', connectivity)
    return () => { active = false; window.removeEventListener('studio-connectivity', connectivity) }
  }, [])
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}
