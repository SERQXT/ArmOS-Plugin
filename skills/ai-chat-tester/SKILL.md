---
name: AI Chat Tester
tier: 1
description: "Automated testing of Domo AI Chat against a dataset — generates a structured test plan, executes N questions via the AI Chat API, evaluates responses for mathematical correctness and business completeness, and produces a scored test report."
maturity: alpha
audience: [delivery]
version: 1.0.0
tags: ["testing", "ai-chat", "domo", "qa", "dataset", "ai-readiness"]
---

# AI Chat Tester — Automated Test Execution & Evaluation

Generates a test plan for a Domo AI Chat–configured dataset, executes the questions via the `domo-ai-chat` MCP tool, evaluates each response, and produces a scored report. Designed to validate AI Readiness configurations before they go live with customers.

## When to Use This Skill

- After configuring AI Readiness on a new dataset
- After modifying column descriptions, global context, or synonyms in AI Readiness
- Before a customer demo that uses AI Chat
- When regression-testing after an ETL schema change

Trigger phrases:
- "test AI chat on [dataset]"
- "run AI chat tests for [account]"
- "validate AI readiness for [dataset]"
- "QA the AI chat on [dataset]"
- "run [N] AI chat tests"

---

## Step 1: Gather Context

Collect the following before executing anything:

```
Required:
  instance      → Domo instance name (e.g. 'maxio')
  dataset_id    → The AI Readiness-configured dataset ID
  dataset_name  → Human-readable name (for the report)
  test_budget   → Total number of tests to run (default: 20, max: 100)

Optional:
  question_source → Path to a .md or .txt file with questions (one per line or in a list)
  focus_area      → 'all' | 'balance' | 'flow' | 'trend' | 'ranking' | 'segment'
  prior_spec_doc  → Path to the AI dataset spec doc (for column/synonym context)
```

If `question_source` is not provided, generate questions from the dataset column context (Step 2).

---

## Step 1b: Sample Real Dataset Values (for Testing Only)

**CRITICAL RULE:** AI Readiness configurations (column descriptions, global context, synonyms) must NEVER hardcode specific segment names, category values, customer names, or any instance-specific strings. These vary by customer instance and would break when the skill is reused elsewhere.

**For testing only**, sample actual values from the dataset to use in test questions — so questions feel realistic and test real data paths.

### How to sample values:

Use `mcp__domo-ai-chat__ai_chat_query` with simple discovery questions:

```
1. "What are all the unique values for segment in this dataset?"
   → Captures actual segment names (e.g., "Core", "Customer", "Enterprise") for this instance
   → Use these in test questions like "What is ARR for the [actual segment name] segment?"

2. "What are the unique product family values?"
   → Captures actual product lines for this instance

3. "What is the most recent month available in this dataset?"
   → Anchors all "current" and "most recent month" questions to real data
```

**Discovery questions do NOT count against the test budget** — run them first as setup.

**Use sampled values ONLY in test questions** — never write them into AI Readiness column descriptions or global context.

### Why this matters:
- A test question like "What is ARR for the [Enterprise] segment?" is meaningless if the instance uses "Core" instead of "Enterprise"
- Using real values means the AI must actually find and return the data, not just pattern-match a hardcoded string
- Sampled values must be re-sampled each run — they may change as the dataset updates

---

## Step 2: Build the Test Plan

A good test plan covers **six question categories** that probe different failure modes. Distribute the test budget proportionally:

| Category | % of Budget | What It Tests | Failure Mode |
|---|---|---|---|
| **Balance Queries** | 20% | Current ARR, opening/closing balances | SUM across months = inflated result |
| **Flow Aggregations** | 20% | New bookings, churn, expansion over a period | Generally safe but verify period scoping |
| **Trend / Time Series** | 20% | Month-over-month, period comparisons | Wrong grain, incorrect date filtering |
| **Ranking & Top-N** | 15% | Top 10 customers by ARR, biggest churners | ORDER BY + LIMIT logic |
| **Segment Breakdowns** | 15% | ARR by product family, segment, region | GROUP BY correctness |
| **Ratio / Rate Metrics** | 10% | GRR, NRR, MoM%, churn rate | Division logic, percentage vs absolute |

### Question Design Rules

1. **Include distractor questions** — rephrase balance questions in ways that might tempt the AI to SUM (e.g., "What was our total opening ARR over Q1?" vs "What was our opening ARR entering Q1?")
2. **Include multi-period questions** — "compare Q1 2024 vs Q1 2025" to test year-over-year
3. **Include specificity tests** — "show me the top 5 customers by ARR loss in the last 3 months, broken down by product family" — tests both ranking and segment in one
4. **Include current-state questions** — "what is our ARR right now?" — tests `is_current_month` flag usage
5. **Include plain English variants** — same question phrased technically vs casually

### Example Test Plan (20 tests)

```
BALANCE QUERIES (4 tests)
  B1. What is our current total ARR?
  B2. What was our opening ARR at the start of Q1 2025?
  B3. Show me the closing ARR for each customer in January 2025.
  B4. What was our total ARR entering 2025 vs entering 2024?

FLOW AGGREGATIONS (4 tests)
  F1. How much new ARR did we book in Q1 2025?
  F2. What was total churn in the last 6 months?
  F3. Show me expansion and contraction ARR for 2024 by month.
  F4. What is the net ARR change (new + expansion - contraction - lost) for Q1 2025?

TREND / TIME SERIES (4 tests)
  T1. Show ARR trend over the last 12 months.
  T2. How has churn changed month over month this year?
  T3. What is the MoM ARR growth rate for the last 6 months?
  T4. Is ARR trending up or down? Show me the last 18 months.

RANKING (3 tests)
  R1. Which 5 customers have the highest ARR today?
  R2. Which customers had the largest ARR decline in the last quarter?
  R3. Who are the top 10 customers by new ARR booked in 2025?

SEGMENT (3 tests)
  S1. Break down current ARR by product family.
  S2. Show me churn by customer segment for Q1 2025.
  S3. What percentage of ARR comes from each product line?

RATIO / RATE (2 tests)
  R1. What is our current Gross Revenue Retention?
  R2. Show me Net Revenue Retention by month for the last 6 months.
```

---

## Step 2b: Expand Question Variations

Some test plan questions contain `[option1/option2]` notation — these indicate multiple valid phrasings or breakdown dimensions to test. **Each variation counts as a separate test against the budget.**

### How to expand variations:

1. Identify all questions with `[...]` in the test plan
2. For each bracketed option, create a separate question with that option substituted in
3. Distribute variations across your remaining budget (don't let variations consume > 50% of budget)

**Example:**
```
Original: "Show me [new/expansion/contraction] ARR for the last 3 months"

Expands to 3 tests:
  → "Show me new ARR for the last 3 months"
  → "Show me expansion ARR for the last 3 months"
  → "Show me contraction ARR for the last 3 months"
```

### Why variations matter:
- Tests whether the AI correctly selects `flow_arr_new` vs `flow_arr_expansion` vs `flow_arr_contraction` based on natural language
- Validates synonym mappings in AI Readiness
- Catches cases where AI defaults to the wrong column (e.g., always picking "new" regardless of the question)

### Variation budget rule:
- If budget = 5 and you have 2 questions each with [A/B] options → run 4 variations + 1 standalone = 5 total
- Do NOT expand every variation if it would exceed the budget — pick the highest-risk combinations

---

## Step 3: Execute Tests

Use the `domo-ai-chat` MCP tool to execute each question. **Run questions one at a time** (do not batch) to capture individual response quality.

```
For each question in test plan:
  1. ai_chat_query(instance, question, dataset_id)
     → Returns: { answer, sql_generated, data_returned, endpoint_used, response_time_ms }

  2. Record:
     - question
     - answer (full AI answer)
     - sql_generated (if exposed)
     - data_returned (row count, sample values)
     - response_time_ms
     - error (if any)

  3. Capture dashboard ground truth (Step 3a)
  4. Run evaluation (Step 4)
  5. Wait 1-2 seconds between queries (rate limiting)
```

**Question variation note:** See Step 2b for full variation expansion rules.

**Note:** The streaming endpoint (`/api/ai/v1/assistant/toolkits/DOMO_BASIC_ASSISTANT/execute/streaming`) is stateless — each query is independent. `ai_chat_new_conversation` returns a client-side session token for grouping/tracking only; no server-side conversation state is maintained.

**If `ai_chat_query` fails or returns an error:**
- Log the failure
- Note the error type (auth, endpoint not found / 404, timeout, API error)
- If 404: run `ai_chat_discover_endpoint` to capture the live endpoint from browser network traffic
- Continue with remaining tests — do not abort the full run
- Flag endpoint failures separately in the report

### Step 3a: Capture Dashboard Ground Truth (Multi-Dimensional)

**Critical rule: One screenshot is rarely enough.** A single full-dashboard screenshot only validates scalar totals. For breakdown questions, use the dashboard's own filters to produce per-dimension ground truth values.

#### Scalar questions (total ARR, single metric)
→ One screenshot of the relevant card with no filters applied. Read the number directly.

#### Breakdown questions (by segment, by product, by period, etc.)
→ Apply the dashboard's dimension filter **one value at a time** and screenshot the relevant card for each value.

**Procedure for breakdown validation:**
```
1. Open the dashboard page that contains the relevant card
2. Locate the dimension filter in the dashboard header (e.g., "Segment", "Product Family")
3. For each dimension value the AI returned:
   a. Apply the filter to that single value
   b. Take a screenshot of the target card with filter applied
   c. Record the card's displayed value (tooltip or label)
   d. Clear the filter before setting the next value
4. Build a comparison table: dimension value | dashboard value | AI value | delta
```

**Example — GRR by Segment:**
```
AI returns: Core 99.1%, Customer 92.7%, Prospect 87.5%, Canceled 65.8%

Validation steps:
  → Apply Segment = "Core"    → screenshot GRR card → read 99.9% → record
  → Apply Segment = "Customer" → screenshot GRR card → read 92.7% → record
  → Apply Segment = "Prospect" → screenshot GRR card → read 99.4% → record ← mismatch!
  → Apply Segment = "Canceled" → screenshot GRR card → read 47.4% → record ← mismatch!

Result: Core/Customer pass, Prospect/Canceled fail by >11pp — ETL segment field bug detected
```

#### Period/time-series questions (trend, monthly breakdown)
→ Set the dashboard's Period or date filter to match the range the AI answered for, then screenshot the trend card. For individual month values, use hover/tooltip to read precise data points.

#### Why this matters
A single full-dashboard screenshot showed overall GRR ~93.6% and AI returned a "Customer" segment value of 92.7% — these appeared close enough to score as a PASS. Filter-based validation revealed Prospect and Canceled were off by 11-18 percentage points — a structural ETL bug that would have gone undetected with single-screenshot testing.

---

## Step 4: Evaluate Each Response

Score each response on two dimensions:

### Dimension 1: Mathematical Correctness (0–50 pts)

Check these signals in order:

| Check | Points | How to Verify |
|---|---|---|
| Response returns a number (not "I don't know") | +10 | Response contains digits |
| Number is in plausible range | +10 | ARR values should be in $M range, not $B or $K |
| Balance query uses point-in-time (not SUM) | +15 | Verify AI filtered to a single month, not summed |
| SQL uses correct aggregation for field type | +15 | `SUM(flow_*)` ✅, `SUM(balance_*)` across dates ❌ |

**Ground Truth Verification — approach depends on question type:**

**Single-value questions** (e.g., "what is total ARR?"):
- One dashboard screenshot with the matching filter applied is sufficient
- If the question asks for opening/closing ARR, check if the SQL (if exposed) uses `WHERE date_month = ...` vs `SUM(...) GROUP BY ...`
- If no SQL is exposed, check if the answer matches the expected single-month value from the dashboard

**Multi-dimensional questions** (e.g., "GRR by segment", "ARR by product family"):
- You MUST apply the dashboard filter for EACH dimension value and take a separate screenshot. Do NOT accept a single overall screenshot as ground truth for breakdown questions. Compare AI Chat's per-dimension values against the per-dimension filtered dashboard values.
- Use the dashboard's page-level filter controls to isolate one dimension at a time (e.g., filter to Segment = "Core", screenshot the GRR card; then filter to Segment = "Customer", screenshot; etc.)
- A single overall screenshot may show a blended number that appears to match the AI's weighted average — masking per-dimension discrepancies that only emerge when filters are applied

**Multi-dimensional correctness — REQUIRED for breakdown questions:**
- Do NOT score a breakdown question against only the overall total
- Each dimension value in the AI response must be verified independently using per-filter dashboard screenshots (see Step 3a)
- A response that gets 2/4 segments correct scores partial, not full, Mathematical Correctness
- A >5% delta on any individual dimension value = deduct 10 pts per failing dimension (up to -30 pts total)

### Dimension 2: Business Completeness (0–50 pts)

| Check | Points | Criteria |
|---|---|---|
| Answers the actual question asked | +20 | Does not deflect or answer a different question |
| Provides appropriate breakout | +15 | Segment question gets segment breakdown, not a single total |
| Includes useful context | +10 | Adds helpful qualifiers (e.g., "This is as of March 2025") |
| Actionable or insight-adjacent | +5 | Notes trends, flags anomalies, or provides comparison |

### Scoring Grades

| Score | Grade | Interpretation |
|---|---|---|
| 90–100 | ✅ Excellent | Production-ready |
| 75–89 | 🟡 Good | Minor issues, usable with caveats |
| 50–74 | 🟠 Needs Work | Specific failure patterns need fixing |
| 0–49 | ❌ Failing | Do not demo — dataset or AI Readiness has structural issues |

---

## Step 5: Produce Test Report

Save the report to `qa-output/ai-chat-test-report-[dataset_name]-[date].md`.

### Report Template

```markdown
# AI Chat Test Report: [Dataset Name]
**Date:** [Date]
**Instance:** [instance].domo.com
**Dataset ID:** [id]
**Test Budget:** [N] questions
**Overall Score:** [X]/100 — [Grade]

---

## Executive Summary

[2-3 sentences: overall quality, key finding, recommended action]

---

## Score Breakdown

| Category | Tests Run | Avg Score | Pass Rate | Top Issue |
|---|---|---|---|---|
| Balance Queries | N | XX/100 | XX% | [issue] |
| Flow Aggregations | N | XX/100 | XX% | [issue] |
| Trend / Time Series | N | XX/100 | XX% | [issue] |
| Ranking | N | XX/100 | XX% | [issue] |
| Segments | N | XX/100 | XX% | [issue] |
| Ratios | N | XX/100 | XX% | [issue] |

---

## Question-by-Question Results

### ✅ PASS — [Category]
**Q:** [question]
**A:** [response summary]
**Score:** [X]/100
**Notes:** [any observations]

---

### ❌ FAIL — [Category]
**Q:** [question]
**A:** [response summary]
**Score:** [X]/100
**Failure Mode:** [balance_sum_inflation | wrong_grain | no_answer | wrong_breakout | api_error]
**Fix:** [specific recommendation]

---

## Failure Pattern Analysis

### Detected Patterns
| Pattern | Count | Questions Affected | Recommended Fix |
|---|---|---|---|
| balance_sum_inflation | N | B1, B4, T4 | Strengthen balance_ column descriptions |
| wrong_grain | N | T1, T3 | Add date filtering examples to global context |
| no_answer | N | F4 | Add flow_arr_net_change synonym |
| api_error | N | — | Check AI Readiness configuration |
| weighted_avg_error | N | — | Update column description to prohibit AVG(); use SUM(numerator)/SUM(denominator) instead |

**`weighted_avg_error`**
- **Pattern**: AI uses `AVG(ratio_column)` which gives equal weight to each row regardless of revenue size. Affects GRR, NRR, and any pre-computed per-row ratio column.
- **Detection**: Compare AI's segment-level ratio to the dashboard's filtered view. If they diverge significantly (>5 percentage points), this is likely the cause.
- **Fix**: Update the column description to say "Do NOT use AVG() — instead compute as SUM(numerator components) / NULLIF(SUM(denominator), 0)"

---

## AI Readiness Configuration Recommendations

Based on test results, the following changes are recommended:

1. [Specific column description to update]
2. [Global context addition]
3. [Column to add/remove from AI dictionary]
4. [Synonym to add]

---

## Test Execution Details
**Total Questions:** [N]
**Passed (≥75):** [N] ([%])
**Failed (<75):** [N] ([%])
**Errors:** [N]
**Avg Response Time:** [X]ms
**Total Credits Used:** ~[N] (estimated)
```

---

## Guardrails

- **Never exceed the test budget.** Count carefully — AI Chat queries cost credits.
- **Do not ask the same question twice** unless testing rephrasing robustness (explicitly marked in test plan).
- **Each query is independent.** The streaming endpoint is stateless — no context bleeds between questions.
- **Always record the raw response.** Even if it looks correct, record it — patterns emerge across the full set.
- **Do not evaluate based on UI screenshots alone.** The API response is the ground truth.
- **If the endpoint can't be reached, run `ai_chat_discover_endpoint` first** — do not guess the API URL.
- **Balance query scoring is strict.** A balance answer that inflates 3× is a ❌ even if it returns a number.
- **For breakdown/segment questions, always validate using the filter-per-dimension approach** — one dashboard screenshot per dimension value. Do not accept a single unfiltered screenshot as ground truth for multi-dimensional questions.
- **Pre-computed ratio columns** (e.g., grr_monthly, nrr_monthly) should never be aggregated with AVG() — always use the component columns and compute weighted ratios.
- **Never hardcode segment names, customer names, or category values in AI Readiness.** Use the `balance_`/`flow_` prefix convention and describe column semantics generically. Specific values are for test questions only, sampled fresh each run.

---

## MCP Tools Used

| Tool | When | Purpose |
|---|---|---|
| `mcp__domo-ai-chat__ai_chat_query` | Steps 3–4 | Execute each test question via streaming endpoint |
| `mcp__domo-ai-chat__ai_chat_new_conversation` | Before test run | Get a session token for grouping/tracking |
| `mcp__domo-ai-chat__ai_chat_discover_endpoint` | On 404 errors | Capture the live endpoint from browser network traffic |
| `mcp__domo-ai-chat__health_check` | Step 1 | Verify connectivity and report current endpoint |

---

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: test scenarios executed, pass/fail results, prompt/response quality observations, edge cases discovered.

## Related Skills

- **etl-builder** — rebuild the ETL if structural fixes are needed
- **dashboard-auditor** — audit the visual layer if the AI layer passes but users still confused
- **adoption-enablement** — once AI Chat is validated, this skill plans the rollout
