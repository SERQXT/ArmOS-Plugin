# User journey test (Orient → Confirm)

Use on **v1** (and lightly re-run on **v2**) inside **`05b-ux-expert-iteration.md`**.

**Coverage:** Run the **Orient → Confirm** path on **each primary `built` surface** listed in **`screen-coverage-checklist.md`** (at least entry + scan; full investigate where data exists). Do **not** only exercise the landing view if other shipped screens exist.

## Phases

| Phase | Time / intent | Pass criteria |
|-------|----------------|---------------|
| **Orient (~3s)** | User grasps *where they are* and *what this app is for* | Title/hero/context visible without confusion |
| **Scan** | User finds the **primary metric or action** without reading everything | Clear visual priority |
| **Investigate (surface)** | Apply a filter or sort; scan updated results | Filtered state is visually distinct from unfiltered; count updates; no stale data |
| **Investigate (detail)** | Open the detail view (drawer, modal, drill-down) for **at least 2 different** item types | Detail view loads correct data; content complete; close/back works; transition smooth (e.g. under 300ms) |
| **Act** | Take the **main action** (filter, submit, navigate) | Success/failure visible |
| **Confirm** | User trusts the result (units, time range, cohort) | Labels match data reality |

## Mandatory UX checks (always test these)

- **Empty state** — filter to zero results; what does the user see?  
- **Loading state** — skeleton/spinner during data fetch?  
- **Detail interaction** — open the primary drill-down for **3 different** items (aligns with `interactive-state-testing.md`).

## Additional spot-checks (pick top 3 relevant)

Pick from: time-to-value, trunk test (“what is this?”), **agentic vs BI bar** (guided vs raw exploration), progressive disclosure, undo/clarity of destructive actions, mobile thumb reach (if applicable), keyboard path for secondary flows, chart accessibility (pattern + table fallback).

## Viewport audit (run per surface)

On each major surface, document what is visible in the initial viewport at 1440x900 (no scroll):

- Is the hero metric / primary content visible?
- Is the primary CTA visible and distinct?
- What percentage of the viewport is actionable vs decorative?
- Compare to the viewport blueprint in BUILD-SPEC if available.

## Dual-persona walkthrough

After the standard Orient-to-Confirm flow, explicitly walk through as two users:

### Power user (1000th visit)
- What is the fastest path to the primary action? Count clicks.
- Are there keyboard shortcuts or quick-access patterns?
- Does the app remember filter state / last-used context?
- Is the density appropriate for someone who works in this app daily?

### First-time user (day 1)
- Does the user know what this surface is for within 3 seconds?
- Is the primary CTA unmissable?
- Do empty states provide guidance ("Drop a folio PDF here")?
- Are labels clear enough to use without training?
- Is there any jargon that would confuse a new user?

Document friction points for each persona separately.

## Happy-path timing

Count clicks/interactions from app open to primary action completion:
- **Target:** 3 clicks or fewer for the most common task
- **Document:** the exact click sequence and time at each step
- **Flag:** any step that adds friction without adding value (unnecessary confirmation, redundant navigation, extra modal)

## Output

- **Journey narrative** — 1 paragraph walkthrough **per major surface** (or one narrative with explicit per-surface sub-bullets if many screens).
- **Viewport audit** — per-surface table of what is above the fold vs BUILD-SPEC blueprint.
- **Dual-persona notes** — friction points per persona (power user vs first-timer).
- **Happy-path click count** — the primary workflow with counted steps.
- **Friction list** — bullets with **severity** (blocker / major / minor).  
- **Link to pillars** — map each friction to usability / IA / interaction / a11y / visual.
