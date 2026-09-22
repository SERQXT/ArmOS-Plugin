---
name: procode-app-decide
tier: t1
description: "Architecture Decision Matrix for Pro-Code Domo apps — choose vanilla vs React, select data access pattern (Domo SDK alias vs SQL vs AppDB vs Code Engine), and specify deployment shape. Produces a build spec consumed by procode-app-build. Trigger with 'should I use vanilla or React for this app', 'what architecture for my Domo custom app', 'help me design a Domo pro-code app', 'plan my custom app build'."
bucket: customer-delivery
status: draft
visibility: anyone
created_by: lane-L7-procode
created_at: 2026-06-07T00:00:00Z
---

# Pro-Code App — Architecture Decision

Evaluates the app requirements against the Architecture Decision Matrix (sourced from 301 functional production apps) and produces a build spec for `procode-app-build` to execute. This is the judgment layer — it does NOT write code.

## When to use

- "Should I use vanilla or React for this Domo app?"
- "What architecture should I pick for my Pro-Code custom app?"
- "Help me design a new Domo custom app before building it"
- "Plan my Pro-Code app — datasets, collections, packages"
- "Which data access pattern makes sense for this app?"

## When NOT to use

Use `procode-app-build` when a build spec already exists and the architecture decision has been made — that skill executes the build deterministically. Use `procode-app-fix` when the app already exists and has a runtime bug rather than an architecture question. Do not use this skill for App Studio no-code page design; that is `app-studio-page-build` territory.

## What this skill does

Works through three decision axes in order:

1. **Architecture pattern** — which data/state surfaces the app needs (dataset-only, dataset + collections, collections-only, packages-only, full-stack). Maps to the production distribution from 301 apps.
2. **Vanilla vs React** — chosen by complexity, state management needs, build-step tolerance, and target audience.
3. **Deployment shape** — size, fullpage flag, and manifest skeleton.

Outputs a structured build spec the agent passes to `procode-app-build`.

## Design principles

- **Start simple.** Dataset-only is 43% of production apps; recommend it unless the user explicitly needs mutable state or server-side processing.
- **Default vanilla.** React is only recommended when component architecture, routing, or TypeScript-heavy state management is genuinely required.
- **Production-derived.** Every threshold and recommendation traces to the 301-app corpus, not intuition.
- **No code in this skill.** Architecture decision output is a spec, not scaffolded code. Code generation is `procode-app-build`'s job.
- **Spec completeness gate.** The build spec must name: (a) architecture pattern, (b) vanilla vs React, (c) deployment shape (size + fullpage), (d) dataset aliases if any. If any of these is unresolvable from the conversation, ask before emitting the spec.

## Architecture Decision Matrix

### Step 1 — Choose the architecture pattern

| Pattern | Production share | Use when |
|---------|----------------|----------|
| Dataset-only | 43% | Read-only data display, KPI cards, dashboards |
| Dataset + Collections | 36% | Display data AND need mutable user state (saved configs, preferences) |
| Collections-only | 9% | Pure form builders, settings panels — no dataset dependency |
| Packages-only | 9% | Serverless LLM/AI interfaces, Code Engine UIs |
| Dataset + Packages | 1% | ETL monitoring — server-side data processing on top of datasets |
| Full-stack (Dataset + Collections + Packages) | 1% | Most complex — reserve for "Live F1 Telemetry" class apps |

**Default recommendation**: dataset-only. Add collections only when mutable state is explicitly required. Add packages only when server-side processing is required.

### Step 2 — Vanilla vs React

| Criteria | Vanilla | React |
|----------|---------|-------|
| Complexity | Simple display, 1-2 interactions | Forms, multi-page, heavy interactivity |
| Build step | None | Vite + TypeScript |
| State management | Manual DOM | React state, hooks, context |
| Routing | Not practical | React Router |
| Best for | KPI widgets, chart cards, data displays | Intake forms, multi-tab, editors, dashboards with filters |

**Default recommendation**: vanilla. Switch to React only when component architecture, state management, or routing is genuinely needed.

### Step 3 — Deployment shape

| Size | Production share | Use case |
|------|----------------|----------|
| 1×1 | 37% | Card-sized widgets (the default) |
| 6×3 | 24% | Wide dashboard cards |
| 5×3 | 13% | Standard content cards |
| 5×4 | 10% | Tall content cards, builder apps |

67% of functional production apps use `"fullpage": true`. Default to fullpage unless the app is specifically an embedded card widget.

## Build spec output format

After working through the three decision axes, emit a build spec in this shape:

```
## Pro-Code Build Spec

**Architecture pattern:** [dataset-only | dataset + collections | collections-only | packages-only | full-stack]
**Framework:** [vanilla | react]
**Deployment shape:** size { width: N, height: N }, fullpage: [true | false]
**Dataset aliases:** [alias1 → dataSetId, alias2 → dataSetId, …] (or "none")
**Collections:** [name → id, …] (or "none")
**Packages:** [alias → packageId@version, …] (or "none")
**Rationale:** [one sentence per decision axis]
```

Pass this spec verbatim to `procode-app-build`.

## Inputs

- User description of what the app should do
- Known dataset IDs (optional — can be placeholders if not yet resolved)
- Instance name (for resolving dataset IDs if needed via `domo-datasets` MCP)

## Outputs

A build spec (see format above) that `procode-app-build` can execute deterministically.

## Failure modes and recovery

- **Ambiguous architecture**: if the user's description is compatible with two patterns (e.g., dataset-only vs dataset + collections), ask one clarifying question before emitting the spec — "Does the app need to save any user state or configuration between sessions?"
- **Missing dataset IDs**: emit the spec with placeholder UUIDs and note that `procode-app-build` will need real IDs before the manifest can be published.
- **App Studio confusion**: if the user uses "App Studio" and "Pro-Code" interchangeably but describes a no-code drag-and-drop page, stop and redirect to `app-studio-page-build`.
