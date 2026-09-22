# Engagement context app — separate reusable template (org-wide)

**Repo path:** `core/skills/ps-build/skills/500apps-pipeline/template/engagement-context-app/` — **open `README.md` there first** for ProCode files (`index.html`, `manifest.json`, `domo.json`, …). This module documents **behavior, slots, and lifecycle**; the template folder is the **artifact-producing** shell agents deploy and parameterize.

This is **not** a screen inside the MVP1 ProCode build. It is a **separate Domo custom app** — implemented as **ProCode** (vanilla or React per your org template): **presentation-style** layout (large type, clear sections, **1–2 “slides” or cards**), not a dense operational dashboard. Same **`domo publish`** lifecycle as other ProCode apps; it **looks like a short deck** you’d show before the real MVP, not like the triage/analytics UI next door.

## What it is

| | |
|--|--|
| **Purpose** | Give **any** reviewer (client, new Domo consultant, expanded stakeholder group) **context without prior knowledge** — what problem, what we built, what’s next, what data, how to use it — **before** they open the functional MVP. |
| **Relationship to MVP1** | **Always a sibling**, never embedded: see **Layout options** below. |
| **Lifecycle** | Same template shell at **discovery (H)**, **each subsequent MVP / release**, and **final delivery (N)** — **different content** per stage (what changed, features, value, data sources, user guide). |
| **Delivery docs** | **Stage N**: embed or link **user guide with screenshots** here — same template section; audience may never read a separate PDF first. |

## Layout options (pick one per deployment; template supports both)

1. **Stacked on one page** — Engagement context app is the **top** section (full width); user **scrolls down** to the **actual MVP1** (second embed or anchor). Same browser page URL if org uses a wrapper page, or two embeds in one parent.  
2. **App Studio — two tabs** — **Tab 1:** engagement context app. **Tab 2:** MVP1 (and later MVPs). Same pattern for **next release**: refresh Tab 1 content from template; Tab 2 is the new build.

The **MVP1 app repo** does **not** contain the context UI — only the functional demo.

## Pre-built template (do not rebuild per engagement)

- **Canonical monorepo copy:** [`template/engagement-context-app/README.md`](../template/engagement-context-app/README.md) — sync or mirror **`500apps-engagement-context-template`** from **domo-ps-repo** into that path so **gateway-fetched** agents always find it.  
- Maintain **one** implementation in **domo-ps-repo**, e.g. `500apps-engagement-context-template` — **versioned**, reviewed once; **pipeline G1** = **parameterize** (JSON/markdown slots or build-time env) + **client brand** (CSS variables, logo URL) + **link/embed URL** to the sibling MVP app.  
- **No** agent-generated greenfield HTML for the shell each time.

## Content modes (same template, different sections visible per stage)

| Stage | What the template emphasizes |
|-------|------------------------------|
| **Discovery (pre–customer call)** | What we heard (survey), assumptions, what MVP1 shows / doesn’t, **discovery focus** (probe themes). |
| **Next MVP / release** | **What changed** vs prior, **key features**, problem solved, **value add**, **data sources** driven. |
| **Delivery (N)** | Same + **user guide** (screenshots, flows, roles) — **delivery doc** lives here as the primary “how to use” surface for a **bigger or rotated audience**. |

Write for **zero assumed context** — no “as we discussed last time” unless you add a one-line recap slot.

## Template slots (fill per stage; not all slots every time)

| Slot | Typical stage | Notes |
|------|----------------|--------|
| Account / program title | All | Client branding |
| Audience note | All | “Who this page is for” in plain language |
| Problem & outcome | Discovery, releases | From `NORTHSTAR.md` |
| What we heard (survey) | Discovery | Verbatim + synthesis |
| What changed since last release | MVP2+ | Diff from prior version |
| What this build demonstrates | All | Scoped honestly |
| In scope / out of scope | All | Built vs mock-teaser |
| Key features | Releases, delivery | Bullets |
| Value / ROI framing | Releases, delivery | No jargon |
| Data sources | All | Datasets, grain, freshness caveats |
| Discovery themes to cover | Discovery only | Probe map |
| **User guide** (screens, steps) | **Delivery (N)** | Screenshots; link to `delivery/` if long-form exists |
| Link to sibling MVP app | All | Open Tab 2 or scroll target |

## Mapping `DISCOVERY-HANDOFF.md` → 1–2 “slide” context app

Rich handoffs (example structure: program title, **What We Built**, **Expansion**, **Out of Scope**, **Risks & Questions**, **Call Prep**, **Artifact References**) should be **distilled** into the template — **not pasted in full**. The context app is a **skim layer**; the markdown handoff remains the **source of truth**.

| Handoff section (typical `#` heading) | Context app placement | Rule |
|--------------------------------------|------------------------|------|
| Title + pipeline meta (account, program, **date**, **status**, **instance**, **`Live URL`**) | **Header / hero** | One title line + status badge + **primary button** → open MVP (Tab 2 or scroll target). |
| **What We Built** | **Slide 1** (or first card) | **Max 4–5 bullets** — outcome-oriented; merge related lines if the handoff has 6–8. Link **North Star** phrasing in parentheses only if space. |
| Stack / dataset one-liners (if present) | **Subfooter** or second small row | Optional; keep to **one line** (e.g. React + dataset name). |
| **Expansion Opportunities** | **Optional strip** or “Phase 2” link | **Top 2–3** opportunities only — or single line: *“See full handoff for roadmap table.”* |
| **Explicitly Out of Scope** | **Slide 2** (top) | **3–5 bullets max** — same honesty as handoff; prevents scope creep on the call. |
| **Risks & Questions for Humans** | **Slide 2** (middle) | Extract **3 targeted questions** (align with **Call Prep** — don’t duplicate all 15 rows). |
| **Call Prep — agenda** | **Slide 2** (bottom) or compact list | **Suggested agenda** as 3–4 time blocks OR one sentence: *“45 min: walkthrough → workflow → data → success metric.”* |
| **Stakeholder map** | Omit or **one line** | *“Validate roles on call”* unless space. |
| **Patterns that help the consultant** | **Internal** — keep in `DISCOVERY-EMAIL.md` or handoff only; **not** customer-facing on context app unless neutral. |
| **Artifact References** | **Footer links** | Short list: *North Star*, *Build Spec*, *UX Report* — or single **“Full handoff (markdown)”** link if your stack serves it. |

**Workflow:** Finish **`DISCOVERY-HANDOFF.md`** first → derive **`ENGAGEMENT-CONTEXT-COPY.md`** by **extracting and compressing** per table above → inject into template. If the handoff is updated after the call, **refresh** the context app copy in the same pass.

## Artifacts (copy for the template)

- **`500apps/{account}/artifacts/ENGAGEMENT-CONTEXT-COPY.md`** — master slot text; use **section headers** per stage (`## Discovery`, `## Release v2`, `## Delivery`) or separate files if the org prefers. **Derive from** `DISCOVERY-HANDOFF.md` using the mapping table above — do not duplicate the full handoff in the app.  
- **`DISCOVERY-EMAIL.md`** (internal) still points consultants to this app + MVP link.

Legacy name **`DISCOVERY-BRIEF-COPY.md`** = discovery-only excerpt; prefer **`ENGAGEMENT-CONTEXT-COPY.md`** with a `## Discovery` section going forward.

## Relationship to other modules

- Narrative rules: **`discovery-call-prep.md`**.  
- This file: **mechanics** — separate app, tabs vs scroll, reuse, delivery user guide.

## G1 / G2 / N

- **G1:** Deploy **template instance** + **MVP1 app** as two artifacts; wire layout (tabs or page).  
- **G2:** UX pass **both** apps; context app is **first impression**.  
- **N:** Populate **delivery + user guide** slots in the **same** template (new section or new deploy of template with delivery mode).
