export async function downloadCard(title: string, score: string, local: boolean): Promise<void> {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1080
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Image unavailable')
  ctx.fillStyle = '#f5ebdf'; ctx.fillRect(0, 0, 1080, 1080)
  ctx.strokeStyle = '#b58777'; ctx.lineWidth = 2; ctx.strokeRect(35, 35, 1010, 1010)
  ctx.fillStyle = '#661414'; ctx.font = 'bold 48px sans-serif'; ctx.fillText('steer ↗', 90, 130)
  ctx.font = '22px sans-serif'; ctx.fillText('METABOQUEST · A LITTLE CURIOSITY GOES A LONG WAY', 90, 195)
  ctx.fillStyle = '#c04e2a'; ctx.beginPath(); ctx.arc(540, 360, 92, 0, Math.PI * 2); ctx.fill()
  ctx.textAlign = 'center'; ctx.fillStyle = '#f8f2eb'; ctx.font = '100px serif'; ctx.fillText('✳', 540, 393)
  ctx.fillStyle = '#661414'; ctx.font = '64px Georgia'
  const words = title.split(' '); const lines: string[] = []; let line = ''
  for (const word of words) { const next = line ? `${line} ${word}` : word; if (ctx.measureText(next).width > 880 && line) { lines.push(line); line = word } else line = next }
  lines.push(line); lines.forEach((value, index) => ctx.fillText(value, 540, 540 + index * 76))
  ctx.font = 'bold 60px sans-serif'; ctx.fillText(score, 540, 750)
  ctx.font = '24px sans-serif'; ctx.fillText(local ? 'LOCAL PLAYABLE RESULT · UNVERIFIED' : 'KNOWLEDGE QUIZ RESULT', 540, 815)
  ctx.font = '28px Georgia'; ctx.fillText('Three questions. What will you discover?', 540, 910)
  ctx.font = '19px sans-serif'; ctx.fillText('An educational knowledge quiz. Not a health assessment.', 540, 980)
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image unavailable')), 'image/png'))
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'metaboquest-result.png'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000)
}
