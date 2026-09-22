---
name: deep-memory-research
tier: 1
description: "Broad and deep cross-portfolio research over organizational memory — go beyond single-account recall to query across tens, hundreds, or all ~3,000+ accounts. Resolve a cohort, aggregate/slice it, sample it, and iteratively drill deeper, then synthesize. Trigger with 'across the portfolio', 'how many accounts', 'which customers', 'where else have we', 'how are customers using', 'cohort of', 'finance customers', 'portfolio research', 'catalog of use cases', 'common patterns across', or any question about the customer base as a whole rather than one account."
maturity: alpha
pipeline:
  phase: discover
  sub_phase: portfolio-intelligence
  position: 5
  output_type: output
  wave: 1
  state: ready
  outputs:
    - name: portfolio-research-findings
      format: markdown
      downstream: []
  data_sources:
    - tool: memory_cohort
      required: true
    - tool: memory_query
      required: true
    - tool: memory_similar_accounts
      required: false
  phase_gate: false
---

# Deep Memory Research — Cross-Portfolio Querying

Answer questions about the **customer base as a whole**, not just one account: "how many accounts have more than one use case," "how are customers using Code Engine," "where else have we solved a Tableau migration," "which finance customers look like our best reference." This is the portfolio counterpart to `memory_recall` (which is single-account, top-K retrieval).

## When to use this vs. memory_recall

- **memory_recall** → "what do we know about **account X**?" (one account, semantic retrieval)
- **deep-memory-research** → "**across the portfolio**, how many / which / where else / how are customers…?" (cohorts, aggregation, cross-account patterns)

If the question names a single account, use `memory_recall`/`memory_bundle`. If it spans many accounts or asks for counts/distributions/patterns across the base, use this skill.

## The tools

| Tool | Purpose | Tier |
|------|---------|------|
| `memory_cohort` | Resolve a set of accounts from a predicate (topic_keys, certainty, industry, account_ids, min_entries, all) → `{ cohort_id, size, account_ids }` | instant |
| `memory_query` | Run `op` over a cohort/predicate: **aggregate** (counts), **distribution** (group-by), **scan** (raw sample) | instant |
| `memory_similar_accounts` | Accounts similar to a given one, from shared use-case types + pattern families | instant |

The canonical graph layer these ride on: `UseCaseType`/`UseCaseCategory`, `PatternFamily`, `CanonicalCapability`, `Industry`, `Outcome` (value_pillar). Use `distribution` `group_by` to roll up along any of these.

## The loop (broad → deep)

```
1. FRAME     What's the population? What's the metric or lens?
2. COHORT    memory_cohort → resolve the account set (start broad; `all` for whole base)
3. SHAPE     memory_query op=aggregate / op=distribution → get counts + the breakdown (instant, free)
4. SAMPLE    memory_query op=scan (small limit) → sanity-check what the data actually says
5. DRILL     Narrow to a sub-cohort (add topic_keys / certainty / industry) and repeat 3–4
6. SYNTHESIZE  Report the numbers + the "so what", citing dimensions/accounts
```

Always **aggregate before you scan**, and **sample before you conclude**.

## Discipline (learned the hard way)

- **Confirmed ≠ mentioned.** Default `certainty: ["confirmed","in_build"]` when the question implies real/active use cases, not casual mentions. Say which you used.
- **Prefer aggregation over pulling rows.** `aggregate`/`distribution` answer most questions in seconds without loading content into context. Use `scan` only to sample or to feed a deeper synthesis.
- **AI / integration are means, not ends.** When cataloging use cases, treat "AI" and "data integration" as properties of a business use case, not use cases themselves.
- **Cite provenance.** Memory is ~99% call-derived; join CRM (via compass-domo tools) for hard numbers like ARR/renewal dates when a cohort needs them.
- **Watch scope.** Cohorts cap at 5,000 accounts and scans at 500 rows per call — paginate with `offset` for bulk.

## Worked examples

**"How many accounts have more than one confirmed use case?"**
1. `memory_query op=aggregate` with `predicate: { topic_keys:["use_cases"], certainty:["confirmed","in_build"] }`, `params: { metric:"count_accounts", filter:{ topic_keys:["use_cases"], certainty:["confirmed","in_build"] }, having_min_per_account: 2 }`.

**"How are customers using our capabilities?"**
1. `memory_cohort { all: true }` → cohort.
2. `memory_query op=distribution params={ group_by:"capability" }` → CanonicalCapability rollup (Connectors, Magic ETL, Code Engine, Domo AI…) by account count.

**"Where else have we solved something like this — build me a play."**
1. `memory_cohort { topic_keys:["use_cases","technology_stack"] }` (optionally `industry`).
2. `memory_query op=distribution params={ group_by:"pattern_family" }` → which approaches recur and at how many accounts.
3. `memory_query op=scan` a sample of the top family's accounts to pull the approach detail; synthesize into a playbook (path, gotchas, outcomes).

**"Which accounts look like [reference account]?"**
1. `memory_similar_accounts { account_id }` → ranked by shared use-case types + pattern families.

## Output

A concise findings report: the headline number(s), the breakdown table (from `distribution`), the "so what," and any caveats (certainty filter used, sample size, that figures are AI-derived from call memory). For heavy synthesis deliverables (playbooks, catalogs), hand off to `portfolio-synthesis` / the relevant build skill.
