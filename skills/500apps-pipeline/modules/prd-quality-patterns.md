# PRD quality patterns (build targets + handoff reporting)

Patterns proven across the highest-quality 500 Apps builds. These are **build targets** — the agent designs to them (stages C, F) and builds to them (G1, G2, J1, J2). Internal handoffs (H, K) report on how well the build hit the targets. The delivery doc (N) is a **customer-facing user guide** that uses only the summary.html template and user guide format — no internal build-target language.

**When to load:** Stages **C** (north star), **F** (build spec), **G1/J1** (build verification), **G2/J2** (UX scoring), **H/K** (handoff reporting), **N** (summary.html template only).

---

## 1. Hero metric framing (used in NORTHSTAR.md)

NORTHSTAR.md must include a structured hero metric section. Template:

```
### HERO — `{Metric Name}`

> {One sentence: what this metric is and why it matters, in the customer's voice if possible}

Today: {current state, with verbatim quote if available}
Target: {measurable target state}

### Supporting metrics

| # | Metric | Today | Target | Why it matters |
|---|--------|-------|--------|----------------|
| H1 | **{Hero}** | {today} | {target} | Hero |
| H2 | {metric 2} | {today} | {target} | {reason} |
| H3 | {metric 3} | {today} | {target} | {reason} |
| H4 | {metric 4} | {today} | {target} | {reason} |
```

The hero CTA on every screen ladders back to one of these metrics. If a button does not move one of them, it should not be in the initial viewport.

---

## 2. Per-surface 5-to-9/10 lift table (used in BUILD-SPEC.md)

For each planned surface, define what "generic" looks like vs what "this build" delivers. This is the **build target** for G1/J1 and the **scoring baseline** for G2/J2.

Template for BUILD-SPEC.md:

```
## Surface lift targets

| Surface | What "5/10" looks like | What "9/10" looks like | Mechanism |
|---------|------------------------|------------------------|-----------|
| Hero / S0 | Tile grid with KPIs | One number + one button | Brutal scope cuts; every CTA ladders to hero metric |
| {Surface 1} | {generic version} | {optimized version} | {what delivers the lift} |
| {Surface 2} | {generic version} | {optimized version} | {what delivers the lift} |
```

**Rules:**
- The "5/10" column describes what an AI would build without this guidance — a generic dashboard or form
- The "9/10" column describes a workflow optimizer that makes the user massively better at their job
- The "Mechanism" column names the specific technique (AI extraction, one-click bulk action, ghost-value benchmarking, visible pipeline progress, etc.)
- During G2/J2, the UX pass scores each surface against this table and identifies what needs to change to close the gap

---

## 3. Timed happy-path (build target + verification gate)

Define the primary workflow as a timed sequence in BUILD-SPEC.md. Verify at G1/J1. Report in H/K.

Template:

```
## Happy path — the {N}-minute story

| t | Surface | Action |
|---|---------|--------|
| 0:00 | {S0} | {User sees X — clicks} |
| 0:05 | {S1} | {Action} |
| {time} | {surface} | {action} |
| {end} | {S0} | {Outcome visible. Done.} |

Today this is a {X}-hour task. The aim is {Y} minutes.
```

**Build verification (G1/J1):** Walk the deployed app through this path. Count actual clicks. Document where the path works and where friction remains. If the happy path is not achievable in the deployed app, the build is not done.

**UX verification (G2/J2):** Re-walk after revision. Document improvement.

---

## 4. Per-surface viewport blueprint (used in BUILD-SPEC.md)

For each surface, specify what appears above the fold at 1440x900. The agent builds to this layout.

Template:

```
### {Surface name} — viewport blueprint (1440x900)

**Above the fold:**
- {Top-left: brand/logo}
- {Primary element: hero metric / big number / CTA}
- {Supporting context: 2-3 tiles or one-line summary}
- {Primary CTA: one button, action-colored, clear label}

**Below the fold:**
- {Secondary content}

**Signal/noise:** {what is NOT on this surface — filters hidden by default, no welcome text, etc.}
```

**Rules:**
- Every surface has exactly one primary CTA above the fold
- No filters above the fold unless the surface IS a filter
- A first-time user must articulate "this surface is for X and the next click is Y" within 3 seconds

---

## 5. Brand kit structure (output of stage F as `spec/BRAND-KIT.md`)

Template:

```markdown
# {Customer Name} — Brand Kit

## 1. Color tokens

\`\`\`css
:root {
  --{prefix}-primary:    #{hex};   /* {usage} */
  --{prefix}-accent:     #{hex};   /* {usage} */
  --surface-bg:          #{hex};   /* Page background */
  --surface-card:        #{hex};   /* Card surface */
  --hairline:            #{hex};   /* Borders, dividers */
  --ink:                 #{hex};   /* Headings, KPI numerics */
  --ink-muted:           #{hex};   /* Helper text, timestamps */
  --state-pass:          #{hex};   /* Success */
  --state-warn:          #{hex};   /* Warning */
  --state-fail:          #{hex};   /* Critical */
}
\`\`\`

**Restraint rules:**
- {e.g., "Never use accent color as text fill — accent only"}
- {e.g., "No gradients. No glows. This is a financial tool."}

## 2. Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display | {font} | 700 | {notes} |
| UI / body | {font} | 400 / 500 | {notes} |
| Numerals | {font} | 500 | Tabular figures |

## 3. Logo

- Primary asset: {path or description}
- Clear-space rules
- Color restrictions

## 4. CTA pattern

- **Primary:** {background, color, radius, weight}
- **Secondary:** {background, border, color}
- **Tertiary / link:** {color, underline behavior}

## 5. Voice and microcopy

| Don't (generic) | Do ({customer voice}) |
|------------------|-----------------------|
| "Submit form" | "{customer-appropriate verb}" |
| "Data updated" | "{domain-specific confirmation}" |

{Domain terms to use as first-class labels}
```

---

## 6. Verbatim evidence format

Every major design decision in NORTHSTAR, BUILD-SPEC, and handoff artifacts should trace to customer evidence.

Format: `"{exact quote}" — {Speaker Name}, {context/date}` or `"{exact quote}" — {Source: survey field name}`

**In NORTHSTAR.md:** Ground each outcome in survey answers or Gong excerpts.
**In BUILD-SPEC.md:** Ground per-surface design decisions in what the customer described.
**In DISCOVERY-HANDOFF.md / MVP2-HANDOFF.md:** Weave quotes throughout to demonstrate "we heard you."

---

## 7. Scope guards (used in BUILD-SPEC.md, carried to handoffs)

Template for BUILD-SPEC.md:

```
## What we are NOT building (and why)

- **{Excluded item}** — {reason it's excluded, framed as intentional design}
- **{Excluded item}** — {reason}
```

Carry these forward to DISCOVERY-HANDOFF.md (section: "Explicitly Out of Scope") and MVP2-HANDOFF.md. Prevents scope creep and builds trust.

---

## 8. summary.html template (stage N delivery only)

A branded, print-ready executive summary generated from the brand kit + deploy-result.json + screenshots. This is what gets emailed to the customer.

**Structure (3 pages):**

Page 1:
- Brand strip (customer colors) + customer logo + product name
- Status pills (engagement stage, date)
- Title + one-paragraph tagline describing what the app does
- Hero metrics band (dark background): hero metric + 3 supporting stats (today vs target)
- Two-column: "What the user asked for" (verbatim quotes) + "What the app does" (surface list)
- One paragraph: "Why it solves it"

Page 2:
- 3 screenshots with numbered labels and captions describing each surface
- Impact metrics grid (from/to cards with mechanism)
- Surface guide (2-column grid, one card per surface with name + one-line description)

Page 3:
- Phased delivery table
- Success criteria
- Next steps

**CSS:** Use the customer's brand kit tokens. Print-optimized (`@page`, `page-break-after`). Inter or customer font. Tabular numerals (`font-feature-settings: 'tnum' 1`).

This is a **customer-facing** document. No internal pipeline language, no 5-to-9 tables, no build-target framing. Frame everything as outcomes delivered.
