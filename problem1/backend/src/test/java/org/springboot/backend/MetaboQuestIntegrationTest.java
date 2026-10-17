package org.springboot.backend;

import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springboot.backend.config.DistributedRateLimitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class MetaboQuestIntegrationTest {
    private static final String Q1 = "30000000-0000-0000-0000-000000000001";
    private static final String Q2 = "30000000-0000-0000-0000-000000000002";
    private static final String Q3 = "30000000-0000-0000-0000-000000000003";
    private static final String Q1_CORRECT = "40000000-0000-0000-0000-000000000002";
    private static final String Q1_WRONG = "40000000-0000-0000-0000-000000000001";
    private static final String Q2_CORRECT = "40000000-0000-0000-0000-000000000004";
    private static final String Q2_WRONG = "40000000-0000-0000-0000-000000000003";
    private static final String Q3_CORRECT = "40000000-0000-0000-0000-000000000005";
    private static final String Q3_WRONG = "40000000-0000-0000-0000-000000000006";

    @Container static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("metaboquest.rate-limit.hash-secret", () -> "integration-test-secret-key");
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired DistributedRateLimitService distributedRateLimits;

    @Test void validPerfectQuizIsSourcedAndIdempotentWithoutLeakingAnswers() throws Exception {
        String sessionId = startSession();
        mvc.perform(get("/api/v1/quiz/questions").param("sessionId", sessionId))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalQuestions").value(3))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("isCorrect"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("correctAnswer"))));
        String submission = submission(sessionId, Q1_CORRECT, Q2_CORRECT, Q3_CORRECT);
        JsonNode first = mapper.readTree(mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON).content(submission))
                .andExpect(status().isOk()).andExpect(jsonPath("$.score").value(300))
                .andExpect(jsonPath("$.correctAnswers").value(3))
                .andExpect(jsonPath("$.profile.code").value("MYTH_BUSTER"))
                .andExpect(jsonPath("$.feedback[0].sources[0].url").isNotEmpty())
                .andExpect(jsonPath("$.resultToken").isNotEmpty())
                .andExpect(jsonPath("$.disclaimer").isNotEmpty())
                .andReturn().getResponse().getContentAsString());
        JsonNode retry = mapper.readTree(mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON).content(submission))
                .andExpect(status().isOk()).andExpect(jsonPath("$.score").value(300))
                .andExpect(jsonPath("$.resultToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString());
        assertThat(retry.get("resultToken").asText()).isEqualTo(first.get("resultToken").asText());
        mvc.perform(get("/api/v1/quiz/results/{id}", retry.get("attemptId").asText())
                        .param("token", retry.get("resultToken").asText()))
                .andExpect(status().isOk());
    }

    @Test void incorrectAnswersReceiveZeroPoints() throws Exception {
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                        .content(submission(startSession(), Q1_WRONG, Q2_WRONG, Q3_WRONG)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.score").value(0))
                .andExpect(jsonPath("$.correctAnswers").value(0))
                .andExpect(jsonPath("$.profile.code").value("CURIOUS_EXPLORER"));
    }

    @Test void rejectsInvalidQuestionOptionCrossQuestionDuplicateAndIncompleteAnswers() throws Exception {
        String invalidQuestion = submission(startSession(), Q1_CORRECT, Q2_CORRECT, Q3_CORRECT)
                .replace(Q1, UUID.randomUUID().toString());
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON).content(invalidQuestion))
                .andExpect(status().isUnprocessableEntity());

        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                        .content(submission(startSession(), UUID.randomUUID().toString(), Q2_CORRECT, Q3_CORRECT)))
                .andExpect(status().isUnprocessableEntity());

        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                        .content(submission(startSession(), Q2_CORRECT, Q2_CORRECT, Q3_CORRECT)))
                .andExpect(status().isUnprocessableEntity());

        String duplicate = """
                {"sessionId":"%s","answers":[
                {"questionId":"%s","selectedOptionId":"%s"},
                {"questionId":"%s","selectedOptionId":"%s"},
                {"questionId":"%s","selectedOptionId":"%s"}]}
                """.formatted(startSession(), Q1, Q1_CORRECT, Q1, Q1_CORRECT, Q3, Q3_CORRECT);
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON).content(duplicate))
                .andExpect(status().isUnprocessableEntity());

        String incomplete = "{\"sessionId\":\""+startSession()+"\",\"answers\":[{\"questionId\":\""+Q1+"\",\"selectedOptionId\":\""+Q1_CORRECT+"\"}]}";
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON).content(incomplete))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test void rejectsConflictingResubmission() throws Exception {
        String sessionId = startSession();
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                .content(submission(sessionId, Q1_CORRECT, Q2_CORRECT, Q3_CORRECT))).andExpect(status().isOk());
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                .content(submission(sessionId, Q1_WRONG, Q2_CORRECT, Q3_CORRECT))).andExpect(status().isConflict());
    }

    @Test void expiredSessionCannotBeSubmitted() throws Exception {
        String sessionId = startSession();
        jdbc.update("UPDATE quiz_sessions SET started_at=now()-interval '2 hours', expires_at=now()-interval '1 hour' WHERE id=?::uuid", sessionId);
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                .content(submission(sessionId, Q1_CORRECT, Q2_CORRECT, Q3_CORRECT)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test void resultRequiresCorrectCapabilityToken() throws Exception {
        JsonNode result = submitPerfect(startSession());
        String attemptId = result.get("attemptId").asText();
        mvc.perform(get("/api/v1/quiz/results/{id}", attemptId).param("token", "wrong-token"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/quiz/results/{id}", attemptId).param("token", result.get("resultToken").asText()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.attemptId").value(attemptId));
    }

    @Test void validChallengeWorksAndExpiredChallengeIsRejected() throws Exception {
        JsonNode result = submitPerfect(startSession());
        String body = "{\"attemptId\":\"" + result.get("attemptId").asText() + "\",\"resultToken\":\"" + result.get("resultToken").asText() + "\"}";
        JsonNode challenge = mapper.readTree(mvc.perform(post("/api/v1/challenges").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String code = challenge.get("challengeCode").asText();
        mvc.perform(get("/api/v1/challenges/{code}", code)).andExpect(status().isOk());
        jdbc.update("UPDATE friend_challenges SET created_at=now()-interval '2 hours', expires_at=now()-interval '1 hour' WHERE challenge_code=?", code);
        mvc.perform(get("/api/v1/challenges/{code}", code)).andExpect(status().isNotFound());
    }

    @Test void analyticsValidatesConsentSessionEventTypeAndMetadata() throws Exception {
        mvc.perform(post("/api/v1/analytics/events").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"GAME_STARTED\",\"metadata\":{},\"consentGranted\":false}"))
                .andExpect(status().isAccepted()).andExpect(jsonPath("$.accepted").value(false));
        mvc.perform(post("/api/v1/analytics/events").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"NOT_SUPPORTED\",\"metadata\":{},\"consentGranted\":true}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/analytics/events").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"CTA_CLICKED\",\"metadata\":{\"healthHistory\":\"private\"},\"consentGranted\":true}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/analytics/events").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\""+UUID.randomUUID()+"\",\"eventType\":\"CTA_CLICKED\",\"metadata\":{\"destination\":\"STEER_WEBSITE\"},\"consentGranted\":true}"))
                .andExpect(status().isNotFound());
    }

    @Test void publicEndpointsAreAnonymousAndUnknownAdminEndpointIsProtected() throws Exception {
        mvc.perform(post("/api/v1/quiz/sessions")).andExpect(status().isCreated());
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("MetaboQuest API"))
                .andExpect(jsonPath("$.paths['/api/v1/quiz/submit']").exists());
        mvc.perform(get("/swagger-ui.html")).andExpect(status().is3xxRedirection());
        mvc.perform(get("/api/v1/admin/analytics/summary")).andExpect(status().isForbidden());
    }

    @Test void rateLimitCounterIsSharedInPostgres() {
        String client = "integration-client-" + UUID.randomUUID();
        Instant now = Instant.now();
        for (int i=0; i<3; i++) assertThat(distributedRateLimits.consume(client, "integration-route", 3, now).allowed()).isTrue();
        assertThat(distributedRateLimits.consume(client, "integration-route", 3, now).allowed()).isFalse();
        Integer stored = jdbc.queryForObject("SELECT request_count FROM api_rate_limits WHERE route_key='integration-route'", Integer.class);
        assertThat(stored).isEqualTo(4);
    }

    private String startSession() throws Exception {
        return mapper.readTree(mvc.perform(post("/api/v1/quiz/sessions")).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("sessionId").asText();
    }

    private JsonNode submitPerfect(String sessionId) throws Exception {
        return mapper.readTree(mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                        .content(submission(sessionId, Q1_CORRECT, Q2_CORRECT, Q3_CORRECT)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private String submission(String sessionId, String q1Option, String q2Option, String q3Option) {
        return """
                {"sessionId":"%s","answers":[
                {"questionId":"%s","selectedOptionId":"%s"},
                {"questionId":"%s","selectedOptionId":"%s"},
                {"questionId":"%s","selectedOptionId":"%s"}]}
                """.formatted(sessionId, Q1, q1Option, Q2, q2Option, Q3, q3Option);
    }
}
