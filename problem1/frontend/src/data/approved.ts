// Exact approved wording: backend V2 seed, with CDC URL updated by V4.
// Local scoring mirrors default game rules only; it is never server verified.
import type { Question, Feedback, LocalResult, Profile } from '../types'
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
export function scoreLocal(answers: Record<string, string>): LocalResult {
  const correctIds = [oid(2), oid(4), oid(5)]
  const feedback: Feedback[] = questions.map((q, i) => ({ questionId: q.id, correct: answers[q.id] === correctIds[i], explanation: explanations[i], sources: [sources[i]] }))
  const correctAnswers = feedback.filter(f => f.correct).length
  const profile: Profile = correctAnswers === 3 ? { code: 'MYTH_BUSTER', title: 'The Myth Buster', description: 'You separated every fact from fiction in this challenge.' } : correctAnswers === 2 ? { code: 'SMART_STRATEGIST', title: 'The Smart Strategist', description: 'You have a strong foundation and keep evidence at the centre.' } : { code: 'CURIOUS_EXPLORER', title: 'The Curious Explorer', description: 'You are building your knowledge of metabolic health.' }
  return { kind: 'local', data: { attemptId: `local-${crypto.randomUUID()}`, score: correctAnswers * 100, maxScore: 300, correctAnswers, totalQuestions: 3, profile, feedback, nextStep: { title: 'Explore doctor-led metabolic care', ctaText: 'Explore Steer', ctaUrl: '' }, disclaimer } }
}
