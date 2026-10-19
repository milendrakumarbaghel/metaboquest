# Problem 1 — MetaboQuest playable quiz

MetaboQuest is a mobile-first, no-login learning game for Steer Club Hackathon Problem Statement 1: **The ad people want to tap**.

It turns common questions about metabolic health and GLP-1 care into a short, useful interaction: choose a concern, answer three questions, learn from source-linked explanations, receive a playful knowledge profile, and optionally challenge a friend or explore doctor-led care.

> Educational only. MetaboQuest is not a health assessment and does not diagnose, recommend treatment, or determine medicine eligibility.

## What the experience delivers

- **Trigger:** a quick curiosity-led challenge designed to make sense in the first three seconds.
- **Value:** three concise questions followed by sourced explanations, topic takeaways, and a doctor-conversation checklist.
- **Next step:** a calm, non-pushy handoff to Steer’s doctor-led programme.
- **Indian context:** familiar routines such as chai breaks, office tiffins, rotis, family WhatsApp groups, weddings, and festival seasons.
- **Responsible framing:** no drug promotion, before/after bodies, weight-loss promises, body shaming, or automatic transfer of quiz answers to Steer.

## Project structure

```text
problem1/
├── backend/
│   ├── src/main/java/org/springboot/backend/
│   │   ├── question/       reviewed, versioned educational content
│   │   ├── quiz/           sessions, question selection, answers and attempts
│   │   ├── gamification/   configurable scores and knowledge profiles
│   │   ├── challenge/      privacy-limited friend challenges
│   │   ├── analytics/      consent-aware events and aggregation
│   │   ├── config/         security, CORS and application configuration
│   │   ├── db/migration/   Java-based Flyway data migrations
│   │   └── common/         errors and shared utilities
│   ├── src/main/resources/
│   │   ├── db/migration/   schema and seed migrations
│   │   └── data/           curated question banks
│   ├── src/test/           unit and Testcontainers integration tests
│   └── docker-compose.yml  local PostgreSQL and API services
├── frontend/
│   ├── src/pages/          landing, topic, quiz, results, challenge, explore
│   ├── src/components/     shared game, learning and handoff UI
│   ├── src/services/       API, storage, scoring and analytics adapters
│   ├── src/data/           approved offline/playable question content
│   ├── src/styles/         Steer editorial styling
│   └── src/test/           Vitest and React Testing Library tests
└── submission/             submission notes and clinical-review checklist
```

## System architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ React + TypeScript frontend                                  │
│ Landing → topic → 3-question quiz → learning → result/share │
│ Connected API mode or self-contained HTML5 playable mode     │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / JSON
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Spring Boot modular monolith                                 │
│ Quiz API · scoring · challenges · analytics · rate limiting  │
└──────────────────────────────┬───────────────────────────────┘
                               │ JPA + Flyway
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ PostgreSQL                                                   │
│ Questions · sessions · attempts · challenges · events        │
│ Distributed rate-limit counters                              │
└──────────────────────────────────────────────────────────────┘
```

### Request flow

1. `POST /api/v1/quiz/sessions` creates an anonymous, expiring session and persists a random three-question selection.
2. `GET /api/v1/quiz/questions` returns questions without correct-answer flags.
3. `POST /api/v1/quiz/submit` validates option ownership, locks the session, scores once, and returns explanations plus a private result token.
4. `GET /api/v1/quiz/results/{attemptId}` requires that result capability token.
5. `POST /api/v1/challenges` creates a random public challenge code without exposing answers or identity.
6. Analytics are accepted only when consent is explicit and metadata matches the event allowlist.

## Technology

| Layer | Technology |
| --- | --- |
| Backend | Java 21, Spring Boot 3.5, Spring Web, Security, Validation, Data JPA |
| Database | PostgreSQL 16, Flyway migrations |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 plus project CSS |
| Backend tests | JUnit, MockMvc, Spring Security Test, Testcontainers |
| Frontend tests | Vitest, React Testing Library, Playwright |
| Deployment | Docker/Render-compatible backend, Vercel-compatible frontend |

## Runtime environments

| Environment | Backend | Frontend | Intended use |
| --- | --- | --- | --- |
| Local connected | Spring Boot + local PostgreSQL | Vite proxy to port 8080 | Full development workflow |
| Local standalone | Not required | Vite with `VITE_APP_MODE=standalone` | Offline behavior checks |
| Playable artifact | Not required | One self-contained file in `dist-playable/` | Meta HTML5 submission/demo |
| Test | Testcontainers PostgreSQL | Vitest/Playwright | Automated verification |
| Production | Container + managed PostgreSQL, `prod` profile | Static Vite build | Hosted web experience |

## Prerequisites

- Java 21
- Node.js 20 or newer and npm
- Docker with Compose for PostgreSQL and backend integration tests

## Run locally — connected mode

### 1. Start PostgreSQL

```bash
cd problem1/backend
cp .env.example .env
docker compose --env-file .env up -d postgres
```

### 2. Start the backend

Load the local variables and provide the JDBC URL assembled from them:

```bash
cd problem1/backend
set -a
source .env
set +a
export DB_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}"
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

The API listens on `http://localhost:8080` unless `SERVER_PORT` is changed. Flyway applies the schema automatically.

### 3. Start the frontend

```bash
cd problem1/frontend
cp .env.example .env.local
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. With an empty `VITE_API_BASE_URL`, `/api` is proxied to `API_PROXY_TARGET`, which defaults to `http://localhost:8080`.

## Run locally — standalone mode

Standalone mode never calls the backend. It selects questions and scores the quiz locally, labels results as unverified, disables server-backed friend challenges, and sends no analytics.

Set this in `problem1/frontend/.env.local`:

```dotenv
VITE_APP_MODE=standalone
VITE_API_BASE_URL=
VITE_STEER_URL=https://steerclub.com
```

Then run:

```bash
cd problem1/frontend
npm run dev
```

## Build the single-file playable ad

```bash
cd problem1/frontend
npm ci
npm run build:playable
npm run test:playable
```

The deliverable is generated under `frontend/dist-playable/`. JavaScript and CSS are inlined, assets are bundled, and no API key or server credential is embedded.

## Configuration

### Backend

| Variable | Required in production | Purpose |
| --- | --- | --- |
| `DB_URL` | Yes | PostgreSQL JDBC URL |
| `DB_USERNAME`, `DB_PASSWORD` | Yes | Database credentials |
| `SPRING_PROFILES_ACTIVE` | Yes | Use `prod` in production |
| `FRONTEND_URL` | Yes | Canonical frontend URL |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated trusted origins; wildcard origins are rejected in production |
| `STEER_WEBSITE_URL` | Recommended | Approved handoff destination |
| `RESULT_TOKEN_SECRET` | Yes | Signs private result capability tokens |
| `RATE_LIMIT_HASH_SECRET` | Yes | Hashes rate-limit client keys |
| `SESSION_TTL`, `CHALLENGE_TTL` | No | ISO-8601 expiry durations |
| `QUIZ_POINTS_PER_CORRECT` | No | Points awarded for each correct answer |
| `QUIZ_SMART_STRATEGIST_MIN_SCORE` | No | Smart Strategist threshold |
| `QUIZ_MYTH_BUSTER_MIN_SCORE` | No | Myth Buster threshold |
| `RATE_LIMIT_*` | No | Distributed rate-limit window and limits |
| `PORT` or `SERVER_PORT` | Host-dependent | HTTP port |

Use long, random, different values for the two secrets. Do not place production values in Git.

### Frontend

| Variable | Purpose |
| --- | --- |
| `VITE_APP_MODE` | `connected` or `standalone` |
| `VITE_API_BASE_URL` | Backend origin in a direct-CORS deployment; blank uses same-origin `/api` |
| `API_PROXY_TARGET` | Development/preview proxy target only |
| `VITE_STEER_URL` | Approved external handoff URL |

## Tests

Backend unit and integration tests:

```bash
cd problem1/backend
./mvnw test
```

The integration suite uses PostgreSQL Testcontainers and needs a running Docker daemon.

Frontend checks:

```bash
cd problem1/frontend
npm run lint
npm test -- --run
npm run build
npm run test:e2e
```

## Production deployment

### Backend container

```bash
cd problem1/backend
docker build -t metaboquest-problem1-api .
```

Deploy the image with:

- `SPRING_PROFILES_ACTIVE=prod`
- managed PostgreSQL values in `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`
- strong `RESULT_TOKEN_SECRET` and `RATE_LIMIT_HASH_SECRET`
- exact frontend origins in `CORS_ALLOWED_ORIGINS`
- `FRONTEND_URL`, `STEER_WEBSITE_URL`, and the host-provided `PORT`

The health check is `GET /actuator/health`. Run Flyway against a backup-protected database and keep at least one application instance available during rolling deployments.

### Frontend static host

Build from `problem1/frontend`:

```bash
npm ci
npm run build
```

Publish `dist/`. Configure either:

- `VITE_API_BASE_URL=https://your-api.example` plus matching backend CORS, or
- a same-origin `/api/*` reverse proxy, as demonstrated by `frontend/vercel.json`.

All non-asset routes must rewrite to `index.html` for React Router.

## Security and privacy

- No account, contact details, or medical history is required.
- Correct answers never appear in the question payload.
- Result access uses signed capability tokens; plaintext tokens are not stored.
- Changed resubmissions conflict, while identical retries remain idempotent.
- PostgreSQL-backed counters enforce limits across multiple backend instances.
- Raw client addresses are not persisted.
- Challenge pages expose only limited score/profile information.
- Analytics are off by default and require explicit consent.
- Topic and score data are not appended to the Steer handoff URL.

## Scientific content workflow

The active bank contains sourced questions across safety, side effects, muscle, maintenance, diabetes, and eligibility. Each explanation carries its source metadata. A migration or database publication flag is not clinical approval: public campaign content should receive named clinician review using the [content review checklist](submission/CONTENT_REVIEW_CHECKLIST.md).

## Related documentation

- [Backend details](backend/README.md)
- [Frontend details](frontend/README.md)
- [Submission package](submission/README.md)
- [Repository overview](../README.md)

Built in the Steer editorial system · [steerclub.com](https://steerclub.com)
