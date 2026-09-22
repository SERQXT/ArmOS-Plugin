---
name: portfolio-health-dashboard
tier: 1
description: "Aggregated health view across all accounts in a book of business. Shows portfolio-level health distribution, ARR at risk, trending accounts, and focus areas. The executive's 'how is my portfolio doing?' skill. Trigger with 'portfolio health', 'how's my book', 'portfolio dashboard', 'show me my accounts', 'portfolio overview', or any request for a bird's-eye view across multiple accounts."
maturity: alpha
audience: [intelligence]
pipeline:
  phase: discover
  sub_phase: portfolio-intelligence
  position: 1
  output_type: output
  wave: 1
  state: ready
  inputs: []
  outputs:
    - name: portfolio-health-report
      format: markdown
      downstream:
        - agent: renewal-risk-radar
        - agent: escalation-radar
  data_sources:
    - tool: portfolio_search
      required: true
    - tool: portfolio_lookup
      required: false
    - tool: hg_summary_lookup
      required: false
  phase_gate: false
---

# Portfolio Health Dashboard — Executive Portfolio View

The executive's starting point. Aggregates health, risk, and engagement data across an entire book of business into a single portfolio-level view. Where Account 360 is a deep-dive on ONE account, this is the wide-angle lens across ALL accounts.

## How It Works

```
User says: "how's my portfolio doing?"
                    |
         portfolio_search
         (all accounts, or filtered by CSM/segment/region)
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  Health   Renewal  Signal  Services Forecast
  Distrib  Pipeline Load    Coverage Gaps
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Aggregate & Rank
                    |
         Produce Portfolio Dashboard
                    |
         Write to account-level knowledgebase
```

## Triggers

- "portfolio health"
- "how's my book"
- "portfolio dashboard"
- "show me my accounts"
- "portfolio overview"
- "how are my accounts doing"
- "book of business health"
- "give me the big picture"
- "executive dashboard"
- "portfolio pulse"

## Execution Flow

### Step 1: Define the Portfolio Scope

Default: all accounts. User can filter:
- By CSM: "portfolio health for Sarah's book"
- By segment: "portfolio health for Enterprise"
- By region: "portfolio health for West"
- By health: "show me all D and F accounts"

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

### Step 2: Compute Portfolio Aggregates

```
Health Distribution:
  A/S accounts: count, % of portfolio, total ARR
  B accounts:   count, % of portfolio, total ARR
  C accounts:   count, % of portfolio, total ARR
  D/F accounts: count, % of portfolio, total ARR

Risk Metrics:
  Total ARR in portfolio
  ARR in D/F accounts (at risk)
  Accounts renewing in 90 days
  Accounts renewing in 90 days with grade D/F (critical)
  Weighted avg forecast % across upcoming renewals

Signal Summary:
  Total risk signals across portfolio
  New risk signals (last 30 days)
  Total growth signals
  New growth signals (last 30 days)

Services Coverage:
  Accounts with active services: count, %
  Accounts without active services: count, %
  Avg pacing across portfolio
```

### Step 3: Identify Movers (Trend Analysis)

Flag accounts with significant recent changes:
- **Declining**: risk_last30days >= 3 (new risk signals accelerating)
- **Improving**: growth_lever_last30days >= 3 (growth signals accelerating)
- **Stalled**: momentum_segment = "Stalled" or "Declining"
- **Accelerating**: momentum_segment = "Accelerating"

### Step 4: Rank Focus Areas

Prioritize by composite urgency:
1. D/F health + renewal within 90 days (critical intervention)
2. D/F health + no active services (unserved risk)
3. C health + declining momentum (slipping)
4. A/B health + growth signals + no active services (missed expansion)

### Step 5: Produce the Dashboard

---

## Output Template

```markdown
# Portfolio Health Dashboard

**Generated:** [Date]
**Scope:** [All / CSM: Name / Segment: X / Region: X]
**Accounts:** [N]
**Total ARR:** $[sum]

---

## Health Distribution

| Grade | Accounts | % of Portfolio | ARR | % of ARR |
|-------|----------|----------------|-----|----------|
| A/S   | [N]      | [X]%           | $[X] | [X]%   |
| B     | [N]      | [X]%           | $[X] | [X]%   |
| C     | [N]      | [X]%           | $[X] | [X]%   |
| D/F   | [N]      | [X]%           | $[X] | [X]%   |

**Portfolio GPA:** [weighted avg]
**ARR at Risk (D/F):** $[sum] ([X]% of total)

---

## Renewal Pipeline (Next 120 Days)

| Window | Accounts | ARR | Avg Forecast % | Critical (D/F) |
|--------|----------|-----|----------------|-----------------|
| 0-30 days | [N] | $[X] | [X]% | [N] |
| 31-60 days | [N] | $[X] | [X]% | [N] |
| 61-90 days | [N] | $[X] | [X]% | [N] |
| 91-120 days | [N] | $[X] | [X]% | [N] |

**Forecast Gap:** $[baseline - forecast sum] across all upcoming renewals

---

## Signal Activity

| Metric | Count | Last 30 Days |
|--------|-------|-------------|
| Risk Signals | [N] total | +[N] new |
| Growth Signals | [N] total | +[N] new |

**Signal Ratio:** [growth/risk] — [Above/Below 1.0 = portfolio trending positive/negative]

---

## Portfolio Momentum

| Segment | Accounts | % |
|---------|----------|---|
| Accelerating | [N] | [X]% |
| Stable | [N] | [X]% |
| Stalled | [N] | [X]% |
| Declining | [N] | [X]% |

---

## Services Coverage

| | Accounts | ARR | Avg Health Grade |
|---|----------|-----|-----------------|
| With Active Services | [N] ([X]%) | $[X] | [X] |
| Without Active Services | [N] ([X]%) | $[X] | [X] |

---

## Accounts Requiring Attention

### Critical (D/F Health + Renewal < 90 Days)

| Account | Grade | GPA | ARR | Renewal | Forecast % | Risk Signals | CSM |
|---------|-------|-----|-----|---------|------------|-------------|-----|
| [Name] | [X] | [X.XX] | $[X] | [Date] ([X]d) | [X]% | [X] | [Name] |

### Declining Momentum (New Risk Signals)

| Account | Grade | Risk (30d) | Momentum | ARR | CSM |
|---------|-------|-----------|----------|-----|-----|
| [Name] | [X] | +[N] | [Segment] | $[X] | [Name] |

### Expansion Opportunities (A/B + Growth Signals + No Services)

| Account | Grade | Growth Signals | ARR | Segment | CSM |
|---------|-------|---------------|-----|---------|-----|
| [Name] | [X] | [N] | $[X] | [X] | [Name] |

---

## Focus Recommendations

1. **Immediate:** [Top 3 critical intervention accounts with specific actions]
2. **This Week:** [Top 3 high-risk accounts needing proactive outreach]
3. **This Month:** [Top 3 expansion opportunities to pursue]
4. **Portfolio-Level:** [Systemic observation — e.g., "services coverage is 35%, below healthy threshold of 50%"]

---

**Prepared by:** Compass Portfolio Health Dashboard
**Data Sources:** Portfolio Search, Portfolio Lookup
**Recommended Cadence:** Weekly (Monday morning) or on-demand
```

---

## Guardrails

- **This is a WIDE view, not a deep view.** Don't pull hggrades/actions/calls for every account. Use portfolio_search aggregates. Point to Account 360 for deep-dives.
- **Always show dollars alongside counts.** "12 D/F accounts" means nothing without "$4.2M ARR at risk."
- **Default to ALL accounts.** Only filter when explicitly asked. Executives want the full picture.
- **Trend > Snapshot.** The momentum segment and 30-day signal counts tell the story of direction, not just state.
- **Don't editorialize.** The recommendations should be driven by the data classification, not opinion.
- **Persist to account-level KB.** When run in an account-level session, write the output to the account's knowledgebase so it's available as context in future conversations.
- **Cap the detail.** Show top 10 in each attention category. Link to renewal-risk-radar or account-360 for full lists.

---

## Connecting MCP Tools

| Tool | Required | What It Provides |
|------|----------|------------------|
| portfolio_search | **Yes** | Bulk account data with filtering — the primary data source |
| portfolio_lookup | Optional | Enrichment for specific accounts in the focus list |
| hg_summary_lookup | Optional | Narrative summaries for critical accounts |

### Manual Mode

If MCP tools aren't connected, ask the user to provide:

1. A list of accounts with health grades and ARR
2. Renewal dates for upcoming renewals
3. Any known risk signals

The output structure stays the same — aggregation just happens on provided data.

---

## Memory

### Before executing

- Call `memory_recall` with intent `"prep"` across each `{account_id}` in scope (or use `memory_bundle` for the portfolio/engagement when the gateway supports multi-account prep) to load existing **account** health signals and any prior dashboard snapshot.

### After executing

- Call `memory_store_artifact` to persist the **PortfolioSnapshot** to **engagement-artifacts** (portfolio aggregates, distributions, focus lists).
- Call `memory_remember` scoped to each `{account_id}` in the analyzed book with updated **health signals** (grade, GPA, momentum, 30d risk/growth counts, renewal window) so account-level memory matches the dashboard run.

---

## Related Skills

- **Account 360** — Deep-dive any account surfaced by the dashboard
- **Renewal Risk Radar** — Focused view on renewal pipeline risk
- **Escalation Radar** — Early warning on accounts needing escalation
- **Executive Briefing** — Periodic summary of portfolio changes
- **Scouting Agent** — Find new engagement opportunities in the portfolio
