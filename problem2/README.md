# Problem 2 — Steer Science Studio

Steer Science Studio is an AI-assisted, doctor-gated pipeline for Steer Club Hackathon Problem Statement 2: **From research paper to Instagram, automated**.

A PDF or supported public research URL goes in. The system extracts traceable claims, translates them into accessible Steer-style language, creates carousel/static/reel/caption assets, requires a human medical review, and produces branded exports plus an auditable schedule and effort report.

> Generated content is a draft until every claim is source-verified and explicitly approved by a qualified reviewer.

## What the project solves

- Converts dense research into repeatable social-content packages.
- Keeps evidence quotes, page numbers, confidence, and source documents attached to claims.
- Produces several content formats from one evidence base.
- Uses Steer’s warm, doctor-led, India-aware voice without hype or shame.
- Separates generation access from doctor-review access.
- Blocks media export and publication actions until the review gate passes.
- Reports machine and human effort so weekly production can be evaluated honestly.

## Project structure

```text
problem2/
├── backend/
│   ├── src/main/java/org/springboot/backend/
│   │   ├── ingest/       PDF/URL acquisition, validation and extraction
│   │   ├── ai/           compatible AI gateway and extractive fallback
│   │   ├── pipeline/     package generation and batch orchestration
│   │   ├── review/       claim and package approval rules
│   │   ├── render/       image, PDF, audio, subtitle and bundle output
│   │   ├── social/       scheduling, publishing state and effort audit
│   │   ├── api/          REST controllers and DTO mapping
│   │   ├── domain/       JPA entities and workflow states
│   │   ├── repository/   persistence adapters
│   │   ├── config/       API-key security, CORS and runtime wiring
│   │   └── common/       errors and shared helpers
│   ├── src/main/resources/db/migration/
│   └── src/test/         unit, rendering and Testcontainers tests
└── frontend/
    ├── src/api/          typed HTTP clients
    ├── src/context/      application state and reducer
    ├── src/hooks/        polling, operations and notifications
    ├── src/components/   papers, review, studio, schedule and audit views
    └── src/assets/       interface assets
```

## System architecture

```text
                         ┌─────────────────────────────┐
 PDF upload / HTTPS URL ─▶ Ingestion and source store  │
                         └──────────────┬──────────────┘
                                        ▼
                         ┌─────────────────────────────┐
                         │ AI structured generation    │
                         │ or extractive fallback      │
                         └──────────────┬──────────────┘
                                        ▼
                         ┌─────────────────────────────┐
                         │ Server-side evidence check  │
                         │ quote · page · confidence   │
                         └──────────────┬──────────────┘
                                        ▼
┌───────────────────┐    ┌─────────────────────────────┐
│ React Studio UI   │◀──▶│ Spring Boot pipeline API    │
│ papers · review   │    │ packages · review · render  │
│ media · schedule  │    │ batch · schedule · effort   │
└───────────────────┘    └──────────────┬──────────────┘
                                        ▼
                         ┌─────────────────────────────┐
                         │ PostgreSQL + Flyway         │
                         │ sources, claims, assets,    │
                         │ reviews, schedules, audits  │
                         └─────────────────────────────┘
```

## Pipeline lifecycle

1. **Ingest:** upload a PDF or submit a public `https://` article URL.
2. **Extract:** retain the source, derive page-level text, deduplicate it by SHA-256, and reject unsafe inputs.
3. **Generate:** use an OpenAI-compatible structured-output provider when configured, otherwise use the grounded English extractive engine.
4. **Verify:** independently locate every evidence quote in stored source text before saving a claim.
5. **Review:** a reviewer approves or rejects claims and then decides the complete package.
6. **Create:** approved packages render carousels, static posts, reel frames, audio, subtitles, captions, and bundles.
7. **Operate:** prepare a schedule/publishing state and inspect machine-versus-human effort telemetry.

## Technology

| Layer | Technology |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1, Spring MVC, Security, Validation, Data JPA |
| Ingestion | Apache PDFBox, jsoup, hardened HTTPS fetcher |
| AI | OpenAI-compatible chat-completions adapter plus deterministic fallback |
| Database | PostgreSQL, isolated Problem 2 Flyway history |
| Rendering | Java2D/Graphics2D, PDF, ZIP, WAV, SRT and VTT generation |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 plus project CSS |
| Tests | JUnit, Spring tests, Testcontainers, frontend lint/type/build checks |
| Deployment | Docker/Render-compatible backend, Vercel-compatible frontend |

## Runtime environments

| Environment | AI mode | Data/API mode | Intended use |
| --- | --- | --- | --- |
| Frontend demo | Sample fixtures | Browser-local `?demo=true` | UI walkthrough without services |
| Local fallback | No `AI_API_KEY` | Local PostgreSQL + live API | Grounded development without paid AI |
| Local AI | Compatible provider configured | Local PostgreSQL + live API | End-to-end generation testing |
| Test | Stubbed/deterministic paths | Testcontainers PostgreSQL | Automated verification |
| Production | Compatible provider optional | Container + managed PostgreSQL | Controlled research/content workflow |

## Prerequisites

- Java 21
- Node.js 20 or newer and npm
- PostgreSQL 16 or compatible
- Docker for backend integration tests
- Optional compatible AI API key

## Run locally — backend

### 1. Create the database

Create a PostgreSQL database named `metaboquest_content`, or choose another name and update `DB_URL` in your local environment file.

### 2. Configure local environment

```bash
cd problem2/backend
cp .env.example .env
```

Replace the database placeholders and create two different random API keys. Leave `AI_API_KEY` blank to use the grounded extractive fallback.

### 3. Start the service

```bash
cd problem2/backend
set -a
source .env
set +a
./mvnw spring-boot:run
```

The backend listens on `http://localhost:8080` by default. Flyway uses `flyway_schema_history_problem2`, allowing the pipeline schema to remain isolated even when a PostgreSQL server is shared with another project.

## Run locally — frontend

```bash
cd problem2/frontend
cp .env.example .env.local
npm ci
npm run dev
```

For local proxy development, set:

```dotenv
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_PIPELINE_API_KEY=your-local-pipeline-key
VITE_REVIEW_API_KEY=your-local-review-key
```

The two frontend values must match their backend counterparts. Open the URL printed by Vite, normally `http://localhost:5173`.

## Run the frontend demo

Start the frontend and open:

```text
http://localhost:5173/?demo=true
```

Demo mode is intentionally browser-local. It includes illustrative papers, claim reviews, media previews, scheduling, and effort values. It does not upload documents, call the live pipeline, generate evidence, download binary exports, or publish content.

## AI environments

### Extractive fallback

Use this when no provider is available:

```dotenv
AI_API_KEY=
```

The backend creates grounded English drafts from extracted source sentences. Hindi/Hinglish generation is not claimed in fallback mode.

### Compatible AI provider

```dotenv
AI_API_KEY=your-provider-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=your-approved-model
```

Provider output is treated as untrusted. The backend requires structured JSON, limits claim count, stores the prompt version, and verifies evidence quotes against the retained source before persistence.

## Configuration

### Backend

| Variable | Required in production | Purpose |
| --- | --- | --- |
| `DB_URL` | Yes | PostgreSQL JDBC URL |
| `DB_USERNAME`, `DB_PASSWORD` | Yes | Database credentials |
| `PIPELINE_API_KEY` | Yes | Pipeline-role authentication |
| `REVIEW_API_KEY` | Yes | Reviewer-role authentication; must differ from pipeline key |
| `AI_API_KEY` | No | Enables compatible AI generation |
| `AI_BASE_URL` | When using AI | Compatible provider base URL |
| `AI_MODEL` | When using AI | Approved model identifier |
| `PORT` | Host-dependent | HTTP port |
| `FRONTEND_URL` | Recommended | Deployed studio URL/documentation value |

### Frontend

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Direct backend origin; blank uses same-origin `/api` |
| `VITE_API_PROXY_TARGET` | Local Vite proxy target |
| `VITE_PIPELINE_API_KEY` | Prototype pipeline credential sent as `X-API-Key` |
| `VITE_REVIEW_API_KEY` | Prototype reviewer credential sent as `X-API-Key` |

Vite variables are embedded in the built JavaScript. Direct browser API keys are acceptable only for a controlled hackathon prototype. A public production console should authenticate users and proxy privileged operations through a trusted server so reviewer and publishing credentials never reach the browser.

## API roles

| Access | Examples |
| --- | --- |
| Public | Health endpoint and approved render/export downloads |
| Pipeline key | Paper ingestion, generation, packages, batches, schedule and effort operations |
| Review key | Read access plus claim/package review endpoints |

The primary workflow begins under `/api/v1/papers`, continues through `/api/v1/packages`, and uses `/api/v1/review/packages` for the independent review gate.

## Tests

Backend tests:

```bash
cd problem2/backend
./mvnw test
```

The suite covers ingestion safety, deduplication, content generation, evidence verification, role separation, review gating, batch behavior, rendering, and exports. Integration tests require Docker for PostgreSQL Testcontainers.

Frontend checks:

```bash
cd problem2/frontend
npm run lint
npm run build
```

The production build includes TypeScript validation. See the [browser verification report](frontend/BROWSER_TEST_REPORT.md) for recorded UI coverage and limitations.

## Production deployment

### Backend container

```bash
cd problem2/backend
docker build -t steer-science-studio-api .
```

The runtime image includes font packages required for headless Java rendering. Deploy it with managed PostgreSQL, unique API keys, optional AI values, and the host-provided `PORT`. The health check is `GET /actuator/health`.

For a hardened production environment:

- restrict CORS to the real frontend origin instead of a broad origin pattern;
- place reviewer and publishing actions behind server-side identity and authorization;
- store database, provider, and API credentials in the host secret manager;
- use persistent object storage when source documents and large exports must outlive an application instance;
- connect scheduling/publishing to an approved social-platform API before claiming automatic publication;
- retain review events and source files according to the organisation’s clinical/content governance policy.

### Frontend static host

Build from `problem2/frontend`:

```bash
npm ci
npm run build
```

Publish `dist/`. Configure `VITE_API_BASE_URL` before build, or provide a same-origin `/api/*` reverse proxy such as the one in `frontend/vercel.json`. SPA routes must fall back to `index.html`.

## Safety controls

- Maximum input and PDF validation prevent unbounded or malformed uploads.
- URL ingestion accepts public HTTPS research sources and blocks local/private destinations and unsafe redirects.
- Source content is hashed for deduplication.
- Papers are treated as untrusted data in model prompts.
- Every saved claim carries a page, evidence quote, confidence, and verification state.
- Package approval fails closed until all linked claims are verified and reviewed.
- Pipeline and reviewer permissions use separate keys and constant-time comparisons.
- Review events preserve who decided what and when.
- No generated copy should promise outcomes, promote a specific drug, shame a body, or replace medical advice.

## Output formats

- Carousel PNG slides, PDF, and ZIP
- Static portrait, square, and story PNGs
- Reel scene frames and storyboard bundle
- WAV voiceover
- SRT and VTT subtitles
- Caption and hashtags
- Canva-compatible JSON specification
- Complete content bundle
- Schedule/publication state and effort audit

The scheduler is an auditable prototype, not proof of a live Instagram/Meta connector.

## Related documentation

- [Backend details and API examples](backend/README.md)
- [Frontend details](frontend/README.md)
- [Browser verification](frontend/BROWSER_TEST_REPORT.md)
- [Repository overview](../README.md)

Built in the Steer editorial system · [steerclub.com](https://steerclub.com)
