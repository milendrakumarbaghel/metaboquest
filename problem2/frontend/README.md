# Steer Science Studio frontend

React 19, TypeScript, Vite, and Tailwind CSS 4 interface for the Problem 2 research-to-social pipeline.

## Run

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The frontend connects to the implemented Spring Boot service in `../backend`. Add `?demo=true` for a fully browser-local walkthrough with clearly labelled sample papers, claims, media, scheduling, and effort values.

## Configuration

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend origin; an empty value uses the Vite development proxy |
| `VITE_API_PROXY_TARGET` | Local proxy target, normally `http://localhost:8080` |
| `VITE_PIPELINE_API_KEY` | Prototype pipeline-role API key |
| `VITE_REVIEW_API_KEY` | Prototype doctor-review API key |

Vite variables are visible in browser JavaScript. For an unrestricted public production deployment, place privileged operations behind a server-side gateway rather than treating these values as secrets.

## Workflow

1. Upload a PDF or import a supported public HTTPS research URL.
2. Generate a source-grounded content package.
3. Review each claim and its evidence quote as a doctor/reviewer.
4. Approve the package to unlock carousel, static, reel, caption, and export views.
5. Prepare a schedule or publication action and inspect the effort audit.

The interface never silently replaces failed live requests with demo data. Binary previews and downloads use the real render/export endpoints; demo mode uses local illustrative previews only.

## Checks

```bash
npm run lint
npm run build
```

See [BROWSER_TEST_REPORT.md](BROWSER_TEST_REPORT.md) for the existing browser-verification record. Repository-wide setup and safeguards are documented in the [root README](../../README.md).
