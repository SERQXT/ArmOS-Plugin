---
name: domo-proposal
tier: 1
maturity: alpha
owner: Mark Lees
description: "Build interactive Domo client proposals — from raw discovery material through polished PDF. This is the client-facing proposal workflow (NOT the internal scoping pipeline). Produces interactive HTML proposals with LOE, ROI, credit impact forecasting, and Pacific Drift design system. Trigger with 'build an interactive proposal for [account]', 'interactive proposal for [account]', 'client proposal for [account]', 'discovery brief from this transcript', 'render the proposal PDF', or 'polished PDF for [account]'. Do NOT use for internal scoping pipeline work (SOW generation, scope building, LOE estimation) — use the ps-discover scoping skills for that."
pipeline:
  phase: commercial
  sub_phase: proposal
  position: 9
  output_type: orchestrator
  wave: 2
  state: ready
---

# Domo Proposal — Interactive Client Proposal Workflow

Orchestrates the complete interactive proposal workflow: raw discovery material → structured discovery brief → interactive HTML proposal → polished PDF. This produces **client-facing sales and review artifacts** — not internal scoping documents or SOWs.

## When to Use This Skill (vs. the Internal Scoping Pipeline)

| Use this skill when... | Use the scoping pipeline (master-scoping) when... |
|---|---|
| Building a client-facing interactive proposal | Running the full internal scoping process |
| Producing a discovery brief for stakeholder review | Producing a Discovery Record for scope building |
| Generating LOE with AI-accelerated estimates (40-50% leaner) | Running Domo estimation methodology formulas |
| Creating polished PDFs for RFP/procurement | Generating a SOW from the Domo template |
| Forecasting credit impact alongside ROI | Validating SOW against CPQ |

The two workflows are **complementary**, not competing. The scoping pipeline produces internal artifacts (Discovery Record → Scope Model → LOE Estimate → SOW). This skill produces client-facing deliverables (Discovery Brief → Interactive Proposal → Polished PDF). They can run in parallel on the same engagement.

## Sub-Skills (loaded on demand)

This workflow uses four sub-skills. Read the appropriate SKILL.md when invoked:

| Sub-Skill | Path | Purpose |
|-----------|------|---------|
| **domo-discovery-brief** | `core/skills/ps-proposal/skills/domo-discovery-brief/SKILL.md` | Convert raw discovery material into a structured JSON brief + markdown for stakeholder review before proposal drafting |
| **domo-interactive-proposal-builder** | `core/skills/ps-proposal/skills/domo-interactive-proposal-builder/SKILL.md` | Build interactive HTML proposals (Pacific Drift design, LOE, ROI, Credit Impact, Domo Momentum methodology) |
| **domo-proposal-pdf-renderer** | `core/skills/ps-proposal/skills/domo-proposal-pdf-renderer/SKILL.md` | Render the same JSON as a polished, signature-quality PDF via headless Chromium |
| **domo-proposal-feedback** | `core/skills/ps-proposal/skills/domo-proposal-feedback/SKILL.md` | Cloudflare Worker for client feedback on published proposals |

## Workflow

```
Raw Discovery Material (transcript, notes, RFP)
                    │
                    ▼
     ┌──────────────────────────────┐
     │  domo-discovery-brief        │──► discovery.json + discovery.md
     │  Structured intake;          │    (human review checkpoint)
     │  surfaces Open Questions     │
     └──────────────────────────────┘
                    │ approved
                    ▼
     ┌──────────────────────────────────────────────────┐
     │           proposal_content.json                  │
     │   (single source of truth — engagement payload)  │
     └───────┬──────────────────────────────┬───────────┘
             │                              │
             ▼                              ▼
     ┌────────────────────┐    ┌──────────────────────┐
     │ domo-interactive-  │    │ domo-proposal-pdf-   │
     │ proposal-builder   │    │ renderer             │
     │ Interactive HTML    │    │ Polished offline PDF │
     └────────────────────┘    └──────────────────────┘
             │                              │
             ▼                              ▼
      proposal.html                  proposal.pdf
      (stakeholder review)           (RFP/procurement)
```

Both renderers consume the **same JSON**. Numbers never disagree — totals, ROI math, hour ranges all come from the same data.

## Triggers

**Discovery brief:**
- "build a discovery brief from this transcript"
- "summarize this scoping conversation as a brief"
- "capture the discovery as a brief"
- "discovery brief for [account]"

**Interactive proposal:**
- "build an interactive proposal for [account]"
- "interactive proposal for [account]"
- "interactive client proposal for [account]"
- "generate a Domo proposal for [account]"
- "scope this engagement as a proposal"

**Polished PDF:**
- "render the polished PDF for this proposal"
- "generate the RFP-ready PDF"
- "export the proposal to PDF"
- "polished PDF for [account]"

**Feedback setup:**
- "enable feedback on this proposal"
- "set up proposal feedback"

## Routing

When triggered, read the appropriate sub-skill's SKILL.md immediately:

1. **Discovery brief requests** → Read `domo-discovery-brief/SKILL.md`
2. **Interactive proposal requests** → Read `domo-interactive-proposal-builder/SKILL.md`
3. **PDF rendering requests** → Read `domo-proposal-pdf-renderer/SKILL.md`
4. **Feedback setup requests** → Read `domo-proposal-feedback/SKILL.md`
5. **Full workflow requests** ("build a proposal from scratch") → Start with discovery-brief, then proposal-builder

## Key Design Principles

- **AI-accelerated LOE**: 40-50% leaner than traditional consulting estimates. AI-assisted delivery is built into every hour estimate.
- **Single JSON source of truth**: `proposal_content.json` drives both HTML and PDF renderers.
- **Pacific Drift design system**: Fixed visual identity — colors, fonts, spacing, badges.
- **Credit Impact forecasting**: Every proposal includes a credit consumption forecast (Y1/Y3/Y5 ranges by solution and category).
- **Domo Momentum methodology**: 9-stage framework rendered in every proposal's Implementation Strategy panel.

## Relationship to Internal Scoping Pipeline

If both workflows are running for the same engagement:

- The **discovery-synthesizer** (scoping pipeline Step 2) produces the internal Discovery Record
- The **domo-discovery-brief** (this workflow) produces the client-reviewable brief
- Both can consume the same Gong transcripts and meeting notes
- The scoping pipeline's **loe-estimator** and this workflow's embedded LOE may produce different numbers (different estimation philosophies) — that's expected and intentional
- The scoping pipeline produces the **SOW** (contract); this workflow produces the **interactive proposal** (sales artifact)
