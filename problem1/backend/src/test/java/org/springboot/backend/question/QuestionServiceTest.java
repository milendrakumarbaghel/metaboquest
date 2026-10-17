package org.springboot.backend.question;

import org.springboot.backend.common.DomainEnums.ReviewStatus;
import org.springboot.backend.common.exception.ApiException;
import org.springboot.backend.question.entity.QuizQuestion;
import org.springboot.backend.question.repository.*;
import org.springboot.backend.question.service.QuestionService;
import org.junit.jupiter.api.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class QuestionServiceTest {
    private QuizQuestionRepository questions;
    private QuestionService service;
    @BeforeEach void setUp() {
        questions = mock(QuizQuestionRepository.class);
        service = new QuestionService(mock(QuestionSetRepository.class), questions);
    }
    @Test void excludesAnEmptyPublishedSet() {
        UUID setId = UUID.randomUUID();
        when(questions.findPublished(setId, ReviewStatus.APPROVED)).thenReturn(List.of());
        assertThatThrownBy(() -> service.publishedQuestions(setId)).isInstanceOf(ApiException.class).hasMessageContaining("approved");
    }
    @Test void failsClosedWhenAnApprovedQuestionHasNoSource() {
        UUID setId = UUID.randomUUID();
        QuizQuestion question = mock(QuizQuestion.class);
        when(question.getSources()).thenReturn(Set.of());
        when(questions.findPublished(setId, ReviewStatus.APPROVED)).thenReturn(List.of(question));
        assertThatThrownBy(() -> service.publishedQuestions(setId)).isInstanceOf(IllegalStateException.class).hasMessageContaining("medical source");
    }
}
