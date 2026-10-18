# MetaboQuest (Problem Statement 1) – GLP-1 topic-first improvement plan

Scope: Problem Statement 1 only. Problem Statement 2 is out of scope.
Root: `/Users/milendrakumarbaghel/Documents/Hackathon/metaboquest/problem1` (git root is one level up: `/Users/milendrakumarbaghel/Documents/Hackathon/metaboquest`).
Frontend: `/Users/milendrakumarbaghel/Documents/Hackathon/metaboquest/problem1/frontend` · Backend: `.../problem1/backend` · Submission: `.../problem1/submission`.

User constraints that override everything else:
- Do NOT `git commit` or push. Leave all changes in the working tree.
- No new automated tests. Only update/repair existing tests that break because of intentional changes.
- All existing checks must pass at the end: `npx vitest run`, `npm run lint`, `npm run build`, `npm run test:e2e`, `npm run test:playable`, `./mvnw test`.
- Never run a foreground dev server. Playwright's own `webServer` is fine (it starts and stops itself). Anything else goes in the background and is stopped afterwards.
- No secrets in files. No drug names, before/after bodies, weight-loss promises or numeric kg claims in user-facing copy.

---------------------------------------------------------------------------------------------------
## 1. Audit findings (verified by reading the working tree; baseline `npx vitest run` = 35 pass, `npm run lint` clean, `./mvnw -q test` = exit 0 with Docker up)

Git state: everything below is UNCOMMITTED work on top of commit `b9eea75`. V6, V7, V8 and the topic work are untracked/modified, so they were never released.

| # | Improvement | State | Evidence / gap |
|---|---|---|---|
| 1 | Hook | PARTIAL | `src/pages/Landing.tsx` h1 is already "GLP-1: fact or fear?" with "Let's play" CTA, but copy is generic, there is no specific first-3s curiosity line, and the topic chips sit under the CTA on the same screen. |
| 2 | Topic-first flow | PARTIAL | Done: `TopicPicker` (radio chips on Landing), `topics.ts` (6 values), `api.start(topic)` sends `{topic}`, backend `StartSessionRequest`, `QuizSession.learningTopic`, `quiz_session_questions`, V8 adds `learning_topic` columns and `selectQuestions(topic)` offline. Missing: flow is not Hook -> Topic -> Play (chips are on the hero); topic labels differ from the brief; no "Is it even for me?" vs "Only for diabetes?" split; backend THROWS 404 when a topic has fewer than 3 questions instead of topping up from a related pool; topics have only 4 questions each (weak replay variation); no skip/"surprise me" affordance beyond a chip; no resume handling. |
| 3 | Educational value | PARTIAL | Explanations only appear after the final answer (`Results.tsx`, `LearningTakeaways.tsx`). No instant myth-vs-fact feedback per question. No per-topic key takeaway panel. Content is short, generic and has almost no Indian context (4 of 21 questions mention food/routine). `DoctorChecklist` exists and must be kept. |
| 4 | Indian context | MISSING (mostly) | Only Q2 (desk work/chai/family dinner), Q11 (roti/sabzi), Q16 (commute), Q10 (family WhatsApp group). Everything else is neutral/Western. |
| 5 | Scientific accuracy | PARTIAL | Sources exist per question (NIDDK, CDC, Guy's & St Thomas', NHS). The NHS source is shown to users with the title "Semaglutide" (drug name in UI). No per-claim source record file. No `submission/CONTENT_REVIEW_CHECKLIST.md`. `LearningTakeaways` says "source-checked, not clinically signed off", which is honest; keep honest, never claim review without a reviewer field. |
| 6 | Fun & playability | PARTIAL | Three-question flow, progress bar, achievements/profiles, sharing, PNG card, friend challenges all exist and must stay. Missing: instant feedback animation, per-question progress feel, streak. Global `prefers-reduced-motion` rule already exists in `src/App.css` (keep it effective for any new animation). |
| 7 | Steer handoff | PARTIAL | `Explore.tsx` has the 4-step care grid and `DoctorChecklist`; `Results.tsx` ends with a generic "Explore Steer" link; backend `QuizService` nextStep copy is "Explore doctor-led metabolic care" / "Explore Steer". CTA labels are not "See if the programme fits you" / "Talk to a Steer doctor". `VITE_STEER_URL` already in `.env.example` and `config.ts` (default `https://steerclub.com`; VERIFIED: returns HTTP 200, `<title>` "Steer — Clinical weight loss, doctor-led"). No topic is sent to Steer today (keep it that way). `steerDestination()` does not strip query/hash. |
| 8 | Submission readiness | PARTIAL | `submission/` is NOT empty: it has stale `README.md` and `LOOM_SCRIPT.md` that describe the old 21-question bank. `dist-playable/index.html` exists (355 KB) but is stale. Missing: `playable-ad.html`, `playable-ad.zip`, `one-liners.md`, `demo-link.txt`, `loom-link.txt`, `SUBMISSION.md`, `CONTENT_REVIEW_CHECKLIST.md`. |

Applied Flyway: V1-V5 SQL (tracked), V6, V7 SQL and `V8__seed_concern_questions.java` (all untracked). Next free version = **V9**. `V8` computes its checksum from `data/glp1-question-bank.json`, so that JSON must NOT be edited. V9 gets its own JSON file.

Existing behaviours to preserve (tests cover them): connected-mode failure shows an error and does NOT silently start a local quiz; draft/refresh recovery; frozen pending submission retry; private result token handling; challenge flow; analytics opt-in (off by default); standalone (`dist-playable`) makes zero network requests.

---------------------------------------------------------------------------------------------------
## 2. Design decisions (each with a one-line reason)

D1. Topics become 7 values: `SAFETY`, `SIDE_EFFECTS`, `MUSCLE`, `MAINTENANCE`, `DIABETES` (new), `ELIGIBILITY`, `GENERAL`. Reason: the brief's six doubts map 1:1 and side effects is a named worry; reusing existing enum values avoids renames. `ELIGIBILITY` now means "Is it even for me?"; the "only for diabetes" question (#18) is reassigned to `DIABETES`.

D2. Exact user-facing topic labels (use verbatim in `src/data/topics.ts`):
- `SAFETY` -> "Is it safe?"
- `SIDE_EFFECTS` -> "What about side effects?"
- `MUSCLE` -> "Will I lose muscle?"
- `MAINTENANCE` -> "Will the weight come back?"
- `DIABETES` -> "Is it only for diabetes?"
- `ELIGIBILITY` -> "Is it even for me?"
- `GENERAL` -> "Just curious" (also reached by the visible "Skip, surprise me" link)

D3. Flow: `/` (hook) -> `/topic` (new route, "What makes you unsure about GLP-1?") -> `/play` -> `/results/:id` -> handoff block on results and `/explore`. Tapping a topic chip IS the start action (one tap, no extra "continue"). `/play` opened directly still works (topic = GENERAL) so existing deep links and the e2e test keep working. Challenge "Accept challenge" keeps going straight to `/play` (GENERAL).

D4. Content single source of truth for new content: one new file `backend/src/main/resources/data/glp1-topic-bank-v9.json`, imported by both the V9 migration and the frontend (the same pattern V8 uses with `glp1-question-bank.json`). V8 JSON stays frozen.

D5. V9 is a Java migration `V9__curated_topic_bank.java` in `org.springboot.backend.db.migration` (same mechanism as V8, `@Component`, checksum = CRC32 of its JSON). It (a) re-creates the `learning_topic` CHECK constraints with `DIABETES`, (b) re-creates the `analytics_events.event_type` CHECK with `TOPIC_SELECTED`, (c) retitles the NHS source, (d) reassigns #18 to `DIABETES`, (e) retires (sets `active=false`) legacy #6, #7, #20, (f) inserts 19 new questions with options and source links, (g) sets `question_sets.version = 4`. Reason: V1-V8 stay untouched; sessions already created keep their questions through `quiz_session_questions` (submit uses `session.getQuestions()`, not the active flag).

D6. Instant feedback uses the bundled bank in BOTH modes (answer key looked up by question id; unknown id -> graceful "explanation comes with your results"). Backend remains authoritative for connected scoring. Reason: no new endpoint, works offline, zero drift because the frontend imports the same JSON the migration seeds. Interaction is two-step (select -> "Check answer" -> feedback + "Next question") because arrow keys in a radio group select on move; revealing on selection would lock keyboard users on the first arrow press.

D7. Analytics: keep existing backend event names (renaming would break DB CHECK, aggregation and tests) and map the brief's names: `game_started`=`GAME_STARTED`, `question_answered`=`QUESTION_ANSWERED`, `game_completed`=`GAME_COMPLETED`, `share_clicked`=`RESULT_SHARED`, `referral_opened`=`FRIEND_CHALLENGE_OPENED`, `cta_clicked`=`CTA_CLICKED` (new metadata key `ctaContext`, keeps `destination`). Add ONE new event `TOPIC_SELECTED` with metadata `{ topic }` only, no sessionId (none exists yet). All remain behind the existing opt-in consent. `FRIEND_CHALLENGE_CREATED` stays.

D8. Steer handoff sends NOTHING to Steer: no topic, no score, no UTM, no query string. `steerDestination()` strips `search`/`hash`. Document: sharing a topic with Steer would need explicit consent and a real handoff mechanism (form/API), which does not exist. Both CTAs go to the same verified URL; they differ only in `ctaContext`.

D9. "Backend must never block first play": the shipped playable (`VITE_APP_MODE=standalone`) never needs a backend. In connected mode keep the visible error (existing test), and add a user-initiated "Play the offline edition instead" button (labelled unverified) that sets `storage` flag `offline-fallback`, then reloads. No silent fallback.

D10. No claim of medical review anywhere in the UI. A `contentReview.reviewedBy: string | null` field (null today) gates any such wording; UI says "Educational only, not medical advice." plus "Answers cite public health sources; they are not clinician-reviewed." while null.

---------------------------------------------------------------------------------------------------
## 3. Precise copy

Hook (`Landing.tsx`):
- Eyebrow: `METABOQUEST · BY STEER`
- Pill: `3 questions · about 60 seconds`
- h1: `GLP-1: how much is fact, and how much is <em>fear?</em>`
- Sub-line: `Heard it in a WhatsApp forward or over family dinner? Test it before you trust it.`
- Teaser chips (static text, no animation): `“It’s only for diabetics.”` `“I’ll lose muscle.”` `“The weight always comes back.”`
- One primary tap target (link to `/topic`): `Bust the myths in 60 seconds →`
- Reassurance: `No signup. Educational only, not medical advice.`
- Must keep the primary CTA fully visible above y=600 at 390x740 (existing e2e assertion) and above the fold at 390x844. If the 4-line h1 pushes it down, reduce h1 `clamp()` font size, not the copy.
- Remove `TopicPicker` from the hero. Remove "THE CURIOSITY EDITION".

Topic page (`/topic`, new `src/pages/Topic.tsx`, reuse `TopicPicker.tsx` as the list):
- h1: `What makes you unsure about GLP-1?`
- Sub: `Pick the doubt closest to yours. It only chooses which questions you see. It is not a medical assessment.`
- 7 buttons (>=44px tall, full width on 320px) using the D2 labels; secondary link `Skip, surprise me`.
- If a saved draft with answers exists (`storage.get('draft')` with matching mode): show a "Continue your quiz" button (-> `/play`) and "Start over" above the chips.

Key takeaways per topic (`topics.ts`, field `takeaway`; keep each <= 55 words; no numbers of kg):
- SAFETY: `Safety is personal. A doctor weighs benefits and risks against your history, your other medicines and plans such as pregnancy before anything is prescribed. A WhatsApp forward or a friend’s good experience cannot do that for you.`
- SIDE_EFFECTS: `Stomach effects such as nausea, constipation or loose motions are among the most reported, and tend to show up more when doses go up and settle over time. Smaller, lighter meals can help. Trouble keeping fluids down needs your care team, not a forwarded tip.`
- MUSCLE: `Some muscle can be lost whenever weight comes down, whatever the method. Protein through the day (dal, paneer, curd, eggs, sattu, chana), strength work a couple of days a week and a body-composition check such as DEXA help a care team see what is changing besides the scale.`
- MAINTENANCE: `Weight management is long-term. In trials, many people regained a good part of the weight after stopping, so the plan for after (food habits, movement, follow-ups) matters as much as the plan for during. Festival weeks and travel are normal life, so a plan should expect them.`
- DIABETES: `These medicines were first used for type 2 diabetes and some are also used for weight management. The question is not “diabetic or not” but whether it suits you. Indians can carry metabolic risk at lower body weights, so a doctor looks at tests, waist and family history, not one sugar report.`
- ELIGIBILITY: `No quiz can tell you whether a medicine is right for you. A doctor decides after your tests, history and goals. Sometimes the answer is “not now”, and food, movement and behavioural support still help.`
- GENERAL: `GLP-1 medicines are one tool inside doctor-led care. Tests come first, a doctor decides if they fit, and habits plus follow-up are what make results last.`
- Results lead-in under the takeaway, linking to the handoff: `Want a doctor to look at your own numbers?`

Instant feedback (`Play.tsx`): button states `Check answer` -> (feedback panel) -> `Next question` / `See my results`. Panel heading text (never colour-only): correct = `✓ Spot on`, incorrect = `↗ Good to know`. Streak chip text: `2 in a row`, `3 in a row`. Progress: keep `<progress>` and "Question n of 3"; add `n / 3` step markers.

Score wording: rename "Knowledge points" -> "Knowledge score" everywhere user-facing (Results, Challenge). Never "health score".

Share text (ShareSheet, share preview, PNG in `services/download.ts`): `<profile title> — <score>/<max> knowledge score on MetaboQuest. Game performance only. Not a diagnosis or treatment recommendation.` Topic and answers are never included.

Steer handoff block (new `src/components/SteerHandoff.tsx`, used on Results and Explore):
- Eyebrow `WHAT HAPPENS AFTER A QUIZ`; heading `Want a doctor to look at your own numbers?`; sub `Steer is India’s doctor-led metabolic health club. Nothing from this quiz is sent to Steer.`
- `<ol>` of 4 steps:
  1. `Diagnostics first` – `Comprehensive tests, including a gut microbiome test and a DEXA body-composition scan, so decisions start from your own data.`
  2. `Doctor consult` – `A physician or endocrinologist reviews your results and decides whether the programme fits. GLP-1 therapy is prescribed only when it is clinically right.`
  3. `Continuous care` – `A dedicated doctor, a care manager and a behavioural dietician stay with you. Daily check-ins happen on WhatsApp, and an AI coach turns meals, weight and lab results into progress trends.`
  4. `Habits that last` – `Diet, fitness and mental-health support sit alongside the medicine, with a focus on protecting muscle and a personalised long-term maintenance plan.`
- CTAs (anchors, `target="_blank" rel="noopener noreferrer"`, href = `steerDestination(...)`): primary `See if the programme fits you`, secondary `Talk to a Steer doctor`. Click -> `track('CTA_CLICKED', { destination: 'STEER_WEBSITE', ctaContext })` with `ctaContext` one of `results_programme_fit`, `results_talk_to_doctor`, `explore_programme_fit`, `explore_talk_to_doctor`.
- Footnote: `Opens Steer’s website in a new tab. Your topic, answers and score are not shared. Programme details come from Steer’s brief; confirm services and suitability with Steer.`
- Replace the generic `Explore Steer` link in `Results.tsx`. In `Explore.tsx`, replace the hero CTA and hard-coded `care-grid` with `<SteerHandoff variant="explore" />`; keep `DoctorChecklist`.
- Header nav label "About Steer" and the `/explore` route remain.

Privacy dialog (`App.tsx`): replace "No chosen topic is included in these events" with: `If you allow analytics, the name of the topic you pick (for example “muscle”) is counted anonymously with gameplay events. It is never sent to Steer’s website or added to challenge links.`

---------------------------------------------------------------------------------------------------
## 4. Banned strings and checks (run at the end of FEAT-001, FEAT-003 and FEAT-004)

Case-insensitive pattern for user-facing copy (UI source, bank text/options/explanations/source titles, takeaways, README demo copy):

`semaglutide|tirzepatide|liraglutide|dulaglutide|exenatide|orforglipron|ozempic|wegovy|rybelsus|mounjaro|zepbound|saxenda|victoza|trulicity|byetta|foundayo|mysimba|contrave|orlistat|novo nordisk|eli lilly`

Also forbidden in UI/bank text: `before and after|before/after|miracle|guarantee[ds]? (weight|results)|medically reviewed|clinician[- ]reviewed|doctor[- ]approved|clinically proven|\b\d+\s?(kg|kilos?|lbs?|pounds)\b|lose \d+`.
(Allowed: the words "not clinician-reviewed", URLs/`href` values, and the internal `CONTENT_REVIEW_CHECKLIST.md`.)

Commands (from `/Users/milendrakumarbaghel/Documents/Hackathon/metaboquest/problem1`):
- `grep -rniE '<pattern>' frontend/src --include='*.ts' --include='*.tsx' --include='*.css' --exclude-dir=test` must return nothing except `href`/`url:` string values.
- For banks, run a throwaway python3 one-liner over `backend/src/main/resources/data/*.json` that checks only `text`, `options`, `explanation`, `title` fields (not `url`). Delete nothing else; no temp files left behind.
- Existing legacy source title "Semaglutide" (NHS) must be retitled (see FEAT-001), including the copy inside `src/data/approved.ts`/bank import.

Evidence sources already verified by web search during planning (re-open each URL with `web_fetch` before recording it; if a claim is not supported, soften or drop the question):
- NIDDK prescription medicines: https://www.niddk.nih.gov/health-information/weight-management/prescription-medications-treat-overweight-obesity (individual assessment, side effects, regain after stopping)
- STEP 1 extension, Wilding et al. 2022: https://pubmed.ncbi.nlm.nih.gov/35441470/ (weight regain after withdrawal; display title `Weight regain after stopping a weekly GLP-1 medicine: STEP 1 trial extension`)
- NICE decision aid for patients and clinicians (GI effects often mild or moderate, more during dose escalation, decrease over time; regain likely after stopping; not for use in pregnancy; lower BMI thresholds for South Asian backgrounds): https://www.nice.org.uk/guidance/ta1026/resources/tirzepatide-a-discussion-guide-for-healthcare-professionals-and-patients-pdf-15363543421 (display title `NICE: discussion aid for medicines to manage overweight and obesity`) and https://www.nice.org.uk/guidance/ta1026/chapter/1-Recommendations
- WHO GLP-1 Q&A and guideline (conditional recommendation, part of comprehensive care with diet, activity, professional support, long-term follow-up): https://www.who.int/news-room/questions-and-answers/item/obesity-glp-1-therapies
- Misra et al. 2009 consensus for Asian Indians (risk at lower BMI, waist cut-offs): https://pubmed.ncbi.nlm.nih.gov/19582986/
- Lean-mass meta-analysis (lean-mass share of weight lost comparable between incretin drugs and lifestyle weight loss): https://pubmed.ncbi.nlm.nih.gov/41877354/
- Body-composition context for GLP-1 treatment: https://pubmed.ncbi.nlm.nih.gov/39372917/
- ICMR-NIN Dietary Guidelines for Indians 2024 (pulses, milk, eggs as protein foods): https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf
- Existing: Guy's & St Thomas' food/nutrition and side-effect pages, NHS semaglutide page (retitle), CDC adult activity, NIDDK choosing a programme (all already in the DB/frontend).
- Counter-evidence to keep wording conservative: a 2026 Cleveland Clinic real-world analysis reports less average regain in practice because many people restart or switch treatment. So wording must say "in trials" and "many people", never "always".

---------------------------------------------------------------------------------------------------
## 5. Step-by-step implementation (ordered by dependency)

### FEAT-001 – Backend: V9 migration, topic selection with top-up, analytics, curated bank (do first; the frontend imports its JSON)

1. Create `/Users/milendrakumarbaghel/Documents/Hackathon/metaboquest/problem1/backend/src/main/resources/data/glp1-topic-bank-v9.json`.
   Shape: `{ "version": 9, "reviewedBy": null, "reviewedOn": null, "sources": [{ "key","title","organization","url","type" }], "retitle": [{ "url","title" }], "reassign": [{ "number": 18, "topic": "DIABETES" }], "retire": [6,7,20], "questions": [{ "number","topic","type","category","text","options":[...],"correct":<index>,"explanation","sourceKeys":[...],"claim":"one-sentence claim being tested" }] }`.
   - `type` in {MYTH_OR_FACT, MULTIPLE_CHOICE, SCENARIO_BASED}; `category` in the existing `QuestionCategory` enum (GLP1_AWARENESS, METABOLIC_HEALTH, TREATMENT_SAFETY, HEALTHY_HABITS, DOCTOR_LED_CARE, NUTRITION); `source.type` in {GOVERNMENT_GUIDANCE, PEER_REVIEWED_RESEARCH, CLINICAL_GUIDANCE, ORGANIZATION_WEBSITE}.
   - `retitle`: NHS `https://www.nhs.uk/medicines/semaglutide/` -> `NHS: prescription weight and diabetes medicines (GLP-1)`.
   - Questions numbered **22-40** (19 new). Option UUID scheme for new questions: question id `30000000-0000-0000-0000-<12-digit number>`; option id `40000000-0000-0000-0000-<12-digit (number*10 + index + 1)>` (the legacy `number*2-1+i` scheme would collide for 3-option questions). New source ids `20000000-0000-0000-0000-<12-digit (100 + k)>`.
   - Each question: 2-3 options, plain language, myth-vs-fact explanation of <= 45 words that starts with `Myth.` or `Fact.` for MYTH_OR_FACT, otherwise a one-sentence reason; correct-answer position varied (not always the 2nd option); wrong options plausible but non-moralising about food; no drug/brand names; no kg or percentage-of-body-weight claims; "doctor"/"care team" for individual decisions.
   - Required Indian context (use real foods and routines, spread across questions): roti/chawal/dal/sabzi, idli/dosa/poha/paratha, chai and biscuits, festival mithai, office tiffin, late dinners, long commutes, desk jobs, family dinner pressure, WhatsApp-forwarded advice, morning walks/gym, fasting days (vrat/Ekadashi), protein from dal/paneer/eggs/curd/sattu/chana.
   - Question angles (write the wording yourself; every claim needs a verified source):
     - SAFETY (+2, #22-23): "a WhatsApp forward says it's safe for everyone" -> safety depends on history/other medicines/plans such as pregnancy (NICE aid, NIDDK); "buying a pen from an online seller/friend without a prescription" -> prescription and monitoring matter (NIDDK).
     - SIDE_EFFECTS (+2, #24-25): office tiffin heavy/fried and nausea -> smaller, lighter meals often feel easier (Guy's managing side effects); constipation on a long commute day -> fluids, fibre foods (dal/sabzi/fruit), gentle movement, and tell the care team if it persists (Guy's).
     - MUSCLE (+4, #26-29): any weight loss, including diet-only, can include muscle loss (lean-mass meta-analysis); breakfast of poha/idli keeps you hungry by 11am -> add protein (curd, sprouts, paneer, egg, sattu) (ICMR-NIN/Guy's); morning walk is good but strength work 2 days a week protects muscle too (CDC adult activity); why a DEXA-style body-composition scan can tell more than the weighing scale (body-composition review, pubmed 39372917).
     - MAINTENANCE (+2, #30-31): after Diwali/wedding season "I'll start again Monday" -> maintenance means ongoing habits and follow-up (NIDDK, WHO long-term care); what trials show after stopping (STEP 1 extension) phrased as "many people regained a good part" – not numbers.
     - DIABETES (+5, #32-36): family history of sugar and belly fat with a "normal" BMI -> risk can appear at lower BMI in Indians (Misra 2009); a normal fasting sugar alone does not clear everything -> doctor looks at the whole picture (Misra/NICE); never change your own diabetes tablets/insulin because of something read online (NIDDK/NHS); GLP-1 medicines are used for diabetes, weight management or both depending on the product (NHS/NIDDK; this is the "uncle's pen is not my pen" angle, distinct from #18/#21); weight-related conditions such as prediabetes, high BP and cholesterol are part of what a doctor reviews (NICE aid).
     - ELIGIBILITY (+4, #37-40): BMI alone does not decide, Indians have lower cut-offs and doctors also use waist and tests (Misra, NICE); why tests come first (WHO: assessment begins care); doctor screens pregnancy plans and medical history (NICE aid); "not now" is a valid answer and food/activity/behavioural support continue (WHO comprehensive care).
   - Resulting active pool: SAFETY 6, SIDE_EFFECTS 6, MUSCLE 7, MAINTENANCE 6, DIABETES 6, ELIGIBILITY 6 (legacy ids 1-5,8-19,21 stay active; #6,#7,#20 retired; #18 -> DIABETES; legacy topics: SAFETY 1,4,5,10; MUSCLE 2,11,12; MAINTENANCE 3,8,9,17; SIDE_EFFECTS 13-16; ELIGIBILITY 19,21).
2. Create `.../backend/src/main/java/org/springboot/backend/db/migration/V9__curated_topic_bank.java` modelled on V8 (`BaseJavaMigration`, `@Component`, `getChecksum()` = CRC32 of the v9 JSON bytes). In `migrate`:
   - Drop and re-create the CHECK constraints for `learning_topic` on `quiz_questions` and `quiz_sessions` with the 7 values. Find the constraint names by querying `pg_constraint` (`conrelid = '<table>'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%learning_topic%'`) rather than assuming names. Same for `analytics_events` and `event_type` (add `TOPIC_SELECTED`; include every value from V1 line 112).
   - `UPDATE medical_sources SET title=? WHERE source_url=?` for each `retitle` entry.
   - Insert new `medical_sources` (skip a source whose URL already exists – `source_url` is unique), insert questions as `APPROVED`, `active=TRUE`, `difficulty='EASY'`, `display_order = number`, `learning_topic`, options, and `question_medical_sources` links.
   - Apply `reassign` (UPDATE learning_topic) and `retire` (UPDATE active=false for ids `30000000-0000-0000-0000-<number>`).
   - `UPDATE question_sets SET version=4, updated_at=now() WHERE id='10000000-0000-0000-0000-000000000001'`.
3. `.../backend/src/main/java/org/springboot/backend/common/DomainEnums.java`: add `DIABETES` to `LearningTopic`; add `TOPIC_SELECTED` to `AnalyticsEventType`.
4. `.../backend/src/main/java/org/springboot/backend/quiz/service/QuizService.java` `start(...)`: replace the "throw notFound when < 3" logic with guaranteed-then-top-up selection:
   - Non-GENERAL: take up to 3 random on-topic questions (SecureRandom shuffle already present). If fewer than 3, top up first from the related topics, then from any remaining published question. Related map (mirror it in the frontend): SAFETY -> [SIDE_EFFECTS, ELIGIBILITY]; SIDE_EFFECTS -> [SAFETY]; MUSCLE -> [MAINTENANCE, SAFETY]; MAINTENANCE -> [MUSCLE, ELIGIBILITY]; DIABETES -> [ELIGIBILITY, SAFETY]; ELIGIBILITY -> [DIABETES, SAFETY]. On-topic questions are always listed first.
   - GENERAL keeps one-per-concern coverage.
   - Only throw `ApiException.notFound` if the whole published pool has fewer than 3.
   - Invalid topic strings already return 400 (enum binding); keep that.
   - Next-step copy at the `NextStepResponse` construction (~line 171): title `Want a doctor to look at your own numbers?`, ctaText `See if the programme fits you`, url unchanged.
5. `.../backend/src/main/java/org/springboot/backend/analytics/service/AnalyticsService.java`: add `TOPIC_SELECTED -> Set.of("topic")` and extend `CTA_CLICKED -> Set.of("destination","ctaContext")`. For `TOPIC_SELECTED`, reject (400) a `topic` value that is not a `LearningTopic` name; for `ctaContext`, require `^[a-z_]{1,40}$`. (`Map.of` supports 10 entries; there will be 8.)
6. Repair existing tests only: in `.../backend/src/test/java/org/springboot/backend/MetaboQuestIntegrationTest.java` add `"DIABETES"` to the topic list in `topicSelectionIsRelevantAndGeneralCoversDifferentConcerns`. If `upgradePreservesOriginalQuestionsForExistingSessions` starts applying V9 (its count assertion expects 21 after V8), pin it with `.target("8")` on the second Flyway configuration. Do not add new test methods.
7. `.../backend/README.md` "Data and medical review": describe the V9 bank (37 active questions, 6 per topic minimum, top-up rule, retired ids, `reviewedBy: null`).

Verify: from `.../problem1/backend` run `./mvnw -q test` (Docker is up; integration tests use Testcontainers) – expect exit code 0 and "BUILD SUCCESS" without `-q`. Also run the banned-string check on the V9 JSON.

### FEAT-002 – Frontend: data layer, hook, topic-first flow, analytics client (depends on FEAT-001 JSON)

1. `src/types.ts`: add `DIABETES` to `LearningTopic`; add `checked?: Record<string, boolean>` to `QuizDraft`.
2. `src/data/topics.ts`: replace with the 7 topics in D2 order (SAFETY, SIDE_EFFECTS, MUSCLE, MAINTENANCE, DIABETES, ELIGIBILITY, GENERAL), keeping the `question` field for `DoctorChecklist` (write a doctor question per new topic), adding `takeaway` (Section 3 copy) and exporting `relatedTopics` (the same map as the backend). Add `export const contentReview = { reviewedBy: null as string | null }`.
3. `src/data/approved.ts`: refactor to a table-driven pool without changing existing export names (`disclaimer`, `questions`, `questionPool`, `questionTopics`, `selectQuestions`, `scoreLocal`). Combine: legacy #1-9 (existing code), V8 bank (`glp1-question-bank.json`), V9 bank (`glp1-topic-bank-v9.json`, option ids per FEAT-001 scheme). Apply `reassign`/`retitle`/`retire`. `questionPool` = active questions only; a separate `answerKey` map covers retired ids too so an in-flight draft still scores. Export `revealAnswer(questionId, optionId)` -> `{ correct, correctOptionId, explanation, sources } | undefined`. `selectQuestions(topic)` mirrors the backend: on-topic first (random 3), top-up from `relatedTopics`, GENERAL = one per concern. `scoreLocal` nextStep -> `{ title: 'Want a doctor to look at your own numbers?', ctaText: 'See if the programme fits you', ctaUrl: '' }`. Keep `questions` (first three legacy) exported because `src/test/fixtures.ts` and e2e use it.
4. `src/services/analytics.ts`: add `TOPIC_SELECTED: ['topic']`, extend `CTA_CLICKED: ['destination','ctaContext']`. `src/services/config.ts`: make `steerDestination` return `origin + pathname` only (drop search/hash; existing test keeps `https://steerclub.com/about`).
5. `src/services/quiz.ts`: keep `startQuiz` topic handling (reads `learning-topic`, defaults GENERAL). Add helper `chooseTopic(topic)` = `resetQuiz()` + `storage.set('learning-topic', topic)` + `track('TOPIC_SELECTED', { topic })` (no sessionId). Add `useOfflineEdition()` which sets storage `offline-fallback` and `config.ts` honours it at import (mode becomes `standalone`); wire a "Play the offline edition instead" button into the error panel in `Play.tsx` that sets the flag and reloads. Keep the rule that a failed connection never silently changes mode.
6. New `src/pages/Topic.tsx` (route `/topic`, lazy in `src/App.tsx`) and rework `src/components/TopicPicker.tsx` into the chip list: each chip is a `<button>`, calls `chooseTopic` then `navigate('/play')`; "Skip, surprise me" calls `chooseTopic('GENERAL')`. Resume panel as in Section 3. Logical focus: focus the h1 on mount (App already focuses `#main`).
7. `src/pages/Landing.tsx`: Section 3 hook copy; primary link `to="/topic"`; remove `TopicPicker`; rename benefit blurbs to match ("Learn real facts" etc. can stay). `src/App.tsx`: header `nav-play` link and `EmptyState` link -> `/topic`; add the `/topic` route; keep document title logic. `src/pages/Results.tsx` "Play again" -> `/topic`. `src/pages/Explore.tsx` "Choose another topic" -> `/topic`.
8. `src/styles/learning.css`: styles for the full-width topic buttons (min-height 48px, wraps at 320px, visible focus ring, selected/hover states) and hook teaser chips; remove obsolete `.topic-picker` chip rules once unused. Keep brand tokens (`--cream`, `--rust`, `--maroon`, `--ink`, `--clay`, `--blush`, `--paper`, `--muted`, `--line` from `src/index.css`), serif headlines.
9. Repair existing tests that this FEAT intentionally breaks: `src/test/question-pool.test.ts` (pool length 21 -> computed active count 37; index-based "scores only selected" test -> pick ids by `questionTopics`/lookup instead of `questionPool[8]` etc.), `src/test/app.test.tsx` (landing heading `GLP-1: how much is fact, and how much is fear?`, CTA name `Bust the myths in 60 seconds`, topic selection now on `/topic` via button `Side effects`-> `What about side effects?`, analytics-consent test navigates through the new CTA), `e2e/flows.spec.ts` (replace `Let’s play` link clicks with the hook CTA + `Skip, surprise me`; the "saved quiz exit" test resumes through the Topic page's "Continue your quiz"; the CTA-above-600px assertion targets the new link), `scripts/verify-playable.mjs` (labels for the 7 topics, new CTA name, `Explore Steer` -> navigate to `/explore`, link `See if the programme fits you`, loop count text "all seven").

Verify (from `.../problem1/frontend`): `npx tsc -b`, `npm run lint`, `npx vitest run`, `npm run build`. E2E and playable are re-run in FEAT-003/004 after the Play changes.

### FEAT-003 – Frontend: instant feedback, results takeaway, Steer handoff, share disclaimer, polish

1. `src/pages/Play.tsx`: load `../data/approved` with dynamic `import()` in an effect (keep the landing bundle small). Implement the two-step flow from D6: radios lock after check (`draft.checked[qid]` set), feedback panel (`role="status"`, `aria-live="polite"`) with heading, explanation, the first source as a link (`rel="noopener noreferrer"`), streak chip, step markers `1/3..3/3`. Persist `checked` through `saveDraft`. If `revealAnswer` returns undefined, skip the check step (button goes straight to Next). Frozen `draft.pending` path unchanged (button says "See my results"). Connected mode still submits answers unchanged (payload test must stay identical).
2. `src/App.css` or `src/styles/learning.css`: 200-250 ms pop/slide-in for the feedback panel and a progress transition. All animation names must be covered by the existing global `@media (prefers-reduced-motion: reduce)` rule. No new dependencies.
3. New `src/components/TopicTakeaway.tsx`: key takeaway panel rendered FIRST on `Results.tsx` (before the score card), heading size >= the score heading, shows the topic label, the `takeaway` text, `Educational only, not medical advice.`, and the lead-in link `Want a doctor to look at your own numbers?` that scrolls to the handoff block. Use `review?.topic` (already in `ReviewContext`), `GENERAL` fallback. Keep `LearningTakeaways` after it; change its footer text per D10 (use `contentReview.reviewedBy`).
4. New `src/components/SteerHandoff.tsx` per Section 3, used in `Results.tsx` (below the score/share row, above `#answer-review`) and `Explore.tsx` (`variant="explore"`). Delete the `Explore Steer` link in `Results.tsx`. `Explore.tsx` keeps `DoctorChecklist`.
5. Rename "Knowledge points" -> "Knowledge score" in `Results.tsx` and `Challenge.tsx`. `ShareSheet.tsx`, `services/download.ts`: add the exact share sentence (Section 3); `src/services/sharing.ts` exports `shareDisclaimer`.
6. `src/App.tsx` privacy dialog copy per Section 3.
7. Repair existing tests/scripts: update `answerQuiz` and `finishQuiz` helpers (click `Check answer` before `Next question`/`See my results`), the `Explore Steer` link assertions, "hands off to the configured trusted destination" (name `See if the programme fits you`), the last-question flow in the standalone test, and `verify-playable.mjs` (adds the check step; asserts the handoff CTAs and `rel="noopener noreferrer"`, no `?` in href).

Verify: `npx tsc -b`, `npm run lint`, `npx vitest run`, `npm run build`, `npm run test:e2e` (starts its own Vite server and stops it; needs Google Chrome), `npm run test:playable` (builds `dist-playable/index.html` and runs the offline flows for all 7 topics with zero network requests).

### FEAT-004 – Docs, content review checklist, submission pack, final verification

1. `.env.example` (frontend): keep `VITE_STEER_URL=https://steerclub.com` with a comment: Steer website opened by the CTAs; no query string is appended; no topic or personal data is sent. Document the same in `frontend/README.md` (replace the Vite template boilerplate heading with a short MetaboQuest section: flow, scripts, env vars, offline playable, privacy notes, topic-sharing needs consent + a real handoff mechanism) and `frontend/API_SETUP.md` (add `VITE_STEER_URL`, `VITE_APP_MODE`).
2. Create `/Users/milendrakumarbaghel/Documents/Hackathon/metaboquest/problem1/submission/CONTENT_REVIEW_CHECKLIST.md`: a table with one row per question (legacy 1-21 active ones plus 22-40; list retired ids in a separate section): `# | topic | question text | claim tested | source title + URL | clinician sign-off (empty) | notes`. Header must state: automated tests do not establish medical accuracy; the content is source-checked, not clinician-reviewed; a qualified clinician must review before any public use. Also list the 7 topic takeaways and the Steer-journey claims (source: Steer brief) as rows. Generate it from the banks with a throwaway script, then delete the script.
3. Run `npm run build:playable` (or `npm run test:playable`, which does it). Then, from `.../problem1/frontend`: `cp dist-playable/index.html ../submission/playable-ad.html` and `cd dist-playable && zip -j ../../submission/playable-ad.zip index.html`. Confirm with `unzip -l` that the zip holds only `index.html`. Report both file sizes.
4. `.../submission/one-liners.md` – three one-liners (trigger / value / next step), e.g. Trigger: `“GLP-1: how much is fact, and how much is fear?” with a one-tap “Bust the myths in 60 seconds” and a choice of the doubt that bothers you most.` Value: `Three questions on your chosen doubt (safety, side effects, muscle, weight regain, diabetes-only, is it for me) with an instant myth-vs-fact explanation, a topic key takeaway and a knowledge score, all using familiar Indian foods and routines.` Next step: `A calm four-step view of Steer’s doctor-led journey with “See if the programme fits you” and “Talk to a Steer doctor”; nothing from the quiz is sent to Steer.`
5. `.../submission/demo-link.txt` and `.../submission/loom-link.txt`: first line `TODO: <what to paste here>` and an explanation (deploy `frontend` to Vercel then paste the live URL; record the 2-minute Loom then paste the share link). No invented URLs.
6. `.../submission/SUBMISSION.md`: (a) what is in this folder; (b) how to run: `npm ci`, `npm run test:playable`, open `playable-ad.html` by double-click or `npx vite preview`; (c) deploy to Vercel (`vercel.json` exists: SPA rewrite + security headers; build `npm run build` output `dist`; or upload the single HTML as a static asset; env `VITE_APP_MODE=standalone` for no-backend, or connected with `VITE_API_BASE_URL` set to the Railway backend origin per `API_SETUP.md`); (d) a ~2-minute Loom script with timed beats: 0:00-0:15 hook, 0:15-0:35 topic choice, 0:35-1:10 play with instant feedback and streak, 1:10-1:30 results takeaway + knowledge score, 1:30-1:50 Steer handoff, 1:50-2:00 scope/safety notes; (e) AI/tool disclosure (this work was produced with an AI coding assistant; list what it generated and that sources were checked via web search but not clinically reviewed); (f) honest "still needs from you": clinician review of every question, Loom recording, live demo URL, Google Form submission for Problem Statement 1 (separate from Problem Statement 2), confirm Steer's current services/URL, Meta playable packaging is optional and not done, no measured user testing.
7. Overwrite the stale `/Users/milendrakumarbaghel/Documents/Hackathon/metaboquest/problem1/submission/README.md` with a short index pointing to `SUBMISSION.md`; delete the stale `/Users/milendrakumarbaghel/Documents/Hackathon/metaboquest/problem1/submission/LOOM_SCRIPT.md` after merging its still-valid points into `SUBMISSION.md`.
8. Final full verification (see Section 6) and cleanup: remove `frontend/test-results` contents only if created by this run and untracked-ignored (it is gitignored, leave it), make sure no dev servers or temp scripts remain.

---------------------------------------------------------------------------------------------------
## 6. Verification commands (exact, discovered from `package.json` / `pom.xml`)

Frontend, from `/Users/milendrakumarbaghel/Documents/Hackathon/metaboquest/problem1/frontend`:
- Type-check + build: `npm run build` (runs `tsc -b && vite build`)
- Lint: `npm run lint`
- Unit/component tests: `npx vitest run` (script `npm test` is watch mode; always pass `-- --run` or use `npx vitest run`)
- E2E (Playwright, Chrome channel, self-managed server): `npm run test:e2e`
- Playable: `npm run build:playable` then `node scripts/verify-playable.mjs`, or both via `npm run test:playable`

Backend, from `/Users/milendrakumarbaghel/Documents/Hackathon/metaboquest/problem1/backend`: `./mvnw test` (Docker required; Testcontainers PostgreSQL 16).

Acceptance checklist for the reviewer:
- Hook h1 and CTA copy match Section 3; CTA visible above y=600 at 390x740 and above the fold at 390x844; no horizontal overflow at 320px.
- `/topic` shows 7 options + skip; choosing a topic starts a quiz of 3 questions all in that topic (when the pool has >= 3), tops up from related topics only otherwise; `GENERAL` covers 3 different concerns. Backend `POST /api/v1/quiz/sessions {"topic":"DIABETES"}` returns 201 with `topic: DIABETES`; unknown topic returns 400.
- Instant feedback appears after "Check answer", never colour-only, reduced-motion respected; streak and `n / 3` progress visible.
- Results order: topic key takeaway, myth/fact recap, score card ("Knowledge score"), challenge/share, Steer handoff, per-answer sources; disclaimer "Educational only, not medical advice." visible.
- Handoff: 4 steps verbatim, two CTAs, `target=_blank rel="noopener noreferrer"`, href is exactly `VITE_STEER_URL` without query; analytics `CTA_CLICKED` carries `ctaContext`; `TOPIC_SELECTED` carries only `topic` and only with consent.
- Share text/PNG include "Game performance only. Not a diagnosis or treatment recommendation." and no topic/answers.
- Banned-string scan clean; no "reviewed" claims; `CONTENT_REVIEW_CHECKLIST.md` complete with empty sign-off column.
- `submission/` contains: `playable-ad.html`, `playable-ad.zip` (only `index.html`), `one-liners.md`, `demo-link.txt` (TODO), `loom-link.txt` (TODO), `SUBMISSION.md`, `CONTENT_REVIEW_CHECKLIST.md`, short `README.md`; no fabricated URLs.
- `playable-ad.html` opens from `file://`, plays fully offline (the verify script asserts zero http(s) requests).
- No git commits were made.
