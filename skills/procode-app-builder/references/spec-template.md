# App Specification Template

Before choosing architecture or template, define what you're building. Present a specification to the user for approval — this is the "plan mode" checkpoint that prevents building the wrong thing.

## Template

```markdown
# App Specification: {App Name}

## Persona
- Target user: {from persona identification}
- Device: {desktop/mobile/both}
- Usage pattern: {daily/weekly/occasional}

## Purpose
{One sentence: what does this app do and why does it exist?}

## Data Requirements
- Datasets needed: {list with names/IDs if known}
- Mutable state needed: {yes/no — user prefs, form data, config}
- Server-side processing: {yes/no — AI calls, heavy computation}

## Features / Deliverables
1. {Feature 1 — e.g., "KPI summary bar with 4 metrics"}
2. {Feature 2 — e.g., "Filterable data table with search"}
3. {Feature 3 — e.g., "Trend chart with date range selector"}

## Interactions
- {Key interaction 1 — e.g., "Click a row to see detail panel"}
- {Key interaction 2 — e.g., "Date picker filters all charts"}

## Acceptance Criteria
- [ ] {Criterion 1 — e.g., "App loads with data in under 3 seconds"}
- [ ] {Criterion 2 — e.g., "All 4 KPI metrics display correct values"}
- [ ] {Criterion 3 — e.g., "Table filters work across all columns"}

## Out of Scope
- {What this app does NOT do — prevents scope creep}
```

## Process

1. Generate the spec from the user's request and persona
2. **Present the spec to the user** and wait for approval before proceeding
3. If the user modifies the spec, update it and re-confirm
4. Save the approved spec as `SPEC.md` in the project root
5. Reference it during implementation to stay on track

> **GUARDRAIL:** Do NOT proceed to architecture/implementation without an approved spec. Building without a spec leads to rework, scope creep, and apps that don't match expectations.
