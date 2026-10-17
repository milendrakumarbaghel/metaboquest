package org.springboot.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties("metaboquest.rate-limit")
public record RateLimitProperties(
        Duration window,
        int quizSubmissionLimit,
        int challengeCreationLimit,
        int analyticsEventLimit,
        String hashSecret
) {
    public RateLimitProperties {
        if (window == null || window.isZero() || window.isNegative()) throw new IllegalArgumentException("rate-limit window must be positive");
        if (quizSubmissionLimit <= 0 || challengeCreationLimit <= 0 || analyticsEventLimit <= 0)
            throw new IllegalArgumentException("rate limits must be positive");
        if (hashSecret == null || hashSecret.length() < 16) throw new IllegalArgumentException("rate-limit hash secret must be at least 16 characters");
    }
}
