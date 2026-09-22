---
name: cross-account-patterns
tier: 1
description: "Identify patterns across multiple accounts — clustering by health signals, industry, engagement type, and outcomes. Enables executives to apply learnings from one account to another. Trigger with 'cross-account patterns', 'which accounts have similar problems', 'pattern analysis', 'cohort analysis', 'what's common across my D accounts', or any request to find commonalities across the portfolio."
maturity: alpha
audience: [intelligence]
pipeline:
  phase: discover
  sub_phase: portfolio-intelligence
  position: 4
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: portfolio-health-dashboard
      required: false
      data: portfolio snapshot for pattern analysis
  outputs:
    - name: cross-account-pattern-report
      format: markdown
      downstream: []
  data_sources:
    - tool: portfolio_search
      required: true
    - tool: hggrades_lookup
      required: false
  phase_gate: false
---

# Cross-Account Patterns — Portfolio Cohort Analysis

"Which of my accounts have similar problems?" Clusters accounts by common characteristics — health dimensions, signal patterns, engagement types, and outcomes — so executives can apply what works in one account to others facing the same challenges.

## How It Works

```
User says: "what's common across my struggling accounts?"
                    |
         portfolio_search
         (full portfolio or filtered subset)
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  Health   Signal   Services Segment
  Cluster  Pattern  Pattern  Grouping
  Analysis Analysis Analysis
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Identify Clusters & Correlations
                    |
         Surface Actionable Patterns
                    |
         Produce Pattern Report
```

## Triggers

- "cross-account patterns"
- "which accounts have similar problems"
- "pattern analysis"
- "cohort analysis"
- "what's common across my D accounts"
- "what do my struggling accounts have in common"
- "similar accounts to [X]"
- "cluster my accounts"
- "what patterns do you see in the portfolio"
- "why are these accounts all declining"

## Execution Flow

### Step 1: Pull Portfolio Data

```
portfolio_search:
  select_fields: bks_account_name, bks_account_id, hgtrends_health_grade,
                 hgtrends_health_gpa, Account Segment, momentum_segment,
                 risk_signal_total, growth_signal_total, risk_last30days,
                 Has Active Services, % Pacing, 2024_arr, 2023_arr,
                 total_arr_growth_percent, bks_csm, Days to Renewal,
                 fcst_renewal_pct, # Active Projects
  limit: 500
```

If user specifies a subset (e.g., "my D/F accounts"), filter accordingly.

### Step 2: Health Dimension Clustering

For accounts scoring D/F (or user-specified subset), pull hggrades:

```
For each account in subset:
  hggrades_lookup(account_id)
  → Identify which Health Courses are failing
```

Cluster by common failing dimensions:

```
Example output:
  Cluster A: "Low Content Creation" (12 accounts)
    → These accounts aren't building dashboards
    → Common: no active services, segment = Mid-Market

  Cluster B: "Low Engagement Frequency" (8 accounts)
    → Users exist but don't log in regularly
    → Common: completed services 6+ months ago, no follow-up

  Cluster C: "Poor Data Integration" (6 accounts)
    → Few connectors, low dataset count
    → Common: early lifecycle, no ETL engagement
```

### Step 3: Signal Pattern Analysis

Group accounts by signal profile:

```
Risk-Heavy: risk_signal_total > 2x growth_signal_total
Growth-Heavy: growth_signal_total > 2x risk_signal_total
Balanced: similar risk and growth
Silent: few signals of either type (may indicate disengagement)
```

### Step 4: Services Correlation

Cross-reference health with services engagement:

```
With Active Services vs Without:
  → Average health grade for each group
  → Average GPA
  → Signal ratio

Services Outcome Patterns:
  → Accounts that improved after services
  → Accounts that didn't improve despite services
  → Accounts that declined after services ended
```

### Step 5: Produce the Pattern Report

---

## Output Template

```markdown
# Cross-Account Pattern Analysis

**Generated:** [Date]
**Scope:** [All / Subset description]
**Accounts Analyzed:** [N]

---

## Key Findings

[3-5 bullet summary of the most actionable patterns discovered]

- [Pattern 1 — e.g., "12 accounts share a 'Low Content Creation' problem — all Mid-Market, none have active services"]
- [Pattern 2 — e.g., "Accounts with services engagement are 2.3x more likely to have B+ health grades"]
- [Pattern 3 — e.g., "6 accounts show a 'post-services decline' pattern — health improved during engagement, then fell after"]

---

## Health Dimension Clusters

### Cluster: [Failing Dimension Name]

**Accounts:** [N] | **Total ARR:** $[X] | **Avg Grade:** [X]

| Account | Grade | GPA | ARR | Segment | Services? | CSM |
|---------|-------|-----|-----|---------|-----------|-----|
| [Name]  | [X]   | [X] | $[X] | [X]   | [Y/N]    | [Name] |

**Common Characteristics:**
- [What these accounts share beyond the failing dimension]
- [Segment, lifecycle stage, services history, etc.]

**Recommended Intervention:**
- [Specific action — e.g., "This cluster would benefit from a Content Creation accelerator engagement"]
- [Which existing skill/play addresses this — e.g., "Run Adoption Acceleration for each"]

---

[Repeat for each significant cluster]

---

## Signal Profiles

| Profile | Accounts | Avg Grade | Avg ARR | Renewal Risk |
|---------|----------|-----------|---------|-------------|
| Risk-Heavy | [N] | [X] | $[X] | [High/Medium/Low] |
| Growth-Heavy | [N] | [X] | $[X] | [High/Medium/Low] |
| Balanced | [N] | [X] | $[X] | [High/Medium/Low] |
| Silent | [N] | [X] | $[X] | [High/Medium/Low] |

**Silent accounts are a concern:** [X] accounts have fewer than [N] total signals — they may be disengaging quietly.

---

## Services Impact Correlation

| Group | Accounts | Avg Grade | Avg GPA | Avg Pacing |
|-------|----------|-----------|---------|-----------|
| Active Services | [N] | [X] | [X.XX] | [X]% |
| No Active Services | [N] | [X] | [X.XX] | [X]% |

**Delta:** Accounts with services are [X] grade points higher on average.

### Post-Services Trajectory

| Pattern | Accounts | Avg Grade Change | Implication |
|---------|----------|-----------------|-------------|
| Improved and held | [N] | +[X] | Services created lasting value |
| Improved then declined | [N] | [X] → [X] | Needs follow-up engagement |
| No improvement | [N] | [0] | Services may not have addressed root cause |

---

## Segment Patterns

| Segment | Accounts | Avg Grade | Grade Distribution | Services % |
|---------|----------|-----------|-------------------|-----------|
| Enterprise | [N] | [X] | A:[N] B:[N] C:[N] D/F:[N] | [X]% |
| Mid-Market | [N] | [X] | A:[N] B:[N] C:[N] D/F:[N] | [X]% |
| SMB | [N] | [X] | A:[N] B:[N] C:[N] D/F:[N] | [X]% |

---

## Actionable Recommendations

### Systemic Interventions (Portfolio-Wide)
1. **[Pattern]** affects [N] accounts ($[X]M ARR) — [Recommended play/skill]
2. **[Pattern]** — [Recommendation]

### Account-Specific Actions
1. **[Account]** — matches [Cluster X] pattern — [Specific action]
2. **[Account]** — [Action]

### Replication Opportunities
- **[Winning account]** improved via [method] — apply same approach to [similar accounts]

---

**Prepared by:** Compass Cross-Account Patterns
**Data Sources:** Portfolio Search, HG Grades
```

---

## Guardrails

- **Correlation is not causation.** Be clear about what's a pattern vs. what's a proven causal relationship.
- **Minimum cluster size: 3.** Don't call 2 accounts a "pattern."
- **Show the outliers.** If most accounts in a cluster share a trait but one doesn't, call it out — it may be the most interesting data point.
- **Actionable or don't mention it.** Every pattern should lead to a recommendation. "These 8 accounts are all in healthcare" is a fact. "These 8 healthcare accounts all lack data integration — run the Data Architecture Assessment for each" is actionable.
- **Don't over-cluster.** 3-5 meaningful patterns are better than 15 weak ones.
- **Respect the scope.** If analyzing D/F accounts, don't also analyze A/B accounts unless asked.

---

## Connecting MCP Tools

| Tool | Required | What It Provides |
|------|----------|------------------|
| portfolio_search | **Yes** | Bulk account data for clustering |
| hggrades_lookup | Recommended | Health dimension breakdown for cluster analysis |
| spp_lookup | Optional | Services engagement history for correlation |

---

## Memory

### Before executing

- Call `memory_recall` with scope `{account_id}` where relevant for account-level facts that inform cohort boundaries.
- Call `memory_recall` with intent `"patterns"` to load **patterns-library** (existing PatternDiscovery entries and prior cluster labels).
- Call `memory_bundle` if you need account snippets plus patterns-library in one read before clustering.

### After executing

- Call `memory_remember` to persist **PatternDiscovery** outputs to **patterns-library** (clusters, correlations, recommended interventions).
- Call `memory_remember` to update **global-context** with new graph relationships (e.g., segment ↔ failing dimension ↔ intervention) so future skills reuse the same ontology.

---

## Related Skills

- **Portfolio Health Dashboard** — Portfolio-level aggregates (this skill goes deeper into WHY)
- **Account 360** — Deep-dive any account surfaced by pattern analysis
- **Adoption Acceleration** — Intervention for clusters of struggling accounts
- **Scouting Agent** — Finds opportunities; this skill finds patterns
