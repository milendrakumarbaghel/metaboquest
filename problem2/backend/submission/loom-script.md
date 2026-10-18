# Steer Science Studio: 2-Minute Loom Video Script

**Target Duration:** 2 minutes (120 seconds)  
**Tone:** Calm, technical, evidence-first, confident  
**Setup:** Screen recording showing the Steer Science Studio browser dashboard (`http://localhost:5173` or deployed URL). Keep credentials and API keys off-screen.

---

### 0:00 - 0:20 (Problem & Paper Ingestion)
- **Visual:** Open to the "Papers & Evidence" tab showing the library of 4 real medical research papers.
- **Script:**
  > *"Welcome. This is Problem Statement 2: Steer Science Studio.  
  > Medical research on GLP-1 and metabolic health is full of breakthrough insights, but it's locked inside dense 15-page papers. We built an automated, evidence-first engine that turns clinical research into ready-to-post Instagram media.  
  > We ingest real PDFs or article links. The backend uses Apache PDFBox to segment pages, verifies document integrity with SHA-256 deduplication, and stores page-level ground truth."*

---

### 0:20 - 0:45 (Evidence Traceability & Quote Verification)
- **Visual:** Click on the STEP 1 Extension paper. Show Page 2 with the highlighted text: *"participants regained roughly two-thirds of their prior weight loss."*
- **Script:**
  > *"Here's our fundamental principle: evidence is data, not decoration.  
  > When our AI engine extracts a finding, it is not trusted blindly. The backend performs an exact server-side substring match against the stored page text.  
  > Every claim is permanently tagged with its DOI, PMID, exact page number, and confidence score. If a quote cannot be verified on the page, the pipeline fails closed."*

---

### 0:45 - 1:15 (Multi-Format Content Factory & AI Reel Studio)
- **Visual:** Switch to the "Content Studio" tab.
  - Cycle through the 5 Carousel slides (showing 4:5 and 1:1 ratios).
  - Show the Static Post auto-resized to Square, Portrait, and Story formats.
  - Open the AI Reel Player. Hit Play: show the audio waveform moving, the 30s timer, synchronized karaoke subtitles, and the b-roll prompt overlays.
- **Script:**
  > *"From one paper, the studio generates three finished media formats in Steer's calm editorial voice:  
  > First, a 5-slide Instagram carousel—available in mobile portrait 4:5 and feed square.  
  > Second, an auto-resized static post for feeds and stories.  
  > Third, an AI video reel: complete with a 30-second scene storyboard, synthesized voiceover audio narration, timed SRT and VTT subtitles, and realistic Indian routine b-roll prompts.  
  > Notice the brand identity: warm cream `#F5EBDF` paper, rust `#C04E2A` serif headlines, and deep maroon accents. We also provide direct Canva design specifications for our creative team."*

---

### 1:15 - 1:40 (Mandatory Doctor Review Gate)
- **Visual:** Switch to the "Doctor Review Gate" tab.
  - Point to the Publication Gate Lock banner: *"Publication Gate Locked: Pending Medical Review"*.
  - Show individual claim approval buttons. Approve Claim 1 and Claim 2 with clinical notes.
  - Show the gate unlocking to green: *"Publication Gate Unlocked: Ready for Sign-Off"*.
  - Click "Sign & Approve Content Package".
- **Script:**
  > *"Here is the clinical review gate. In healthcare, automation without human oversight is reckless.  
  > No post can ever be published or exported as approved media until an authorized doctor reviews every underlying claim.  
  > The doctor sees the plain-language copy side-by-side with the verbatim quote and page number. Once all claims are approved, the doctor signs off digitally, releasing the publication lock."*

---

### 1:40 - 2:00 (Social Scheduling, Human Effort & Exit)
- **Visual:** Switch to "Publish & Schedule" (showing Meta Graph API payload) and then "Human Effort Audit" tab.
- **Script:**
  > *"Once approved, our Meta connector generates container payloads for Instagram Feed and Reels.  
  > In our Human Effort Audit, we measured actual turnaround across 4 real landmark papers. A traditional manual workflow takes an agency 3.5 hours per paper. Steer Science Studio completes it in under 1.5 minutes of doctor review—a 99.3% efficiency gain.  
  > This is reliable, doctor-gated science translation ready for weekly production. Thank you."*
