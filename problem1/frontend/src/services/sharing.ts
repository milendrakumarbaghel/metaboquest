export async function copyLink(url: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(url); return true } catch { return false }
}
export async function nativeShare(data: ShareData): Promise<'shared' | 'copied' | 'manual' | 'cancelled'> {
  if (navigator.share) {
    try { await navigator.share(data); return 'shared' } catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled' }
  }
  return await copyLink(data.url ?? '') ? 'copied' : 'manual'
}
