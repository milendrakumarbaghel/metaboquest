// Loaded only in explicit ?demo=true mode. Illustrative workflow data, not medical evidence.
import type { PaperView, PackageView, Language, GenerateInput, BatchView, ScheduledPostView, ReviewInput, Decision, ScheduleInput } from './types'
const now = () => new Date().toISOString()
export const samplePaper: PaperView = { id: 'demo-paper', title: 'From research to responsible communication — sample paper', sourceType: 'PDF', fileName: 'sample-paper.pdf', sourceDownloadUrl: '', pageCount: 8, status: 'EXTRACTED', createdAt: now() }
const content: Record<Language, { message: string; slides: { headline: string; body: string }[] }> = {
  en: { message: 'Good science deserves careful storytelling.', slides: [{ headline: 'A finding is a starting point.', body: 'Read the context before sharing the conclusion.' }, { headline: 'Look at the whole study.', body: 'Who was studied? What was measured? What are the limitations?' }, { headline: 'Keep the evidence close.', body: 'Make every claim traceable to its source.' }, { headline: 'A human checks the story.', body: 'Clinical review comes before publication.' }] },
  hi: { message: 'अच्छे विज्ञान की कहानी सावधानी से कहें।', slides: [{ headline: 'हर निष्कर्ष एक शुरुआत है।', body: 'निष्कर्ष साझा करने से पहले उसका संदर्भ पढ़ें।' }, { headline: 'पूरे अध्ययन को समझें।', body: 'किसका अध्ययन हुआ? क्या मापा गया? सीमाएँ क्या हैं?' }, { headline: 'साक्ष्य साथ रखें।', body: 'हर दावे को उसके स्रोत से जोड़ें।' }, { headline: 'विशेषज्ञ की समीक्षा ज़रूरी है।', body: 'प्रकाशन से पहले चिकित्सकीय समीक्षा होती है।' }] },
  hinglish: { message: 'Science ki kahaani, zimmedaari ke saath.', slides: [{ headline: 'Har finding ek starting point hai.', body: 'Conclusion share karne se pehle context padhein.' }, { headline: 'Poori study ko samjhein.', body: 'Kiski study hui? Kya measure hua? Limitations kya hain?' }, { headline: 'Evidence ko saath rakhein.', body: 'Har claim ko uske source se jodein.' }, { headline: 'Expert review pehle.', body: 'Publish karne se pehle clinical review zaroori hai.' }] },
}
function makePackage(paper: PaperView, language: Language = 'en', audience = 'Adults in India curious about metabolic health'): PackageView {
  const id = crypto.randomUUID(); const copy = content[language]
  const claims = ['Context belongs beside a conclusion.', 'Claims should remain traceable to the source.', 'A reviewer checks the content before publishing.'].map((text, i) => ({ id: `${id}-claim-${i}`, claimText: text, plainLanguage: text, evidenceQuote: `Illustrative sample text: ${text} This is demo content, not a quotation from medical research.`, pageNumber: i + 2, section: 'Demonstration', confidence: .92 - i * .12, evidenceVerified: true, reviewStatus: 'PENDING' as const }))
  return { id, paper, language, audience, coreMessage: copy.message, reasoning: 'Sample workflow illustrating source traceability and a human approval gate. Not clinical evidence.', status: 'AWAITING_REVIEW', aiProvider: 'Demo fixture', promptVersion: 'sample-1', estimatedHumanMinutes: 3, readyForApproval: false, claims, createdAt: now(), assets: [
    { id: `${id}-carousel`, type: 'CAROUSEL', title: 'The evidence, in context', payload: { slides: copy.slides, dimensions: '1080 × 1350' }, claimIds: claims.map(c => c.id), status: 'DRAFT' },
    { id: `${id}-static`, type: 'STATIC', title: 'A thoughtful takeaway', payload: { headline: copy.message, body: copy.slides[0].body, footer: 'Demonstration only · Steer Science Studio', dimensions: '1080 × 1350' }, claimIds: claims.map(c => c.id), status: 'DRAFT' },
    { id: `${id}-reel`, type: 'REEL', title: 'A story worth checking', payload: { hook: copy.message, totalSeconds: 20, musicMood: 'Calm and thoughtful', scenes: copy.slides.map((s, i) => ({ time: `${i * 5}–${(i + 1) * 5}s`, visual: 'Editorial typography with a paper motif.', voiceover: s.body, subtitle: s.headline })), bRollPrompts: ['A paper on a warm cream desk.', 'A reviewer checking a source.'] }, claimIds: claims.map(c => c.id), status: 'DRAFT' },
    { id: `${id}-caption`, type: 'CAPTION', title: 'Caption', payload: { text: `${copy.message} This is sample content demonstrating the review workflow.`, hashtags: ['#ScienceCommunication', '#Steer'] }, claimIds: claims.map(c => c.id), status: 'DRAFT' },
  ] }
}
export const samplePackage = makePackage(samplePaper)
const papers = new Map([[samplePaper.id, samplePaper]])
const packages = new Map([[samplePackage.id, samplePackage]])
const batches = new Map<string, BatchView>()
const schedules = new Map<string, ScheduledPostView>()
export async function demoRequest<T>(path: string, options: RequestInit): Promise<T> {
  if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
  const method = options.method ?? 'GET'
  const body = typeof options.body === 'string' ? JSON.parse(options.body) : {}
  const segments = path.split('/')
  let response: unknown
  if (path === '/api/v1/papers/upload' || path === '/api/v1/papers/from-url') {
    const file = options.body instanceof FormData ? options.body.get('file') as File : null
    const paper: PaperView = { ...samplePaper, id: crypto.randomUUID(), title: body.title || (options.body instanceof FormData ? options.body.get('title')?.toString().trim() : '') || file?.name || 'Imported demonstration paper', sourceType: file ? 'PDF' : 'URL', fileName: file?.name, sourceUrl: body.url, createdAt: now() }
    papers.set(paper.id, paper); response = paper
  } else if (segments[3] === 'papers' && segments[5] === 'generate') {
    const paper = papers.get(segments[4]); if (!paper) throw new Error('Sample paper not found.')
    const input = body as GenerateInput; const pkg = makePackage(paper, input.language, input.audience); packages.set(pkg.id, pkg); response = pkg
  } else if (segments[3] === 'papers' && segments.length === 4) {
    response = Array.from(papers.values())
  } else if (segments[3] === 'papers') {
    response = papers.get(segments[4])
  } else if (segments[3] === 'packages' && segments.length === 4) {
    response = Array.from(packages.values())
  }
  else if (path === '/api/v1/batches' && method === 'POST') {
    const ids = (body.paperIds as string[]).map(id => { const pkg = makePackage(papers.get(id)!, body.language, body.audience); packages.set(pkg.id, pkg); return pkg.id })
    const batch: BatchView = { id: crypto.randomUUID(), status: 'COMPLETED', requestedCount: ids.length, completedCount: ids.length, failedCount: 0, packageIds: ids, errors: {}, createdAt: now(), completedAt: now() }; batches.set(batch.id, batch); response = batch
  } else if (segments[3] === 'batches') response = batches.get(segments[4])
  else if (segments[3] === 'review') {
    const pkg = packages.get(segments[5]); if (!pkg) throw new Error('Sample package not found.')
    const input = body as ReviewInput
    if (segments[6] === 'claims') { const claim = pkg.claims.find(c => c.id === segments[7]); if (!claim) throw new Error('Sample claim not found.'); Object.assign(claim, { reviewStatus: body.approved ? 'APPROVED' : 'REJECTED', reviewer: input.actor, reviewNote: input.note, reviewedAt: now() }); pkg.readyForApproval = pkg.claims.every(c => c.reviewStatus === 'APPROVED'); response = claim }
    else { pkg.status = body.decision as Decision; pkg.assets.forEach(a => { a.status = pkg.status === 'APPROVED' ? 'APPROVED' : 'DRAFT' }); response = pkg }
  } else if (segments[3] === 'packages') {
    const id = segments[4]; const pkg = packages.get(id); if (!pkg) throw new Error('Sample package not found.')
    if (segments[5] === 'schedule') {
      if (method === 'POST') { const input = body as ScheduleInput; schedules.set(id, { ...input, id: crypto.randomUUID(), packageId: id, status: 'SCHEDULED', createdAt: now() }) }
      response = schedules.get(id)
    } else if (segments[5] === 'publish') { const schedule = schedules.get(id); if (!schedule) throw new Error('Create a sample schedule first.'); schedule.status = 'PUBLISHED'; schedule.publishedAt = now(); schedule.metaPublishedId = 'DEMO-NOT-PUBLISHED'; response = schedule }
    else if (segments[5] === 'effort') response = { ingestSeconds: 2.1, extractionSeconds: 3.6, reviewSeconds: 75, exportSeconds: 1.8, totalHumanSeconds: 75, manualBaselineSeconds: 12600, timeSavedPercentage: 99.4 }
    else if (segments[5] === 'export') response = { demonstration: true, packageId: id, assets: pkg.assets }
    else response = pkg
  }
  return structuredClone(response) as T
}
