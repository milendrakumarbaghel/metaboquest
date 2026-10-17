CREATE TABLE api_rate_limits (
    client_key VARCHAR(64) NOT NULL,
    route_key VARCHAR(64) NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL CHECK (request_count > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (client_key, route_key, window_start)
);

CREATE INDEX idx_api_rate_limits_expiry ON api_rate_limits(expires_at);

ALTER TABLE quiz_answers DROP CONSTRAINT IF EXISTS quiz_answers_points_awarded_check;
ALTER TABLE quiz_answers ADD CONSTRAINT ck_quiz_answers_points_nonnegative CHECK (points_awarded >= 0);
