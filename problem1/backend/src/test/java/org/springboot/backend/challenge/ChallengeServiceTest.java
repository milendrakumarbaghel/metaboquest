package org.springboot.backend.challenge;

import org.springboot.backend.challenge.dto.ChallengeDtos.CreateChallengeRequest;
import org.springboot.backend.challenge.repository.FriendChallengeRepository;
import org.springboot.backend.challenge.service.ChallengeService;
import org.springboot.backend.common.util.SecureTokenService;
import org.springboot.backend.config.MetaboQuestProperties;
import org.springboot.backend.config.GameRulesProperties;
import org.springboot.backend.gamification.GamificationService;
import org.springboot.backend.quiz.entity.QuizAttempt;
import org.springboot.backend.quiz.service.QuizService;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ChallengeServiceTest {
    @Test void buildsOnlyFromTrustedFrontendConfiguration() {
        FriendChallengeRepository repository = mock(FriendChallengeRepository.class);
        QuizService quiz = mock(QuizService.class);
        SecureTokenService tokens = mock(SecureTokenService.class);
        QuizAttempt attempt = mock(QuizAttempt.class);
        UUID attemptId = UUID.randomUUID();
        when(quiz.authorizedAttempt(attemptId, "result-token")).thenReturn(attempt);
        when(attempt.getScore()).thenReturn(200);
        when(tokens.generate(12)).thenReturn("abcdefghijklmnop");
        when(repository.findByChallengeCode("abcdefghijklmnop")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var properties = new MetaboQuestProperties("https://play.example", "https://steerclub.com", "https://play.example",
                Duration.ofMinutes(30), Period.ofDays(14), "disclaimer");
        var service = new ChallengeService(repository, quiz, tokens,
                new GamificationService(new GameRulesProperties(100, 200, 300)), properties);
        var response = service.create(new CreateChallengeRequest(attemptId, "result-token"));
        assertThat(response.challengeUrl()).isEqualTo("https://play.example/challenge/abcdefghijklmnop");
        assertThat(response.creatorScore()).isEqualTo(200);
    }
}
