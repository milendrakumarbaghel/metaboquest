INSERT INTO question_sets (id, title, description, version, language, active)
VALUES ('10000000-0000-0000-0000-000000000001', 'MetaboQuest evidence challenge',
        'Three short questions about safe, sustainable and doctor-led metabolic care.', 1, 'en-IN', TRUE);

INSERT INTO medical_sources (id, title, organization, source_url, accessed_at, source_type) VALUES
('20000000-0000-0000-0000-000000000001', 'Prescription Medications to Treat Overweight and Obesity', 'National Institute of Diabetes and Digestive and Kidney Diseases',
 'https://www.niddk.nih.gov/health-information/weight-management/prescription-medications-treat-overweight-obesity', '2026-10-17T00:00:00Z', 'GOVERNMENT_GUIDANCE'),
('20000000-0000-0000-0000-000000000002', 'Adult Activity: An Overview', 'Centers for Disease Control and Prevention',
 'https://www.cdc.gov/physical-activity/php/about/index.html', '2026-10-17T00:00:00Z', 'GOVERNMENT_GUIDANCE'),
('20000000-0000-0000-0000-000000000003', 'Choosing a Safe and Successful Weight-loss Program', 'National Institute of Diabetes and Digestive and Kidney Diseases',
 'https://www.niddk.nih.gov/health-information/weight-management/choosing-a-safe-successful-weight-loss-program', '2026-10-17T00:00:00Z', 'GOVERNMENT_GUIDANCE');

INSERT INTO quiz_questions (id, question_set_id, question_text, question_type, category, difficulty, explanation, display_order, active, review_status) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
 'Before starting a prescription medicine for weight management, what should come first?', 'SCENARIO_BASED', 'TREATMENT_SAFETY', 'EASY',
 'A qualified health professional should assess whether a prescription treatment is appropriate and discuss its possible benefits and risks. A social-media post cannot replace an individual medical assessment.', 1, TRUE, 'APPROVED'),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
 'Between desk work, chai breaks and family dinners, which routine matches general activity guidance for adults?', 'MULTIPLE_CHOICE', 'HEALTHY_HABITS', 'MEDIUM',
 'General guidance for adults includes at least 150 minutes of moderate-intensity activity each week and muscle-strengthening activity on at least 2 days. Individual needs and abilities vary.', 2, TRUE, 'APPROVED'),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
 'Myth or fact: a quick fix with no follow-up is the strongest plan for long-term weight management.', 'MYTH_OR_FACT', 'DOCTOR_LED_CARE', 'EASY',
 'Myth. Reputable programmes focus on realistic goals, healthy eating and activity habits, ongoing monitoring and support, and a plan for maintaining progress over time.', 3, TRUE, 'APPROVED');

INSERT INTO question_options (id, question_id, option_text, is_correct, display_order) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Advice from social-media testimonials', FALSE, 1),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'An assessment and benefit-risk discussion with a qualified clinician', TRUE, 2),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Only one hard workout each month', FALSE, 1),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'At least 150 minutes of moderate activity weekly plus strengthening on 2 days', TRUE, 2),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 'Myth', TRUE, 1),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003', 'Fact', FALSE, 2);

INSERT INTO question_medical_sources (question_id, source_id) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003');
