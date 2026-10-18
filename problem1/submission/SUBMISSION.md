# MetaboQuest: Problem Statement 1 submission

An interactive quiz for sceptical adults in India about GLP-1 doubts. Mobile web, no login. Educational, not medical advice.

## Contents

- `playable-ad.html` / `playable-ad.zip`: offline build, no network requests while playing
- `one-liners.md`: trigger / value / next step
- `CONTENT_REVIEW_CHECKLIST.md`: questions, sources, takeaways, Steer claims; sign-off column is empty
- `demo-link.txt`, `loom-link.txt`: TODO placeholders

## The experience

Hook "GLP-1: how much is fact, and how much is fear?" -> pick a doubt (optional, "Skip, surprise me") -> three questions with instant myth-vs-fact feedback and source links -> topic takeaway, then knowledge score, answer review, sharing -> four-step Steer journey with "See if the programme fits you" and "Talk to a Steer doctor". The Steer description comes from the supplied brief. Nothing from the quiz (topic, answers, score) is sent to Steer.

## Run

Open `playable-ad.html` in a browser. To work on the source, from `problem1/frontend`:

```
npm install
npm run dev            # needs the backend on :8080 for connected mode
npm run build:playable # rebuilds dist-playable/index.html
```

Offline mode needs no backend: set `VITE_APP_MODE=standalone` (what `build:playable` does).

## Deploy (Vercel)

1. Import `problem1/frontend` as a Vercel project (Vite preset). `vercel.json` already rewrites routes to `index.html`.
2. For the no-backend demo, set `VITE_APP_MODE=standalone`. For connected mode, deploy the Spring Boot backend with PostgreSQL, set `VITE_API_BASE_URL` to its origin (no `/api`), and set the backend `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL` to the Vercel origin. See `frontend/API_SETUP.md`.
3. Optional: set `VITE_STEER_URL` (default `https://steerclub.com`).
4. Put the live URL in `demo-link.txt`.

## Loom script (about 2 minutes, mobile viewport)

Keep code, env files and credentials off screen.

- 0:00-0:20 Hook: show the landing screen. "Problem Statement 1: an ad people choose to tap. The first line asks how much of GLP-1 is fact and how much is fear, and the chips echo what people hear on WhatsApp. No signup."
- 0:20-0:40 Choose a doubt: open the topic screen. "What makes you unsure? One tap picks the doubt. It only chooses questions. It is not a medical assessment. Or skip."
- 0:40-1:10 Play: answer three questions, pause on the feedback. "Every answer gets an instant myth-vs-fact explanation with a source. Indian foods and routines: dal, chai, office tiffin, family dinners."
- 1:10-1:30 Value: results screen. "The takeaway for your doubt comes first, then the knowledge score. The score measures quiz knowledge, never health."
- 1:30-1:50 Handoff: Steer block. "Diagnostics, doctor consult, continuous care, habits that last. Two clear next steps. Nothing from the quiz goes to Steer."
- 1:50-2:00 Honesty: "Content is source-checked but not yet clinician-reviewed. That is the next step before public use."

## AI and tool disclosure

Built with AI coding assistance (Kiro) on a React, Vite, TypeScript frontend and a Spring Boot, PostgreSQL backend. The AI helped write code, tests and copy, and helped check public sources. The question content has not had clinician review. No AI is used at runtime.

## Still needs from you

- Clinician review and sign-off of `CONTENT_REVIEW_CHECKLIST.md` (nothing is clinician-reviewed today)
- Confirm Steer service details with Steer
- Deploy and add the live URL to `demo-link.txt`
- Record the Loom and add the link to `loom-link.txt`
- Submit through the Google Form (separately from Problem Statement 2)
- Not done: Meta/HTML5 ad packaging (optional per brief), user testing, and a real handoff mechanism to Steer. Sharing a topic with Steer would need explicit consent plus that mechanism.
- Sources are UK/US/WHO public-health references, not Indian prescribing criteria.
- The 60-second duration is a design target, not a measured result.
