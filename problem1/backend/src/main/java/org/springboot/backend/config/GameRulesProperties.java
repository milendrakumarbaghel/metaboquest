package org.springboot.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("metaboquest.game")
public record GameRulesProperties(
        int pointsPerCorrectAnswer,
        int smartStrategistMinScore,
        int mythBusterMinScore
) {
    public GameRulesProperties {
        if (pointsPerCorrectAnswer <= 0) throw new IllegalArgumentException("pointsPerCorrectAnswer must be positive");
        if (smartStrategistMinScore <= 0) throw new IllegalArgumentException("smartStrategistMinScore must be positive");
        if (mythBusterMinScore <= smartStrategistMinScore)
            throw new IllegalArgumentException("mythBusterMinScore must exceed smartStrategistMinScore");
    }
}
