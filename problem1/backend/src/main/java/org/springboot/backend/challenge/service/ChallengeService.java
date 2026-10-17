package org.springboot.backend.challenge.service;

import org.springboot.backend.challenge.dto.ChallengeDtos.*;
import org.springboot.backend.challenge.entity.FriendChallenge;
import org.springboot.backend.challenge.repository.FriendChallengeRepository;
import org.springboot.backend.common.exception.ApiException;
import org.springboot.backend.common.util.SecureTokenService;
import org.springboot.backend.config.MetaboQuestProperties;
import org.springboot.backend.gamification.GamificationService;
import org.springboot.backend.quiz.entity.QuizAttempt;
import org.springboot.backend.quiz.service.QuizService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.UUID;

@Service
public class ChallengeService {
    private final FriendChallengeRepository repository;
    private final QuizService quizService;
    private final SecureTokenService tokens;
    private final GamificationService gamification;
    private final MetaboQuestProperties properties;
    private final Clock clock = Clock.systemUTC();

    public ChallengeService(FriendChallengeRepository repository, QuizService quizService, SecureTokenService tokens,
                            GamificationService gamification, MetaboQuestProperties properties) {
        this.repository=repository; this.quizService=quizService; this.tokens=tokens; this.gamification=gamification; this.properties=properties;
    }

    @Transactional
    public ChallengeResponse create(CreateChallengeRequest request) {
        QuizAttempt attempt = quizService.authorizedAttempt(request.attemptId(), request.resultToken());
        Instant now = clock.instant();
        String code = uniqueCode();
        FriendChallenge challenge = repository.save(new FriendChallenge(UUID.randomUUID(), code, attempt, now,
                now.plus(properties.challengeTtl())));
        return new ChallengeResponse(code, properties.frontendUrl() + "/challenge/" + code,
                challenge.getCreatorScore(), challenge.getExpiresAt());
    }

    @Transactional(readOnly = true)
    public PublicChallengeResponse get(String code) {
        FriendChallenge challenge = repository.findByChallengeCode(code)
                .orElseThrow(() -> ApiException.notFound("Challenge not found"));
        if (!challenge.isUsable(clock.instant())) throw ApiException.notFound("Challenge has expired or is inactive");
        var profile = gamification.profileFor(challenge.getCreatorScore());
        return new PublicChallengeResponse(code, challenge.getCreatorScore(), gamification.achievement(profile),
                "Your friend scored " + challenge.getCreatorScore() + " points. Can you beat it?", true);
    }

    private String uniqueCode() {
        for (int i=0; i<5; i++) {
            String candidate = tokens.generate(12);
            if (repository.findByChallengeCode(candidate).isEmpty()) return candidate;
        }
        throw new IllegalStateException("Could not allocate challenge code");
    }
}
