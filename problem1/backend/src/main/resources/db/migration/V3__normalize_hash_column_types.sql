ALTER TABLE quiz_attempts
    ALTER COLUMN submission_hash TYPE VARCHAR(64),
    ALTER COLUMN result_token_hash TYPE VARCHAR(64);
