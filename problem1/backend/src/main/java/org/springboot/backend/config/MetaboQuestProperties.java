package org.springboot.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.time.Period;

@ConfigurationProperties("metaboquest")
public record MetaboQuestProperties(
        String frontendUrl,
        String steerWebsiteUrl,
        String allowedOrigins,
        Duration sessionTtl,
        Period challengeTtl,
        String resultDisclaimer
) { }
