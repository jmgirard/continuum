# Continuous Rating Tool — Product & Architecture Spec (v0.4)

> A modern, web-based successor to CARMA and DARMA: one config-driven **web app** for
> collecting continuous perceptual/experiential ratings on one dimension (slider) or two
> dimensions (circumplex). Analysis, visualization, and reliability are handled downstream
> by a planned companion R package (out of scope for this build).
>
> **Status:** working draft for planning. This document is the source of truth that the
> Design brief and the Code prompt both build from.

---

## 1. Goals & non-goals

### Goals
- Replace the MATLAB CARMA/DARMA line with a web app that is platform-independent, install-free, and open-source (GPL, consistent with the originals).
- **Unify** 1D (CARMA) and 2D circumplex (DARMA) rating into one codebase where dimensionality is a study setting.
- Preserve the originals' strengths: minimal, clean, highly **customizable** rating UI, and broad **media** support.
- Add **study authoring + distribution**: researchers pre-load settings and a media playlist, then send participants a link to complete in-lab or remotely (MTurk/Prolific) with **completion tracking**.
- **Reach beyond the originals** in ways they never could: data-quality instrumentation for remote raters, resilient local-first collection, embedded questionnaires and per-participant randomization, and a coherent accessible design system (§6).
- Emit a clean, non-proprietary export that a downstream R package consumes for all analysis.
- Apply real software-engineering practice (typed code, tests, CI, accessibility).

### Non-goals (for v1)
- **In-app** analysis/visualization/reliability — handled by the planned companion R package (§7), out of scope for this build.
- **Synchronized multi-stream playback** — deliberately *not* pursued. Researchers who need a side-by-side view (e.g., both members of a dyad) pre-composite a single video; this avoids browser multi-element sync drift. Independent audio/seeking, if ever needed, is a review-side concern for the R package.
- Automated affect/behavior detection (ML "ground truth" pipeline). Export must not preclude it later.
- A media transcoding service (v1 documents codec constraints; see §8).
- Real-time multi-user collaboration during rating; native mobile/desktop apps.

---

## 2. Scope

**In scope (this build): the web app** — participant rating collection, researcher project console, clean export. §4–§6, §8, §9.

**Out of scope (planned, later): a companion R package** — imports the export files and owns downsampling/smoothing, visualization, and reliability. Noted here only because it explains why the web app has no review screen and why the export format (§9.3) is a clean data contract.

---

## 3. Users & roles

- **Researcher** — creates/configures projects (settings + playlists + optional questionnaires), distributes participant links, tracks session completion and data quality. Uses a **lightweight token-based** model early on; full auth can come with the cloud phase.
- **Participant / rater** — reaches a study by link (or, pre-cloud, Browses to a local media file). Completes instructions, rates each media item, optionally answers embedded questionnaire items, receives a completion code / redirect. May be a trained in-lab observer or a crowdworker.

---

## 4. Functional requirements

### 4.1 Participant rating flow
1. Enter a study — via a distributed link (cloud phase) or by **Browsing to a local media file** (File API; works with no backend).
2. Instruction / consent screen (configurable; optional required acknowledgment). Optional **calibration/training clip** with light feedback before real data (§6).
3. For each item in the (optionally randomized) playlist:
   - Optional **questionnaire block** before/after the clip (§6).
   - Media plays in a clean player panel; **focus mode** fades chrome during playback (§6).
   - A live **rating indicator** tracks input: a vertical slider (1D) or a moving point in the circumplex (2D), with **damped, instrument-grade motion** (§6).
   - Input is sampled per §5; **every sample stores media `currentTime`** for exact sync.
   - **Transport** can optionally be **locked** (no scrub/seek/speed change) to protect data integrity (§6). **Pause/resume** via control and spacebar.
   - Ratings **autosave continuously** to local storage; an interrupted session is **resumable** (§6).
4. On completion: export/submit annotations and present a **completion code** and/or **redirect to a configurable completion URL** (MTurk + Prolific).

**Input modalities:** mouse, keyboard (arrow keys), and **gamepad/joystick** (Gamepad API), with configurable behavior (§5).

### 4.2 Researcher project console
- **Create/configure projects:** dimensionality, full rating configuration (§5), instructions/consent, **playlist** (ordered; per-item options; **per-participant randomization/counterbalancing**), and optional **questionnaire blocks**.
- **Distribution:** participant link(s); completion code / redirect URL.
- **View current projects:** list with **completed vs. open session counts** and **per-session data-quality flags** (requires cloud phase).
- Save/load presets and built-in circumplex presets. Encode an entire study as a **single self-contained, versioned config file/URL** for reproducibility (§6).
- **Local mode (pre-cloud):** author + export study config. **Cloud mode:** persist, collect results, track sessions/quality.
- *(No in-app review/analysis window — see §2/§7.)*

### 4.3 Completion tracking
- Participant links carry study id + session token. On finish, record session (cloud), issue completion code, optionally redirect with the code as a parameter. Console shows status (assigned / in progress / complete) per project.

---

## 5. Customization & sampling

**Sampling (raw, default):**
- **Video:** one sample per presented frame via `requestVideoFrameCallback` (matches frame rate; exact per-frame media time).
- **Audio / unsupported:** fixed-rate fallback, default **~100 Hz**, via a timer (ideally a Web Worker to resist throttling). *(`requestAnimationFrame` caps near ~60 Hz, so it is not the high-rate driver.)*
- Configurable; **every sample stores media `currentTime`**. Optional **binned export** off by default (R package normally downsamples/smooths).
- **Data-quality signals** are derived from the raw stream (§6) at effectively no extra cost.

**Customization surface**
- **Shared:** sampling rate; optional bin interval; instruction text; per-item prompts; theme (incl. **dark**); **transport lock** on/off.
- **1D (slider):** lower/upper labels; numeric min/max; number of steps (or continuous); **3-color gradient** *and* **CVD-safe preset palettes** (§6); orientation (vertical default).
- **2D (circumplex):** axis labels and region/quadrant labels; presets — **affective** (valence × arousal) and **interpersonal** (agency × communion); axis magnitude/range; indicator appearance; grid/crosshair/quadrant-tint styling.
- **Control behavior:** **spring-to-center vs. stay-put**; joystick **gain** and **dead-zone** (§6).

---

## 6. Enhancements over the originals (with phasing)

Near-free / design-system (build in early):
- **CVD-safe default palettes** (perceptually-uniform, colorblind-safe) alongside the fully custom 3-color option. *(Design + Phase 1–2.)*
- **Focus / distraction-free mode** — chrome fades during playback, returns on hover/pause; **dark theme**. *(Design + Phase 1–2.)*
- **Damped, instrument-grade indicator motion** with optional trail; circumplex radial grid, center crosshair, light quadrant tints. *(Design + Phase 1–2.)*
- **Configurable control behavior** — spring-to-center vs. stay-put; joystick gain/dead-zone. *(Phase 2.)*
- **Locked transport** during rating (override for training). *(Phase 1–3, config.)*
- **Autosave + resumable sessions** via local storage (IndexedDB); no data loss on crash/interruption. *(Phase 1–2.)*

Higher-value, later phases:
- **Data-quality instrumentation** — idle/flat-line detection, movement variance/entropy, event-responsiveness, optional **attention "catch" clips** with an expected trajectory, and a per-session **quality score** to make exclusions defensible. Raw signals captured from Phase 1; scoring/attention UI later. *(Phase 4–5.)*
- **Embedded questionnaire blocks** — Likert/text items before/between/after clips. *(Phase 3–5.)*
- **Per-participant playlist randomization / counterbalancing.** *(Phase 3.)*
- **Calibration / training mode** — practice clip with light feedback to standardize raters. *(Phase 5.)*
- **PWA / offline** — loaded studies run without a live connection (robust for home raters). *(Phase 4–5.)*
- **Self-contained, versioned study configs** — a study as one shareable, citable file/URL. *(Phase 3+.)*

---

## 7. Downstream analysis (context only — not built here)

A planned companion **R package** consumes the export files and owns: import; downsampling/smoothing; visualization (time-series overlays, 1D boxplots, 2D centroid/smoke/contour plots); and reliability — **ICC(A,1), ICC(A,k), ICC(C,1), ICC(C,k)** from a two-way model (McGraw & Wong, 1996), plus descriptives. Because exact per-frame timestamps are preserved, downstream **reaction-time / lag correction** is possible there (the app makes no such correction). Not part of this build.

---

## 8. Media handling

- Native HTML5 `<video>`/`<audio>` — cross-platform, install-free (replaces VLC-via-ActiveX).
- **Local-first:** v1 uses the **File API (Browse to a local file)** with an object URL; no backend. MVP path.
- **Cloud (later):** researcher-hosted URL and/or upload to app storage. Uploaded video for remote crowdworkers is the biggest cost driver; deferred until the local-file MVP proves the core.
- **Codec reality:** safe targets are **H.264/AAC MP4** and **WebM**; legacy AVI/WMV/MOV may need researcher-side transcoding. Documented, not solved, in v1.

---

## 9. Architecture

### 9.1 Frontend
- **TypeScript + React** (Vite build).
- Media: HTML5 media elements; local files via File API object URLs.
- Input & sampling: Pointer/keyboard + **Gamepad API**; **`requestVideoFrameCallback`** per-frame sampler for video, timer/Web-Worker fallback otherwise; media `currentTime` per sample.
- Resilience: **IndexedDB** autosave; **PWA** for offline (later).
- Static hosting (Vercel / Netlify / Cloudflare Pages / GitHub Pages).

### 9.2 Backend — **Supabase (cloud phase only)**
- **Postgres** (studies, media metadata, sessions, annotations, quality flags), **Auth** (researchers), **Storage** (media/results), **row-level security**, **edge functions** (completion codes / redirects). Self-hostable if an IRB requires it. The participant + local-authoring experience works before any of this exists.

### 9.3 Export format (clean data contract)
- **One self-describing file per annotation** (participant × media item).
- Tidy **CSV** with a **commented metadata header** (`# key: value` — study id, dimensionality, sampling rate, labels, ranges, media reference, participant token, app version), then a header row and one row per sample. `readr::read_csv(comment = "#")` ignores the header. JSON sidecar is the documented alternative.
- **Raw samples by default**, each with `sample_index` and `media_time_s`. Optional binned export off by default.
- **Columns:** 1D → `sample_index, media_time_s, value`; 2D → config-driven axis names (e.g., `agency, communion`) with a documented **`x, y` fallback**.
- Quality signals (§6) exported alongside or in the metadata header.

### 9.4 Distribution & completion
- Links carry study id + session token. On finish: record session, issue completion code, optional redirect to a **configurable completion URL** — sufficient for MTurk + Prolific without deeper API integration.

---

## 10. Key technical risks (validate early in Code)
1. **Sampling precision & media sync** — `requestVideoFrameCallback` per frame; store `currentTime` per sample; validate timer-fallback cadence.
2. **Codec support** — verify targets across Chrome/Firefox/Safari; document constraints.
3. **Gamepad polling** — cross-browser behavior, calibration, dead-zone.
4. **Autosave integrity** — IndexedDB writes must not stall the sampling loop; verify resume correctness.
5. **Media upload/streaming cost** — model storage/egress before enabling built-in hosting.

---

## 11. Phased roadmap (MVP-first, web app)
- **Phase 0 — Foundation:** repo, TS config, CI/lint/test, design tokens (incl. CVD-safe palettes, dark theme).
- **Phase 1 — 1D rating MVP (no backend):** Browse to a local file, rate on the slider, per-frame sampling, **autosave/resume**, **focus mode**, optional **transport lock**, **raw-signal capture**, raw CSV export. Proves the risky core.
- **Phase 2 — 2D circumplex + gamepad:** circumplex mode, joystick input, configurable control behavior, damped motion + grid/crosshair.
- **Phase 3 — Researcher console (local mode):** author/configure projects, playlists + **randomization**, instructions, completion redirect, **self-contained study config**; export config. Questionnaire authoring begins.
- **Phase 4 — Cloud (Supabase):** media storage/hosted studies, session tokens, result collection, session-count + **quality tracking**, completion codes/redirect; PWA groundwork.
- **Phase 5 — Crowdworker polish:** MTurk/Prolific end-to-end, **data-quality scoring + attention checks**, **calibration mode**, questionnaires complete, offline/PWA, docs, accessibility pass.

Phases 1–3 need no infrastructure, so most of the app is demoable before any backend exists.

---

## 12. Resolved decisions (from planning)
1. **Export:** single self-describing tidy CSV with commented config-metadata header (JSON sidecar alt). ✔
2. **Reliability/analysis:** four ICCs + visualization in the planned R package, out of this build. ✔
3. **Media:** local Browse-to-file first; cloud storage later. ✔
4. **Auth:** lightweight token-based early; heavier auth at cloud phase. ✔
5. **Crowdworker:** MTurk + Prolific via completion code + redirect URL. ✔
6. **Console:** projects with settings/playlists + open/completed session counts (counts need cloud). ✔
7. **No in-app review window** — analysis in R. ✔
8. **Sampling:** raw by default — per-frame for video, ~100 Hz fallback for audio; optional binned export off by default; 2D columns config-driven with `x, y` fallback. ✔
9. **Enhancements adopted:** CVD-safe palettes, focus mode + dark theme, damped indicator motion, control-behavior settings, transport lock, autosave/resume, data-quality instrumentation, questionnaire blocks, playlist randomization, calibration mode, PWA/offline, self-contained study configs (phased per §6/§11). ✔
10. **Rejected:** synchronized multi-stream playback (pre-composite instead). ✔

*No open questions outstanding — ready for the Design brief and Phase 1 Code prompt.*

---

## 13. Provenance
Requirements derived from the CARMA paper (Girard, 2014, *J. Open Res. Softw.*) and the DARMA paper (Girard & Wright, 2018, *Behav. Res.*), plus the author's modernization goals and planning decisions. Preserves minimalism, customizability, and multi-format media; removes the MATLAB Runtime dependency and Windows/local-install constraints; moves analysis into a downstream R package; adds web-based study distribution; and extends the originals with data-quality instrumentation, resilient local-first collection, embedded questionnaires, and an accessible design system.
