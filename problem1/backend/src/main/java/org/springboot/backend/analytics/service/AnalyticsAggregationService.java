package org.springboot.backend.analytics.service;

import org.springboot.backend.analytics.dto.AnalyticsDtos.*;
import org.springboot.backend.analytics.repository.AnalyticsEventRepository;
import org.springboot.backend.challenge.repository.FriendChallengeRepository;
import org.springboot.backend.common.DomainEnums.AnalyticsEventType;
import org.springboot.backend.quiz.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;

@Service
public class AnalyticsAggregationService {
    private final QuizSessionRepository sessions;
    private final QuizAttemptRepository attempts;
    private final QuizAnswerRepository answers;
    private final FriendChallengeRepository challenges;
    private final AnalyticsEventRepository events;

    public AnalyticsAggregationService(QuizSessionRepository sessions, QuizAttemptRepository attempts,
                                       QuizAnswerRepository answers, FriendChallengeRepository challenges,
                                       AnalyticsEventRepository events) {
        this.sessions=sessions; this.attempts=attempts; this.answers=answers; this.challenges=challenges; this.events=events;
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryResponse summarize() {
        long starts = sessions.count();
        long completions = attempts.count();
        long shares = events.countByEventType(AnalyticsEventType.RESULT_SHARED);
        long ctaClicks = events.countByEventType(AnalyticsEventType.CTA_CLICKED);
        long created = challenges.count();
        long opened = events.countByEventType(AnalyticsEventType.FRIEND_CHALLENGE_OPENED);
        var misunderstood = answers.findQuestionPerformance().stream()
                .map(row -> new QuestionPerformanceResponse(row.getQuestionId(), row.getQuestionText(),
                        row.getIncorrectAnswers(), row.getTotalAnswers(), ratio(row.getIncorrectAnswers(), row.getTotalAnswers())))
                .sorted(Comparator.comparingDouble(QuestionPerformanceResponse::incorrectRate).reversed()
                        .thenComparing(QuestionPerformanceResponse::questionText))
                .limit(5)
                .toList();
        return new AnalyticsSummaryResponse(starts, completions, ratio(completions, starts),
                shares, ratio(shares, completions), ctaClicks, ratio(ctaClicks, completions),
                created, opened, ratio(opened, created), misunderstood);
    }

    private static double ratio(long numerator, long denominator) {
        if (denominator == 0) return 0.0;
        return Math.round((double) numerator * 10_000.0 / denominator) / 10_000.0;
    }
}
