# Contributing to the Domo Interactive Proposal Builder Skill

Short guide for Domo team members adding patterns, fixing bugs, or extending the skill.

---

## Quick orientation

This skill produces interactive Domo client proposal HTML documents from a JSON content payload. The output is positioned as a **proposal for review**, not a Statement of Work for signature — even though it contains the same scoping, phase, LOE, and ROI detail. A polished offline / RFP-grade PDF is rendered by the companion skill `domo-proposal-pdf-renderer` from the same JSON.

The architecture is deliberately decoupled:

- **`SKILL.md`** is the authoring playbook — persona, voice, non-negotiable rules. Read it before changing anything else.
- **`schema.json`** is the contract — what a valid engagement content payload looks like. Schema changes are MAJOR version bumps if they break existing payloads.
- **`template.html`** is the renderer — Jinja2-parameterized HTML using Pacific Drift CSS variables. CSS, JS, and the Domo Momentum SVG are intentionally static.
- **`generate.py`** computes derived values (85% rule, totals, payback, ROI multiple, timeline geometry) before handing context to Jinja2. Keep this script the single source of computation.
- **`examples/pha-2026.json`** is the canonical reference. Use it as your style guide when authoring or proposing changes.

---

## Common contributions

### Fixing a typo or small copy edit in the persona / authoring rules

Edit `SKILL.md`, bump the patch version (`0.1.0` → `0.1.1`), add a one-line entry to `CHANGELOG.md`. No schema or renderer changes needed.

### Adding a new optional section to the proposal

1. Add the new field to `schema.json` as **optional** (do not add to `required`).
2. Add a `{% if section.field %}…{% endif %}` block to `template.html`.
3. If the section needs computed values, extend `enrich_context()` in `generate.py`.
4. Update `examples/pha-2026.json` to demonstrate the new section (optional but encouraged).
5. Bump the **MINOR** version (`0.1.x` → `0.2.0`).
6. Document in `CHANGELOG.md` under the new version.

### Changing a non-negotiable authoring rule

Authoring rules are the team's collective standard. Discuss in advance — do not change unilaterally. Update `SKILL.md`, bump MINOR, document the change in `CHANGELOG.md` and notify the team. Consultants with in-flight proposals need to know what changed.

### Adding a new design pattern

The Pacific Drift palette is fixed. Do not introduce new color tokens, fonts, or spacing values. If you need a new design pattern (e.g. a new visualization type, a new badge state), discuss with the design owner first. Once approved, extend `template.html` and update the design rules in `SKILL.md`.

### Schema changes that break existing payloads

This is a **MAJOR** version bump (`0.x.y` → `1.0.0`). Required because:

- Any in-flight client engagement content JSON must be migrated.
- The companion `domo-proposal-pdf-renderer` skill, which consumes the same schema, may also need coordinated updates.

Process:
1. Open a discussion before implementing — schema breaks are expensive.
2. Update `schema.json`, `template.html`, `generate.py`, and `examples/pha-2026.json` together.
3. Coordinate with `domo-proposal-pdf-renderer` if shared fields changed.
4. Provide a migration note in `CHANGELOG.md` showing what changed and how to update existing JSON files.
5. Bump MAJOR version and `last_revised` date in `SKILL.md`.

---

## Testing your changes

Before committing:

```bash
cd domo-interactive-proposal-builder
python3 generate.py examples/pha-2026.json examples/pha-2026.html
```

The render must succeed without errors. Open `examples/pha-2026.html` in a browser and verify:

- All 8 tabs render and switch correctly
- ROI rate input recalculates costs, payback, ROI multiple
- Phase cards expand/collapse
- Timeline bars are positioned and labeled correctly
- Math is internally consistent (totals, ROI, payback)

---

## Versioning checklist

Before merging any change:

- [ ] Version bumped appropriately (PATCH / MINOR / MAJOR)
- [ ] `last_revised` date updated in `SKILL.md` frontmatter
- [ ] `CHANGELOG.md` entry added under the new version
- [ ] Existing `examples/pha-2026.json` still renders cleanly
- [ ] Authoring rules in `SKILL.md` still match what the renderer enforces
- [ ] If schema changed: coordinated bump in `domo-proposal-pdf-renderer` if shared fields affected

---

## What lives in this skill vs. somewhere else

**In this skill:**

- The interactive proposal HTML format
- The JSON schema for the engagement content payload (also consumed by `domo-proposal-pdf-renderer`)
- The persona and authoring rules for proposal generation
- Pacific Drift design system tokens (CSS variables in `template.html`)

**Not in this skill (separate skills):**

- `domo-discovery-brief` — Structured intake skill that produces partial engagement content JSON
- `domo-proposal-pdf-renderer` — Polished offline / RFP-grade PDF rendering of the same JSON payload
- `domo-msp-proposal` (planned) — Managed Services proposals (different LOE shape, different audience)

If you find yourself wanting to add Managed Services language or discovery-intake forms to this skill, propose a separate skill instead.

---

## Questions

Reach the skill maintainer (current: Mark Lees) before significant changes. Small edits — typos, copy refinements, single-row schema additions — can ship without prior discussion as long as the versioning checklist is followed.
