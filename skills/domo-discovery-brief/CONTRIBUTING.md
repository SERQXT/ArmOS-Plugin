# Contributing to the Domo Discovery Brief Skill

Short guide for Domo team members extending or fixing the `domo-discovery-brief` skill.

---

## Quick orientation

This skill produces structured Discovery Briefs from raw discovery material — call transcripts, meeting notes, RFP responses. Architecture is similar to `domo-interactive-proposal-builder` but simpler: no math, just structured extraction + markdown rendering.

- **`SKILL.md`** is the brain. Read it before changing anything else.
- **`schema.json`** is the contract — and is **coupled** to `domo-interactive-proposal-builder`'s schema where they share fields.
- **`template.md`** is the markdown template that produces the human-readable brief.
- **`render.py`** turns JSON into markdown. Less complex than the proposal-builder renderer.
- **`examples/pha-2026-discovery.json`** is the canonical reference for what a good brief looks like.

---

## The schema coupling rule

The Discovery Brief schema is a **structurally compatible subset** of the engagement content schema (used by `domo-interactive-proposal-builder`). Where field names overlap (`client.name`, `client.short_name`, `stakeholders[]`, `current_state.pain_points[]`, `proposed_phase_shape[]`), the shapes match exactly so the proposal builder can consume the brief JSON as starting context.

**This means:**

- Renaming a shared field in the Discovery Brief breaks the handoff to the proposal builder.
- Adding a new shared field requires coordinated updates in both schemas.
- Fields that are *only* in the Discovery Brief (e.g. `open_questions`, `key_quotes`, `commercial_signals`) can be changed without touching the proposal builder.

Before any schema change, ask: "Does this field appear in the engagement content schema?" If yes, coordinate the change.

---

## Common contributions

### Fixing a typo or copy edit in extraction rules / persona

Edit `SKILL.md`, bump patch version (`0.1.0` → `0.1.1`), add a one-line entry to `CHANGELOG.md`. No schema or renderer changes.

### Adding a new optional section to the brief

1. Add the new field to `schema.json` as **optional** (do not add to `required`).
2. Check whether the field belongs in `domo-interactive-proposal-builder`'s schema too. If yes, coordinate with the proposal builder's maintainer.
3. Add a `{% if section.field %}…{% endif %}` block to `template.md`.
4. Update `examples/pha-2026-discovery.json` to demonstrate the new section.
5. Bump MINOR version (`0.1.x` → `0.2.0`).
6. Document in `CHANGELOG.md`.

### Tightening an extraction rule (e.g. requiring more verbatim quotes)

Edit `SKILL.md` to update the rule. Update `CHANGELOG.md` with the new rule and rationale. Notify the team — extraction rules change consultant behavior, not just code. Bump MINOR version.

### Adding a new trigger phrase

Add to the `MANDATORY TRIGGERS` line in `SKILL.md`'s description block. PATCH bump if just a copy refinement; MINOR if it expands the skill's invocation surface (e.g. now triggers on a new artifact type).

### Schema changes that break existing briefs

This is a **MAJOR** version bump on **both** skills if the change affects shared handoff fields. Process:

1. Discuss before implementing.
2. Update `schema.json` here AND in `domo-interactive-proposal-builder/`.
3. Update `template.md`, `render.py`, and `examples/` here.
4. Update the proposal builder's renderer and example JSON to consume the new schema.
5. Provide a migration note in both `CHANGELOG.md` files.
6. Bump MAJOR on both skills (`v1.0.0`).

For breaks that affect ONLY discovery-specific fields (Open Questions, Key Quotes, Commercial Signals), bump MAJOR on this skill only. The proposal builder is unaffected.

---

## Testing your changes

```bash
cd domo-discovery-brief
python3 render.py examples/pha-2026-discovery.json examples/pha-2026-discovery.md
```

Open the rendered markdown and verify:

- Section structure is preserved
- All sections render with no missing data
- Markdown is readable when viewed in GitHub or any standard markdown renderer
- Open Questions section is present and non-empty for the PHA example

If you've changed schema fields, also test with the proposal builder:

```bash
# Manually feed the brief into the proposal builder (today this is done by Claude during authoring)
# After v0.2.0, a discovery_to_proposal.py helper will automate this
```

Verify the proposal builder produces a coherent interactive proposal from the updated brief.

---

## Versioning checklist

- [ ] Version bumped appropriately (PATCH / MINOR / MAJOR)
- [ ] `last_revised` date updated in `SKILL.md`
- [ ] `CHANGELOG.md` entry added
- [ ] Existing `examples/pha-2026-discovery.json` still renders cleanly
- [ ] If schema changed: handoff to `domo-interactive-proposal-builder` still works
- [ ] If MAJOR: coordinated bump in `domo-interactive-proposal-builder` if shared fields changed

---

## What lives in this skill vs. somewhere else

**In this skill:**

- Discovery Brief authoring rules and persona
- The Discovery Brief JSON schema (subset compatible with the engagement content schema)
- Markdown rendering for human review

**Not in this skill:**

- Client-facing interactive proposal HTML (use `domo-interactive-proposal-builder`)
- Polished offline / RFP-grade PDF (use `domo-proposal-pdf-renderer`)
- Managed Services intake (planned: `domo-msp-discovery`)
- General meeting summarization unrelated to a Domo opportunity

If you find yourself wanting to add proposal prose generation or LOE math here, propose adding it to the proposal builder instead.

---

## Questions

Reach the skill maintainer (current: Mark Lees) before significant changes. Small edits — typos, copy refinements, single-row schema additions — can ship without prior discussion as long as the versioning checklist is followed. Schema changes that touch shared handoff fields **always** require discussion.
