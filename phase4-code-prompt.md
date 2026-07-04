# Claude Code Prompt — Phase 4: Cloud Backend (Supabase)

*Use this in the existing repo/session, after Phase 3 works. Attach the spec (`continuous-rating-tool-spec.md`). Keep CLAUDE.md current. Build only Phase 4 as scoped below.*
*Before implementing, verify current Supabase APIs, client-library versions, RLS syntax, and Storage/Auth practices against the official Supabase docs — they change, and correctness here is security-critical.*

---

## Context

Phase 3 delivered a local-mode researcher console: authoring, playlists, local sessions, and a versioned study-config schema. Phase 4 adds the **Supabase backend** so studies can be **hosted**, participants reached by **link**, results **collected centrally**, and sessions **tracked**. This resolves the local-file limitation for remote participants and is the largest architectural addition in the project. **Security (row-level security) is the top priority** — a participant must never be able to read or modify anyone else's data.

## Scope

**In scope (build this):**
- **Supabase integration:** Postgres schema + **migrations checked into the repo**, **Auth** for researchers, **Storage** for media and result files, **row-level security (RLS)** policies, and **edge functions** for completion handling.
- **Researcher auth:** lightweight but real accounts (e.g., email magic link). Researchers own their studies.
- **Cloud studies:** publish a Phase 3 study (config + media) to the cloud; upload playlist media to Storage; playlist items reference hosted URLs.
- **Hosted participant flow:** a shareable **participant link** (study id + session token) opens the study on any device, streams the media, runs the Phase 1–3 rating flow, and **submits annotations** to the backend.
- **Session lifecycle & tracking:** create session on link open; statuses (assigned / in progress / complete); dashboard shows **open vs. completed counts**; issue **completion codes** and support the **redirect URL**.
- **Result collection:** annotations stored server-side; researcher can **export the collected CSVs** (the R-package contract) from the console.
- **Raw-signal persistence:** store the per-session raw signals/basic flags captured since Phase 1 (full *scoring* is Phase 5).
- **Local-first sync:** hosted sessions keep the Phase 1 autosave and reconcile to the backend, so a dropped connection doesn't lose data.
- **PWA groundwork:** service worker + manifest (full offline is Phase 5).

**Explicitly out of scope (do NOT build in Phase 4):**
- Data-quality **scoring** + attention checks (Phase 5), calibration (Phase 5), full **questionnaires** (Phase 5), complete **offline** (Phase 5).
- Analysis/visualization/reliability (R package).

Preserve all prior-phase behavior; **local mode must continue to work** for researchers who don't use the cloud.

## Key requirements

### Security & secrets (highest priority)
- **RLS on every table.** Unauthenticated participants (token-based) may create their own session and insert their own annotations only; they cannot read others' sessions/annotations or any study internals beyond what's needed to run. Authenticated researchers may access only **their own** studies and the sessions/annotations under them. Write explicit policies and **test them**.
- **Never expose the service-role key** client-side. Only the anon key ships to the browser; privileged operations (completion-code issuance, etc.) run in **edge functions**. Config via env; no secrets committed.

### Schema (starting point — refine against Supabase docs)
- `studies` (id, owner → auth user, validated config JSON, schema_version, timestamps)
- `media` (id, study_id, storage_path, metadata)
- `sessions` (id, study_id, token, status, platform_metadata JSON, completion_code, quality_flags JSON, started_at, completed_at)
- `annotations` (id, session_id, media_item_id, **storage_path to the raw sample file**, config_snapshot JSON, created_at)
- **Store raw sample data as files in Storage** (CSV/columnar) referenced by an `annotations` row, rather than millions of DB rows — far more scalable for high-frequency data.

### Media upload
- **Resumable/chunked** uploads for large video; show progress; validate against supported codecs (§8 of spec). Note storage/egress cost implications in docs.

### Publish & sync
- Define how a **local Phase 3 study** becomes a **cloud study** (import the config, upload its media). Keep the config schema as the shared contract.

### Completion
- Edge function issues a **unique completion code**, marks the session complete, and returns/redirects to the configured **completion URL** with the code — compatible with MTurk and Prolific (full platform param handling is Phase 5).

## Testing requirements
- **RLS (critical):** a participant token **cannot** read or write another session's or study's data; a researcher **cannot** access another researcher's studies. Test both positive and negative cases against **local Supabase** (`supabase` CLI).
- **Edge functions:** completion-code **uniqueness**, session state transitions, redirect correctness.
- **Submission round-trip:** participant submits → stored in Storage/DB → researcher exports an identical CSV.
- **Media upload:** large-file/resumable path; codec validation.
- **Sync:** dropped-connection reconciliation from local autosave.
- **Regression:** local mode and Phases 1–3 tests remain green.
- CI runs type-check, lint, tests, and (where feasible) integration tests against local Supabase.

## Suggested build order (check in at each milestone)
1. Supabase local dev + schema **migrations** + **RLS policies** + policy tests. **Get security right first.**
2. Researcher **auth** + project ownership.
3. **Publish** a Phase 3 study to the cloud (config + media upload to Storage).
4. **Hosted participant flow** via link (load study, stream media, run rating flow).
5. **Session lifecycle** + annotation **submission** + local-first reconciliation.
6. **Completion** edge function + redirect.
7. Dashboard **session counts** + raw-signal/basic-flag **persistence**.
8. **Result export** from the console; PWA groundwork; regression.

## Definition of done
A researcher signs in, publishes a study (config + media) to the cloud, and gets a shareable participant link. A participant opens the link **on a different machine**, streams the media, completes the ratings (surviving a brief disconnection without data loss), submits, and receives a completion code / redirect. The researcher sees the session marked complete with open/completed counts and can export the collected CSVs (unchanged R-package format). **RLS provably prevents** cross-session and cross-study access; no service-role secret is exposed client-side. Local mode still works. Type-check, lint, and tests — including RLS tests and Phase 1–3 regressions — pass in CI.

## Decisions you may make
Auth method details, exact table/column names and indexes, Storage bucket layout, upload library, and PWA scaffolding specifics — consistent with current Supabase guidance. Record consequential choices and the final schema in CLAUDE.md/README. Do not expand beyond Phase 4; stub Phase 5 needs behind clear interfaces with `TODO(phase-5)` notes.
