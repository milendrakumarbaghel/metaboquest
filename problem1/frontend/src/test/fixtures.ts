import type { Result, Session, Questions, Challenge, PublicChallenge } from '../types'
import { questions, scoreLocal } from '../data/approved'
export const session: Session = { sessionId: '00000000-0000-0000-0000-000000000001', questionSetId: '10000000-0000-0000-0000-000000000001', questionSetVersion: 1, totalQuestions: 3, status: 'STARTED' }
export const questionResponse: Questions = { questions, totalQuestions: 3, questionSetVersion: 1 }
export const answers = Object.fromEntries(questions.map(q => [q.id, q.options[1].id]))
export const result: Result = { ...scoreLocal(answers).data, attemptId: '50000000-0000-0000-0000-000000000001', resultToken: 'private-test-capability', nextStep: { title: 'Explore doctor-led metabolic care', ctaText: 'Explore Steer', ctaUrl: 'https://steerclub.com' } }
export const challenge: Challenge = { challengeCode: 'Abcdef1234567890', challengeUrl: 'https://quiz.example.com/challenge/Abcdef1234567890', creatorScore: 200, expiresAt: '2099-01-01T00:00:00Z' }
export const publicChallenge: PublicChallenge = { challengeCode: challenge.challengeCode, creatorScore: 200, achievement: 'The Smart Strategist', message: 'Your friend scored 200 points. Can you beat it?', active: true }
