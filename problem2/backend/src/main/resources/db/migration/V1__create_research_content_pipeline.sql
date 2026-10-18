CREATE TABLE papers (
    id UUID PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    source_type VARCHAR(16) NOT NULL CHECK (source_type IN ('PDF','URL')),
    source_url VARCHAR(1500),
    file_name VARCHAR(500),
    content_type VARCHAR(100) NOT NULL,
    source_content BYTEA NOT NULL,
    sha256 VARCHAR(64) NOT NULL UNIQUE,
    raw_text TEXT NOT NULL,
    page_count INTEGER NOT NULL CHECK (page_count > 0),
    status VARCHAR(24) NOT NULL CHECK (status IN ('INGESTED','GENERATED','FAILED')),
    failure_reason VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE content_packages (
    id UUID PRIMARY KEY,
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE RESTRICT,
    language VARCHAR(16) NOT NULL,
    audience VARCHAR(500) NOT NULL,
    core_message VARCHAR(1000) NOT NULL,
    reasoning TEXT NOT NULL,
    status VARCHAR(24) NOT NULL CHECK (status IN ('AWAITING_REVIEW','CHANGES_REQUESTED','APPROVED','REJECTED')),
    ai_provider VARCHAR(100) NOT NULL,
    prompt_version VARCHAR(40) NOT NULL,
    estimated_human_minutes INTEGER NOT NULL CHECK (estimated_human_minutes >= 0),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_content_packages_paper ON content_packages(paper_id, created_at DESC);

CREATE TABLE claims (
    id UUID PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES content_packages(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    plain_language TEXT NOT NULL,
    evidence_quote TEXT NOT NULL,
    page_number INTEGER NOT NULL CHECK (page_number > 0),
    section_name VARCHAR(300),
    confidence NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    evidence_verified BOOLEAN NOT NULL,
    review_status VARCHAR(24) NOT NULL CHECK (review_status IN ('PENDING','APPROVED','REJECTED')),
    reviewer VARCHAR(200),
    review_note VARCHAR(1000),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_claims_package_review ON claims(package_id, review_status);

CREATE TABLE content_assets (
    id UUID PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES content_packages(id) ON DELETE CASCADE,
    asset_type VARCHAR(24) NOT NULL CHECK (asset_type IN ('CAROUSEL','STATIC','REEL','CAPTION')),
    title VARCHAR(300) NOT NULL,
    payload JSONB NOT NULL,
    claim_ids JSONB NOT NULL,
    status VARCHAR(24) NOT NULL CHECK (status IN ('DRAFT','APPROVED','REJECTED')),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_asset_payload_object CHECK (jsonb_typeof(payload) = 'object'),
    CONSTRAINT ck_asset_claim_ids_array CHECK (jsonb_typeof(claim_ids) = 'array')
);
CREATE INDEX idx_assets_package_type ON content_assets(package_id, asset_type);

CREATE TABLE review_events (
    id UUID PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES content_packages(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    action VARCHAR(32) NOT NULL CHECK (action IN ('CLAIM_APPROVED','CLAIM_REJECTED','PACKAGE_APPROVED','PACKAGE_REJECTED','CHANGES_REQUESTED')),
    actor VARCHAR(200) NOT NULL,
    note VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_review_events_package ON review_events(package_id, created_at);

CREATE TABLE batch_runs (
    id UUID PRIMARY KEY,
    status VARCHAR(24) NOT NULL CHECK (status IN ('RUNNING','COMPLETED','PARTIAL_FAILURE','FAILED')),
    requested_count INTEGER NOT NULL CHECK (requested_count BETWEEN 1 AND 20),
    completed_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    package_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT ck_batch_package_ids_array CHECK (jsonb_typeof(package_ids) = 'array'),
    CONSTRAINT ck_batch_errors_array CHECK (jsonb_typeof(errors) = 'array')
);
