// Seed wording: backend V2/V7/V8, curated bank V9 (glp1-topic-bank-v9.json), with CDC URL updated by V4.
// Local scoring mirrors default game rules only; it is never server verified.
import type { LearningTopic, Question, Feedback, LocalResult, Profile, Source } from '../types'
import bank from '../../../backend/src/main/resources/data/glp1-question-bank.json' with { type: 'json' }
import topicBank from '../../../backend/src/main/resources/data/glp1-topic-bank-v9.json' with { type: 'json' }
import { relatedTopics } from './topics'
export const disclaimer = 'This quiz is for general educational purposes only. It does not provide medical advice, diagnosis, or treatment recommendations.'
const qid = (n: number) => `30000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const oid = (n: number) => `40000000-0000-0000-0000-${String(n).padStart(12, '0')}`
export const questions: Question[] = [
  { id: qid(1), type: 'SCENARIO_BASED', category: 'TREATMENT_SAFETY', questionText: 'Before starting a prescription medicine for weight management, what should come first?', options: [{ id: oid(1), text: 'Advice from social-media testimonials' }, { id: oid(2), text: 'An assessment and benefit-risk discussion with a qualified clinician' }] },
  { id: qid(2), type: 'MULTIPLE_CHOICE', category: 'HEALTHY_HABITS', questionText: 'Between desk work, chai breaks and family dinners, which routine matches general activity guidance for adults?', options: [{ id: oid(3), text: 'Only one hard workout each month' }, { id: oid(4), text: 'At least 150 minutes of moderate activity weekly plus strengthening on 2 days' }] },
  { id: qid(3), type: 'MYTH_OR_FACT', category: 'DOCTOR_LED_CARE', questionText: 'Myth or fact: a quick fix with no follow-up is the strongest plan for long-term weight management.', options: [{ id: oid(5), text: 'Myth' }, { id: oid(6), text: 'Fact' }] },
]
const explanations = [
  'A qualified health professional should assess whether a prescription treatment is appropriate and discuss its possible benefits and risks. A social-media post cannot replace an individual medical assessment.',
  'General guidance for adults includes at least 150 minutes of moderate-intensity activity each week and muscle-strengthening activity on at least 2 days. Individual needs and abilities vary.',
  'Myth. Reputable programmes focus on realistic goals, healthy eating and activity habits, ongoing monitoring and support, and a plan for maintaining progress over time.',
]
const sources = [
  { title: 'Prescription Medications to Treat Overweight and Obesity', organization: 'National Institute of Diabetes and Digestive and Kidney Diseases', url: 'https://www.niddk.nih.gov/health-information/weight-management/prescription-medications-treat-overweight-obesity', publicationDate: null },
  { title: 'Adult Activity: An Overview', organization: 'Centers for Disease Control and Prevention', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html', publicationDate: null },
  { title: 'Choosing a Safe and Successful Weight-loss Program', organization: 'National Institute of Diabetes and Digestive and Kidney Diseases', url: 'https://www.niddk.nih.gov/health-information/weight-management/choosing-a-safe-successful-weight-loss-program', publicationDate: null },
]
const extra = [
  { number: 4, type: 'MYTH_OR_FACT', category: 'TREATMENT_SAFETY', text: 'Myth or fact: prescription weight-management medicines replace healthy eating and physical activity.', options: ['Fact', 'Myth'], correct: 8, explanation: 'Myth. Medication can be part of care, but healthy eating and physical activity remain important. Treatment decisions belong with a qualified health professional.', source: 0 },
  { number: 5, type: 'SCENARIO_BASED', category: 'TREATMENT_SAFETY', text: 'At a medication review, what should you tell your clinician about?', options: ['All other medicines, vitamins and supplements you use', 'Only products advertised as prescription medicines'], correct: 9, explanation: 'Tell your clinician about other medicines, vitamins and supplements you use. This information helps them assess treatment suitability and possible interactions.', source: 0 },
  { number: 6, type: 'MULTIPLE_CHOICE', category: 'HEALTHY_HABITS', text: 'Does weekly physical activity have to happen in one long session?', options: ['Yes, shorter sessions do not count', 'No, it can be spread across the week in smaller chunks'], correct: 12, explanation: 'No. Activity can be spread across the week in smaller chunks. Choose activities that suit your abilities and circumstances.', source: 1 },
  { number: 7, type: 'MULTIPLE_CHOICE', category: 'HEALTHY_HABITS', text: 'Which activity is an example of moderate-intensity aerobic movement?', options: ['Brisk walking', 'Sitting while watching a fitness video'], correct: 13, explanation: 'Brisk walking is an example of moderate-intensity aerobic activity. General adult guidance combines aerobic movement with muscle-strengthening activities.', source: 1 },
  { number: 8, type: 'SCENARIO_BASED', category: 'DOCTOR_LED_CARE', text: 'When comparing weight-management programmes, which feature deserves attention?', options: ['Realistic goals and continuing support', 'A promise of permanent results without ongoing habits'], correct: 15, explanation: 'Look for realistic goals and continuing support. A sustainable programme includes help with eating habits, physical activity and maintaining progress.', source: 2 },
  { number: 9, type: 'MYTH_OR_FACT', category: 'DOCTOR_LED_CARE', text: 'Myth or fact: a weight-management plan should include support for maintaining progress over time.', options: ['Myth', 'Fact'], correct: 18, explanation: 'Fact. Planning how to maintain progress is part of a sound programme. Long-term support and follow-up can help people sustain changes.', source: 2 },
] satisfies Array<{ number: number; type: Question['type']; category: Question['category']; text: string; options: string[]; correct: number; explanation: string; source: number }>

const originalTopics: LearningTopic[] = ['SAFETY', 'MUSCLE', 'MAINTENANCE', 'SAFETY', 'SAFETY', 'MUSCLE', 'MUSCLE', 'MAINTENANCE', 'MAINTENANCE']
const retitles = new Map(topicBank.retitle.map(item => [item.url, item.title]))
const reassigned = new Map(topicBank.reassign.map(item => [item.number, item.topic as LearningTopic]))
const retired = new Set(topicBank.retire)
const source = (item: { title: string; organization: string; url: string }): Source => ({ title: retitles.get(item.url) ?? item.title, organization: item.organization, url: item.url, publicationDate: null })
const sourceByKey = new Map(topicBank.sources.map(item => [item.key, source(item)]))
interface Entry { number: number; topic: LearningTopic; question: Question; correctOptionId: string; explanation: string; sources: Source[]; active: boolean }
const entry = (number: number, topic: LearningTopic, question: Omit<Question, 'id'>, correctOptionId: string, explanation: string, sources: Source[]): Entry => ({ number, topic: reassigned.get(number) ?? topic, question: { id: qid(number), ...question }, correctOptionId, explanation, sources, active: !retired.has(number) })
const legacy = questions.map((q, i) => entry(i + 1, originalTopics[i], q, [oid(2), oid(4), oid(5)][i], explanations[i], [source(sources[i])]))
const legacyExtra = extra.map(q => entry(q.number, originalTopics[q.number - 1], { type: q.type, category: q.category, questionText: q.text, options: q.options.map((text, index) => ({ id: oid(q.number * 2 - 1 + index), text })) }, oid(q.correct), q.explanation, [source(sources[q.source])]))
const v8 = bank.questions.map(q => entry(q.number, q.topic as LearningTopic, { type: q.type as Question['type'], category: q.category as Question['category'], questionText: q.text, options: q.options.map((text, i) => ({ id: oid(q.number * 2 - 1 + i), text })) }, oid(q.number * 2 - 1 + q.correct), q.explanation, [source(bank.sources[q.source])]))
const optionId = (number: number, index: number) => oid(number * 10 + index + 1)
const v9 = topicBank.questions.map(q => entry(q.number, q.topic as LearningTopic, { type: q.type as Question['type'], category: q.category as Question['category'], questionText: q.text, options: q.options.map((text, i) => ({ id: optionId(q.number, i), text })) }, optionId(q.number, q.correct), q.explanation, q.sourceKeys.map(key => sourceByKey.get(key)!)))
const entries = [...legacy, ...legacyExtra, ...v8, ...v9]
// Retired questions leave the pool but stay in the answer key so an in-flight draft still scores.
const answerKey = new Map(entries.map(item => [item.question.id, item]))
export const questionPool: Question[] = entries.filter(item => item.active).map(item => item.question)
export const questionTopics = new Map(entries.map(item => [item.question.id, item.topic]))

function shuffled<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
// Mirrors the backend QuizService: on-topic first, then related topics, then any published question; surprise mode = one per concern.
export function selectQuestions(topic: LearningTopic = 'GENERAL'): Question[] {
  if (topic === 'GENERAL') {
    const seen = new Set<LearningTopic>()
    return shuffled(questionPool).filter(q => { const value = questionTopics.get(q.id)!; if (seen.has(value)) return false; seen.add(value); return true }).slice(0, 3)
  }
  const picked = shuffled(questionPool.filter(q => questionTopics.get(q.id) === topic)).slice(0, 3)
  for (const next of [...relatedTopics[topic], undefined]) {
    if (picked.length >= 3) break
    const more = shuffled(questionPool.filter(q => !picked.includes(q) && (next === undefined || questionTopics.get(q.id) === next)))
    picked.push(...more.slice(0, 3 - picked.length))
  }
  return picked
}

export function revealAnswer(questionId: string, optionId: string): { correct: boolean; correctOptionId: string; explanation: string; sources: Source[] } | undefined {
  const item = answerKey.get(questionId)
  return item && { correct: item.correctOptionId === optionId, correctOptionId: item.correctOptionId, explanation: item.explanation, sources: item.sources }
}

export function scoreLocal(answers: Record<string, string>, selected: Question[] = questions): LocalResult {
  const feedback: Feedback[] = selected.map(q => {
    const item = answerKey.get(q.id)
    if (!item) throw new Error('Unknown standalone question')
    return { questionId: q.id, correct: answers[q.id] === item.correctOptionId, explanation: item.explanation, sources: item.sources }
  })
  const correctAnswers = feedback.filter(f => f.correct).length
  const profile: Profile = correctAnswers === 3 ? { code: 'MYTH_BUSTER', title: 'The Myth Buster', description: 'You separated every fact from fiction in this challenge.' } : correctAnswers === 2 ? { code: 'SMART_STRATEGIST', title: 'The Smart Strategist', description: 'You have a strong foundation and keep evidence at the centre.' } : { code: 'CURIOUS_EXPLORER', title: 'The Curious Explorer', description: 'You are building your knowledge of metabolic health.' }
  return { kind: 'local', data: { attemptId: `local-${crypto.randomUUID()}`, score: correctAnswers * 100, maxScore: selected.length * 100, correctAnswers, totalQuestions: selected.length, profile, feedback, nextStep: { title: 'Want a doctor to look at your own numbers?', ctaText: 'See if the programme fits you', ctaUrl: '' }, disclaimer } }
}
