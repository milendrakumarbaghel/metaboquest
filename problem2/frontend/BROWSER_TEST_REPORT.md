# Science Studio browser verification

Tested locally on 2026-10-18 at `http://127.0.0.1:5186/?demo=true` using headless installed Chrome, driven by the existing Playwright installation in Problem 1. No npm packages were added. Browser timezone: Asia/Kolkata. Reduced motion enabled.

## Verified interactions

| Tab | Browser checks |
| --- | --- |
| Papers | Seed library; PDF upload and URL import with optional titles; paper refresh and selection; English-only generation with no language controls; two-paper demo batch completion and opening a result. Demo ingestion is simulated, not PDF extraction. |
| Doctor Review | Required reviewer name; evidence disclosure; three claim approvals; claim rejection; full-package approval; request changes; package rejection; approval gates for media and scheduling. |
| Media Studio | Carousel selection; square, portrait and story static previews; all four reel scenes and B-roll disclosure; caption clipboard copy and denied-clipboard fallback; Canva JSON dialog, Escape close and file download; binary exports disabled in demo. |
| Scheduling | All four platform choices; past-date validation; caption edits; adding/removing hashtags; saving and retaining a schedule across tab navigation; disabling publication for unsaved captions and pending hashtags; confirmation dialog; simulated publication and published-state lock. Nothing was posted. |
| Effort Audit | Sample metrics, human time, percentage, table and chart render; reduced-motion final counter value. These values are illustrative. |

All five tabs were checked at 320, 390, 768 and 1280px viewport widths, with no document-level horizontal overflow. The normal demo scenarios produced no console errors or uncaught browser errors and made no Science Studio API requests.

A separate scenario used live-mode frontend code with **every `/api/v1/` request intercepted in the browser**. It verified offline import failure and recovery, disabled/loading generation UI, HTTP 503 generation failure and retry, failed image preview and retry, schedule loading/error/retry (including an empty 204 schedule), and effort loading/error/retry. Expected failed-resource console messages from these injected failures are recorded separately in the JSON report. This is frontend failure-state testing, not backend integration verification.

## Fixes from testing

- `src/components/SchedulingView.tsx`: an uncommitted hashtag now counts as an unsaved edit and disables Publish now.
- `src/mockData.ts`: demo PDF uploads now honor the optional FormData title.
- `src/App.tsx`: offline guidance now references the configured Science Studio service, instead of instructing users to run the empty Problem 2 backend starter.

## Reproduce

From `problem2/frontend`, start Vite in one terminal:

```sh
npm run dev -- --host 127.0.0.1 --port 5186 --strictPort
```

In another terminal:

```sh
node scripts/browser-check.mjs
npm run build
npm run lint
```

The script requires the already-installed `problem1/frontend/node_modules/@playwright/test` and Google Chrome. The intercepted live-mode scenario needs nonempty local placeholder pipeline/review keys, as supplied by `.env.example`; no real API credentials are needed or sent. All test API traffic is intercepted. Optional `TEST_FILTER=Intercepted` runs only failure-state checks. Each run replaces `screenshots/browser-report.json`.

The latest full run passed all seven browser scenarios, including English-only generation and batch payload enforcement. `npm run build` and `npm run lint` exited successfully. Screenshots and per-scenario console results are in `screenshots/`.

## Remaining limitations

- No deployed Science Studio backend is available in the inspected project. Real PDF extraction/URL retrieval, AI generation and translation, persisted review/approval, asynchronous batch jobs, rendered media, binary exports/audio, durable schedules, social publication and measured effort telemetry remain unverified.
- The intercepted fixtures do not establish compatibility with an implemented API. The team must provide the Science Studio service URL, confirmed API contract, authentication/access setup, CORS or reverse-proxy configuration, and configured publishing accounts to test live mode.
- Demo data resets on reload; the supplied contract has no library-list endpoint. Demo mode remains explicitly available through `?demo=true` and never publishes to social accounts.
- This pass used Chromium at multiple viewport sizes. Safari, Firefox, real mobile devices, screen-reader behavior, the two-minute timeout, and partial-failure batch polling were not exhaustively tested.

No backend files, dependency manifests, deployment configuration or unrelated user changes were modified in this pass.

## Files touched during the original verification pass

All paths below are relative to `problem2/frontend/`. Other existing working-tree changes were left intact.

- `src/App.tsx`
- `src/components/SchedulingView.tsx`
- `src/mockData.ts`
- `scripts/browser-check.mjs`
- `README.md`
- `BROWSER_TEST_REPORT.md`
- `screenshots/browser-report.json`
- `screenshots/demo-papers-desktop.png`
- `screenshots/demo-review-desktop.png`
- `screenshots/demo-studio-desktop.png`
- `screenshots/demo-schedule-desktop.png`
- `screenshots/demo-effort-desktop.png`
- `screenshots/demo-mobile.png`

## English-only follow-up

Removed the header language selector, multilingual Papers copy, and language-switch action. The workspace stays on English; generation and batch API requests always serialize `language: 'en'`. Backend DTOs still accept `Language = 'en' | 'hi' | 'hinglish'`. Date labels use English while retaining the local timezone.

The updated demo regression suite passed across all five tabs and four viewport sizes. An additional intercepted-request test checked six generation/batch calls using all three DTO language values: every request sent English and retained the API-key header. It also checked that a non-English package cannot change the workspace language or become active. Normal demo scenarios and the new payload test had no console errors. Expected injected network errors remain recorded separately.

`npm run build`, `npm run lint`, and `git diff --check` passed. Real backend integration remains unverified. No backend, Problem 1, dependency, or stylesheet files were changed.

Files updated in this follow-up: `src/components/Header.tsx`, `src/components/PapersView.tsx`, `src/components/DoctorReviewView.tsx`, `src/components/MediaStudioView.tsx`, `src/components/utils.ts`, `src/context/store.ts`, `src/api/packages.ts`, `scripts/browser-check.mjs`, `README.md`, this report, and the seven existing screenshot/report artifacts listed above.
