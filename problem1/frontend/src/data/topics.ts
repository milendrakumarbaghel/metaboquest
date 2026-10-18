import type { LearningTopic } from '../types'
// Educational interest only; never a medical assessment. Order = order shown on /topic.
export const topics: { value: LearningTopic; label: string; question: string; takeaway: string }[] = [
  { value: 'SAFETY', label: 'Is it safe?', question: 'What benefits and risks matter given my history and current medicines?', takeaway: 'Safety is personal. A doctor weighs benefits and risks against your history, your other medicines and plans such as pregnancy before anything is prescribed. A WhatsApp forward or a friend’s good experience cannot do that for you.' },
  { value: 'SIDE_EFFECTS', label: 'What about side effects?', question: 'Which symptoms should I report, and how do I reach my care team?', takeaway: 'Stomach effects such as nausea, constipation or loose motions are among the most reported, and tend to show up more when doses go up and settle over time. Smaller, lighter meals can help. Trouble keeping fluids down needs your care team, not a forwarded tip.' },
  { value: 'MUSCLE', label: 'Will I lose muscle?', question: 'How would we plan nutrition, strength activity and body-composition monitoring?', takeaway: 'Some muscle can be lost whenever weight comes down, whatever the method. Protein through the day (dal, paneer, curd, eggs, sattu, chana), strength work a couple of days a week and a body-composition check such as DEXA help a care team see what is changing besides the scale.' },
  { value: 'MAINTENANCE', label: 'Will the weight come back?', question: 'What would my long-term maintenance and follow-up plan look like?', takeaway: 'Weight management is long-term. In trials, many people regained a good part of the weight after stopping, so the plan for after (food habits, movement, follow-ups) matters as much as the plan for during. Festival weeks and travel are normal life, so a plan should expect them.' },
  { value: 'DIABETES', label: 'Is it only for diabetes?', question: 'Do my tests, waist and family history suggest any prescription treatment could suit me, with or without diabetes?', takeaway: 'These medicines were first used for type 2 diabetes and some are also used for weight management. The question is not “diabetic or not” but whether it suits you. Indians can carry metabolic risk at lower body weights, so a doctor looks at tests, waist and family history, not one sugar report.' },
  { value: 'ELIGIBILITY', label: 'Is it even for me?', question: 'Would any prescription treatment be appropriate for me, and what alternatives are there?', takeaway: 'No quiz can tell you whether a medicine is right for you. A doctor decides after your tests, history and goals. Sometimes the answer is “not now”, and food, movement and behavioural support still help.' },
  { value: 'GENERAL', label: 'Just curious', question: 'What should I understand before considering a weight-management programme?', takeaway: 'GLP-1 medicines are one tool inside doctor-led care. Tests come first, a doctor decides if they fit, and habits plus follow-up are what make results last.' },
]
// Mirrors RELATED_TOPICS in the backend QuizService: used to top up a topic that has fewer than 3 questions.
export const relatedTopics: Record<Exclude<LearningTopic, 'GENERAL'>, LearningTopic[]> = {
  SAFETY: ['SIDE_EFFECTS', 'ELIGIBILITY'],
  SIDE_EFFECTS: ['SAFETY'],
  MUSCLE: ['MAINTENANCE', 'SAFETY'],
  MAINTENANCE: ['MUSCLE', 'ELIGIBILITY'],
  DIABETES: ['ELIGIBILITY', 'SAFETY'],
  ELIGIBILITY: ['DIABETES', 'SAFETY'],
}
// Only a named reviewer may ever unlock "reviewed" wording in the UI. null = source-checked only, no clinical sign-off.
export const contentReview = { reviewedBy: null as string | null }
