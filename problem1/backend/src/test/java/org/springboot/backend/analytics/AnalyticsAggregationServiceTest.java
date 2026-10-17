package org.springboot.backend.analytics;

import org.junit.jupiter.api.Test;
import org.springboot.backend.analytics.repository.AnalyticsEventRepository;
import org.springboot.backend.analytics.service.AnalyticsAggregationService;
import org.springboot.backend.challenge.repository.FriendChallengeRepository;
import org.springboot.backend.common.DomainEnums.AnalyticsEventType;
import org.springboot.backend.quiz.repository.*;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AnalyticsAggregationServiceTest {
    @Test void calculatesFunnelsAndRanksMisunderstoodQuestions() {
        QuizSessionRepository sessions = mock(QuizSessionRepository.class);
        QuizAttemptRepository attempts = mock(QuizAttemptRepository.class);
        QuizAnswerRepository answers = mock(QuizAnswerRepository.class);
        FriendChallengeRepository challenges = mock(FriendChallengeRepository.class);
        AnalyticsEventRepository events = mock(AnalyticsEventRepository.class);
        when(sessions.count()).thenReturn(10L);
        when(attempts.count()).thenReturn(8L);
        when(challenges.count()).thenReturn(4L);
        when(events.countByEventType(AnalyticsEventType.RESULT_SHARED)).thenReturn(2L);
        when(events.countByEventType(AnalyticsEventType.CTA_CLICKED)).thenReturn(4L);
        when(events.countByEventType(AnalyticsEventType.FRIEND_CHALLENGE_OPENED)).thenReturn(3L);
        var harder = performance("Harder question", 6, 8);
        var easier = performance("Easier question", 1, 8);
        when(answers.findQuestionPerformance()).thenReturn(List.of(easier, harder));

        var summary = new AnalyticsAggregationService(sessions, attempts, answers, challenges, events).summarize();
        assertThat(summary.completionRate()).isEqualTo(0.8);
        assertThat(summary.shareConversionRate()).isEqualTo(0.25);
        assertThat(summary.ctaConversionRate()).isEqualTo(0.5);
        assertThat(summary.challengeOpenRate()).isEqualTo(0.75);
        assertThat(summary.mostMisunderstoodQuestions().getFirst().questionText()).isEqualTo("Harder question");
    }

    private QuizAnswerRepository.QuestionPerformance performance(String text, long incorrect, long total) {
        var row = mock(QuizAnswerRepository.QuestionPerformance.class);
        when(row.getQuestionId()).thenReturn(UUID.randomUUID());
        when(row.getQuestionText()).thenReturn(text);
        when(row.getIncorrectAnswers()).thenReturn(incorrect);
        when(row.getTotalAnswers()).thenReturn(total);
        return row;
    }
}
