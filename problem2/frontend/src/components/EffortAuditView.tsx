import { useEffect, useState } from 'react'
import { usePackage } from '../context/store'
import { getEffort } from '../api/effort'
import { demo, message } from '../api/client'
import type { HumanEffortView } from '../types'
import { Empty, InlineError, Skeleton } from './ui'
function Counter({ value }: { value: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => { let frame: number; const start = performance.now(); const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    function tick(now: number) { const progress = reduced ? 1 : Math.min(1, (now - start) / 1500); setCount(value * progress); if (progress < 1) frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [value])
  return <><span aria-hidden="true">{count.toFixed(1)}%</span><span className="sr-only">{value.toFixed(1)} percent</span></>
}
export default function EffortAuditView() {
  const pkg = usePackage(); const [effort, setEffort] = useState<HumanEffortView>(); const [error, setError] = useState(''); const [retry, setRetry] = useState(0)
  const id = pkg?.id
  useEffect(() => { if (!id) return; const controller = new AbortController(); getEffort(id, controller.signal).then(value => { if (!controller.signal.aborted) setEffort(value) }).catch(e => { if (!controller.signal.aborted) setError(message(e)) }); return () => controller.abort() }, [id, retry])
  if (!pkg) return <Empty title="Make a package. Measure the work.">The effort audit becomes available after a package is generated.</Empty>
  if (error) return <InlineError text={error} retry={() => { setError(''); setRetry(n => n + 1) }} />
  if (!effort) return <Skeleton label="Loading effort telemetry…" />
  const total = Math.round(effort.totalHumanSeconds)
  const rows = [{ label: 'Paper ingest', mode: 'Machine', value: effort.ingestSeconds, note: 'Source ingestion', color: 'rust' }, { label: 'AI extraction', mode: 'Machine', value: effort.extractionSeconds, note: 'Claim extraction and content generation', color: 'rust' }, { label: 'Doctor review', mode: 'Human', value: effort.reviewSeconds, note: 'Clinical review time reported by the backend', color: 'maroon' }, { label: 'Export & render', mode: 'Machine', value: effort.exportSeconds, note: 'Media generation', color: 'clay' }]
  const max = Math.max(1, ...rows.map(row => row.value))
  return <div><div className="page-heading"><div><span className="eyebrow">05 / HUMAN EFFORT AUDIT</span><h1>Less busywork.<br />More human judgement.</h1><p>{demo ? 'Illustrative sample metrics, not measured performance.' : 'Pipeline telemetry for this content package, reported by the backend.'}</p></div></div><div className="metric-grid">{rows.map((row, index) => <article className="card metric" key={row.label}><span className="tiny-label">0{index + 1} / {row.label}</span><strong>{row.mode === 'Human' ? (row.value / 60).toFixed(1) : row.value.toFixed(1)}<small>{row.mode === 'Human' ? 'min' : 'sec'}</small></strong><span className="muted">{row.mode === 'Human' ? 'Human expertise' : 'Machine processing'}</span></article>)}</div><section className="impact-banner"><div><span className="eyebrow">ROOM FOR WHAT MATTERS</span><h2>Total human time: {Math.floor(total / 60)} min {total % 60} sec</h2><p>vs manual baseline: {(effort.manualBaselineSeconds / 3600).toFixed(1)} hrs</p></div><div><strong><Counter value={effort.timeSavedPercentage} /></strong><span>time saved {demo ? '· sample' : '· reported'}</span></div></section><div className="audit-grid"><section className="card"><h2>Where the time goes</h2><p className="muted">Stage duration in seconds. Human and machine time shown separately.</p><div className="bars">{rows.map(row => <div key={row.label}><span>{row.label}</span><div className="bar-track"><div style={{ width: `${Math.max(0, row.value) / max * 100}%`, background: `var(--${row.color})` }} /></div><strong>{row.value.toFixed(1)}s</strong></div>)}</div></section><section className="card traceability"><h2>Evidence traceability</h2><div className="table-scroll"><table><caption className="sr-only">Time spent at each production stage</caption><thead><tr><th>Stage</th><th>Mode</th><th>Time</th><th>Notes</th></tr></thead><tbody>{rows.map(row => <tr key={row.label}><th>{row.label}</th><td>{row.mode}</td><td>{row.value.toFixed(1)}s</td><td>{row.note}</td></tr>)}<tr className="total"><th>Total human</th><td>Human</td><td>{(effort.totalHumanSeconds / 60).toFixed(1)}m</td><td>vs {(effort.manualBaselineSeconds / 3600).toFixed(1)}hr manual baseline</td></tr></tbody></table></div></section></div></div>
}
