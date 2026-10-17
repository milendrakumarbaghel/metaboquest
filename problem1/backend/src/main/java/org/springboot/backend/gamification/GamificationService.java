package org.springboot.backend.gamification;

import org.springboot.backend.common.DomainEnums.ProfileType;
import org.springboot.backend.quiz.dto.QuizDtos.ProfileResponse;
import org.springboot.backend.config.GameRulesProperties;
import org.springframework.stereotype.Service;

@Service
public class GamificationService {
    private final GameRulesProperties rules;

    public GamificationService(GameRulesProperties rules) { this.rules = rules; }

    public int pointsPerCorrectAnswer() { return rules.pointsPerCorrectAnswer(); }

    public int maximumScore(int totalQuestions) { return totalQuestions * rules.pointsPerCorrectAnswer(); }

    public ProfileType profileFor(int score) {
        if (score >= rules.mythBusterMinScore()) return ProfileType.MYTH_BUSTER;
        if (score >= rules.smartStrategistMinScore()) return ProfileType.SMART_STRATEGIST;
        return ProfileType.CURIOUS_EXPLORER;
    }

    public ProfileResponse describe(ProfileType profile) {
        return switch (profile) {
            case MYTH_BUSTER -> new ProfileResponse(profile, "The Myth Buster", "You separated every fact from fiction in this challenge.");
            case SMART_STRATEGIST -> new ProfileResponse(profile, "The Smart Strategist", "You have a strong foundation and keep evidence at the centre.");
            case CURIOUS_EXPLORER -> new ProfileResponse(profile, "The Curious Explorer", "You are building your knowledge of metabolic health.");
        };
    }

    public String achievement(ProfileType profile) { return describe(profile).title(); }
}
