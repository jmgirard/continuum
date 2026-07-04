# Claude Code Prompt — Phase 3: Researcher Console (Local Mode)

*Use this in the existing repo/session, after Phases 1–2 work. Attach the spec (`continuous-rating-tool-spec.md`) and the **researcher-console design** handoff. Keep CLAUDE.md current. Build only Phase 3 as scoped below.*

---

## Context

Phases 1–2 delivered the full participant **rating experience** (1D slider + 2D circumplex, mouse/keyboard/joystick, per-frame sampling, autosave/resume, self-describing CSV export), driven by a config object. Phase 3 wraps a **researcher console** around it so a researcher can author and manage studies **without any backend** — "local mode." This is where study configuration graduates from a dev object into a real, persisted, researcher-facing surface.

## Scope

**In scope (build this):**
- A **project dashboard**: create, list, open, duplicate, archive/delete studies; projects **persist locally** (IndexedDB) across reloads; a clear empty state.
- A **project editor** with: the full **rating configuration** (reuse the settings surface from Phases 1–2), a **playlist builder** (add local media, reorder, per-item options, per-participant **randomization/counterbalancing** settings), and an **instructions/consent** editor.
- **Distribution & completion settings** authored now (completion code + redirect URL fields) even though they only take full effect in the cloud phase.
- A **local session runner**: launch a configured study for a participant, play the playlist, collect ratings (reusing the Phase 1–2 flow), and export the CSVs. This is real in-lab usability with no backend.
- **Self-contained, versioned study config**: export/import an entire study (settings + playlist references + instructions) as a single JSON file, with schema validation.
- **Questionnaire scaffolding only**: the data model + editor insertion points (before/between/after clips). Do NOT build full item authoring or participant rendering yet.

**Explicitly out of scope (do NOT build in Phase 3):**
- Any backend, cloud, auth, hosted links, remote distribution, or server-side result collection.
- Live session-count tracking or data-quality flags (needs cloud — Phase 4).
- Full questionnaires (Phase 5), data-quality scoring, attention checks, calibration, PWA/offline.
- Analysis/visualization/reliability (R package).

Preserve everything Phases 1–2 do; the participant rating flow must keep working.

## Key requirements

### Formalize the study config schema
- Promote the config to a **versioned, validated schema** (e.g., with `zod`): dimensionality, rating settings, playlist, instructions, distribution/completion, and (scaffolded) questionnaire blocks. This schema is now a first-class artifact and the **contract Phase 4 will store** — define it carefully and include a `schemaVersion`.

### Project persistence & the local-media wrinkle
- Persist projects to **IndexedDB**.
- Playlist items reference real local media. Browsers can't silently reopen a file path across reloads, so choose one:
  - Use the **File System Access API** (`showOpenFilePicker`) to persist file **handles** in IndexedDB and re-request permission at session start (Chromium; ideal for lab machines), **or**
  - Store filename + metadata and **prompt the researcher to locate the files** when starting a session.
- Detect capability and fall back gracefully; document the choice in CLAUDE.md.

### Playlist randomization
- Per-participant **randomization/counterbalancing** must be **deterministic given a seed**, so a given participant's order is reproducible and recorded in the exported metadata.

### Local session runner
- From a project, "Start a session" runs the (optionally randomized) playlist through the Phase 1–2 rating flow, one item at a time, with autosave/resume, and exports one self-describing CSV per item. Completion settings (code/redirect) are shown but not enforced without a backend.

### Preview
- A prominent **Preview** launches the participant experience exactly as configured, for pre-distribution checks.

## Data model & export

- **Study config JSON** (versioned) is exportable/importable as a single file; import validates against the schema and reports errors clearly.
- Participant CSV export is **unchanged** from Phases 1–2; the exported metadata header now also records the resolved **playlist order / randomization seed** for the session.
- Metadata keys remain stable — still the R-package contract.

## Testing requirements
- **Schema validation:** valid configs pass; malformed configs fail with clear errors; `schemaVersion` handled.
- **Export/import round-trip:** a study exported to JSON re-imports to an identical study.
- **Randomization:** given a seed, order is deterministic and reproducible; counterbalancing distributes as intended across seeds.
- **Project persistence:** create → reload → projects restored.
- **Session runner:** running a playlist produces the correct per-item annotations; metadata records the order/seed.
- **Regression:** Phases 1–2 tests remain green.
- CI runs type-check, lint, tests.

## Suggested build order (check in at each milestone)
1. Study config schema (`zod`, versioned) + validation tests.
2. Project dashboard + IndexedDB persistence + empty state.
3. Project editor: rating configuration (reuse settings) + instructions editor.
4. Playlist builder (add/reorder/per-item options) + local-media handle strategy + randomization (seeded) + tests.
5. Distribution/completion settings fields + study config export/import + round-trip tests.
6. Local session runner (wire playlist → rating flow → per-item CSV) + tests.
7. Questionnaire **scaffolding** (model + editor insertion points only).
8. Reskin to the console design handoff; polish; regression.

## Definition of done
A researcher can create and name a project, configure a 1D or 2D scale, build and reorder a playlist of local media with seeded per-participant randomization, write instructions, set completion code/redirect fields, export the whole study as a single JSON file and re-import it identically, preview it, and **run a local in-lab session** that plays the playlist and collects ratings (with autosave/resume and per-item CSV export whose metadata records the order/seed). Projects persist across reloads. Questionnaire scaffolding exists but is not yet functional. No backend code is present. Type-check, lint, and tests (including Phase 1–2 regressions) pass in CI.

## Decisions you may make
Folder/component structure, the local-media handle strategy (document it), randomization algorithm details, and styling not fixed by the design. Record consequential choices in CLAUDE.md/README. Do not expand beyond Phase 3; stub out-of-scope needs behind clear interfaces with `TODO(phase-N)` notes.
