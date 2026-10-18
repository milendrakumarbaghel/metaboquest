-- Source-checked educational seed content, not evidence of clinical sign-off.
-- Reuses the NIDDK and CDC references already linked in V2/V4.
-- Session selections from older versions are retained by V6.
UPDATE question_sets SET version = 2, updated_at = now()
WHERE id = '10000000-0000-0000-0000-000000000001';

INSERT INTO quiz_questions (id, question_set_id, question_text, question_type, category, difficulty, explanation, display_order, active, review_status) VALUES
('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001',
 'Myth or fact: prescription weight-management medicines replace healthy eating and physical activity.', 'MYTH_OR_FACT', 'TREATMENT_SAFETY', 'EASY',
 'Myth. Medication can be part of care, but healthy eating and physical activity remain important. Treatment decisions belong with a qualified health professional.', 4, TRUE, 'APPROVED'),
('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001',
 'At a medication review, what should you tell your clinician about?', 'SCENARIO_BASED', 'TREATMENT_SAFETY', 'EASY',
 'Tell your clinician about other medicines, vitamins and supplements you use. This information helps them assess treatment suitability and possible interactions.', 5, TRUE, 'APPROVED'),
('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001',
 'Does weekly physical activity have to happen in one long session?', 'MULTIPLE_CHOICE', 'HEALTHY_HABITS', 'EASY',
 'No. Activity can be spread across the week in smaller chunks. Choose activities that suit your abilities and circumstances.', 6, TRUE, 'APPROVED'),
('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001',
 'Which activity is an example of moderate-intensity aerobic movement?', 'MULTIPLE_CHOICE', 'HEALTHY_HABITS', 'EASY',
 'Brisk walking is an example of moderate-intensity aerobic activity. General adult guidance combines aerobic movement with muscle-strengthening activities.', 7, TRUE, 'APPROVED'),
('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001',
 'When comparing weight-management programmes, which feature deserves attention?', 'SCENARIO_BASED', 'DOCTOR_LED_CARE', 'EASY',
 'Look for realistic goals and continuing support. A sustainable programme includes help with eating habits, physical activity and maintaining progress.', 8, TRUE, 'APPROVED'),
('30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001',
 'Myth or fact: a weight-management plan should include support for maintaining progress over time.', 'MYTH_OR_FACT', 'DOCTOR_LED_CARE', 'EASY',
 'Fact. Planning how to maintain progress is part of a sound programme. Long-term support and follow-up can help people sustain changes.', 9, TRUE, 'APPROVED');

INSERT INTO question_options (id, question_id, option_text, is_correct, display_order) VALUES
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000004', 'Fact', FALSE, 1),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000004', 'Myth', TRUE, 2),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000005', 'All other medicines, vitamins and supplements you use', TRUE, 1),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000005', 'Only products advertised as prescription medicines', FALSE, 2),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000006', 'Yes, shorter sessions do not count', FALSE, 1),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000006', 'No, it can be spread across the week in smaller chunks', TRUE, 2),
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000007', 'Brisk walking', TRUE, 1),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000007', 'Sitting while watching a fitness video', FALSE, 2),
('40000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000008', 'Realistic goals and continuing support', TRUE, 1),
('40000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000008', 'A promise of permanent results without ongoing habits', FALSE, 2),
('40000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000009', 'Myth', FALSE, 1),
('40000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000009', 'Fact', TRUE, 2);

INSERT INTO question_medical_sources (question_id, source_id) VALUES
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002'),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002'),
('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003'),
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000003');
