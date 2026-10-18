# Steer Science Studio — Problem 2 frontend

React 19, TypeScript, Vite and Tailwind CSS 4. No dependencies were added to the existing project.

## Run

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open the URL printed by Vite. Add `?demo=true` for a browser-local demonstration. The parameter must equal `true`; ordinary live mode starts with an empty paper library and never falls back to sample data.

The demo includes illustrative papers, claim review, English sample media, sample batch processing, simulated scheduling/publication, and sample effort values. Binary exports and source-file downloads need the real backend and are disabled in demo mode. Sample content is not medical evidence. Nothing is posted to social networks by demo mode.

## Backend configuration and verified limitations

The frontend implements the endpoint shapes supplied in `frontend-p2.md`. At inspection time, this checkout's `problem2/backend` contains only a Spring Boot starter, with no controllers implementing those endpoints. The root `backend/target` JAR contains only `BackendApplication.class`. The running Docker service at localhost:8080 belongs to `problem1/backend`; its OpenAPI document exposes the quiz, challenge, and analytics endpoints, not Science Studio.

Consequently, live Science Studio ingestion, generation, review, rendering, exports, scheduling, publication, and telemetry cannot be integration-verified against the currently available backend. Point the frontend at the implemented Science Studio service when available. No backend files have been changed.

Environment values:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend origin. Empty uses same-origin `/api` requests. |
| `VITE_API_PROXY_TARGET` | Development proxy target; defaults to `http://localhost:8080`. |
| `VITE_PIPELINE_API_KEY` | `X-API-Key` for papers, packages, batches, scheduling, and effort. |
| `VITE_REVIEW_API_KEY` | `X-API-Key` for doctor-review writes. |

The example keys are local placeholders from the provided brief. Vite environment variables are embedded in browser JavaScript; they are not server-side secrets. Production hosting needs a suitable access-control deployment, matching keys, and CORS or a same-origin reverse proxy. Vite's development proxy does not run in the production build.

## Behavior

- PDF upload uses `FormData`; URL import sends JSON. Failed requests show actionable errors without silently switching modes.
- The workspace is English-only, with no language selector. Generation and batch requests always send `language: 'en'`; the backend `Language` DTO union is unchanged. Paper selection resolves the corresponding English package. State is kept in React Context and a reducer. The supplied contract has no paper/package list endpoint, so the library is session-memory only and resets on page reload.
- A claim review is followed by a full package fetch. Package decisions follow the backend's `readyForApproval` flag. Media and scheduling require `APPROVED` status.
- Batch polling runs every three seconds without overlapping reads, aborts on unmount, and stops on `COMPLETED`, `PARTIAL_FAILURE`, or `FAILED`. Available results can be opened individually.
- Live previews and binary downloads use the unauthenticated render/export endpoints. Canva JSON is fetched and can be downloaded. Clipboard failures leave text available for manual copying.
- Scheduling converts the local datetime input to UTC and re-fetches the saved schedule. Publishing requires an existing saved schedule and a separate confirmation; its status comes from the backend. No publication is claimed without that response.
- Effort values come from the API in live mode. Sample values are labelled in demo mode. Reduced-motion preferences disable the animated counter.
- Fetch requests time out after two minutes. Writes are not automatically retried.

## Checks

```sh
npm run build
npm run lint
```

The build type-checks and emits `dist/`. Local Chrome browser checks now cover all five demo tabs, responsive navigation, and intercepted API failure/retry states. See [the browser verification report](BROWSER_TEST_REPORT.md) for exact coverage, reproduction instructions, screenshots, and limitations. Real backend integration and social-platform publication still require the implemented Science Studio service.
