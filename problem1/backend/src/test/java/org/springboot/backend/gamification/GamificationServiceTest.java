package org.springboot.backend.gamification;

import org.springboot.backend.common.DomainEnums.ProfileType;
import org.springboot.backend.config.GameRulesProperties;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class GamificationServiceTest {
    private final GamificationService service = new GamificationService(new GameRulesProperties(100, 200, 300));
    @Test void assignsAllScoreBands() {
        assertThat(service.profileFor(0)).isEqualTo(ProfileType.CURIOUS_EXPLORER);
        assertThat(service.profileFor(100)).isEqualTo(ProfileType.CURIOUS_EXPLORER);
        assertThat(service.profileFor(200)).isEqualTo(ProfileType.SMART_STRATEGIST);
        assertThat(service.profileFor(300)).isEqualTo(ProfileType.MYTH_BUSTER);
    }
    @Test void descriptionsAreExplicitlyGameplayAchievements() {
        assertThat(service.describe(ProfileType.MYTH_BUSTER).title()).isEqualTo("The Myth Buster");
        assertThat(service.describe(ProfileType.CURIOUS_EXPLORER).description()).doesNotContainIgnoringCase("diagnosis", "eligible");
    }
    @Test void usesConfiguredPointsAndThresholds() {
        var configured = new GamificationService(new GameRulesProperties(75, 150, 225));
        assertThat(configured.pointsPerCorrectAnswer()).isEqualTo(75);
        assertThat(configured.maximumScore(3)).isEqualTo(225);
        assertThat(configured.profileFor(225)).isEqualTo(ProfileType.MYTH_BUSTER);
    }
}
