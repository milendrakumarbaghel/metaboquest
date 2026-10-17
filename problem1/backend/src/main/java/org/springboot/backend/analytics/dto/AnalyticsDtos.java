package org.springboot.backend.analytics.dto;

import com.fasterxml.jackson.databind.JsonNode;
import org.springboot.backend.common.DomainEnums.AnalyticsEventType;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import java.util.List;

public final class AnalyticsDtos {
    private AnalyticsDtos() { }
    public record EventRequest(UUID sessionId, @NotNull AnalyticsEventType eventType, JsonNode metadata, boolean consentGranted) { }
    public record EventResponse(boolean accepted) { }
    public record QuestionPerformanceResponse(UUID questionId, String questionText, long incorrectAnswers,
                                              long totalAnswers, double incorrectRate) { }
    public record AnalyticsSummaryResponse(long quizStarts, long quizCompletions, double completionRate,
                                           long resultShares, double shareConversionRate,
                                           long ctaClicks, double ctaConversionRate,
                                           long challengesCreated, long challengeOpenings, double challengeOpenRate,
                                           List<QuestionPerformanceResponse> mostMisunderstoodQuestions) { }
}
