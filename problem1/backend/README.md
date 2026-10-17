# MetaboQuest backend

MetaboQuest is a Java 21 and Spring Boot backend for the Problem Statement 1 playable educational quiz. It provides anonymous sessions, server-side answer validation, medically sourced feedback, gameplay achievements, capability-protected results, friend challenges and consent-aware analytics. It never asks for health history or treats a score as a medical assessment.

## Architecture

The application is a feature-based modular monolith. `question` owns versioned reviewed content, `quiz` owns sessions and immutable attempts, `gamification` maps scores to fictional game achievements, `challenge` exposes limited public challenge data, and `analytics` accepts only event-specific metadata. Controllers use DTOs and never serialize JPA entities.

The frontend should bundle the same approved educational content for offline playable-ad completion. The API enhances the experience but is not a hard dependency for the core three-question flow.

Key security decisions:

- Public gameplay requires no account or login.
- Correct-option flags never appear in the question response.
- Submissions are validated and scored transactionally under a database session lock.
- Canonical submission hashes make identical retries idempotent; changed retries return `409`.
- Result reads and challenge creation require a server-signed result capability token. Identical submission retries reproduce the same token, so a lost first response is recoverable without storing plaintext credentials.
- Challenge codes use 96 bits of cryptographic randomness and expose no session or personal data.
- Analytics metadata is allowlisted per event, size-limited and discarded when consent is absent.
- Rate limits use keyed hashes of network addresses and atomic PostgreSQL counters shared by every application instance; raw addresses are never persisted.
- Flyway owns the schema; Hibernate uses `validate` only.

## Run locally

Requirements: Java 21, Docker, and Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

The API is at `http://localhost:8080`. Interactive OpenAPI documentation is at `http://localhost:8080/swagger-ui.html`, and the machine-readable specification is at `http://localhost:8080/v3/api-docs`. Actuator exposes only `health` and `info`.

To run the API outside Docker, start PostgreSQL and then:

```bash
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

## Complete quiz flow

Start a session:

```bash
curl -s -X POST http://localhost:8080/api/v1/quiz/sessions
```

Use the returned `sessionId`:

```bash
curl -s 'http://localhost:8080/api/v1/quiz/questions?sessionId=SESSION_ID'
```

Submit exactly one option for each returned question:

```bash
curl -s -X POST http://localhost:8080/api/v1/quiz/submit \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId":"SESSION_ID",
    "answers":[
      {"questionId":"QUESTION_1","selectedOptionId":"OPTION_1"},
      {"questionId":"QUESTION_2","selectedOptionId":"OPTION_2"},
      {"questionId":"QUESTION_3","selectedOptionId":"OPTION_3"}
    ]
  }'
```

Save both `attemptId` and `resultToken` from that response. An identical retry returns the same token, while a retry with changed answers returns `409`:

```bash
curl -s 'http://localhost:8080/api/v1/quiz/results/ATTEMPT_ID?token=RESULT_TOKEN'
```

Create and open a friend challenge:

```bash
curl -s -X POST http://localhost:8080/api/v1/challenges \
  -H 'Content-Type: application/json' \
  -d '{"attemptId":"ATTEMPT_ID","resultToken":"RESULT_TOKEN"}'

curl -s http://localhost:8080/api/v1/challenges/CHALLENGE_CODE
```

Send analytics only after consent:

```bash
curl -s -X POST http://localhost:8080/api/v1/analytics/events \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"SESSION_ID","eventType":"CTA_CLICKED","metadata":{"destination":"STEER_WEBSITE"},"consentGranted":true}'
```

## Configuration

Deployment values can be overridden through environment variables; see `.env.example`. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and strong, distinct shared `RATE_LIMIT_HASH_SECRET` and `RESULT_TOKEN_SECRET` values on Railway. Use a comma-separated `CORS_ALLOWED_ORIGINS` value for multiple trusted frontends. Wildcard origins are rejected in `prod`. Score points and achievement thresholds are configurable with `QUIZ_POINTS_PER_CORRECT`, `QUIZ_SMART_STRATEGIST_MIN_SCORE`, and `QUIZ_MYTH_BUSTER_MIN_SCORE`.

Railway deployment uses the Dockerfile. Attach PostgreSQL, set `SPRING_PROFILES_ACTIVE=prod`, map the provider's database variables to `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`, and configure the public frontend and Steer URLs.

## Data and medical review

The seed migration contains three deliberately narrow educational questions. Each approved question has an HTTPS reference to public US government health guidance. Publication is fail-closed in the service: approved content without at least one source is not served. Update source access dates and have a qualified reviewer approve changed wording before publishing a new question-set version.

## Tests

```bash
./mvnw test
```

Unit tests cover configurable score bands, achievement copy, consent, analytics allowlists, funnel calculations and misunderstood-question ranking. The Testcontainers suite covers the anonymous end-to-end flow, Flyway migrations, answer-key non-disclosure, perfect and incorrect scoring, idempotent and conflicting submissions, invalid/cross-question/duplicate/incomplete answers, expired sessions and challenges, capability-token access, analytics validation, anonymous and protected routes, and PostgreSQL-backed distributed rate limiting. It is skipped automatically when Docker is unavailable.

## Known operational limits

Rate-limit counters expire automatically and are periodically cleaned from PostgreSQL. Completion, sharing, CTA and challenge conversion rates plus the most-misunderstood questions are available through `AnalyticsAggregationService` for a future authenticated admin module; no internal metrics endpoint is publicly exposed.
