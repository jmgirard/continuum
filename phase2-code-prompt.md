# Claude Code Prompt — Phase 2: 2D Circumplex + Joystick

*Use this in the existing repo/session, after Phase 1 is working. Attach the spec (`continuous-rating-tool-spec.md`), the design (rating-view brief covers both modes; hand off the 2D design if you produced it), and keep CLAUDE.md in the loop. Build only Phase 2 as scoped below.*

---

## Context

Phase 1 delivered a local-file **1D** rating MVP with a per-frame sampling engine, autosave/resume, and a self-describing CSV export. Phase 2 adds the **2D circumplex** rating mode and **joystick/gamepad** input. Dimensionality becomes a study setting (`1D` | `2D`); the existing sampling engine now captures **two** values per sample instead of one. Reuse Phase 1's architecture and the same quality bar — sampling correctness and media sync stay paramount.

## Scope

**In scope (build this):**
- **2D circumplex rating mode:** a square rating space with two crossed axes, a movable point indicator, configurable axis labels and region/quadrant labels, and the two built-in presets — **affective** (valence × arousal) and **interpersonal** (agency × communion) — plus configurable axis magnitude/range.
- **Gamepad/joystick input** via the Gamepad API, working in both 1D and 2D modes (primary input for 2D).
- **Configurable control behavior:** spring-to-center vs. stay-put, plus joystick **dead-zone** and **gain**.
- **Damped, instrument-grade indicator motion** with an optional trail (display-only), and the circumplex's **radial grid, center crosshair, and light quadrant tints**.
- Extend the **session model, autosave, and export** to 2D.
- Extend the **settings surface** for the 2D options.

**Explicitly out of scope (do NOT build in Phase 2):**
- Any backend, cloud storage, auth, study links, completion codes.
- Researcher console, playlists, questionnaires, randomization.
- Analysis/visualization/reliability/review UI (lives in the R package).
- Data-quality scoring, attention checks, calibration mode, PWA/offline.

Keep interfaces clean so these can be added later; do not implement them now. Preserve everything Phase 1 does — **1D mode must continue to work unchanged.**

## Key requirements

### Dimensionality as a setting
- Config gains a `dimensionality: '1D' | '2D'`. The rating screen branches on it: Phase 1's vertical slider for `1D`, the circumplex panel for `2D`. Shared shell (media panel, transport, focus mode, playlist progress) stays common.

### 2D circumplex panel
- Square space, two axes crossing at center; faint **radial grid**, **center crosshair**, and **light quadrant tints** for legibility without noise.
- **Axis labels** at the ends and optional **region/quadrant labels** (free text).
- Built-in presets populate labels: **affective** (valence × arousal) and **interpersonal** (agency × communion).
- **Axis magnitude/range** configurable; the point is clamped to the square bounds defined by ±magnitude per axis. (A circular clamp is a possible later enhancement — do not add now.)
- A clear **movable point** indicator with the same damped motion as the slider.

### Input & control behavior
- **Gamepad API:** handle connect/disconnect events; **poll gamepad state inside the sampling path** (read axes at sample time — for video, within the `requestVideoFrameCallback`; for the audio fallback, within the timer tick). Apply **dead-zone** and **gain** from config.
- Support **mouse** and **keyboard** in 2D as well (drag the point; arrow keys nudge along both axes) so the app is usable without a joystick.
- **Control-behavior modes** (config), defined precisely:
  - **spring-to-center (absolute/position):** the value maps directly to control position; a self-centering joystick returns the value toward center when released. Natural for mouse.
  - **stay-put (hold):** the value persists when input stops. For a self-centering joystick, implement this as **rate/velocity control** — stick displacement sets the rate of change so a position can be held; releasing holds the current value. For mouse/keyboard, the value simply stays where left.
- **Recorded value rule (carry over from Phase 1):** the saved sample is the control's **true logical value(s)**. Damping and the trail are **display-only** and must never alter saved values.

### Sampling
- The existing engine now records **two** values per sample in 2D (one per axis). `sample_index`, `media_time_s`, and timestamps behave exactly as in Phase 1. Sampling still pauses with playback.

## Data model & export changes

- **1D export unchanged.**
- **2D export:** same self-describing CSV, with the metadata header extended (`# dimensionality: 2D`, axis labels, axis magnitude, control-behavior mode, gamepad settings). Data columns become the **config-driven axis names** with the documented **`x, y` fallback**:
  ```
  # dimensionality: 2D
  # axis_x_label: communion
  # axis_y_label: agency
  # axis_magnitude: 1000
  # control_behavior: spring_to_center
  sample_index,media_time_s,communion,agency
  0,0.000,0,0
  1,0.033,-12,45
  ...
  ```
- Metadata keys stay stable — they remain the contract the future R package reads.

## Testing requirements

- **Gamepad mapping** (mocked gamepad): axes → x/y with dead-zone and gain applied correctly; connect/disconnect handled; behavior differs correctly between spring-to-center and stay-put (including the velocity-integration path for stay-put).
- **2D scale mapping:** circumplex coordinates ↔ values across magnitudes; clamping to square bounds; presets populate labels correctly.
- **Sampling:** two values captured per sample in sync; `sample_index` monotonic; pause/resume behavior intact.
- **Export round-trip:** write 2D CSV, parse with `papaparse`, confirm metadata + `x/y`-named columns reconstruct faithfully; confirm 1D round-trip still passes.
- **Regression:** 1D mode and Phase 1 tests remain green.
- CI continues to run type-check, lint, and tests.

## Suggested build order (check in at each milestone)

1. Add `dimensionality` to config; branch the rating screen; keep the shared shell.
2. Circumplex panel UI (axes, grid, crosshair, quadrant tints, labels, presets, magnitude) with **mouse/keyboard** input and value↔position mapping + tests.
3. Gamepad API integration (connect/disconnect, polling in the sample path, dead-zone/gain), wired to both modes. **Validate joystick→point sync here.**
4. Control-behavior modes (spring-to-center vs. stay-put / velocity integration) + tests.
5. Damped motion + optional trail (display-only), shared by slider and point.
6. Extend session model, autosave, and export to 2D; round-trip tests; regression pass.
7. Settings-surface additions; reskin to the 2D design if handed off.

## Definition of done

A user can configure a 2D circumplex (e.g., interpersonal: agency × communion), load a local video, and rate with a **joystick** (and mouse/keyboard) while the point moves in sync and both dimensions are sampled per frame; can switch a study to 1D and use the Phase 1 slider unchanged; autosave/resume works in both modes; and export produces a self-describing CSV with the two config-named columns that parses cleanly in R. Type-check, lint, and tests (including Phase 1 regressions) pass in CI. No backend or console code is present.

## Decisions you may make

Where this prompt is silent (exact axis-to-gamepad mapping defaults, dead-zone/gain default values, keyboard nudge step, component decomposition, styling not fixed by the design), use good judgment and record consequential choices in the README/CLAUDE.md. Do not expand beyond Phase 2; stub anything that seems to require an out-of-scope feature behind a clear interface with a `TODO(phase-N)` note.
