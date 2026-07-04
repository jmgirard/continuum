# Continuum

A modern, web-based tool for **continuous perceptual/experiential rating** — the open-source
successor to the MATLAB tools **CARMA** (1D) and **DARMA** (2D). A participant watches a media
file and, in real time, reports a judgment by moving a control; the control's position is sampled
continuously and exported for downstream analysis (handled by a separate, planned R package).

> **Status: Phase 1 — Local-File 1D Rating MVP (no backend).** This build proves the risky core:
> **sampling correctness and media synchronization.** See [`CLAUDE.md`](CLAUDE.md) for the full
> Phase 1 scope, the explicit out-of-scope list, and the CSV export contract.

## Prerequisites

- **Node 20 LTS** (see [`.nvmrc`](.nvmrc)) and **npm**.

## Getting started

```bash
npm install     # install dependencies
npm run dev      # start the Vite dev server
npm test         # run the test suite (watch mode)
```

Other scripts:

| Script                 | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm run build`        | Type-check, then produce a production build           |
| `npm run test:run`     | Run the test suite once (CI mode)                     |
| `npm run coverage`     | Run tests with a coverage report                      |
| `npm run typecheck`    | `tsc --noEmit` strict type-check                       |
| `npm run lint`         | ESLint (flat config, type-aware)                      |
| `npm run format`       | Prettier — write                                      |
| `npm run format:check` | Prettier — check (used by CI)                         |
| `npm run ci`           | typecheck + lint + format:check + tests (local gate)  |

## Tech stack

- **TypeScript (strict)** + **React** + **Vite**, targeting **Node 20 LTS**.
- **Vitest** + **React Testing Library** for tests; **ESLint** + **Prettier** for quality gates.
- **IndexedDB** (via `idb`) for autosave/resume; **`papaparse`** for CSV round-trip tests.
- Continuous integration via **GitHub Actions** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):
  type-check, lint, format check, tests, and build on every push/PR.
- Licensed **GPLv3**, consistent with the CARMA/DARMA originals.

### Project structure

```
src/
├─ config/     # rating-scale config + CVD-safe palettes
├─ media/      # File API load + <video>/<audio> element + transport  (milestone 2)
├─ sampling/   # per-frame (rVFC) + ~100 Hz Web-Worker fallback sampler (milestone 4)
├─ rating/     # scale model, value↔position mapping, vertical slider   (milestone 3)
├─ session/    # session model, IndexedDB autosave/resume               (milestone 5)
├─ export/     # self-describing CSV writer                             (milestone 6)
├─ ui/         # theme tokens (the single reskin surface), global styles
└─ app/        # application shell + theme hook
```

All visual styling lives in **design tokens** ([`src/ui/tokens/tokens.css`](src/ui/tokens/tokens.css)),
transcribed from the Claude Design handoff, so the app can be reskinned without touching components.
Dark theme is the default (better for watching video); light is required and derived.

## Data model & export format

Phase 1 exports **one self-describing CSV per annotation** — a commented `# key: value` metadata
header carrying the config snapshot, then a header row, then one raw sample per row:

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

`readr::read_csv(comment = "#")` parses the data cleanly, and the header is machine-parseable.
Raw samples only (no binning). The 1D column names are exactly `sample_index, media_time_s, value`.
These metadata keys are a **stable contract** the downstream R package reads — see [`CLAUDE.md`](CLAUDE.md).

## Notable decisions

- **Single `tsconfig.json`** (not project references) — simpler and avoids build-mode/composite
  pitfalls; type-checking runs via `tsc --noEmit`, transpilation via Vite/esbuild.
- **Theme applied via `data-theme` on `<html>`**, flipping CSS custom properties in one place.
- Local Node may be newer than the Node 20 LTS that CI pins; the `engines` field allows `>=20`.

## License

[GPLv3](LICENSE) — consistent with the original CARMA and DARMA tools.
