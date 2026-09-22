# Changelog — `domo-discovery-brief`

All notable changes to the `domo-discovery-brief` skill are documented here.

This skill follows [Semantic Versioning](https://semver.org/):

- **MAJOR** — schema breaks. Existing Discovery Brief JSON must be migrated.
- **MINOR** — additive changes (new optional sections, new extraction rules).
- **PATCH** — copy edits, bug fixes, renderer improvements.

The Discovery Brief schema is **coupled** to the engagement content schema (used by `domo-interactive-proposal-builder`) where they share fields. Changes that affect handoff fields (e.g. renaming `pain_points`, `proposed_solution_shape`, or `stakeholders`) require coordinated updates to `domo-interactive-proposal-builder` and a coordinated version bump on **both** skills.

---

## [0.3.0] — 2026-05-03

### Changed

- **Schema vocabulary: `proposed_phase_shape` → `proposed_solution_shape`.** Renamed in lockstep with the proposal builder's 0.5.0 release so the brief and the proposal speak the same vocabulary at the handoff boundary. Domo speaks in *solutions* — discrete, customer-facing chunks of value the engagement delivers — not *phases*. Stable IDs (the `p1`, `p2`, … pattern) are preserved across the rename.
- **All visible "Phase X" copy rewritten in solution language.** Rendered markdown headings ("Solution 1: X" instead of "Phase 1: X"), rationale prose, key-deliverable lists, open-question phrasing, key-quote contexts, and the `external_guidance` field descriptions all read in solutions. SKILL.md tab/handoff descriptions, Rule 5 ("The proposed solution shape is a draft, not a commitment"), and the field-mapping table updated to match.
- **PHA example brief refreshed.** `examples/pha-2026-discovery.json` migrated to schema 0.3.0 (`proposed_phase_shape` → `proposed_solution_shape`, all narrative "Phase X" → "Solution X" inside `external_guidance`, `risks_and_dependencies`, `commercial_signals`, `stakeholder_dynamics`, `open_questions`, and `brief_author_notes`). `examples/pha-2026-discovery.md` re-rendered.

### Schema

- `meta.schema_version` is now `"0.3.0"` (const-validated).
- Migration from 0.2.x is mechanical: rename `proposed_phase_shape` → `proposed_solution_shape` at the top level, optionally rewrite "Phase X" prose to "Solution X" in narrative fields, and bump `meta.schema_version` to `"0.3.0"`. No field shapes change.

### Why MINOR

The proposal builder and discovery brief schemas are coupled at the handoff boundary, so this rename happens in lockstep with the proposal builder's 0.5.0 release. Treated as MINOR per the pre-1.0 versioning policy in SKILL.md — existing brief JSON requires the rename above before re-rendering, but no field shapes change.

---

## [0.2.0] — 2026-05-03

### Added (non-breaking)

- **New optional `external_guidance` section in the Discovery Brief schema and rendered markdown.** Captures pricing, delivery, and timeline context the brief author brings in from *outside* the source material — Salesforce, prior call notes, account-team tribal knowledge, internal pricing posture, executive-level reads. Strictly distinct from `commercial_signals` (which captures what stakeholders said *during* the discovery itself). Five subsections: `account_economics` (ACV, TCV, contract term, renewal window, license footprint, expansion potential), `pricing_guidance` (rate posture, discount authority, package preference, competitive pressure, target Total Investment, free-text notes), `delivery_guidance` (preferred model, team composition, phasing preference, customer capacity, free-text notes), `timeline_guidance` (target start, must-finish-by, blackout periods, sequencing constraints, free-text notes), and `anecdotal_context` (free-text catch-all for ancillary or political context). Entire section is optional — omit if the author has nothing to add beyond the source material.
- **Mandatory authoring prompt.** SKILL.md now instructs the skill to explicitly prompt the user for `external_guidance` content after extracting from source material but *before* finalizing the JSON. The prompt offers all five subsections; the user can answer partially, fully, or reply "skip" / "none" to omit the section. This ensures the brief author always gets the chance to inject Salesforce ACV, account-team tribal knowledge, and pricing posture rather than relying on the skill to silently miss it.
- **New extraction rule (Rule 7) — source signal vs. external guidance.** SKILL.md now explicitly documents the boundary between `commercial_signals` (source-derived, customer-facing high-trust) and `external_guidance` (author-derived, internal high-trust, never quoted verbatim to the customer). Conflating the two is the most common authoring mistake; the rule makes the boundary load-bearing.
- **PHA example brief updated.** `examples/pha-2026-discovery.json` now demonstrates a fully-populated `external_guidance` section: $340K ACV / $1.02M TCV / 3-year platform agreement with Q3 FY27 renewal, $275/hr rate posture with $160K–$180K target Total Investment and $200K ceiling, AI-accelerated solo SA delivery model with Marcus Brown retained on Phase 1, late-May start / late-November finish with mid-September member-conference blackout and AMS-replacement sequencing constraint, and anecdotal context on Maya/David alignment, Aaron Cole's contribution shape, Nadia Park's MSP follow-on positioning, and PHA's recent member-organization losses tied to reporting timeliness. Also re-rendered `examples/pha-2026-discovery.md` against the updated template.

### Schema

- **Schema version: 0.1.0 → 0.2.0.** Additive only — no existing fields renamed, removed, or restructured. Existing v0.1.0 briefs remain valid (the new section is optional). Forward-compatible: a v0.2.0-aware proposal builder will read `external_guidance` if present and ignore it if absent. Discovery Brief schema and `domo-interactive-proposal-builder` remain a versioned pair on overlapping handoff fields, but `external_guidance` is brief-internal and does not currently feed the proposal builder's content schema (a follow-on to the proposal builder may consume it as a sizing hint).

### Notes

- Skill version bumped to 0.2.0 (MINOR — meaningful new author-facing behavior, schema version increment, but no breaking changes).
- `last_revised` updated to 2026-05-03.

---

## [0.1.1] — 2026-05-01

### Changed (non-breaking)

- **`SKILL.md`** — Added a "Deliverable hints in the brief vs. the proposal" subsection in the Handoff section, clarifying that `key_deliverables` in the brief remain short hint strings; expansion into the four-field object form (`title` / `description` / `audience` / `outcome_value`) is the responsibility of `domo-interactive-proposal-builder` v0.2.0 onward. The brief reviewer's role is lightweight confirmation that discovery context contains enough signal for the proposal builder to draft credible audience and outcome content per deliverable — no new prompts or schema changes in the brief itself.
- **Cross-references to `domo-sow-docx-renderer` removed** — The Word SOW renderer plugin has been removed from this marketplace. SKILL.md, schema description, CHANGELOG, CONTRIBUTING, template footer, and example brief footer have all been updated to drop references to the docx companion. No functional behavior changes; field names and handoff shape unchanged.

### Schema

- Unchanged. Discovery Brief schema remains at v0.1.0.

---

## [0.1.0] — 2026-04-29

Initial release. Phase C of the Domo skills roadmap. Built as the upstream companion to `domo-interactive-proposal-builder` v0.1.0.

### Added

- **`SKILL.md`** — Persona (Domo Apex Expert in *discovery* mode), voice (sharp, no-fluff, surface uncertainty), and the six non-negotiable extraction rules: no invention (uncertainty becomes Open Questions), verbatim quotes for proposal-worthy statements, hidden value identification is mandatory, pain points must be specific with evidence, the proposed phase shape is a draft, JSON schema is a partial engagement content JSON for handoff. Mandatory trigger phrases included in the description block (discovery brief, scoping intake, RFP intake, summarize this transcript, build a discovery brief, extract a discovery brief, etc.).
- **`schema.json`** — JSON content schema (Draft 7). Designed as a structurally compatible subset of the engagement content schema for direct handoff. Sections: discovery context, client snapshot, stakeholder map (with decision authority and champion/skeptic flags), current state (tech stack, data flow, evidenced pain points, what's working), target outcomes, hidden value, proposed phase shape, out of scope (initial), risks and dependencies, commercial signals, stakeholder dynamics, key quotes, open questions, brief author notes.
- **`template.md`** — Jinja2 markdown template for the human-readable brief. Designed to render as a 1-to-2 page reviewable document with clear section structure.
- **`render.py`** — JSON → markdown renderer. Best-effort schema validation if `jsonschema` is installed. Whitespace handling deliberately differs from the proposal builder's `generate.py` because markdown is whitespace-sensitive (blank lines separate blocks).
- **`examples/pha-2026-discovery.json`** — Pacific Healthcare Association discovery captured as data, conforming to schema. Reverse-engineered from the existing PHA proposal; canonical reference example.
- **`examples/pha-2026-discovery.md`** — Rendered output of the PHA discovery JSON.
- **Versioning** — `version` and `last_revised` fields in SKILL.md frontmatter.

### Extraction rules locked in

- **No invention** — anything not in the source material becomes an Open Question. Empty Open Questions sections are treated as a hallucination smell-test.
- **Verbatim quotes** — 3 to 8 attributed quotes per discovery, captured verbatim with speaker/title/context.
- **Hidden value identification is mandatory** — every brief surfaces secondary use cases the client hasn't explicitly asked for.
- **Pain points need evidence** — specific description + source evidence + implied impact. No vague "manual processes are slow."
- **Proposed phase shape is a draft** — clearly marked as draft to be refined in the proposal builder.
- **Schema compatibility** — handoff fields (`client`, `stakeholders`, `pain_points`, `proposed_phase_shape`) match the engagement content schema field names and shapes.

### Coupling to `domo-interactive-proposal-builder`

The Discovery Brief JSON is designed to feed directly into `domo-interactive-proposal-builder` as starting context. The handoff is documented in both SKILL.md files. When the proposal builder is invoked with a brief in hand, it reads the brief and enriches it (adds full strategic context paragraphs, detailed phase descriptions with LOE breakdowns, ROI driver quantifications, the four-pillar narrative).

### Known limitations

- Markdown rendering produces some extra blank lines between sections; functional but slightly verbose. Will be tightened in 0.1.1.
- No automated `discovery_to_proposal.py` converter yet — the proposal builder performs the field mapping at draft time. A standalone converter is planned as a fast-follow for high-volume sales teams.
- No `validate.py` checker that flags briefs with smell-test failures (empty Open Questions, no verbatim quotes, missing Hidden Value section). Planned as a fast-follow.
