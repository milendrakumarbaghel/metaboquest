CREATE TABLE question_sets (
    id UUID PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(500) NOT NULL,
    version INTEGER NOT NULL CHECK (version > 0),
    language VARCHAR(10) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_question_set_version_language UNIQUE (version, language)
);
CREATE UNIQUE INDEX uq_one_active_question_set_language ON question_sets(language) WHERE active;

CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY,
    question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE RESTRICT,
    question_text TEXT NOT NULL,
    question_type VARCHAR(32) NOT NULL CHECK (question_type IN ('MYTH_OR_FACT','MULTIPLE_CHOICE','SCENARIO_BASED')),
    category VARCHAR(32) NOT NULL CHECK (category IN ('GLP1_AWARENESS','METABOLIC_HEALTH','TREATMENT_SAFETY','HEALTHY_HABITS','DOCTOR_LED_CARE','NUTRITION')),
    difficulty VARCHAR(16) NOT NULL CHECK (difficulty IN ('EASY','MEDIUM','HARD')),
    explanation TEXT NOT NULL,
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    active BOOLEAN NOT NULL DEFAULT FALSE,
    review_status VARCHAR(16) NOT NULL CHECK (review_status IN ('DRAFT','APPROVED','REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_question_order UNIQUE (question_set_id, display_order)
);
CREATE INDEX idx_questions_public ON quiz_questions(question_set_id, review_status, active, display_order);

CREATE TABLE question_options (
    id UUID PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text VARCHAR(500) NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    CONSTRAINT uq_option_order UNIQUE (question_id, display_order)
);
CREATE UNIQUE INDEX uq_one_correct_option ON question_options(question_id) WHERE is_correct;

CREATE TABLE medical_sources (
    id UUID PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    organization VARCHAR(200) NOT NULL,
    source_url VARCHAR(1000) NOT NULL,
    publication_date DATE,
    accessed_at TIMESTAMPTZ,
    source_type VARCHAR(40) NOT NULL CHECK (source_type IN ('GOVERNMENT_GUIDANCE','PEER_REVIEWED_RESEARCH','CLINICAL_GUIDANCE','ORGANIZATION_WEBSITE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_medical_source_url UNIQUE (source_url),
    CONSTRAINT ck_medical_source_https CHECK (source_url LIKE 'https://%')
);

CREATE TABLE question_medical_sources (
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES medical_sources(id) ON DELETE RESTRICT,
    PRIMARY KEY (question_id, source_id)
);

CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY,
    question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE RESTRICT,
    question_set_version INTEGER NOT NULL CHECK (question_set_version > 0),
    status VARCHAR(16) NOT NULL CHECK (status IN ('STARTED','COMPLETED','EXPIRED')),
    started_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_session_expiry CHECK (expires_at > started_at)
);
CREATE INDEX idx_sessions_status_expiry ON quiz_sessions(status, expires_at);

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL UNIQUE REFERENCES quiz_sessions(id) ON DELETE RESTRICT,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
    profile_type VARCHAR(32) NOT NULL CHECK (profile_type IN ('CURIOUS_EXPLORER','SMART_STRATEGIST','MYTH_BUSTER')),
    submission_hash CHAR(64) NOT NULL,
    result_token_hash CHAR(64) NOT NULL UNIQUE,
    completed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE RESTRICT,
    selected_option_id UUID NOT NULL REFERENCES question_options(id) ON DELETE RESTRICT,
    is_correct BOOLEAN NOT NULL,
    points_awarded INTEGER NOT NULL CHECK (points_awarded IN (0, 100)),
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);
CREATE INDEX idx_answers_question_correct ON quiz_answers(question_id, is_correct);

CREATE TABLE friend_challenges (
    id UUID PRIMARY KEY,
    challenge_code VARCHAR(32) NOT NULL UNIQUE,
    creator_attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE RESTRICT,
    creator_score INTEGER NOT NULL CHECK (creator_score >= 0),
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_challenge_expiry CHECK (expires_at > created_at)
);
CREATE INDEX idx_challenges_lookup ON friend_challenges(challenge_code, active, expires_at);

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES quiz_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(40) NOT NULL CHECK (event_type IN ('GAME_STARTED','QUESTION_ANSWERED','GAME_COMPLETED','RESULT_SHARED','FRIEND_CHALLENGE_CREATED','FRIEND_CHALLENGE_OPENED','CTA_CLICKED')),
    event_time TIMESTAMPTZ NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT ck_analytics_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);
CREATE INDEX idx_analytics_type_time ON analytics_events(event_type, event_time DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id) WHERE session_id IS NOT NULL;
