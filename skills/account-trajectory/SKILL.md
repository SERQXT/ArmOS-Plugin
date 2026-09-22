---
name: account-trajectory
tier: 1
description: "Trend analysis for a single account over time — health trajectory, signal evolution, engagement history arc, and renewal outcomes. The 'movie' not the 'photo' of an account. Trigger with 'trajectory for [account]', 'how has [account] been trending', 'account trend for [customer]', 'show me the arc for [account]', or any request for historical account trend analysis."
maturity: alpha
audience: [intelligence]
pipeline:
  phase: discover
  sub_phase: portfolio-intelligence
  position: 3
  output_type: output
  wave: 1
  state: ready
  inputs: []
  outputs:
    - name: account-trajectory-report
      format: markdown
      downstream:
        - agent: account-360
  data_sources:
    - tool: portfolio_lookup
      required: true
    - tool: hggrades_lookup
      required: true
    - tool: calls_lookup
      required: false
    - tool: spp_lookup
      required: false
  phase_gate: false
---

# Account Trajectory — Trend Analysis Over Time

Where Account 360 is the snapshot, this is the movie. Shows how an account has been trending — is health improving or declining? Are signals accelerating? Is the engagement history one of expansion or contraction? Critical for execs who need to tell the STORY of an account, not just its current state.

## How It Works

```
User says: "how has Acme Corp been trending?"
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  Health   Signal   Calls   SPP     Financial
  Trends   Evolution History Engagement History
  (30/90/  (risk vs (tone   (starts, (ARR
  180d)    growth)  shifts) ends)    growth)
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Build Trajectory Narrative
                    |
         Classify: Ascending / Stable / Declining / Volatile
                    |
         Produce Trajectory Report
```

## Triggers

- "trajectory for [account]"
- "how has [account] been trending"
- "account trend for [customer]"
- "show me the arc for [account]"
- "[account] over time"
- "is [account] getting better or worse"
- "what's the story with [account]"
- "historical trend for [customer]"

## Execution Flow

### Step 1: Resolve the Account

```
portfolio_lookup(account_name, fields="identity,renewal,health,pacing,signals,services,financial")
→ Capture: bks_account_id, current state baseline
```

### Step 2: Pull Trend Data

```
1. hggrades_lookup(account_id)
   → 17 metrics with 30/90/180-day trends
   → This is the core trend dataset

2. portfolio_lookup — extract trend fields:
   → risk_signal_total + risk_last30days (signal acceleration)
   → growth_signal_total + growth_lever_last30days
   → momentum_segment (current trajectory classification)
   → % Pacing (usage trajectory)
   → 2023_arr vs 2024_arr (financial trajectory)
   → total_arr_growth, total_arr_growth_percent

3. calls_lookup(account_name, limit=10)
   → Sentiment over time — are calls getting more positive or negative?
   → Topic evolution — what are they talking about now vs. 3 months ago?

4. spp_lookup(account_name) [when available]
   → Engagement timeline — starts, completions, gaps
   → Hours burn rate — ahead/behind/on track
```

### Step 3: Build Trend Vectors

For each dimension, classify the direction:

```
Health Trend:
  Compute from hggrades 30/90/180-day changes
  ↑ Improving: majority of metrics trending positive
  → Stable: mixed or flat
  ↓ Declining: majority of metrics trending negative

Signal Trend:
  Compare risk_last30days vs historical pace
  If risk signals accelerating: ↑ Risk Growing
  If growth signals accelerating: ↑ Growth Growing
  Signal ratio trend: improving or worsening

Engagement Trend:
  Active services: growing, steady, or winding down
  Hours: burning fast, on pace, or stalled
  Gap analysis: are there periods with no services?

Financial Trend:
  ARR growth: positive, flat, or declining
  Forecast trend: improving, stable, or deteriorating
  Pacing: ahead, on track, or falling behind

Sentiment Trend:
  Call sentiment over last 10 calls: improving, stable, or declining
  Topic shift: new concerns emerging? Old concerns resolved?
```

### Step 4: Classify Overall Trajectory

| Trajectory | Criteria | Implication |
|------------|----------|-------------|
| **Ascending** | Majority of vectors improving, no critical declines | Account is on a positive path — capitalize on momentum |
| **Stable** | Mixed vectors, no strong directional signal | Maintain current approach — watch for tipping points |
| **Declining** | Majority of vectors worsening, especially health | Intervention needed — trajectory leads to churn without action |
| **Volatile** | Vectors moving in opposite directions, rapid changes | Unpredictable — needs close monitoring and stabilization |

### Step 5: Produce the Report

---

## Output Template

```markdown
# Account Trajectory: [Account Name]

**Generated:** [Date]
**Overall Trajectory:** [Ascending / Stable / Declining / Volatile]
**Time Horizon:** 180-day lookback

---

## Trajectory Summary

[2-3 paragraph narrative telling the STORY of this account — where it was 6 months ago, what happened, where it's heading. This is the executive version a VP would read before a board meeting or QBR.]

---

## Trend Dashboard

| Dimension | Direction | Confidence | Detail |
|-----------|-----------|------------|--------|
| Health Grade | [↑/→/↓] | [High/Medium/Low] | [Current grade] from [grade 180d ago] |
| Risk Signals | [↑/→/↓] | [High/Medium/Low] | [N] total, [N] new in 30d |
| Growth Signals | [↑/→/↓] | [High/Medium/Low] | [N] total, [N] new in 30d |
| Pacing | [↑/→/↓] | [High/Medium/Low] | [X]% current, trend [direction] |
| ARR | [↑/→/↓] | [High/Medium/Low] | $[current] from $[previous] ([X]%) |
| Call Sentiment | [↑/→/↓] | [High/Medium/Low] | [Recent avg] vs [historical avg] |
| Services Engagement | [↑/→/↓] | [High/Medium/Low] | [Active/Winding down/Gap] |

---

## Health Grade Trends (180-Day View)

| Health Course | Metric | Current | 30d | 90d | 180d | Direction |
|---------------|--------|---------|-----|-----|------|-----------|
| [Course] | [Metric] | [Grade] | [Change] | [Change] | [Change] | [↑/→/↓] |

**Improving Dimensions:** [List of health courses trending up]
**Declining Dimensions:** [List of health courses trending down]
**Stable Dimensions:** [List of health courses flat]

---

## Signal Evolution

| Period | Risk Signals | Growth Signals | Net Signal | Momentum |
|--------|-------------|---------------|------------|----------|
| Current | [N] | [N] | [N] | [Segment] |
| 30 days ago | [Est.] | [Est.] | [N] | [If known] |

**Signal Interpretation:** [What the signal pattern tells us — e.g., "Risk signals peaked 60 days ago and are now declining while growth signals are emerging — classic recovery pattern."]

---

## Conversation Tone Over Time

| Date | Call Title | Sentiment | Key Theme |
|------|-----------|-----------|-----------|
| [Date] | [Title] | [Sentiment] | [1-line topic summary] |

**Tone Trajectory:** [Are calls getting more positive/negative/staying the same? What topics have shifted?]

---

## Engagement History

| Period | Engagement | Type | Hours | Outcome |
|--------|-----------|------|-------|---------|
| [Dates] | [Name] | [Type] | [X] hrs | [Completed/Active/Stalled] |

**Engagement Pattern:** [Is this an account that buys services regularly? One-time? Intermittent? Growing?]

---

## Financial Arc

| Metric | Previous Year | Current Year | Change |
|--------|-------------|--------------|--------|
| ARR | $[X] | $[X] | [+/-$X] ([X]%) |
| Forecast % | [X]% | [X]% | [+/-X]pp |
| Active TCV | $[X] | $[X] | [+/-$X] |

---

## Trajectory Forecast

Based on current vectors, if trends continue:

**Best Case:** [What happens if positive trends accelerate — e.g., "Account reaches B grade by renewal, full renewal at baseline"]
**Base Case:** [What happens if current trends continue — e.g., "Stays at C, partial renewal at 85%"]
**Worst Case:** [What happens if negative trends accelerate — e.g., "Falls to D, significant downsell risk at renewal"]

---

## Recommended Actions

[Based on trajectory classification:]

**For Ascending:**
1. [Capitalize — expand services, plan next engagement]
2. [Document what's working for replication]

**For Stable:**
1. [Identify the next catalyst — what would tip this positive?]
2. [Prevent stagnation — engagement can't just be "fine"]

**For Declining:**
1. [Intervene — specific action to arrest the decline]
2. [Root cause — is it product, relationship, or value delivery?]

**For Volatile:**
1. [Stabilize — reduce uncertainty, increase touchpoint frequency]
2. [Investigate — what's causing the swings?]

---

**Prepared by:** Compass Account Trajectory
**Data Sources:** Portfolio, HG Grades, Calls[, SPP]
```

---

## Guardrails

- **Tell the story, not just the data.** The narrative summary is the most valuable part. Data tables support it.
- **180-day lookback is default.** Don't go further back unless specifically asked — data quality degrades.
- **Trends need context.** A grade change from B to C means different things depending on whether it happened gradually over 90 days or suddenly in the last week.
- **Don't project too far.** The trajectory forecast should be cautious — 1-2 quarters at most.
- **Confidence matters.** If trend data is sparse (few calls, short history), lower the confidence and say so.
- **Connect to action.** Every trajectory classification should end with specific, actionable recommendations.

---

## Connecting MCP Tools

| Tool | Required | What It Provides |
|------|----------|------------------|
| portfolio_lookup | **Yes** | Current state + financial history |
| hggrades_lookup | **Yes** | 30/90/180-day health trends — the core dataset |
| calls_lookup | Recommended | Sentiment trend over time |
| spp_lookup | Optional | Engagement history timeline |
| actions_lookup | Optional | Current recommended actions for context |

---

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and portfolio signals.

### After executing
- Call `memory_remember` with scope `{account_id}`, hints `{layers: ["account"]}`, content: health trajectory direction (improving/declining/stable), signal evolution over time, key inflection points, engagement history arc.

## Related Skills

- **Account 360** — Current snapshot (pair with trajectory for full picture)
- **Portfolio Health Dashboard** — Portfolio-level trends
- **Executive Briefing** — Periodic changes across all accounts
- **Call Prep** — Prep for a call with context of how the account has been trending
