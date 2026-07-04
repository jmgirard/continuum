# Design Brief — Participant Rating View

*Paste this into Claude Design. It is self-contained; attach the spec for extra context if you like.*

---

## What we're designing

The participant-facing **rating screen** of a web app for continuous perceptual/experiential rating. A participant watches a media file (usually video, sometimes audio) and, in real time, reports a feeling or judgment by moving a control. The control's position is sampled continuously and saved. This is the modern successor to two research tools, CARMA (one dimension) and DARMA (two dimensions); the app unifies them, so the same screen has **two modes** set by study configuration:

- **1D mode** — a single vertical slider on a colored scale (e.g., "very negative" at the bottom to "very positive" at the top).
- **2D mode** — a square "circumplex" space with two crossed axes and a movable point (e.g., horizontal = communion/coldness–warmth, vertical = agency/submission–dominance).

Users are researchers and their participants (trained observers in a lab, or crowdworkers at home). It must feel calm, focused, and trustworthy — a well-made scientific instrument, not a consumer app.

## Design principles

- **Minimal and quiet.** While rating, only the media and the control matter; everything else recedes. This minimalism was a signature strength of the originals — preserve it.
- **Media- and rating-forward.** Large media panel; an unambiguous, always-visible rating control beside it.
- **Customizable without clutter.** Researchers reconfigure labels, colors, ranges, and axis names per study. The layout must stay clean across all of these — including a fully custom 3-color gradient and arbitrary text labels.
- **Research-grade neutrality.** Restrained, accessible color and type. The one place vivid color lives is the *rating scale itself*; surrounding UI stays neutral so it never competes with the scale's meaning.
- **Accessible by default.** Strong contrast, legible at a glance while attention is on the video, keyboard-operable — and **colorblind-safe default palettes** (perceptually-uniform / CVD-safe), since the classic red–yellow–green scale fails the most common color-vision deficiency. The custom 3-color option remains, but defaults are safe.

## Screen anatomy — 1D mode

- **Media panel** — dominant, left/center. Clean, letterboxed, no distracting overlays during playback.
- **Rating column** — right side: a tall **vertical slider** running the height of the media on a **gradient scale**, with upper/lower **text labels** and **numeric ticks** for the configured range and number of steps. Current value readable but not shouty.
- **Live indicator** — the handle moves with mouse drag, keyboard arrows, or joystick, with **damped, instrument-grade motion** (smoothed, precise, never twitchy); an optional faint **trail** is welcome.
- **Transport bar** — beneath the media: elapsed time, media title, total/remaining, play/pause. Spacebar toggles pause (show subtly). Design a variant where **transport is locked** (scrubbing/seek disabled) for data integrity.
- **Playlist progress** — unobtrusive ("Clip 2 of 5").

## Screen anatomy — 2D mode

- **Media panel** — same treatment as 1D.
- **Circumplex panel** — right side, a **square** space with two crossed axes through the center: a faint **radial grid**, a **center crosshair**, and **light quadrant tints** to make the space legible without noise. **Axis labels** at the ends and optional **region/quadrant labels** (e.g., "Friendly," "Dominant," "Introverted"). A clear **movable point** shows the current position, tracking joystick (primary), mouse, or keyboard — same damped motion as 1D.
- Visualize at least one **preset** populated: **affective** (valence × arousal) or **interpersonal** (agency × communion).
- Same transport bar and playlist progress as 1D.

## States to design

1. **Instructions / consent** — configurable text, optional required acknowledgment.
2. **Ready** — media loaded, not started ("Begin Rating").
3. **Rating (playing)** — the core state, both modes, in **focus mode**: chrome fades during playback and returns on hover/pause.
4. **Paused.**
5. **Resume** — a returning participant is offered to continue an autosaved, partially-completed session.
6. **Between items** — brief transition when advancing the playlist.
7. **Complete** — clear end state with a **completion code** and/or a "return to study" action.

Provide a **light theme** (required) and a **dark theme** (required — better for watching video).

## Customization / settings surface

Design a compact **settings view** (used by researchers when authoring, not participants mid-task) exposing: upper/lower labels; numeric min/max; number of steps; **palette** (CVD-safe presets + custom 3-color gradient); orientation (1D); axis + region labels and circumplex **presets** (2D); **control behavior** (spring-to-center vs. stay-put; joystick gain/dead-zone); transport-lock toggle; and instruction text. Render **two contrasting configurations** on the rating screen (e.g., a CVD-safe 9-step 1D scale, and a 2D interpersonal circumplex) to prove the system flexes.

## Interaction affordances (visual only)

Convey that the control responds to **mouse drag, keyboard arrows, and a joystick**, that **spacebar** pauses, and that **spring-to-center vs. stay-put** behavior exists. No real input needed — just legible affordances.

## Deliverables

- The **rating view in both modes** (1D slider, 2D circumplex), core "rating" state, in focus mode.
- The **key states** above (instructions, ready, paused, resume, between-items, complete), light and dark.
- The **settings view**, plus two contrasting configurations rendered on the rating screen.
- A compact **design-system sheet**: color tokens (including how neutral UI coexists with a customizable gradient, and the CVD-safe defaults), typography scale, spacing, and subtle motion guidance for the damped indicator.

## Out of scope for this brief

- The **researcher project console** (project list, playlists, session/quality tracking) — a separate brief, but it should reuse this visual system.
- **Analysis/visualization/reliability** UI — lives in a downstream R package, not this app.
- Full **questionnaire-block** screens — a later, separate concern; just note that any instruction/survey screens should inherit these tokens and type.

## Lineage note (for context, don't copy)

The originals placed a vertical, color-graded slider to the right of the video (1D), or a square circumplex with quadrant labels and a single moving dot (2D). Keep that fundamental clarity while modernizing the visual language — refined type, spacing, color, a coherent token system, and accessible defaults — without adding visual noise.
