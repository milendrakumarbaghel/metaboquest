package org.springboot.backend;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.flywaydb.core.Flyway;
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
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class MetaboQuestIntegrationTest {
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
    @Autowired org.springframework.boot.test.web.client.TestRestTemplate http;

    @Test void fullServerStartsAndServesTopicQuizOverHttp() {
        var response = http.postForEntity("/api/v1/quiz/sessions", Map.of("topic", "ELIGIBILITY"), JsonNode.class);
        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(response.getBody().get("topic").asText()).isEqualTo("ELIGIBILITY");
        var questions = http.getForEntity("/api/v1/quiz/questions?sessionId=" + response.getBody().get("sessionId").asText(), JsonNode.class);
        assertThat(questions.getStatusCode().value()).isEqualTo(200);
        assertThat(questions.getBody().get("questions").size()).isEqualTo(3);
    }

    @Test void validPerfectQuizIsSourcedAndIdempotentWithoutLeakingAnswers() throws Exception {
        String sessionId = startSession();
        mvc.perform(get("/api/v1/quiz/questions").param("sessionId", sessionId))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalQuestions").value(3))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("isCorrect"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("correctAnswer"))));
        String submission = submission(sessionId, true).toString();
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
                        .content(submission(startSession(), false).toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.score").value(0))
                .andExpect(jsonPath("$.correctAnswers").value(0))
                .andExpect(jsonPath("$.profile.code").value("CURIOUS_EXPLORER"));
    }

    @Test void rejectsInvalidQuestionOptionCrossQuestionDuplicateAndIncompleteAnswers() throws Exception {
        ObjectNode invalidQuestion = submission(startSession(), true);
        ((ObjectNode) invalidQuestion.get("answers").get(0)).put("questionId", UUID.randomUUID().toString());
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON).content(invalidQuestion.toString()))
                .andExpect(status().isUnprocessableEntity());

        ObjectNode invalidOption = submission(startSession(), true);
        ((ObjectNode) invalidOption.get("answers").get(0)).put("selectedOptionId", UUID.randomUUID().toString());
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                        .content(invalidOption.toString()))
                .andExpect(status().isUnprocessableEntity());

        ObjectNode crossQuestion = submission(startSession(), true);
        ((ObjectNode) crossQuestion.get("answers").get(0)).put("selectedOptionId", crossQuestion.get("answers").get(1).get("selectedOptionId").asText());
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                        .content(crossQuestion.toString()))
                .andExpect(status().isUnprocessableEntity());

        ObjectNode duplicate = submission(startSession(), true);
        ((ArrayNode) duplicate.get("answers")).set(1, duplicate.get("answers").get(0).deepCopy());
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON).content(duplicate.toString()))
                .andExpect(status().isUnprocessableEntity());

        ObjectNode incomplete = submission(startSession(), true);
        ((ArrayNode) incomplete.get("answers")).remove(0);
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON).content(incomplete.toString()))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test void rejectsConflictingResubmission() throws Exception {
        String sessionId = startSession();
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                .content(submission(sessionId, true).toString())).andExpect(status().isOk());
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                .content(submission(sessionId, false).toString())).andExpect(status().isConflict());
    }

    @Test void expiredSessionCannotBeSubmitted() throws Exception {
        String sessionId = startSession();
        jdbc.update("UPDATE quiz_sessions SET started_at=now()-interval '2 hours', expires_at=now()-interval '1 hour' WHERE id=?::uuid", sessionId);
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON)
                .content(submission(sessionId, true).toString()))
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
                        .content(submission(sessionId, true).toString()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private ObjectNode submission(String sessionId, boolean correct) {
        ObjectNode request = mapper.createObjectNode().put("sessionId", sessionId);
        ArrayNode answers = request.putArray("answers");
        // Read answer keys only inside tests, never via the public questions API.
        // Questions can have two wrong options; answer each question once.
        Set<String> answered = new HashSet<>();
        jdbc.query("SELECT sq.question_id, o.id FROM quiz_session_questions sq JOIN question_options o " +
                "ON o.question_id=sq.question_id WHERE sq.session_id=?::uuid AND o.is_correct=? ORDER BY sq.position, o.id",
                (org.springframework.jdbc.core.RowCallbackHandler) row -> { if (answered.add(row.getString(1))) answers.addObject()
                        .put("questionId", row.getString(1)).put("selectedOptionId", row.getString(2)); }, sessionId, correct);
        return request;
    }

    @Test void sessionKeepsThreeDistinctQuestionsAcrossReadsAndNewSessionsVary() throws Exception {
        Set<Set<String>> combinations = new HashSet<>();
        for (int i = 0; i < 12; i++) {
            String sessionId = startSession();
            String first = mvc.perform(get("/api/v1/quiz/questions").param("sessionId", sessionId))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalQuestions").value(3))
                    .andReturn().getResponse().getContentAsString();
            mvc.perform(get("/api/v1/quiz/questions").param("sessionId", sessionId))
                    .andExpect(status().isOk()).andExpect(content().string(first));
            Set<String> ids = new HashSet<>();
            mapper.readTree(first).get("questions").forEach(q -> ids.add(q.get("id").asText()));
            assertThat(ids).hasSize(3);
            combinations.add(ids);
        }
        assertThat(combinations.size()).isGreaterThan(1);
    }

    @Test void rejectsPublishedQuestionNotAssignedToSession() throws Exception {
        String sessionId = startSession();
        ObjectNode body = submission(sessionId, true);
        String other = jdbc.queryForObject("SELECT id::text FROM quiz_questions WHERE active AND id NOT IN " +
                "(SELECT question_id FROM quiz_session_questions WHERE session_id=?::uuid) LIMIT 1", String.class, sessionId);
        String option = jdbc.queryForObject("SELECT id::text FROM question_options WHERE question_id=?::uuid AND is_correct", String.class, other);
        ((ObjectNode) body.get("answers").get(0)).put("questionId", other).put("selectedOptionId", option);
        mvc.perform(post("/api/v1/quiz/submit").contentType(MediaType.APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test void upgradePreservesOriginalQuestionsForExistingSessions() {
        String schema = "selection_upgrade";
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas(schema).defaultSchema(schema).target("5").load().migrate();
        UUID legacySession = UUID.randomUUID();
        jdbc.update("INSERT INTO selection_upgrade.quiz_sessions " +
                "(id, question_set_id, question_set_version, status, started_at, expires_at) " +
                "VALUES (?, '10000000-0000-0000-0000-000000000001', 1, 'STARTED', now(), now()+interval '30 minutes')", legacySession);
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas(schema).defaultSchema(schema)
                .javaMigrations(new org.springboot.backend.db.migration.V8__seed_concern_questions()).load().migrate();
        assertThat(jdbc.queryForList("SELECT question_id::text FROM selection_upgrade.quiz_session_questions " +
                "WHERE session_id=? ORDER BY position", String.class, legacySession)).containsExactly(
                "30000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000002", "30000000-0000-0000-0000-000000000003");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM selection_upgrade.quiz_questions", Integer.class)).isEqualTo(21);
        assertThat(jdbc.queryForObject("SELECT learning_topic FROM selection_upgrade.quiz_sessions WHERE id=?", String.class, legacySession)).isEqualTo("GENERAL");
    }

    @Test void topicSelectionIsRelevantAndGeneralCoversDifferentConcerns() throws Exception {
        for (String topic : List.of("SAFETY", "MUSCLE", "SIDE_EFFECTS", "MAINTENANCE", "DIABETES", "ELIGIBILITY", "GENERAL")) {
            JsonNode session = mapper.readTree(mvc.perform(post("/api/v1/quiz/sessions").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"topic\":\"" + topic + "\"}"))
                    .andExpect(status().isCreated()).andExpect(jsonPath("$.topic").value(topic))
                    .andReturn().getResponse().getContentAsString());
            String id = session.get("sessionId").asText();
            List<String> assigned = jdbc.queryForList("SELECT q.learning_topic FROM quiz_questions q JOIN quiz_session_questions sq ON sq.question_id=q.id WHERE sq.session_id=?::uuid", String.class, id);
            assertThat(assigned).hasSize(3);
            if (topic.equals("GENERAL")) assertThat(new HashSet<>(assigned)).hasSize(3);
            else assertThat(assigned).containsOnly(topic);
            submitPerfect(id);
        }
        mvc.perform(post("/api/v1/quiz/sessions").contentType(MediaType.APPLICATION_JSON).content("{\"topic\":\"DIAGNOSE_ME\"}"))
                .andExpect(status().isBadRequest());
    }
}
