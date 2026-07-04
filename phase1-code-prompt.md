# Claude Code Prompt — Phase 1: Local-File 1D Rating MVP

*Paste this into Claude Code. Attach the project spec (`continuous-rating-tool-spec.md`) and, if available, the exported design from Claude Design. Build only Phase 1 as scoped below.*

---

## Context

You are building the first phase of a web app for **continuous perceptual/experiential rating** — the modern successor to two MATLAB research tools, CARMA (1D) and DARMA (2D). A participant watches a media file and, in real time, reports a judgment by moving a control; the control's position is sampled continuously and exported for analysis. The full product spec is attached. **This prompt covers Phase 1 only.**

The single most important quality bar for this phase is **sampling correctness and media synchronization**. Everything else is in service of proving that core.

## Scope

**In scope (build this):**
- Load a **local media file** via the File API (Browse button); play video or audio via an object URL.
- A **1D vertical slider** rating control operated by **mouse** and **keyboard** (arrow keys).
- **Per-frame sampling** of the control's value, synchronized to media playback.
- **Autosave** of the in-progress session and **resume** on reload.
- **Focus mode**, optional **transport lock**, and a configurable **rating scale**.
- **Export** to a self-describing CSV.
- A real, tested, CI-backed repo.

**Explicitly out of scope (do NOT build in Phase 1):**
- 2D circumplex mode; joystick/gamepad input.
- Any backend, cloud storage, auth, study links, or completion codes.
- Researcher console, playlists, questionnaires, randomization.
- Any analysis, visualization, reliability, or review UI (that lives in a separate R package).
- Data-quality *scoring* or attention checks (but see "raw-signal retention" below).

Keep the code structured so these can be added later without rework, but do not implement them now.

## Tech stack & tooling

- **TypeScript** (strict mode) + **React** + **Vite**.
- Package manager: **npm**; target **Node 20 LTS**.
- State: keep the high-frequency sample buffer in a **mutable ref / plain module**, NOT React state (see Architecture). Use lightweight React state (or a small store like Zustand) only for UI-facing values.
- Local persistence: **IndexedDB** via the `idb` library.
- Testing: **Vitest** + **React Testing Library**; `papaparse` for CSV round-trip tests.
- Quality gates: **ESLint** + **Prettier**, **TypeScript** type-check, **Vitest** — all wired into a **GitHub Actions CI** workflow that runs on push/PR.
- License: **GPLv3** (`LICENSE` file), consistent with the originals.
- Follow the frontend-design skill's conventions; keep all visual styling in **design tokens** so the app can be reskinned to match the Claude Design output. If the design export is attached, implement to it; if not, use a clean minimal placeholder consistent with the spec's principles (quiet chrome, media-forward, CVD-safe default palette, light + dark themes).

## Architecture guidance

- **Decouple the sampling engine from React rendering.** Sampling runs at frame rate (or ~100 Hz for audio); writing each sample into React state would thrash rendering. Write samples into a mutable buffer; update the visible indicator via a throttled/rAF-driven display path.
- **Sampling engine (the heart):**
  - **Video:** use **`requestVideoFrameCallback`** to sample once per presented frame; record the callback's `mediaTime` (and useful metadata like `presentedFrames`/`expectedDisplayTime` if helpful).
  - **Audio / when `requestVideoFrameCallback` is unavailable:** fall back to a fixed-rate timer at a configurable **default ~100 Hz**, reading `media.currentTime`. Prefer a **Web Worker** timer to resist background-tab throttling. (Note: `requestAnimationFrame` caps near display refresh, so it is not the high-rate driver.)
  - **Every sample records:** `sample_index`, the media time (`media_time_s`), the current rating **value**, and a wall-clock timestamp. Sampling starts/stops with play/pause and stops at media end.
- **Recorded value vs. display smoothing:** the **saved sample is the control's true logical value**. Any damped motion or trail on the indicator is **display-only** and must never alter saved values.
- **Modules:** keep clear boundaries — `media/` (element + File API), `sampling/` (engine + fallback), `rating/` (scale model, value↔position mapping, slider), `session/` (session model, autosave/resume), `export/` (CSV writer), `config/` (scale/config), `ui/` (screens, theme tokens).
- **Raw-signal retention:** the data model must retain every raw sample and its timestamps so downstream quality metrics (idle/flat-line, variance, responsiveness) are derivable **later**. Do not compute or display scores now — just don't throw the signal away.

## Functional requirements (Phase 1)

1. **Load media:** Browse to a local file; support common video (MP4/H.264, WebM) and audio; show a clear error for unsupported/failed loads. Display the file name.
2. **Rating scale (configurable via a simple settings panel or config object):** upper/lower labels, numeric min/max, number of steps (or continuous), and palette (**CVD-safe default preset** plus a custom 3-color gradient option). Render as a vertical slider with labels and numeric ticks.
3. **Input:** mouse drag on the slider; keyboard arrow keys nudge the value (with sensible step size). The control's value is well-defined at every sample.
4. **Transport:** play/pause via button and **spacebar**; show elapsed/total time and file name. Provide an optional **transport-lock** config that disables seeking/scrubbing/rate changes.
5. **Focus mode:** during playback, chrome (controls, labels beyond the scale) fades; it returns on hover or pause.
6. **Sampling:** per Architecture — per-frame for video, ~100 Hz fallback for audio; pauses with playback.
7. **Autosave & resume:** continuously persist the session (samples + config + media file name) to IndexedDB; on reload, offer to resume a partially completed session. Autosave must not stall the sampling loop.
8. **Export:** produce a downloadable **self-describing CSV** (below). Also allow re-export of a resumed session.
9. **Theming/accessibility:** light + dark themes; keyboard operable; adequate contrast; ARIA where appropriate.

## Data model & export format

One self-describing CSV per annotation. A commented metadata header (`# key: value`) carries the config snapshot, then a normal header row and one row per raw sample.

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
...
```

- `readr::read_csv(comment = "#")` must parse the data cleanly; the header is machine-parseable too.
- Raw samples by default (no binning in Phase 1). Column names for 1D are exactly `sample_index, media_time_s, value`.
- Keep the metadata keys stable — they are the contract the future R package reads.

## Testing requirements

- **Sampling engine:** with a mocked media element, verify samples capture `currentTime` correctly, `sample_index` is monotonic, sampling starts/stops with play/pause, and the fallback timer approximates the configured rate.
- **Scale mapping:** value↔slider-position is correct across ranges, step counts, and continuous mode; boundaries clamp.
- **Export:** round-trip — write CSV, parse with `papaparse`, and confirm metadata + rows reconstruct faithfully.
- **Storage:** save → reload → resume restores the session and can re-export identical data.
- Prioritize meaningful coverage of `sampling/`, `rating/`, `session/`, and `export/`. CI must run type-check, lint, and tests.

## Repo hygiene & deliverables

- `git init` with clear, incremental commits; sensible `.gitignore`.
- `README.md`: what it is, prerequisites, `npm install` / `npm run dev` / `npm test`, Phase 1 scope, and the export-format description.
- `LICENSE` (GPLv3).
- Runnable via `npm run dev`; green CI; passing tests.

## Suggested build order (check in at each milestone)

1. Scaffold: Vite + TS strict + ESLint/Prettier + Vitest + CI + README/LICENSE; theme tokens (light/dark).
2. Media layer: File API load + `<video>`/`<audio>` playback + transport (play/pause/spacebar, transport-lock flag).
3. Rating scale + slider (mouse + keyboard), value↔position mapping, tests.
4. Sampling engine (rVFC + Web-Worker fallback), buffer in a ref, display path, tests. **Validate sync here.**
5. Autosave/resume (IndexedDB), tests.
6. CSV export + round-trip tests.
7. Focus mode + accessibility + dark theme polish; reskin to the Claude Design output if attached.

## Definition of done

A user can: Browse to a local video, see a configured 1D scale, play the media, rate with mouse or keyboard while samples are captured per frame in sync, pause with spacebar, reload and resume, and export a self-describing CSV whose rows match the ratings given. Type-check, lint, and tests pass in CI. No 2D, joystick, backend, or console code is present.

## Decisions you may make

Where this prompt is silent (exact folder names, minor library choices consistent with the stack, component decomposition, precise keyboard step size, styling details not fixed by the design), use good judgment and note any consequential choice in the README. Do not expand scope beyond Phase 1; if something seems to require an out-of-scope feature, stub it behind a clear interface and leave a `TODO(phase-N)` note instead.
EOF