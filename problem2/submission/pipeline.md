# Steer Science Studio: Pipeline Architecture & Technical Flow

## 1. System Architecture

```text
       SCIENTIFIC PAPER (PDF / URL)
                    │
                    ▼
          [ Paper Ingestion ]
    (PDFBox Extraction, SHA-256 Deduplication,
     SSRF Validation, Page Text Segmentation)
                    │
                    ▼
     [ AI Research & Claim Extractor ]
    (Structured JSON Schema or Grounded Local Fallback)
                    │
                    ▼
       [ Verbatim Quote Verification ]
  (Server-side substring search on stored page: FAIL-CLOSED)
                    │
                    ▼
       [ Content Generation Factory ]
  ┌─────────────────┬──────────────────┬─────────────────┐
  │                 │                  │                 │
  ▼                 ▼                  ▼                 ▼
[ Carousel ]    [ Static Post ]    [ AI Reel ]     [ Captions & ]
(5-7 Slides,    (Multi-Ratio:      (Storyboard,    [  Hashtags  ]
1:1 & 4:5,      1:1, 4:5, 9:16,    Voiceover WAV,
PDF & ZIP)      PNG Graphic)       SRT/VTT Subs)
  │                 │                  │                 │
  └─────────────────┴────────┬─────────┴─────────────────┘
                             │
                             ▼
              [ Doctor Review Gate (Mandatory) ]
          (Itemized Claim Approval + Clinician Sign-off)
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       [ If Rejected ]               [ If Approved ]
    (Revision Requested,         (Publication Lock Released,
     Blocks Publication)          All Exports Enabled)
                                            │
                             ┌──────────────┴──────────────┐
                             │                             │
                             ▼                             ▼
                     [ Media Exporter ]         [ Social Scheduler ]
                   (PNG, ZIP, PDF, Video)     (Meta Graph API Container)
```

## 2. API Endpoints

### Ingestion & Papers
- `POST /api/v1/papers/upload` (Multipart file upload, PDFBox extraction, max 20MB)
- `POST /api/v1/papers/from-url` (Public HTTPS ingestion with SSRF protection)
- `GET /api/v1/papers/{id}` (Get paper metadata and page count)
- `GET /api/v1/papers/{id}/source` (Download authenticated original PDF/HTML source)

### Generation & Review
- `POST /api/v1/papers/{id}/generate` (Generate package: language `en|hi|hinglish`, target audience)
- `GET /api/v1/packages/{id}` (View package, claims, and asset specifications)
- `POST /api/v1/review/packages/{packageId}/claims/{claimId}` (Approve or reject individual claim with clinical note)
- `POST /api/v1/review/packages/{packageId}` (Approve or reject package; requires 100% claims approved)

### Media Rendering & Multi-Format Auto-Resizing
- `GET /api/v1/packages/{id}/render/carousel/slides/{slideIndex}` (Render single slide PNG)
- `GET /api/v1/packages/{id}/render/carousel/zip` (Download all slides packed in ZIP)
- `GET /api/v1/packages/{id}/render/carousel/pdf` (Download multi-page PDF document)
- `GET /api/v1/packages/{id}/render/static?format=square|portrait|story` (Render static graphic)
- `GET /api/v1/packages/{id}/render/reel/audio` (Download synthesized voiceover WAV)
- `GET /api/v1/packages/{id}/render/reel/subtitles?format=srt|vtt` (Download timed subtitles)
- `GET /api/v1/packages/{id}/render/reel/frames/{sceneIndex}` (Render 1080x1920 scene frame PNG)
- `GET /api/v1/packages/{id}/render/reel/zip` (Download full Reel production kit ZIP)

### Canva, Scheduling & Exports
- `GET /api/v1/packages/{id}/export/canva` (Canva design specification JSON & template sync)
- `POST /api/v1/packages/{id}/schedule` (Schedule post to Instagram/Facebook via Meta Graph API)
- `GET /api/v1/packages/{id}/schedule` (Get scheduled post status and container payload)
- `POST /api/v1/packages/{id}/publish` (Simulate / trigger live publishing to Meta)
- `GET /api/v1/packages/{id}/effort` (Get empirical human effort telemetry)
- `GET /api/v1/packages/{id}/export/bundle` (Download complete master bundle ZIP)

## 3. Reliability & Fail-Closed Guardrails
1. **SSRF Guard:** Rejects loopback (127.0.0.1), private RFC-1918, link-local, multicast, and non-HTTPS URLs.
2. **Document Provenance:** SHA-256 fingerprinting ensures idempotent uploads and exact source mapping.
3. **Verbatim Passage Matching:** Model output is strictly verified by finding the exact normalized substring on the claimed page number. If not found, generation fails closed.
4. **Publication Gate:** Assets remain locked in `DRAFT` status and cannot be exported as approved media until an authorized clinician signs off.

