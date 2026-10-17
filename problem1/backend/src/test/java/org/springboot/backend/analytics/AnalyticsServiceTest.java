package org.springboot.backend.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springboot.backend.analytics.dto.AnalyticsDtos.EventRequest;
import org.springboot.backend.analytics.repository.AnalyticsEventRepository;
import org.springboot.backend.analytics.service.AnalyticsService;
import org.springboot.backend.common.DomainEnums.AnalyticsEventType;
import org.springboot.backend.common.exception.ApiException;
import org.springboot.backend.quiz.repository.QuizSessionRepository;
import org.junit.jupiter.api.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AnalyticsServiceTest {
    private AnalyticsEventRepository repository;
    private AnalyticsService service;
    @BeforeEach void setUp() {
        repository = mock(AnalyticsEventRepository.class);
        service = new AnalyticsService(repository, mock(QuizSessionRepository.class), new ObjectMapper());
    }
    @Test void doesNotPersistWithoutConsent() {
        assertThat(service.record(new EventRequest(null, AnalyticsEventType.GAME_STARTED, null, false)).accepted()).isFalse();
        verifyNoInteractions(repository);
    }
    @Test void rejectsMetadataOutsideEventAllowlist() throws Exception {
        var metadata = new ObjectMapper().readTree("{\"healthHistory\":\"private\"}");
        assertThatThrownBy(() -> service.record(new EventRequest(null, AnalyticsEventType.CTA_CLICKED, metadata, true)))
                .isInstanceOf(ApiException.class).hasMessageContaining("Unsupported");
    }
}
