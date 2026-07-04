# CLAUDE.md — Continuum (Continuous Rating Tool)

Web-based successor to the MATLAB tools **CARMA** (1D) and **DARMA** (2D): a config-driven
web app for collecting continuous perceptual/experiential ratings. Analysis lives downstream
in a planned companion R package and is **not** built here.

Source-of-truth docs in this repo:
- `continuous-rating-tool-spec.md` — overall product & architecture spec (v0.4).
- `phase1-code-prompt.md` — **the authoritative task for the current build**.
- `rating-view-design-brief.md` — brief behind the participant rating view design.
- Design handoff (Claude Design): project `8816e1ef-8900-40fd-af6e-20c66616d7eb`,
  file `Rating View.dc.html` — visual source of truth. Import when available; until then,
  build a clean token-driven placeholder and reskin later.

---

## Current build: Phase 1 — Local-File 1D Rating MVP (no backend)

**Quality bar that dominates everything else: sampling correctness and media synchronization.**
Everything in Phase 1 exists to prove that core.

### In scope (build this)
- Load a **local media file** via the File API (Browse button); play video/audio via object URL;
  show filename; clear error on unsupported/failed load.
- **1D vertical slider** rating control, operated by **mouse drag** and **keyboard arrows**.
  Configurable scale: upper/lower labels, numeric min/max, number of steps (or continuous),
  palette (CVD-safe default preset + custom 3-color gradient). Labels + numeric ticks.
- **Per-frame sampling** synchronized to media playback (see Sampling contract).
- **Transport:** play/pause via button and **spacebar**; elapsed/total time + filename;
  optional **transport-lock** config disabling seek/scrub/rate change.
- **Focus mode:** chrome fades during playback, returns on hover/pause.
- **Autosave + resume:** continuous IndexedDB persistence (samples + config + media filename);
  offer resume on reload. Autosave must never stall the sampling loop.
- **Export** to a self-describing CSV (see Export contract); re-exportable after resume.
- Light + dark themes; keyboard operable; adequate contrast; ARIA where appropriate.
- Real repo: TS strict + React + Vite, Vitest + RTL tests, ESLint + Prettier, GitHub Actions CI,
  GPLv3 LICENSE, README.

### Explicitly OUT of scope in Phase 1 (do NOT build)
- ❌ 2D circumplex mode; ❌ joystick / gamepad input.
- ❌ Any backend, cloud storage, auth, study links, or completion codes.
- ❌ Researcher console, playlists, questionnaires, randomization.
- ❌ Any analysis, visualization, reliability, or review UI (that lives in the R package).
- ❌ Data-quality **scoring** or attention checks.
  **BUT: retain every raw sample and its timestamps** so quality metrics (idle/flat-line,
  variance, responsiveness) are derivable later. Keep the signal; do not score it now.

Keep code structured so out-of-scope features slot in later behind clean interfaces.
If something seems to need an out-of-scope feature, stub it and leave a `TODO(phase-N)` note.

---

## Tech stack & tooling
- **TypeScript (strict)** + **React** + **Vite**. Package manager **npm**; target **Node 20 LTS**.
- High-frequency sample buffer lives in a **mutable ref / plain module — NOT React state**.
  Lightweight React state (or a small Zustand store) only for UI-facing values.
- Local persistence: **IndexedDB** via the **`idb`** library.
- Testing: **Vitest** + **React Testing Library**; **`papaparse`** for CSV round-trip tests.
- Quality gates in CI: TypeScript type-check, ESLint, Prettier, Vitest — GitHub Actions on push/PR.
- **License: GPLv3** (consistent with CARMA/DARMA).
- All visual styling in **design tokens** (single reskin surface). CVD-safe default palette;
  light + dark themes; quiet, media-forward chrome.

### Module boundaries
`media/` (element + File API) · `sampling/` (engine + fallback + buffer) · `rating/` (scale model,
value↔position mapping, slider) · `session/` (session model, autosave/resume) · `export/` (CSV writer)
· `config/` (scale/config) · `ui/` (screens, theme tokens).

---

## Sampling contract (the heart — validate early)
- **Video:** `requestVideoFrameCallback` — one sample per presented frame; record the callback's
  `mediaTime` (keep `presentedFrames` / `expectedDisplayTime` if useful).
- **Audio / rVFC unavailable:** fixed-rate timer, **default ~100 Hz**, reading `media.currentTime`.
  Prefer a **Web Worker** timer to resist background-tab throttling.
  (`requestAnimationFrame` caps ~60 Hz — not the high-rate driver.)
- **Every sample records:** `sample_index` (monotonic), `media_time_s`, rating **value**,
  wall-clock timestamp. Sampling starts/stops with play/pause; stops at media end.
- **Recorded value vs. display smoothing:** the saved sample is the control's **true logical
  value**. Damped indicator motion / trail is **display-only** and must never alter saved values.

---

## CSV export contract (STABLE — the future R package reads this)
One self-describing CSV per annotation (participant × media item): a commented `# key: value`
metadata header carrying the config snapshot, then a normal header row, then one row per raw sample.
Raw samples only in Phase 1 (no binning). `readr::read_csv(comment = "#")` must parse it cleanly.
**1D column names are exactly `sample_index, media_time_s, value`.** Keep metadata keys stable.

```
# app_version: 0.1.0
# study_id: local
# dimensionality: 1D
# media_reference: interview_clip.mp4
# sampling_mode: per_frame            # or: fixed_100hz
# scale_lower_label: very negative
# scale_upper_label: very positive
# scale_min: -100
# scale_max: 100
# scale_steps: 9                      # or: continuous
# created_at: 2025-01-15T10:32:00Z
sample_index,media_time_s,value
0,0.000,0
1,0.033,0
2,0.067,4
```

---

## Build order (check in at each milestone; HARD STOP after #4)
1. Scaffold: Vite + TS strict + ESLint/Prettier + Vitest + CI + README/LICENSE + theme tokens.
2. Media layer: File API load + `<video>`/`<audio>` + transport (play/pause/spacebar, lock flag).
3. Rating scale + slider (mouse + keyboard), value↔position mapping, tests.
4. **Sampling engine (rVFC + Web-Worker fallback), buffer in ref, display path, tests.**
   🔴 **Validate sync here and STOP for user verification — riskiest part.**
5. Autosave/resume (IndexedDB), tests.
6. CSV export + round-trip tests.
7. Focus mode + a11y + dark-theme polish; reskin to the Claude Design output if attached.

## Testing priorities
Meaningful coverage of `sampling/`, `rating/`, `session/`, `export/`:
sampling (mocked media: currentTime capture, monotonic index, start/stop with play/pause,
fallback-timer cadence) · scale mapping (value↔position across ranges/steps/continuous, boundary
clamping) · export (CSV round-trip via papaparse) · storage (save→reload→resume→identical re-export).

## Workflow notes
- Build strictly in milestone order; check in at each; **hard stop after milestone 4** for the
  user to verify sampling/sync before building on top.
- Note any consequential judgment-call (folder names, minor libs, keyboard step size) in the README.
- Do not expand scope beyond Phase 1.
