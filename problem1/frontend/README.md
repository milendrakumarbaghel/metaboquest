# MetaboQuest frontend

A mobile-first quiz about GLP-1 doubts for Steer (Problem Statement 1). React 19, Vite and TypeScript.
No login. Educational only, not medical advice.

## Flow

1. Hook (`/`): "GLP-1: how much is fact, and how much is fear?"
2. Topic (`/topic`): "What makes you unsure about GLP-1?" Seven options: safe, side effects, muscle, weight regain, only for diabetes, even for me, or just curious ("Skip, surprise me"). The topic only picks which questions you see. It is an educational interest, not a medical assessment.
3. Play (`/play`): three questions. Each has an instant myth-vs-fact explanation with a source link.
4. Results (`/results/:id`): the topic takeaway first, then the knowledge score, sourced answer review, sharing and friend challenge.
5. Handoff: a four-step view of how Steer works (diagnostics, doctor consult, continuous care, habits that last) with "See if the programme fits you" and "Talk to a Steer doctor". Also on `/explore`.

## Scripts

Run from this folder.

- `npm run dev`: dev server (proxies `/api` to the backend)
- `npm run build`: type-check and production build
- `npm run build:playable`: single-file offline build to `dist-playable/index.html`
- `npx vitest run`: unit tests (`npm test` is watch mode)
- `npm run lint`
- `npm run test:e2e`: Playwright (Chrome); starts its own dev server
- `npm run test:playable`: rebuilds the offline file and checks all seven topic flows with zero network requests

## Environment variables

See `.env.example` and [API setup](./API_SETUP.md).

- `VITE_APP_MODE`: `connected` (default) or `standalone` (offline, bundled questions)
- `VITE_API_BASE_URL`: backend origin, without `/api`
- `API_PROXY_TARGET`: local dev proxy target
- `VITE_STEER_URL`: where the Steer buttons open (default `https://steerclub.com`)

## Offline playable

`npm run build:playable` produces one self-contained `dist-playable/index.html` (HashRouter, standalone mode). It needs no server and makes no network requests while playing. Scores in this mode are local and unverified; public friend challenges need the backend. A copy for submission lives in `../submission/`.

## Privacy

- Nothing from the quiz is sent to Steer. The Steer buttons open `VITE_STEER_URL` (origin and path only) in a new tab: no topic, answers, score, UTM or query string.
- Analytics is off unless the player opts in. If allowed, the chosen topic name is counted anonymously with gameplay events. It is not added to share text or challenge links.
- Sharing a topic with Steer would need clear consent and a real handoff mechanism (a form or API). Neither exists today.

## Content

Questions and takeaways cite public health sources. They are source-checked, not clinician-reviewed. See `../submission/CONTENT_REVIEW_CHECKLIST.md`.
