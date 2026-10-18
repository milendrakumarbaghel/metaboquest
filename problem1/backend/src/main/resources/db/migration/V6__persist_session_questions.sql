CREATE TABLE quiz_session_questions (
    session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE RESTRICT,
    position INTEGER NOT NULL CHECK (position >= 0),
    PRIMARY KEY (session_id, position),
    UNIQUE (session_id, question_id)
);

-- Preserve the original questions for sessions created before random selection.
-- This runs before the pool expansion so in-progress quizzes keep their content.
INSERT INTO quiz_session_questions (session_id, question_id, position)
SELECT s.id, q.id, (row_number() OVER (PARTITION BY s.id ORDER BY q.display_order) - 1)::integer
FROM quiz_sessions s
JOIN quiz_questions q ON q.question_set_id = s.question_set_id
WHERE q.active AND q.review_status = 'APPROVED';
