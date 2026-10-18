export function date(value: string) { const d = new Date(value); return Number.isNaN(d.valueOf()) ? 'Date unavailable' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) }
export function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
