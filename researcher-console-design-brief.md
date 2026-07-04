# Design Brief — Researcher Console

*Paste this into Claude Design. Design it as part of the **same project / design system** as the participant rating view — it must reuse those tokens, type, and components. Attach the spec (`continuous-rating-tool-spec.md`) for context.*

---

## What we're designing

The **researcher-facing console** of the continuous-rating web app. Where the rating view is the calm, focused screen a *participant* uses to rate media, the console is where a *researcher* sets up studies, distributes them, and tracks who has completed them. Same product, same visual language, different job: this side is more information-dense and workflow-driven.

A researcher uses the console to: create and configure a study (rating settings + a media playlist + instructions), distribute it to participants (in-lab or remote crowdworkers), and monitor completion. **Analysis is not here** — that lives in a separate R package — so the console never shows charts, statistics, or reliability. It ends at "collect clean data and hand it off."

Note two operating modes the design must accommodate:
- **Local mode** (no backend yet): a researcher authors a study and **exports it as a config file**. There are no live session counts.
- **Cloud mode** (later): studies are hosted, results come back, and **session counts and data-quality flags** appear.

The design should handle both gracefully — a local-mode project shows authoring + export; a cloud-mode project additionally shows live tracking.

## Design principles

- **One product.** Reuse the rating view's color tokens, typography, spacing, and components. The console is the same system in a denser, more utilitarian layout — not a different aesthetic.
- **Calm density.** Researchers scan lists and fill forms; make that efficient and legible without feeling like a heavy admin panel. Quiet chrome, clear hierarchy, generous but not wasteful spacing.
- **Authoring should feel safe.** Configuration is consequential (it defines the data collected). Make current settings obvious, support presets, and make it easy to preview exactly what a participant will experience before distributing.
- **Accessible, light + dark**, consistent with the rating view.

## Screens & areas to design

### 1. Project dashboard (home)
- A scannable list/grid of the researcher's projects. Each project shows: name, dimensionality (1D/2D), media/playlist summary, and status.
- **Cloud mode adds** per-project **session counts (open vs. completed)** and a **data-quality flag** summary (e.g., a small count of sessions flagged for low engagement). **Local mode** instead surfaces "export config" and last-edited.
- Primary actions: **New project**, open, duplicate, export config, distribute, archive/delete.
- Design a clear **empty state** (no projects yet) that invites creating the first study.

### 2. Project editor (the core authoring surface)
Organize as sections or tabs:
- **Rating configuration** — dimensionality (1D/2D) and the full settings surface (labels, ranges, steps, palette incl. CVD-safe presets, axis labels + circumplex presets, magnitude, control behavior, transport lock, sampling rate). **Reuse the settings component from the rating-view brief** rather than reinventing it.
- **Playlist** — add media items (local file now; hosted URL later), **reorder** them, set per-item options, and configure **per-participant randomization / counterbalancing**.
- **Instructions / consent** — a simple editor for the text a participant sees first, with an optional "require acknowledgment" toggle.
- **Questionnaire blocks** *(later phase — design lightly)* — show where survey items could be **inserted before / between / after clips**, as placeholders/insertion points. Do not design a full survey builder; just the concept and entry points.
- **Preview** — a prominent way to **launch the participant experience** exactly as configured, so the researcher can check it before distributing.

### 3. Distribution & completion
- Generate and display **participant link(s)**.
- Configure the **completion code** and/or **redirect URL** (works for MTurk and Prolific).
- Show clear guidance on how a participant reaches the study and returns a completion code.

### 4. Session tracking *(cloud mode)*
- A per-project list of **sessions** with status (assigned / in progress / complete) and **data-quality flags** per session.
- An action to **export collected results** (the CSVs the R package consumes). No analysis or visualization — just collection and handoff.

### 5. Study portability
- Surface the **self-contained, versioned study config** as a first-class object: export/import a whole study (settings + playlist + instructions) as a single shareable file, for reproducibility.

## States to design
- Dashboard: **empty**, **local-mode project**, **cloud-mode project with live session counts + a flagged session**.
- Project editor: a representative filled-in state for both a **1D** and a **2D** study (to show the shared settings component flexing).
- Distribution view with a generated link + completion redirect configured.
- Session-tracking view with a mix of statuses and at least one quality flag.
- Light and dark.

## Deliverables
- The **dashboard**, **project editor** (all sections; questionnaire as light placeholders), **distribution & completion** view, and **session-tracking** view.
- The **empty and populated states** listed above, light and dark.
- Notes on any **new tokens/components** introduced for the denser console layout — kept consistent with the rating-view system.

## Out of scope
- The **participant rating view** — already designed; the console only *launches a preview* of it.
- Any **analysis, visualization, statistics, or reliability** UI — that is the R package, not this app.
- A full **survey/questionnaire builder** — later; design only insertion points here.
- Backend/auth screens beyond what's needed to convey local vs. cloud mode.

## Reuse note

This is the same design system as the rating view. Pull those tokens and components (`/design-sync` if you're driving from Claude Code), and let the console be the utilitarian, information-dense sibling of the calm rating screen — unmistakably the same product.
