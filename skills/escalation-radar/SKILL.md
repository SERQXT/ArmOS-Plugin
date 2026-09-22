---
name: escalation-radar
tier: 1
description: "Proactive early warning system for accounts showing escalation-worthy signals that haven't been flagged yet. Scans for declining health, missed calls, stalled engagements, approaching renewals with no plan, and combinations of signals that individually look manageable but together indicate trouble. Trigger with 'escalation radar', 'what should I escalate', 'early warnings', 'who needs help', 'flag accounts', or any request to surface accounts needing escalation before they become emergencies."
maturity: alpha
audience: [intelligence]
pipeline:
  phase: discover
  sub_phase: portfolio-intelligence
  position: 6
  output_type: alert
  wave: 1
  state: ready
  inputs: []
  outputs:
    - name: escalation-alert-report
      format: markdown
      downstream:
        - agent: account-360
        - agent: call-prep
  data_sources:
    - tool: portfolio_search
      required: true
    - tool: actions_lookup
      required: true
    - tool: calls_lookup
      required: false
    - tool: hggrades_lookup
      required: false
  phase_gate: false
---

# Escalation Radar — Early Warning System

The proactive alert system. Surfaces accounts that aren't yet in crisis but are showing early warning patterns that, left unaddressed, will become emergencies. Different from Renewal Risk Radar (which focuses on renewal timing) — this catches problems early regardless of renewal date.

The key insight: individual signals look manageable. It's the COMBINATION that matters. An account with a C grade is fine. A C grade + declining momentum + last call was 45 days ago + no active services = an account slipping through the cracks.

## How It Works

```
User says: "what should I escalate?"
                    |
         portfolio_search
         (all accounts, looking for warning patterns)
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  Health   Call     Services Signal  Combination
  Decline  Gaps    Stalls   Accel   Scoring
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Score: Escalation Urgency (0-100)
                    |
         Classify: Escalate Now / Watch / Monitor
                    |
         Produce Escalation Radar Report
```

## Triggers

- "escalation radar"
- "what should I escalate"
- "early warnings"
- "who needs help"
- "flag accounts"
- "accounts slipping through the cracks"
- "what am I missing"
- "surprise me" (in portfolio context)
- "pre-escalation check"
- "weekly warning scan"

## Warning Patterns

Each pattern is scored independently and then combined:

### Pattern 1: Silent Decline (25 pts max)
Account health is declining but no one is talking to them.

```
Criteria:
  health_grade IN ('C', 'D', 'F')
  AND momentum_segment IN ('Declining', 'Stalled')
  AND last_call > 30 days ago (or no calls in dataset)
  AND Has Active Services = false

Scoring:
  Grade D/F + no calls in 60d: 25 pts
  Grade C + declining + no calls in 45d: 20 pts
  Grade C + stalled + no calls in 30d: 15 pts
```

### Pattern 2: Signal Acceleration (20 pts max)
Risk signals are accumulating faster than normal.

```
Criteria:
  risk_last30days >= 3
  OR (risk_signal_total > 5 AND growth_signal_total < 2)

Scoring:
  risk_last30days >= 5: 20 pts
  risk_last30days >= 3: 15 pts
  risk_signal_total > 5 with low growth: 10 pts
```

### Pattern 3: Engagement Drop-Off (20 pts max)
Services engagement was active but has stalled or ended without follow-through.

```
Criteria:
  Has Active Services = false
  AND Billable Hours Consumed > 0
  AND health_grade IN ('C', 'D', 'F')
  (i.e., had services, services ended, health is poor)

Scoring:
  Services ended + grade D/F: 20 pts
  Services ended + grade C + declining: 15 pts
  Services ended + grade C: 10 pts
```

### Pattern 4: Forecast Divergence (15 pts max)
Forecast is significantly below baseline with no apparent plan.

```
Criteria:
  fcst_renewal_pct < 85%
  AND Has Active Services = false
  AND no recent calls

Scoring:
  forecast < 70% + no services + no calls: 15 pts
  forecast < 85% + no services: 10 pts
  forecast < 85%: 5 pts
```

### Pattern 5: Pacing Collapse (10 pts max)
Platform usage has fallen off significantly.

```
Criteria:
  % Pacing < 50%
  AND pacing was previously higher (if trend available)

Scoring:
  Pacing < 30%: 10 pts
  Pacing 30-50%: 7 pts
```

### Pattern 6: High-Value Neglect (10 pts max)
Large ARR account with poor health and low attention.

```
Criteria:
  2024_arr > $200K
  AND health_grade IN ('C', 'D', 'F')
  AND no recent engagement activity

Scoring:
  ARR > $500K + grade D/F: 10 pts
  ARR > $200K + grade D/F: 7 pts
  ARR > $200K + grade C + declining: 5 pts
```

## Escalation Classification

| Classification | Score | Meaning |
|---------------|-------|---------|
| **Escalate Now** | 50+ | Multiple warning patterns active. Needs immediate manager/leadership attention. |
| **Watch Closely** | 30-49 | Warning signs emerging. Flag to CSM, monitor weekly. |
| **Monitor** | 15-29 | Single warning pattern. Note it but don't escalate yet. |
| **Clear** | 0-14 | No concerning patterns. Standard motion. |

## Execution Flow

### Step 1: Scan Portfolio

```
portfolio_search:
  select_fields: bks_account_name, bks_account_id, hgtrends_health_grade,
                 hgtrends_health_gpa, momentum_segment, risk_signal_total,
                 growth_signal_total, risk_last30days, Has Active Services,
                 Billable Hours Consumed, % Pacing, 2024_arr,
                 fcst_renewal_pct, Days to Renewal, bks_csm, Account Segment
  where_clause: (hgtrends_health_grade IN ('C', 'D', 'F')
                 OR risk_last30days >= 3
                 OR fcst_renewal_pct < 85)
  limit: 200
```

### Step 2: Score Each Account

Apply all 6 warning patterns. Sum scores.

### Step 3: Enrich Top Escalations

For accounts scoring 50+:

```
actions_lookup(account_name)  → What's driving the signals?
calls_lookup(account_name, limit=3) → When was last contact? What was the tone?
hggrades_lookup(account_id)  → Which health dimensions are failing?
```

### Step 4: Produce the Report

---

## Output Template

```markdown
# Escalation Radar

**Scan Date:** [Date]
**Scope:** [All / Filter]
**Accounts Scanned:** [N]

---

## Summary

| Classification | Accounts | Total ARR |
|---------------|----------|-----------|
| Escalate Now | [N] | $[X]M |
| Watch Closely | [N] | $[X]M |
| Monitor | [N] | $[X]M |

**Top Concern:** [1-sentence summary of the most urgent finding]

---

## Escalate Now (Score 50+)

### [Account Name] — Score: [XX]/100

| | |
|---|---|
| Health Grade | [X] (GPA: [X.XX]) |
| ARR | $[X] |
| Renewal | [Date] ([X] days) |
| Forecast | [X]% |
| Momentum | [Segment] |
| CSM | [Name] |

**Warning Patterns Triggered:**

| Pattern | Score | Detail |
|---------|-------|--------|
| [Pattern Name] | [X] pts | [Specific observation — e.g., "No calls in 52 days, grade D"] |
| [Pattern Name] | [X] pts | [Detail] |
| [Pattern Name] | [X] pts | [Detail] |

**Why This Is Urgent:**
[2-3 sentence narrative connecting the patterns — e.g., "This $400K ARR account has been declining for 90 days with no customer contact. Risk signals are accelerating (+5 in 30 days) and there's no active services engagement. Without intervention, this is a likely downsell at renewal in 67 days."]

**Recommended Actions:**
1. [Specific action — e.g., "CSM schedule emergency check-in this week"]
2. [Specific action — e.g., "AE engage on retention strategy"]
3. [Specific action — e.g., "Consider PS intervention: Adoption Acceleration"]

---

[Repeat for each Escalate Now account]

---

## Watch Closely (Score 30-49)

| Account | Score | Grade | ARR | Top Pattern | CSM | Action |
|---------|-------|-------|-----|-------------|-----|--------|
| [Name]  | [XX]  | [X]   | $[X] | [Primary warning] | [Name] | [1-line action] |

---

## Pattern Distribution

| Pattern | Escalate Now | Watch | Monitor | Total |
|---------|-------------|-------|---------|-------|
| Silent Decline | [N] | [N] | [N] | [N] |
| Signal Acceleration | [N] | [N] | [N] | [N] |
| Engagement Drop-Off | [N] | [N] | [N] | [N] |
| Forecast Divergence | [N] | [N] | [N] | [N] |
| Pacing Collapse | [N] | [N] | [N] | [N] |
| High-Value Neglect | [N] | [N] | [N] | [N] |

**Most Common Pattern:** [Pattern] — appearing in [N] accounts
**Most Dangerous Pattern:** [Pattern] — highest correlation with escalation

---

## This Week's Action List

| Priority | Account | Action | Owner | Deadline |
|----------|---------|--------|-------|----------|
| 1 | [Name] | [Specific action] | [CSM/AE/Manager] | [Date] |
| 2 | [Name] | [Action] | [Owner] | [Date] |
| 3 | [Name] | [Action] | [Owner] | [Date] |

---

**Prepared by:** Compass Escalation Radar
**Data Sources:** Portfolio Search, Actions, Calls, HG Grades
**Recommended Cadence:** Weekly (complements Executive Briefing)
```

---

## Guardrails

- **Combinations matter more than individual signals.** A C grade alone isn't escalation-worthy. A C grade + no calls + declining momentum + forecast gap IS.
- **Don't cry wolf.** Keep "Escalate Now" to genuinely urgent cases. If every scan produces 30 escalations, the signal becomes noise.
- **Every escalation needs an action.** Don't just flag problems — recommend specific next steps with owners.
- **Recent data wins.** Weight 30-day signals more heavily than historical patterns. Things change fast.
- **ARR awareness.** A $50K account slipping is different from a $500K account slipping. The scoring reflects this.
- **This is EARLY warning.** If an account is already D/F with renewal next week, that's not an early warning — that's a fire. Point them to Renewal Risk Radar.
- **Persist findings.** Write escalation findings to account-level KB so they're available as context in future sessions.

---

## Connecting MCP Tools

| Tool | Required | What It Provides |
|------|----------|------------------|
| portfolio_search | **Yes** | Bulk account scan with warning pattern filters |
| actions_lookup | **Yes** | Signal detail for enrichment |
| calls_lookup | Recommended | Last contact date and tone |
| hggrades_lookup | Optional | Health dimension detail for escalation accounts |
| spp_lookup | Optional | Services engagement status |

---

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and portfolio signals.

### After executing
- Call `memory_remember` with scope `{account_id}`, hints `{layers: ["account"]}`, content: escalation-worthy signals detected, severity assessment, combination risk factors, recommended intervention timeline.

## Related Skills

- **Renewal Risk Radar** — Focused on renewal timing (this skill catches problems earlier)
- **Executive Briefing** — Periodic summary (includes escalation highlights)
- **Account 360** — Deep-dive any escalated account
- **Call Prep** — Prep for the intervention call
- **Adoption Acceleration** — Generate intervention plan for escalated accounts
