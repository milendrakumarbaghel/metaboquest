package org.springboot.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("metaboquest.result-token")
public record ResultTokenProperties(String secret) {
    public ResultTokenProperties {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("metaboquest.result-token.secret must contain at least 32 characters");
        }
    }
}
