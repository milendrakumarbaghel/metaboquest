import { Component, useEffect, useRef, type ReactNode } from 'react'
import { useApp } from './context/store'
import { demo } from './api/client'
import { usePollBatch } from './hooks/usePollBatch'
import Header from './components/Header'
import Toast from './components/Toast'
import PapersView from './components/PapersView'
import DoctorReviewView from './components/DoctorReviewView'
import MediaStudioView from './components/MediaStudioView'
import SchedulingView from './components/SchedulingView'
import EffortAuditView from './components/EffortAuditView'
import './App.css'
class ViewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div role="alert" className="error">This view could not display the returned data. Check the backend response format, then switch tabs to retry.</div> : this.props.children }
}
export default function App() {
  const { state } = useApp(); const main = useRef<HTMLElement>(null)
  usePollBatch()
  useEffect(() => { main.current?.focus() }, [state.activeTab])
  return <><a className="skip-link" href="#main">Skip to workspace</a>{demo && <div className="demo-banner">Demo mode — using sample data. Remove ?demo=true for live API.</div>}<div className="app-shell"><Header />{state.offline && <div className="offline-banner" role="alert">Unable to reach Science Studio. Check the configured API URL and that the Science Studio service is running, then retry.</div>}{state.errors.demo && <div className="error" role="alert">{state.errors.demo}</div>}<main id="main" ref={main} tabIndex={-1}><ViewBoundary key={`${state.activeTab}-${state.activePackageId}`}>
    {state.activeTab === 'papers' && <PapersView />}{state.activeTab === 'review' && <DoctorReviewView key={state.activePackageId} />}{state.activeTab === 'studio' && <MediaStudioView key={state.activePackageId} />}{state.activeTab === 'schedule' && <SchedulingView key={state.activePackageId} />}{state.activeTab === 'effort' && <EffortAuditView key={state.activePackageId} />}
  </ViewBoundary></main><footer><span><strong>steer</strong> Science Studio</span><p>Doctor-led · Evidence-first</p><a className="tiny-label" href="https://steerclub.com" target="_blank" rel="noreferrer">steerclub.com</a></footer></div><Toast /></>
}
