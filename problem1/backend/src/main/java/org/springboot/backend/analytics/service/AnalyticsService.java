package org.springboot.backend.analytics.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springboot.backend.analytics.dto.AnalyticsDtos.*;
import org.springboot.backend.analytics.entity.AnalyticsEvent;
import org.springboot.backend.analytics.repository.AnalyticsEventRepository;
import org.springboot.backend.common.DomainEnums.AnalyticsEventType;
import org.springboot.backend.common.DomainEnums.LearningTopic;
import org.springboot.backend.common.exception.ApiException;
import org.springboot.backend.quiz.repository.QuizSessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class AnalyticsService {
    private static final int MAX_METADATA_BYTES = 1024;
    private static final Map<AnalyticsEventType, Set<String>> ALLOWED_KEYS = Map.of(
            AnalyticsEventType.GAME_STARTED, Set.of("source", "platform"),
            AnalyticsEventType.QUESTION_ANSWERED, Set.of("questionId", "responseTimeMs"),
            AnalyticsEventType.GAME_COMPLETED, Set.of("durationMs"),
            AnalyticsEventType.RESULT_SHARED, Set.of("channel"),
            AnalyticsEventType.FRIEND_CHALLENGE_CREATED, Set.of(),
            AnalyticsEventType.FRIEND_CHALLENGE_OPENED, Set.of("challengeCode"),
            AnalyticsEventType.CTA_CLICKED, Set.of("destination", "ctaContext"),
            AnalyticsEventType.TOPIC_SELECTED, Set.of("topic")
    );
    private static final Pattern CTA_CONTEXT = Pattern.compile("^[a-z_]{1,40}$");
    private final AnalyticsEventRepository repository;
    private final QuizSessionRepository sessions;
    private final ObjectMapper mapper;

    public AnalyticsService(AnalyticsEventRepository repository, QuizSessionRepository sessions, ObjectMapper mapper) {
        this.repository=repository; this.sessions=sessions; this.mapper=mapper;
    }

    @Transactional
    public EventResponse record(EventRequest request) {
        if (!request.consentGranted()) return new EventResponse(false);
        if (request.sessionId() != null && !sessions.existsById(request.sessionId()))
            throw ApiException.notFound("Quiz session not found");
        ObjectNode metadata = sanitize(request.eventType(), request.metadata());
        repository.save(new AnalyticsEvent(UUID.randomUUID(), request.sessionId(), request.eventType(), Instant.now(), write(metadata)));
        return new EventResponse(true);
    }

    @Transactional(readOnly = true)
    public Map<AnalyticsEventType, Long> aggregateCounts() {
        EnumMap<AnalyticsEventType, Long> result = new EnumMap<>(AnalyticsEventType.class);
        for (AnalyticsEventType type : AnalyticsEventType.values()) result.put(type, repository.countByEventType(type));
        return Collections.unmodifiableMap(result);
    }

    private ObjectNode sanitize(AnalyticsEventType type, JsonNode input) {
        ObjectNode object = mapper.createObjectNode();
        if (input == null || input.isNull()) return object;
        if (!input.isObject()) throw new ApiException(HttpStatus.BAD_REQUEST, "Analytics metadata must be an object");
        Set<String> allowed = ALLOWED_KEYS.get(type);
        input.fields().forEachRemaining(entry -> {
            if (!allowed.contains(entry.getKey())) throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported analytics metadata field: " + entry.getKey());
            JsonNode value = entry.getValue();
            if (!(value.isTextual() || value.isNumber() || value.isBoolean()) || (value.isTextual() && value.textValue().length() > 100))
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid analytics metadata value");
            if (type == AnalyticsEventType.TOPIC_SELECTED && entry.getKey().equals("topic") && !isLearningTopic(value))
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid analytics metadata value");
            if (type == AnalyticsEventType.CTA_CLICKED && entry.getKey().equals("ctaContext")
                    && !(value.isTextual() && CTA_CONTEXT.matcher(value.textValue()).matches()))
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid analytics metadata value");
            object.set(entry.getKey(), value);
        });
        if (write(object).getBytes(java.nio.charset.StandardCharsets.UTF_8).length > MAX_METADATA_BYTES)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Analytics metadata is too large");
        return object;
    }

    private static boolean isLearningTopic(JsonNode value) {
        return value.isTextual() && Arrays.stream(LearningTopic.values()).anyMatch(t -> t.name().equals(value.textValue()));
    }

    private String write(JsonNode node) {
        try { return mapper.writeValueAsString(node); }
        catch (JsonProcessingException ex) { throw new IllegalStateException("Could not serialize analytics metadata", ex); }
    }
}
