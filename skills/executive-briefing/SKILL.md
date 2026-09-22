---
name: executive-briefing
tier: 1
description: "Periodic executive summary of what changed across the portfolio since last check. Surfaces new risks, resolved issues, health grade shifts, engagement milestones, and renewal outcomes. The 'what happened this week' skill for leaders. Trigger with 'executive briefing', 'what changed this week', 'weekly briefing', 'portfolio update', 'catch me up', or any request for a periodic summary of portfolio changes."
maturity: alpha
audience: [intelligence]
pipeline:
  phase: discover
  sub_phase: portfolio-intelligence
  position: 2
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: portfolio-health-dashboard
      required: false
      data: previous portfolio snapshot for delta comparison
  outputs:
    - name: executive-briefing-report
      format: markdown
      downstream: []
  data_sources:
    - tool: portfolio_search
      required: true
    - tool: actions_lookup
      required: false
    - tool: calls_lookup
      required: false
  phase_gate: false
---

# Executive Briefing — What Changed This Week

The leader's periodic catch-up. Instead of asking "how is everything," this skill tells you what's DIFFERENT since last time. New risks, resolved issues, grade changes, renewal outcomes, engagement starts/ends, and emerging patterns. Designed for VP/Director cadence — weekly on Monday morning or on-demand before leadership meetings.

## How It Works

```
User says: "catch me up on this week"
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  Current   Previous Signal  Call    Engagement
  Portfolio Snapshot Changes  Tone   Milestones
  State     (from KB) (30d)  Shifts  (SPP)
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Compute Deltas & Surface Changes
                    |
         Produce Executive Briefing
                    |
         Save snapshot to account KB for next comparison
```

## Triggers

- "executive briefing"
- "what changed this week"
- "weekly briefing"
- "portfolio update"
- "catch me up"
- "what happened since last [Monday/week/check]"
- "leadership update"
- "what do I need to know"
- "prep me for the leadership meeting"
- "weekly exec summary"

## Execution Flow

### Step 1: Load Previous Snapshot

Check account-level knowledgebase for the most recent portfolio snapshot file:
- Look for `knowledgebase/portfolio-snapshot-*.md` or `knowledgebase/executive-briefing-*.md`
- If found: parse previous health grades, ARR, signal counts, engagement statuses
- If not found: this is the first run — establish baseline, skip delta section

### Step 2: Pull Current State

```
portfolio_search:
  select_fields: bks_account_name, bks_account_id, hgtrends_health_grade,
                 hgtrends_health_gpa, Days to Renewal, bks_renewal_date,
                 bks_renewal_baseline_usd, bks_FCST_amount, fcst_renewal_pct,
                 risk_signal_total, growth_signal_total, risk_last30days,
                 growth_lever_last30days, momentum_segment, Account Segment,
                 bks_csm, Has Active Services, % Pacing, 2024_arr
  order_by: hgtrends_health_gpa ASC
  limit: 500
```

### Step 3: Compute Deltas

Compare current state to previous snapshot:

```
Grade Changes:
  Upgraded:  accounts that moved up (e.g., C → B)
  Downgraded: accounts that moved down (e.g., B → C)
  New D/F:   accounts that fell to D or F since last check

Signal Changes:
  New risk signals: accounts with risk_last30days > 0
  New growth signals: accounts with growth_lever_last30days > 0
  Signal acceleration: accounts with significantly more signals

Renewal Outcomes:
  Renewals that closed since last check (forecast → actual)
  Upcoming renewals entering the 30-day window

Momentum Shifts:
  Accounts that changed momentum segment (e.g., Stable → Declining)
```

### Step 4: Enrich Key Changes

For the most significant changes (top 5 by impact), pull additional context:

```
For downgraded/new D/F accounts:
  actions_lookup(account_name) → What's driving the decline?
  calls_lookup(account_name, limit=2) → What's the customer saying?

For accelerating accounts:
  What growth signals appeared? What's driving the improvement?
```

### Step 5: Produce the Briefing & Save Snapshot

---

## Output Template

```markdown
# Executive Briefing

**Period:** [Start Date] — [End Date]
**Scope:** [All / CSM: Name / Segment: X]
**Generated:** [Date]

---

## TL;DR

[3-5 bullet executive summary — the things you'd say in the first 30 seconds of a leadership meeting]

- Portfolio health [improved/declined/stable]: GPA moved from [X.XX] to [X.XX]
- [N] accounts downgraded, [N] upgraded — net [positive/negative]
- $[X]M in renewals in next 30 days, [N] at risk
- [Key story — e.g., "Acme Corp fell to F with $800K renewal in 45 days"]
- [Key win — e.g., "Contoso upgraded to A after services engagement completed"]

---

## Health Grade Movement

### Downgrades (Action Required)

| Account | Previous | Current | ARR | Renewal | Key Driver |
|---------|----------|---------|-----|---------|------------|
| [Name]  | [B]      | [C]     | $[X] | [Date] | [Brief reason from actions/signals] |

### Upgrades (Wins)

| Account | Previous | Current | ARR | Key Driver |
|---------|----------|---------|-----|------------|
| [Name]  | [C]      | [B]     | $[X] | [What improved] |

### New D/F Accounts (Escalation Candidates)

| Account | Grade | ARR | Renewal | Risk Signals (30d) | CSM |
|---------|-------|-----|---------|-------------------|-----|
| [Name]  | [D]   | $[X] | [Date] | [N] | [Name] |

**[For each new D/F: 2-3 sentence summary of what's happening and recommended action]**

---

## Renewal Pipeline Update

### Renewals Entering 30-Day Window

| Account | Grade | ARR | Forecast % | Risk Level |
|---------|-------|-----|------------|------------|
| [Name]  | [X]   | $[X] | [X]%    | [Critical/High/Moderate/Low] |

### Renewal Outcomes Since Last Briefing

| Account | ARR | Outcome | Forecast Was | Delta |
|---------|-----|---------|-------------|-------|
| [Name]  | $[X] | [Renewed/Churned/Downsold] | [X]% | [$X] |

---

## Signal Activity

| Metric | Last Period | This Period | Change |
|--------|------------|-------------|--------|
| Risk Signals (total) | [N] | [N] | [+/-N] |
| Risk Signals (30d new) | [N] | [N] | [+/-N] |
| Growth Signals (total) | [N] | [N] | [+/-N] |
| Growth Signals (30d new) | [N] | [N] | [+/-N] |
| Signal Ratio | [X] | [X] | [+/-X] |

### Accounts with Most New Risk Signals

| Account | New Risk (30d) | Grade | ARR | CSM |
|---------|---------------|-------|-----|-----|
| [Name]  | [N]           | [X]   | $[X] | [Name] |

### Accounts with Most New Growth Signals

| Account | New Growth (30d) | Grade | ARR | CSM |
|---------|-----------------|-------|-----|-----|
| [Name]  | [N]             | [X]   | $[X] | [Name] |

---

## Momentum Shifts

| Account | Previous Momentum | Current Momentum | ARR | Grade |
|---------|-------------------|------------------|-----|-------|
| [Name]  | Stable            | Declining        | $[X] | [X] |
| [Name]  | Stalled           | Accelerating     | $[X] | [X] |

---

## Services Activity

| Metric | Value |
|--------|-------|
| New engagements started | [N] |
| Engagements completed | [N] |
| Active engagement count | [N] |
| Services coverage | [X]% of portfolio |

---

## This Week's Focus

### Immediate Actions (This Week)
1. **[Account]** — [What to do] — Owner: [Name]
2. **[Account]** — [What to do] — Owner: [Name]
3. **[Account]** — [What to do] — Owner: [Name]

### Watch List (Next 2 Weeks)
- **[Account]** — [Why it's on the list]
- **[Account]** — [Why]

### Wins to Celebrate
- **[Account]** — [What happened — upgrade, successful renewal, engagement completion]

---

**Prepared by:** Compass Executive Briefing
**Data Sources:** Portfolio Search, Actions, Calls
**Cadence:** Weekly (Monday) or on-demand
**Previous Briefing:** [Date or "First run — baseline established"]
```

---

## Post-Execution: Save Snapshot

After producing the briefing, save a snapshot to the account-level knowledgebase:

```
Write to: knowledgebase/portfolio-snapshot-[YYYY-MM-DD].md

Content: structured data of current portfolio state:
- Account list with grades, GPA, ARR, signal counts
- Portfolio aggregates
- This becomes the "previous snapshot" for next week's delta comparison
```

This enables the delta comparison on the next run.

---

## Guardrails

- **Lead with what CHANGED.** This is not a dashboard — it's a diff. If nothing changed for an account, don't mention it.
- **TL;DR is mandatory.** An executive should get the picture from the first 5 bullets without reading further.
- **Always show dollars.** "3 downgrades" means nothing. "$2.1M in downgraded accounts" means everything.
- **Wins matter.** Don't make this a doom report. Celebrate upgrades and successful renewals.
- **Save the snapshot.** The skill gets better over time because each run establishes the baseline for the next comparison.
- **First run is special.** When no previous snapshot exists, produce the baseline dashboard (like Portfolio Health Dashboard) and note "Baseline established — deltas will appear in the next briefing."
- **Don't deep-dive everything.** Enrich only the top 5 most impactful changes. Point to Account 360 for the rest.
- **Respect cadence.** If the user runs this daily, acknowledge the short window. If it's been 3 weeks, flag the gap.

---

## Connecting MCP Tools

| Tool | Required | What It Provides |
|------|----------|------------------|
| portfolio_search | **Yes** | Current portfolio state — all accounts with health/signals/renewals |
| actions_lookup | Recommended | Enrichment for downgraded/critical accounts |
| calls_lookup | Optional | Recent call sentiment for key accounts |
| spp_lookup | Optional | Services engagement activity |

### Manual Mode

If MCP tools aren't connected, ask for:
1. Current account health grades and ARR
2. Any known changes since last meeting
3. Upcoming renewals

---

## Memory

### Before executing

- Call `memory_recall` with scope `{account_id}` and intent `"prep"` per account (or batch per your gateway) to load **account** health, ARR, and signal baselines for delta comparison.
- Call `memory_recall` with intent appropriate to **engagement-observations** (e.g., recent Gong/call-derived observations) for accounts you will enrich in the briefing.

### After executing

- Call `memory_store_artifact` to persist the **ExecutiveBriefing** output to **engagement-artifacts** (period, TL;DR, grade movements, renewal and signal deltas) so it is versioned and retrievable for the next run’s “previous snapshot” logic.

---

## Related Skills

- **Portfolio Health Dashboard** — Full portfolio snapshot (no delta — just current state)
- **Renewal Risk Radar** — Focused renewal pipeline risk analysis
- **Account 360** — Deep-dive any account flagged in the briefing
- **Escalation Radar** — Early warning system for accounts needing escalation
- **Monday QB** — Consultant capacity review (complements the executive briefing)
