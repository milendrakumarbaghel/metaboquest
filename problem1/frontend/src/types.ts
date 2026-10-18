export type QuestionType = 'MYTH_OR_FACT' | 'MULTIPLE_CHOICE' | 'SCENARIO_BASED'
export type QuestionCategory = 'GLP1_AWARENESS' | 'METABOLIC_HEALTH' | 'TREATMENT_SAFETY' | 'HEALTHY_HABITS' | 'DOCTOR_LED_CARE' | 'NUTRITION'
export interface Question { id: string; type: QuestionType; category: QuestionCategory; questionText: string; options: { id: string; text: string }[] }
export interface Session { sessionId: string; questionSetId: string; questionSetVersion: number; totalQuestions: number; status: 'STARTED' | 'COMPLETED' | 'EXPIRED' }
export interface Questions { questionSetVersion: number; totalQuestions: number; questions: Question[] }
export interface Submission { sessionId: string; answers: { questionId: string; selectedOptionId: string }[] }
export type ProfileCode = 'CURIOUS_EXPLORER' | 'SMART_STRATEGIST' | 'MYTH_BUSTER'
export interface Profile { code: ProfileCode; title: string; description: string }
export interface Source { title: string; organization: string; url: string; publicationDate: string | null }
export interface Feedback { questionId: string; correct: boolean; explanation: string; sources: Source[] }
export interface Result { attemptId: string; resultToken?: string | null; score: number; maxScore: number; correctAnswers: number; totalQuestions: number; profile: Profile; feedback: Feedback[]; nextStep: { title: string; ctaText: string; ctaUrl: string }; disclaimer: string }
export type SafeResult = Omit<Result, 'resultToken'>
export interface LocalResult { kind: 'local'; data: SafeResult }
export interface ConnectedResult { kind: 'connected'; data: SafeResult }
export type Outcome = LocalResult | ConnectedResult
export interface Challenge { challengeCode: string; challengeUrl: string; creatorScore: number; expiresAt: string }
export interface PublicChallenge { challengeCode: string; creatorScore: number; achievement: string; message: string; active: boolean }
export interface QuizDraft { mode: 'connected' | 'standalone'; sessionId: string; questions: Question[]; answers: Record<string, string>; index: number; startedAt: number; pending?: Submission; challenge?: PublicChallenge }
export interface ReviewContext { questions: Question[]; answers: Record<string, string>; challenge?: PublicChallenge }
