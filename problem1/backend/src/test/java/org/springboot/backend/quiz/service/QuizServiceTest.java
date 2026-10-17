package org.springboot.backend.quiz.service;

import org.springboot.backend.common.DomainEnums.SessionStatus;
import org.springboot.backend.common.exception.ApiException;
import org.springboot.backend.common.util.SecureTokenService;
import org.springboot.backend.config.MetaboQuestProperties;
import org.springboot.backend.config.GameRulesProperties;
import org.springboot.backend.config.ResultTokenProperties;
import org.springboot.backend.gamification.GamificationService;
import org.springboot.backend.question.entity.*;
import org.springboot.backend.question.service.QuestionService;
import org.springboot.backend.quiz.dto.QuizDtos.*;
import org.springboot.backend.quiz.entity.QuizSession;
import org.springboot.backend.quiz.repository.*;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class QuizServiceTest {
    @Test void rejectsDuplicateQuestionAnswersBeforeScoring() {
        QuestionService questionService = mock(QuestionService.class);
        QuizSessionRepository sessions = mock(QuizSessionRepository.class);
        QuizAttemptRepository attempts = mock(QuizAttemptRepository.class);
        SecureTokenService tokens = mock(SecureTokenService.class);
        UUID sessionId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();
        QuizSession session = mock(QuizSession.class);
        QuestionSet set = mock(QuestionSet.class);
        QuizQuestion question = mock(QuizQuestion.class);
        when(tokens.hash(anyString())).thenReturn("hash");
        when(sessions.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));
        when(attempts.findBySessionId(sessionId)).thenReturn(Optional.empty());
        when(session.getStatus()).thenReturn(SessionStatus.STARTED);
        when(session.getExpiresAt()).thenReturn(Instant.parse("2030-01-01T00:00:00Z"));
        when(session.getQuestionSet()).thenReturn(set);
        when(set.getId()).thenReturn(UUID.randomUUID());
        when(question.getId()).thenReturn(questionId);
        when(questionService.publishedQuestions(set.getId())).thenReturn(List.of(question));
        var properties = new MetaboQuestProperties("https://play.example", "https://steerclub.com", "https://play.example",
                Duration.ofMinutes(30), Period.ofDays(14), "disclaimer");
        var service = new QuizService(questionService, sessions, attempts, mock(QuizAnswerRepository.class),
                new GamificationService(new GameRulesProperties(100, 200, 300)), tokens, properties,
                new ResultTokenProperties("unit-test-result-token-secret-32-characters"),
                Clock.fixed(Instant.parse("2026-10-17T00:00:00Z"), ZoneOffset.UTC));
        var request = new SubmitRequest(sessionId, List.of(
                new AnswerRequest(questionId, UUID.randomUUID()), new AnswerRequest(questionId, UUID.randomUUID())));
        assertThatThrownBy(() -> service.submit(request)).isInstanceOf(ApiException.class).hasMessageContaining("Duplicate");
    }
}
