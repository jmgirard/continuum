# Claude Code Prompt — Phase 5: Crowdworker Polish

*Use this in the existing repo/session, after Phase 4 works. Attach the spec (`continuous-rating-tool-spec.md`). Keep CLAUDE.md current. Build only Phase 5 as scoped below.*
*Before implementing platform/offline pieces, verify current MTurk and Prolific completion/redirect conventions and current service-worker/PWA practices against their official docs.*

---

## Context

Phase 4 made studies hostable, collectable, and trackable via Supabase. Phase 5 hardens the tool for **real remote crowdworker use** and completes the features deferred earlier: end-to-end MTurk/Prolific flows, **data-quality scoring** and attention checks, a **calibration/training mode**, **complete questionnaires**, full **offline/PWA**, an **accessibility pass**, and **documentation**. This is the phase that turns a working app into something researchers will trust for money-on-the-line remote data collection.

## Scope

**In scope (build this):**
- **MTurk + Prolific end-to-end:** capture platform params from the participant URL into session metadata (e.g., Prolific `PROLIFIC_PID`/`STUDY_ID`/`SESSION_ID`; MTurk `workerId`/`assignmentId`/`hitId`); configurable per study; correct **completion redirect** with code; a test/preview mode.
- **Data-quality scoring:** turn the raw signals captured since Phase 1 into per-session **scores/flags** — idle/flat-line detection, movement variance/entropy, event-responsiveness — with **configurable thresholds**, surfaced on the dashboard and stored per session. Document the methodology.
- **Attention "catch" clips:** optional playlist items with an **expected trajectory**; score adherence; flag failures.
- **Calibration / training mode:** a practice clip with light feedback to standardize raters before real data.
- **Complete questionnaires:** finish the Phase 3 scaffolding — author item types (Likert, multiple choice, text, etc.), render them in the participant flow **before/between/after** clips, validate responses, and store them with the session.
- **Offline / PWA:** cache the app shell and a loaded study's assets so a participant can complete even if the connection drops, then **sync** results when back online (build on the local-first autosave).
- **Accessibility pass:** full keyboard operation, screen-reader labels/ARIA, contrast audit, and **`prefers-reduced-motion`** support (disable damping/trail when requested).
- **Documentation:** researcher guide (set up a study, connect MTurk/Prolific, interpret quality flags, export for the R package), participant-facing clarity, and developer/README docs.

**Explicitly out of scope:**
- Analysis/visualization/reliability — that is the **R package**, never in this app.
- Any new backend beyond **extending** the Phase 4 schema as needed for questionnaire responses, quality scores, catch-clip definitions, and platform metadata.

Preserve all prior-phase behavior and keep local mode working.

## Key requirements

### Data-quality scoring (design carefully)
- Compute scores from the **already-captured raw samples** — do not require new collection. Provide transparent, documented metrics and **configurable thresholds** so researchers can justify exclusions. Surface as per-session flags + a score; never auto-delete data — flag, don't discard.
- Validate against **synthetic traces**: a flat-line/parked control is flagged; an engaged, responsive trace is not.

### Attention catch clips
- A study may include catch items with an **expected trajectory**; scoring compares the rater's series to it within tolerance and flags failures. Keep this as one input to quality, not an automatic exclusion.

### Questionnaires
- Extend the config schema (versioned) with questionnaire blocks and item types; render and validate in the participant flow; store responses linked to the session. Respect the RLS model from Phase 4.

### Offline / PWA
- Service worker caches the app and the current study's assets; a mid-session disconnection does not lose data; results **reconcile** to the backend on reconnect. Test the offline→online transition explicitly.

### Accessibility
- Keyboard-complete; ARIA on interactive controls; contrast audit (e.g., axe); honor `prefers-reduced-motion` for indicator damping/trail.

## Testing requirements
- **Quality scoring:** synthetic flat-line flagged; engaged trace not flagged; thresholds configurable.
- **Catch clips:** adherent vs. non-adherent trajectories scored/flagged correctly.
- **Questionnaires:** item rendering, validation, and response storage (with RLS respected).
- **Platform params:** captured from URL into session metadata; completion redirect correct for both platforms.
- **Offline sync:** simulate offline during a session, then online; results reconcile with no loss/duplication.
- **Accessibility:** automated a11y checks pass; reduced-motion respected.
- **Regression:** all Phase 1–4 tests remain green.
- CI runs type-check, lint, tests, a11y checks, and integration tests against local Supabase.

## Suggested build order (check in at each milestone)
1. Platform param capture + completion redirect (MTurk + Prolific) + test/preview mode.
2. Complete **questionnaires** (schema, authoring, participant rendering, validation, storage).
3. **Data-quality scoring** from raw signals + dashboard surfacing + synthetic-trace tests + docs.
4. **Attention catch clips** + adherence scoring.
5. **Calibration/training** mode.
6. **Offline/PWA** completion + reconnect sync + offline→online tests.
7. **Accessibility** pass (keyboard, ARIA, contrast, reduced-motion).
8. **Documentation** (researcher, participant, developer); final regression.

## Definition of done
A researcher can publish a study to Prolific or MTurk with a working completion redirect; a remote participant can optionally calibrate, complete rating **and** questionnaire blocks, survive a brief disconnection without data loss, and return via the platform's completion flow. The researcher sees **per-session quality scores/flags** (including any catch-clip results) and can exclude defensibly, then export the collected data in the unchanged R-package format. The app passes an accessibility audit and respects reduced-motion. Documentation covers setup → export. All prior-phase tests still pass in CI.

## Decisions you may make
The specific quality metrics and default thresholds (document them), catch-clip tolerance model, questionnaire item set, PWA caching strategy, and doc structure. Record consequential choices in CLAUDE.md/README. Do not add analysis features to the app — that boundary is permanent. Extend the Phase 4 schema only as needed, with migrations checked in.
