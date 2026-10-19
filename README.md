# MetaboQuest × steer

Two production-oriented prototypes for the Steer Club Hackathon, built around one principle: metabolic-health education should be accurate, useful, calm, and easy to act on.

| Project | Experience | Core outcome |
| --- | --- | --- |
| **[Problem 1 — MetaboQuest](problem1/README.md)** | Mobile-first playable quiz | A no-login, three-question learning experience with sourced explanations, shareable results, friend challenges, and a gentle doctor-led handoff |
| **[Problem 2 — Science Studio](problem2/README.md)** | Research-to-social content pipeline | A source-traceable workflow that ingests research, creates multi-format content, requires doctor review, renders exports, and records production effort |

Both applications use Steer’s warm editorial system: cream paper, rust and maroon accents, serif headlines, generous spacing, Indian context, and no fear, shame, miracle claims, or medicine promotion.

## Repository map

```text
metaboquest/
├── problem1/
│   ├── backend/       Java 21 + Spring Boot quiz API
│   ├── frontend/      React + TypeScript playable experience
│   └── submission/    Hackathon hand-off and clinical-review material
├── problem2/
│   ├── backend/       Java 21 + Spring Boot content pipeline
│   └── frontend/      React + TypeScript Science Studio
├── Dockerfile.problem1
├── Dockerfile.problem2
└── render.yaml        Render service definitions
```

## Architecture

```text
Problem 1 browser                          Problem 2 browser
quiz · results · challenges                papers · review · studio · schedule
          │                                             │
          ▼                                             ▼
Problem 1 Spring Boot API                  Problem 2 Spring Boot API
sessions · scoring · analytics             ingest · extract · generate · render
          │                                doctor gate · export · schedule
          └──────────── PostgreSQL + Flyway ────────────┘
```

The backends use the Java package root `org.springboot.backend`.

## Technology

- Java 21, Spring Boot, Spring Security, Spring Data JPA, Flyway, PostgreSQL
- React 19, TypeScript, Vite, accessible semantic UI, responsive CSS
- JUnit, MockMvc, Testcontainers, Vitest, React Testing Library, Playwright
- Docker/Render for backend deployment and Vercel-compatible frontend builds
- Optional OpenAI-compatible model access in Problem 2, with a grounded extractive fallback when no AI key is configured

## Quick start

Prerequisites: Java 21, Node.js 20+, npm, Docker, and Docker Compose.

### Problem 1 — playable quiz

Start PostgreSQL:

```bash
cd problem1/backend
cp .env.example .env
docker compose --env-file .env up -d postgres
```

Then start Spring Boot with the local environment:

```bash
cd problem1/backend
set -a
source .env
set +a
export DB_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}"
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

Start the frontend in another terminal:

```bash
cd problem1/frontend
cp .env.example .env.local
npm ci
npm run dev
```

The default frontend URL is `http://localhost:5173`; the API defaults to `http://localhost:8080` through the Vite development proxy.

Problem 1 also supports a self-contained playable-ad build:

```bash
cd problem1/frontend
npm run build:playable
npm run test:playable
```

### Problem 2 — Science Studio

Create a PostgreSQL database, copy the sample environment file, and keep all real values outside version control:

```bash
cd problem2/backend
cp .env.example .env
set -a
source .env
set +a
./mvnw spring-boot:run
```

Start the frontend in another terminal:

```bash
cd problem2/frontend
cp .env.example .env.local
npm ci
npm run dev
```

Append `?demo=true` to the frontend URL for a browser-local walkthrough that does not call the backend. Demo content and metrics are explicitly labelled as illustrative.

## Environment configuration

Never commit production secrets. The checked-in `.env.example` files contain names and placeholders only.

### Problem 1

| Variable | Purpose |
| --- | --- |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection |
| `RATE_LIMIT_HASH_SECRET` | Hashing secret for shared PostgreSQL rate-limit keys |
| `RESULT_TOKEN_SECRET` | Signs private result capability tokens |
| `CORS_ALLOWED_ORIGINS` | Comma-separated trusted frontend origins |
| `VITE_API_BASE_URL` | Browser-visible backend origin; leave blank for the local Vite proxy |
| `VITE_APP_MODE` | `connected` or self-contained `standalone` behavior |
| `VITE_STEER_URL` | Natural Steer handoff destination; defaults to `https://steerclub.com` |

### Problem 2

| Variable | Purpose |
| --- | --- |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection |
| `PIPELINE_API_KEY` | Ingestion, generation, batch, render, and scheduling access |
| `REVIEW_API_KEY` | Independent doctor-review access |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Optional compatible AI provider configuration |
| `VITE_API_BASE_URL` | Science Studio backend origin |
| `VITE_PIPELINE_API_KEY`, `VITE_REVIEW_API_KEY` | Prototype browser credentials; use a server-side gateway for a public production deployment |

Vite variables are embedded in the browser bundle and must not be treated as server-side secrets. The direct-key setup is suitable for a controlled hackathon prototype, not an unrestricted public publishing console.

## Problem 1 capabilities

- No-login mobile quiz with a clear first-screen hook and three-question play loop
- Random, persisted question selection across safety, side effects, muscle, maintenance, diabetes, and eligibility topics
- Server-side validation, scoring, configurable point thresholds, and capability-protected results
- Immediate sourced explanations, educational takeaways, and a doctor-conversation checklist
- Shareable achievement card and privacy-limited friend challenges
- Consent-aware analytics, funnel aggregation, and PostgreSQL-backed distributed rate limiting
- Standalone HTML5 playable mode when the API is unavailable
- Natural, non-diagnostic handoff to doctor-led Steer care

Clinical note: publication state is not the same as clinical sign-off. The content inventory records reviewer status, and the UI does not claim clinician review when no reviewer is recorded. See [Problem 1 submission guidance](problem1/submission/README.md).

## Problem 2 capabilities

- PDF upload and public HTTPS article ingestion with source retention and SHA-256 deduplication
- AI-assisted structured generation or deterministic extractive fallback
- Claim-level evidence quotes, page references, confidence, and server-side grounding checks
- English content packages with carousel, static, reel storyboard, captions, and hashtags
- Mandatory claim-by-claim doctor review before media export or publication actions unlock
- Brand-aligned PNG carousel/static rendering, carousel PDF/ZIP, reel frames, WAV voiceover, SRT/VTT subtitles, and bundle exports
- Canva-compatible JSON, batch processing, scheduling/publishing workflow, and human-effort telemetry
- SSRF protections, file limits, role-separated API keys, append-only review history, and fail-closed approval rules

The scheduling/publishing workflow is an auditable prototype. Connecting it to a real social-network publishing account requires that platform’s production credentials and approval process.

## Brand system

| Token | Value | Usage |
| --- | --- | --- |
| Cream | `#F5EBDF` | Page background |
| Steer rust | `#C04E2A` | Headlines, key words, actions, links |
| Ink | `#351D1D` | Body copy |
| Clay | `#B58777` | Secondary copy and labels |
| Blush | `#E6CBBD` | Dividers, borders, subtle fills |
| Soft paper | `#F8F2EB` | Cards and surfaces |

Headlines use an editorial serif; controls and body copy use a clean sans-serif. Copy stays confident, warm, short, and sentence-cased. Every experience reinforces doctor-led decisions, screening first, personal care, Indian routines, and durable habits. It avoids body shaming, before/after imagery, drug promotion, outcome promises, and crowded neon visuals. Brand sign-off is `steerclub.com`.

## Verification

Run each suite from its project directory:

```bash
# Problem 1 backend
cd problem1/backend && ./mvnw test

# Problem 1 frontend
cd problem1/frontend && npm run lint && npm test -- --run && npm run build

# Problem 2 backend
cd problem2/backend && ./mvnw test

# Problem 2 frontend
cd problem2/frontend && npm run lint && npm run build
```

Backend integration tests use Testcontainers and therefore require a running Docker daemon.

## Deployment

- `render.yaml` defines both backend services. Supply production database URLs, strong distinct API secrets, allowed origins, and optional AI provider values through the host’s secret manager.
- Build each frontend from its own directory and configure its `VITE_API_BASE_URL` before the production build.
- Configure SPA rewrites so client-side routes resolve to `index.html`.
- Allow only the deployed frontend origins in backend CORS configuration.
- Keep PostgreSQL credentials in deployment secrets; this repository’s application configuration is environment-driven.

## Responsible use

MetaboQuest is educational software, not diagnosis, treatment, or eligibility advice. Prescription decisions belong to qualified clinicians after individual screening. Problem 2’s generated drafts remain unpublished until the evidence is traceable and a doctor has reviewed every claim.

---

Built for Steer Club Hackathon · [steerclub.com](https://steerclub.com)
