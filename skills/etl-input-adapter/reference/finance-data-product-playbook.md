# Finance Data Product — Validation & Build Playbook

**Scope:** Any ERP-sourced GL pipeline producing Balance Sheet (BS) and/or Income Statement (IS) outputs through a Magic ETL chain. Covers NetSuite, SAP, Oracle, Sage, QuickBooks, and any double-entry GL feed.

This playbook is **generic** — it describes the approach, common pitfalls, and validation methodology without referencing specific dataset IDs, dataflow IDs, or customer dollar targets. Adapt every step to the client's actual ERP, chart of accounts (CoA), and data feeds.

---

## 1. ETL Chain Architecture & the Template Model

### The Finance Data Product ETL is a Template

The Layer 2 "Finance Data Product" ETL is a **pre-built template** copied from a squads/accelerator instance into the client's Domo instance. It is designed to work flexibly across clients without modification — provided the upstream staging layer feeds it data that matches its expected input schema (the "data contract").

**The job of this skill is to build the upstream staging layer (Layer 1), not to modify the data product ETL itself.**

```
ERP / GL Source (varies per client)
    ├── GL Transactions (journal lines: debit/credit per period per account)
    ├── Chart of Accounts (full account list with account type, hierarchy)
    ├── Trial Balance (optional — period-end balances for a starting point)
    ├── Exchange Rates (if multi-currency)
    └── Fiscal Calendar / Accounting Periods
            ↓
    ┌──────────────────────────────────────────────────────┐
    │  Layer 1: Staging / Input Adapter ETL(s)  [Bronze]   │
    │  ← THIS IS WHAT WE BUILD — one or more ETLs that     │
    │    transform client data to match the data product's  │
    │    input contract / schema expectations                │
    └──────────────────────────────────────────────────────┘
            ↓  (output datasets match the template's expected inputs)
    ┌──────────────────────────────────────────────────────┐
    │  Layer 2: Finance Data Product ETL  [Silver / Viz]   │
    │  ← TEMPLATE — copied from squads instance, treated   │
    │    as a fixed contract. Only minor adjustments made   │
    │    (sign logic account types, RE handling, period     │
    │    sort — see Section 4, 11)                          │
    └──────────────────────────────────────────────────────┘
            ↓
    Dashboard Cards (Balance Sheet, Income Statement, Validation)
```

### What Changes Where

| Layer | Who Builds It | What Changes Per Client |
|-------|---------------|------------------------|
| **Layer 1 — Staging ETL(s)** | This skill creates NEW ETLs | Everything. Schema mapping, joins, FX conversion, CoA alignment, date field selection, filtering, aggregation — all client-specific adaptation lives here. Always new ETLs; never edit existing client ETLs. |
| **Layer 2 — Data Product ETL** | Template from squads | Only sections explicitly marked as optional or requiring adjustment. The template contains comments/notes on tiles indicating what can be changed (e.g., "Optional: remove if no currency conversion", "Adjust account_type values for client ERP"). Edit those marked sections only — sign adjustment codes (Section 11), RE calculation variant (Section 4), period sort key (Lesson #9), dropping optional branches. Everything else is untouched. |
| **Dashboard Cards** | Template or manually built | Filters (report = BS or IS), intercompany toggle, CoA level drill-down. |
| **Existing client assets** | Client owns these | **NEVER edit or delete.** All existing ETLs, datasets, cards, and pages in the client instance are read-only. Study them for context, but do not modify. |

### Asset Protection Rule

**Do not edit or delete any existing asset in the client's Domo instance.** This includes ETLs, datasets, cards, pages, and any other Domo objects that were there before this engagement. The only assets you modify are:
1. **New staging ETLs you create** (you own these)
2. **The data product template ETL** — and only the sections it explicitly marks as optional/adjustable

If source datasets for the staging layer are not obvious, **ask the user** or search the instance by key terms (ERP name, "GL", "trial balance", "chart of accounts", "exchange rate", etc.) to discover what's available. Never assume.

### The Data Contract

The data product ETL expects specific input datasets with specific schemas. Before building any staging ETL, **analyze the template's input slots** (Phase 1 of the parent SKILL.md) to extract the exact column names, types, and how each column is used (join key, filter, expression, group-by). The staging ETL's output must match this contract exactly.

Study the template ETL to identify which branches/inputs are marked optional. If the client's use case doesn't require an optional branch (e.g., no multi-currency → the FX conversion branch is unnecessary), that branch and its input slot can be removed from the template. Only do this when the template explicitly marks it as optional.

### Why Fan-Out and Other Issues Still Happen

Even though the template is well-designed, issues can still surface in the output. These are almost always caused by the **staging layer** feeding bad data:

| Symptom in Data Product Output | Likely Staging Layer Cause |
|-------------------------------|---------------------------|
| Balances are 10x–100x too large | FX rate table not deduplicated before join — fan-out |
| Accounts silently missing | Wrong join type (INNER instead of LEFT) dropping unmatched rows |
| Duplicate rows in output | Wrong join keys chosen, or source data has duplicates not cleaned |
| Wrong period assignments | Wrong date field used in calendar join (transaction date vs posted date) |
| Unexpected dimension explosion | High-cardinality columns passed through instead of pre-aggregated |
| Currency amounts already converted being re-converted | Wrong amount field selected (reporting currency field treated as local currency) |

The data product ETL is designed to deploy and work flexibly — **all adaptation happens in the staging layer**.

---

## 2. Starting Balance — The Foundation

The single most important decision is **where balances start**.

### 2a. Trial Balance as Starting Point (Preferred)

If the client provides a **trial balance** (TB) for a specific point in time as a separate input to the ETL — use that as the opening balance anchor. This is superior to rebuilding from GL since inception because:
- You avoid needing the full GL history (which the connector may not have)
- You get a client-verified starting position
- You can validate immediately: the TB should balance (debits = credits, or Assets = L + E)

**Confirm this immediately:**
1. Is the starting TB a separate input dataset (not derived from GL)?
2. What period does it represent? (e.g., "as of Dec 31 2024")
3. Does it balance? Run: `SUM(debit) - SUM(credit)` or `SUM(balance) WHERE report = 'Balance Sheet'` — result should be zero or near-zero

If it balances → the CoA mapping and the TB merge are correct for that point in time. This is your baseline.

### 2b. Building from GL Since Inception

If no standalone TB is provided, the ETL accumulates all GL transactions from the earliest available period. Risks:
- The GL connector may only load N months of history — older periods are missing
- The earliest period may be a bulk migration load (all prior history posted to one period)
- If the GL doesn't go back far enough, cumulative BS balances will be understated

**Check:** What is the earliest period in the GL? Does the client confirm that covers their full history, or is there a cutoff?

### 2c. Hybrid: TB Start + GL Accumulation

The standard pattern in the Jumpstart ETL template:
1. Load a starting TB for period P₀
2. Load GL transactions for all periods after P₀
3. For each subsequent period: `balance = starting_TB_balance + SUM(GL_activity from P₀+1 to current period)`

This is the most robust approach. Validate the starting TB balances first, then step forward.

---

## 3. Period-by-Period Validation Approach

### Step 1: Validate the Starting Balance

Confirm the starting TB (or the first period of GL if building from inception) produces a balanced Balance Sheet:

```sql
SELECT
    CASE
        WHEN account_type IN (<asset_types>) THEN 'Assets'
        WHEN account_type IN (<liability_types>) THEN 'Liabilities'
        WHEN account_type IN (<equity_types>) THEN 'Equity'
    END AS bs_section,
    SUM(balance) AS total
FROM starting_trial_balance
GROUP BY bs_section
```

**Assets − Liabilities − Equity = 0** (the fundamental BS equation). If this doesn't hold at the starting point, the issue is one of:
- CoA mapping is incomplete (accounts not classified into BS sections)
- Accounts are missing from the TB feed (permission issue, bad filter, connector config)
- The GL/TB data itself doesn't include all accounts

### Step 2: Step Forward One Month at a Time

After the starting balance validates, advance one period at a time:

| Period | Balanced? | Diagnosis |
|--------|-----------|-----------|
| P₀ (starting TB) | Yes ✓ | Baseline confirmed |
| P₁ (first GL month) | ? | If NO → GL transactions are introducing imbalance. Check: are all GL entries double-sided? Missing accounts in GL feed? |
| P₂ | ? | If P₁ was fine but P₂ breaks → look at P₂-specific transactions |
| P₃ ... | ? | Continue stepping forward |

**Interpretation guide:**

- **Imbalance from P₀ (starting balance doesn't balance):** CoA issue. Accounts are missing or misclassified. The CoA doesn't cover all accounts in the TB, or BS/IS report assignment is wrong.

- **Imbalance immediately at P₁ (first GL month):** The GL feed is likely missing accounts that are in the CoA. Check:
  - Are all GL accounts present in the CoA? (`GL accounts NOT IN CoA accounts`)
  - Are CoA accounts missing from GL? (expected zero-balance accounts — see Section 5)
  - Is the GL feed filtered in a way that drops certain account types or subsidiaries?

- **Imbalance appears at a specific later month (e.g., P₅):** The issue is period-specific. Common causes:
  - A journal entry that posted to only one side (data quality issue in ERP)
  - Intercompany entries that don't net to zero (see Section 7)
  - Currency conversion applied inconsistently in that period (see Section 8)
  - A new account was created in the ERP but not yet in the CoA feed
  - Retained Earnings calculation diverges (see Section 4)

- **Imbalance grows linearly over time:** Usually a Retained Earnings issue — net income isn't being rolled into equity correctly, so the gap compounds each period.

### Step 3: Compare to Client-Provided Validation Data

Clients may provide validation files in various formats:
- **Rolled-up section totals** (e.g., "Total Assets = $X for Feb 2026")
- **Account-level detail by month** (full TB export)
- **Only certain months** (e.g., quarter-end snapshots)

**Strategy: Compare as early as possible.**

For **Balance Sheet**: Start with the earliest available validation period. BS is cumulative — deviations compound over time. If you match at an early period but diverge later, the problem is isolated to the intervening months. If you diverge from the start, it's a structural issue (CoA, starting balance, missing accounts).

For **Income Statement**: Any month is fair game for comparison since IS is period-specific (non-cumulative). Exception: the most recent month may not be closed in the ERP — skip it unless the client confirms it's final.

**Comparison approach:**
1. Match at the highest level first (Total Assets, Total Liabilities, Total Equity)
2. Drill into sections (Current Assets, Fixed Assets, Current Liabilities, etc.)
3. Drill into individual accounts only where section-level variances exist
4. Tolerance: < 0.5% variance is often acceptable for FX rounding. Document any variance and its cause.

---

## 4. Retained Earnings — The Most Dangerous Section

Retained Earnings (RE) is the link between the Balance Sheet and Income Statement. It represents cumulative net income from all prior periods. Getting RE wrong creates the single largest source of BS imbalance.

### How the ETL Calculates RE

The standard pattern:
```
RE_balance = historical_opening_RE + SUM(net_income for each period)
```

Where `net_income = Revenue − Expenses` (the IS bottom line) for each period.

### Variants to Try

Different clients and ERPs handle RE differently. Try these variants:

1. **Monthly RE accumulation:** Each month's net income is added to the prior month's RE balance. This is the most common pattern.

2. **Annual RE accumulation:** Net income only rolls into RE at year-end. During the year, current-year net income sits in a separate "Current Year Earnings" line. At year-end close, it moves to RE.

3. **Mixed:** The ERP auto-posts a year-end close entry that moves net income to RE. During mid-year, you may see both the RE historical balance AND current-year activity as separate lines.

### Common Pitfalls

- **GL already contains RE entries:** Some ERPs post journal entries to the RE account monthly. If you also calculate RE as sum-of-net-income, you double-count it. Check: does the GL have any postings directly to RE accounts? If yes, you may need to exclude those and rely on the ETL's calculated RE, or vice versa — use the GL's RE postings and skip calculating.

- **Partial RE in GL:** Some ERPs post annual close entries but not monthly accumulation. In this case, you get the historical RE from the GL, but need to add current-year net income manually in the ETL.

- **No RE in GL at all:** The ERP tracks RE as a system-calculated value, not as posted journal entries. The ETL must calculate RE entirely: `RE = opening_RE_balance + SUM(all net income since inception)`.

- **Historical opening balance lines:** Some ERPs (NetSuite in particular) include a large historical opening balance in the GL as a special transaction type (e.g., `trantype = 'Revenue Recognition'` or a specific memo). Excluding this will create a multi-billion dollar gap. Including it correctly anchors the historical RE.

**Diagnosis:**
```sql
-- Check what entries exist on RE accounts
SELECT account_number, account_name, period_id, transaction_type, memo,
       SUM(amount) as total
FROM gl_transactions
WHERE account_number IN (
    SELECT account_number FROM chart_of_accounts
    WHERE account_type IN ('RetainedEarnings', 'Equity')
)
GROUP BY account_number, account_name, period_id, transaction_type, memo
ORDER BY ABS(SUM(amount)) DESC
```

Try different RE calculation approaches and compare the resulting BS balance (Assets - L - E) to see which produces zero.

---

## 5. Chart of Accounts Completeness

The CoA is the master list of all accounts. Every account in the GL and TB must map to the CoA for proper classification.

### Checks

```sql
-- Accounts in GL but not in CoA (these will be unclassified / dropped)
SELECT DISTINCT gl.account_number
FROM gl_transactions gl
LEFT JOIN chart_of_accounts coa ON gl.account_number = coa.account_number
WHERE coa.account_number IS NULL

-- Accounts in CoA but not in GL (zero-balance accounts — normal, but should appear as $0)
SELECT coa.account_number, coa.account_name, coa.account_type
FROM chart_of_accounts coa
LEFT JOIN gl_transactions gl ON coa.account_number = gl.account_number
WHERE gl.account_number IS NULL
```

### Zero-Balance Accounts

If the ETL starts from GL transactions (not from CoA), accounts with no activity in a period simply disappear from the output. This is a problem for BS reporting because those accounts should show $0, not be absent.

**Fix:** Build the ETL starting from the CoA, cross-joined with periods, then LEFT JOIN GL transactions. This ensures every account appears for every period.

### Report Assignment

Every account must be assigned to either "Balance Sheet" or "Income Statement" (the `report` field in the CoA). If this classification is wrong:
- An asset account tagged as IS will appear as revenue/expense
- An expense account tagged as BS will inflate equity

**Always verify:** Does the CoA have a `report` field? Is it populated for all accounts? Do the assignments match the client's expectations?

---

## 6. Validation Cards — What They Should Look Like

Build validation cards as Domo dashboard cards to provide ongoing monitoring of the data product's accuracy.

### Card 1: BS Balance Check by Period (Pivot Table)

**Structure:** Pivot table with periods as columns and BS sections as rows.

| | Jan 2025 | Feb 2025 | Mar 2025 | ... |
|---|---|---|---|---|
| Total Assets | $X | $X | $X | |
| Total Liabilities | $X | $X | $X | |
| Total Equity | $X | $X | $X | |
| **A − L − E (should = 0)** | **$0** | **$0** | **$0** | |

**Filter:** `report = 'Balance Sheet'`

A non-zero value in the bottom row for any period signals an imbalance that needs investigation.

### Card 2: Account Detail by CoA Levels (Pivot Table)

**Structure:** Rows = CoA hierarchy levels (Level 1 → Level 2 → Level 3 → Account), Columns = Periods.

| Level 1 | Level 2 | Level 3 | Account | Jan 2025 | Feb 2025 | ... |
|---|---|---|---|---|---|---|
| Assets | Current Assets | Cash | 10100 - Operating Cash | $X | $X | |
| Assets | Current Assets | Cash | 10200 - Savings | $X | $X | |
| Assets | Current Assets | AR | 11000 - Trade AR | $X | $X | |

**Filter:** `report = 'Balance Sheet'` or `report = 'Income Statement'` (build one card per report type, or use a card filter to toggle).

This lets you drill from section totals down to individual accounts to find where variances live.

### Card 3: Income Statement by CoA Levels (Pivot Table)

Same structure as Card 2 but filtered to `report = 'Income Statement'`.

| Level 1 | Level 2 | Account | Jan 2025 | Feb 2025 | ... |
|---|---|---|---|---|---|
| Revenue | Product Revenue | 40100 - Sales | $X | $X | |
| Revenue | Service Revenue | 40200 - Consulting | $X | $X | |
| COGS | Direct Costs | 50100 - Materials | $X | $X | |
| Expenses | SG&A | 60100 - Salaries | $X | $X | |
| **Net Income** | | | **$X** | **$X** | |

### Card 4: Account Count by Period

**Purpose:** Detect accounts appearing/disappearing across periods.

```sql
SELECT period_id, COUNT(DISTINCT account_number) as account_count
FROM trial_balance_output
GROUP BY period_id
ORDER BY period_id
```

A sudden drop in account count signals a data feed issue (connector filter, permission change). A sudden increase may mean new accounts were added in the ERP.

### Card 5: Intercompany & IC Elimination View

**Purpose:** Show intercompany (IC) accounts separately so they can be validated in isolation. See Section 7.

**Filter:** Add a filter for `is_intercompany = 'Y'` / `is_intercompany = 'N'` to toggle IC accounts on/off at the card level. Also filter for `is_ic_elimination = 'Y'` to see elimination entries.

---

## 7. Intercompany Accounts & IC Eliminations

### Why Flag Them

Intercompany (IC) accounts represent transactions between entities within the same parent company (e.g., Subsidiary A bills Subsidiary B). At a consolidated level, these should cancel each other out — the receivable in Sub A should equal the payable in Sub B.

IC elimination entries are journal entries that zero out these intercompany balances for consolidated reporting.

### Do Intercompany Entries Cancel Each Other Out?

**In theory, yes.** IC receivables and IC payables should net to zero at the consolidated level.

**In practice, often no.** Common reasons IC doesn't net to zero:
- **Timing differences:** Sub A records the IC invoice in March, Sub B records it in April
- **FX differences:** IC transactions between entities with different functional currencies create translation variances
- **Partial eliminations:** The ERP's elimination entries may not cover all IC activity (especially recent months that haven't been reconciled)
- **Wrong direction:** Sometimes IC entries are posted on the wrong side (debit vs credit), causing them to double instead of cancel
- **Missing elimination journals:** The ERP may have the IC activity but the elimination entries haven't been posted yet

### Approach

1. **Flag IC accounts in the CoA** — add an `is_intercompany` flag. Common patterns:
   - Account name contains "Intercompany", "IC", "Elimination"
   - Account is in a specific account number range (e.g., 19000-19999)
   - The CoA has an explicit IC flag field

2. **Flag IC elimination entries in the GL** — add an `is_ic_elimination` flag. Common patterns:
   - Transaction type is "Elimination" or "IC Elimination"
   - Journal memo contains "Elimination" or "Intercompany"
   - Subsidiary = "Elimination" entity

3. **Build validation cards with IC filter** — allow toggling IC accounts on/off at the card level:
   - **Including IC:** Shows the full picture as the ERP sees it
   - **Excluding IC (and eliminations):** Shows the "clean" consolidated view — this is what external reports should match

4. **Check if IC nets to zero:**
   ```sql
   SELECT period_id,
          SUM(CASE WHEN is_intercompany = 'Y' THEN balance ELSE 0 END) as ic_net
   FROM trial_balance_output
   GROUP BY period_id
   ORDER BY period_id
   ```
   If `ic_net` is non-zero, investigate the timing/FX/direction issues above.

5. **Filter IC out at the final card level**, not in the ETL. Keep IC data flowing through the ETL so it can be analyzed separately, but filter it out on the dashboard cards that compare to client-provided reports (which are typically post-elimination).

---

## 8. Currency Conversion

### Common Pitfalls

1. **Exchange rate fan-out:** Multi-currency ERP systems often store exchange rates with one row per subsidiary pair per currency per period. A raw JOIN on currency + period produces N rows per transaction (one per subsidiary). **Always deduplicate the rate table before joining:**
   ```sql
   SELECT from_currency, period_id, to_currency, MIN(rate) AS rate
   FROM exchange_rates
   WHERE to_currency = '<reporting_currency>'
   GROUP BY from_currency, period_id, to_currency
   ```

2. **INNER JOIN drops:** If the exchange rate table doesn't have a row for a particular currency + period combination, an INNER JOIN silently drops those transactions. **Always use LEFT JOIN** with `COALESCE(rate, 1.0)` to default missing rates to 1:1 (acceptable for reporting-currency-native transactions).

3. **Wrong rate type for BS vs IS:**
   - Balance Sheet: Use **period-end (closing) rate** for asset/liability translation
   - Income Statement: Use **average rate** for revenue/expense translation
   - Equity: Use **historical rate** (rate at the time equity was contributed)
   - Check if the client's rate table has separate rate types or if a single rate is used for all

4. **Wrong amount field:** The GL may have multiple amount fields:
   - `amount` or `netamount` — in the transaction's original currency
   - `amount_foreign` — in the entity's functional currency
   - `amount_reporting` — already converted to reporting currency
   - If the source data is already in reporting currency, **do not apply FX conversion again**

5. **Currency code mismatch:** The GL may use ISO codes (USD, EUR) while the rate table uses internal IDs (1, 2, 3). Ensure the join keys match.

### Diagnosis
```sql
-- Check how many GL lines have no matching exchange rate
SELECT gl.currency, COUNT(*) as unmatched_lines, SUM(ABS(gl.amount)) as total_exposure
FROM gl_transactions gl
LEFT JOIN exchange_rates_deduped fx
    ON fx.from_currency = gl.currency AND fx.period_id = gl.period_id
WHERE fx.from_currency IS NULL
GROUP BY gl.currency
ORDER BY total_exposure DESC
```

If the reporting currency (e.g., USD) shows up as unmatched, that's usually fine — those transactions don't need conversion. But if non-reporting currencies are unmatched with significant dollar amounts, the rate table is incomplete.

---

## 9. Date Field Selection

ERPs typically have multiple date fields per transaction:

| Field | Meaning | When to Use |
|-------|---------|-------------|
| Transaction Date | When the business event occurred | Most common for financial reporting |
| Posted Date | When the journal entry was posted to the GL | Use when the client's reporting aligns to posting periods |
| Effective Date | When the transaction takes economic effect | Sometimes used for accruals |
| Created Date | System timestamp when the record was created | Almost never used for reporting |

### How to Decide

1. **Ask the client** which date their reports are based on. Different ERP configurations report on different date bases.
2. **Check the fiscal calendar join:** The ETL maps transactions to periods via a date field + fiscal calendar lookup. If the wrong date field is used, transactions land in the wrong period.
3. **Test:** Run a comparison of transaction counts by period using each date field. The one that matches the client's period-level totals is correct.

```sql
-- Compare row counts by period for different date fields
SELECT 'transaction_date' as date_field, fiscal_period(transaction_date) as period, COUNT(*) as rows
FROM gl_transactions GROUP BY period
UNION ALL
SELECT 'posted_date', fiscal_period(posted_date), COUNT(*)
FROM gl_transactions GROUP BY fiscal_period(posted_date)
```

---

## 10. Common Root Causes — Diagnostic Reference

Most issues surface in the data product ETL's output but originate in the **staging layer**. The "Fix Layer" column indicates where the fix belongs.

### Structural Issues (Detected at Starting Balance)

| Symptom | Root Cause | Fix | Fix Layer |
|---------|------------|-----|-----------|
| BS doesn't balance at P₀ | CoA doesn't classify all accounts into BS sections | Audit CoA — find unclassified accounts | **Staging** |
| Many accounts show $0 when they shouldn't | TB feed is filtered or missing accounts | Check connector permissions, filters | **Staging** |
| Account counts don't match CoA | Staging ETL starts from GL, not CoA | Rebuild staging starting from CoA with LEFT JOIN | **Staging** |
| Massive unexpected balances | Historical opening balance included/excluded incorrectly | Check for bulk migration period entries | **Staging** |

### Period-Specific Issues (Detected When Stepping Forward)

| Symptom | Root Cause | Fix | Fix Layer |
|---------|------------|-----|-----------|
| BS balance breaks at specific month | Journal entry with one-sided posting, or new account not in CoA | Check GL entries for that month; update CoA | **Staging** |
| Imbalance grows linearly over time | RE calculation wrong — net income not rolling into equity | Adjust RE calc (see Section 4) | **Template** (minor) |
| Balances are 10x–100x too large | FX rate fan-out (rate table not deduplicated in staging) | Deduplicate rate table before join | **Staging** |
| Accounts silently disappear | INNER JOIN on rate table dropping unmatched rows in staging | Switch to LEFT JOIN with COALESCE | **Staging** |
| Signs are inverted (liabilities show negative) | Sign adjustment expression uses wrong account_type codes | Query actual account_type values, update expression | **Template** (minor) |
| Periods sort wrong in running totals | String-based period sort (Apr before Jan) | Sort by numeric key: `year * 100 + month` | **Template** (minor) |

### Data Quality / Staging Layer Issues

| Symptom | Root Cause | Fix | Fix Layer |
|---------|------------|-----|-----------|
| Recent month totals don't match client | Month not yet closed in ERP — accruals/adjustments pending | Skip current open period for comparison | **Staging** (filter) |
| IS totals match but BS diverges | RE handling differs between Domo and ERP | Try different RE variants (Section 4) | **Template** (minor) |
| Certain accounts have wildly wrong balances | Wrong amount field used (original vs functional vs reporting currency) | Check which amount field the client's reports use | **Staging** |
| Row counts spike in recent periods | Dimension explosion from high-cardinality journal types | Pre-aggregate to account × period grain before scaffold | **Staging** |
| Duplicate rows causing inflated totals | Wrong join keys in staging, or source data has duplicates | Fix join keys, add dedup step in staging | **Staging** |
| Currency amounts double-converted | Staging applied FX conversion to already-converted reporting currency field | Use the correct amount field; don't re-convert | **Staging** |
| Wrong period assignments | Wrong date field used in staging calendar join | Switch from transaction_date to posted_date or vice versa | **Staging** |

---

## 11. Sign Adjustment — Account Type Mapping

This is one of the **few changes made to the data product template itself** (not the staging layer). ERP systems use granular account type codes, not generic labels. The template's sign-adjustment expression must be updated to match the actual codes in the client's data.

### Step 1: Query Actual Account Types

**Always do this before writing any sign logic:**
```sql
SELECT DISTINCT account_type, report, COUNT(*) as account_count
FROM chart_of_accounts
GROUP BY account_type, report
ORDER BY report, account_type
```

### Step 2: Map to Sign Convention

For standard BS/IS display (positive values on reports):

| Category | Sign in GL (Debit-Normal) | Display Sign | Action |
|----------|---------------------------|-------------|--------|
| Assets | Positive (debit balance) | Positive | Keep as-is |
| Liabilities | Negative (credit balance) | Positive | Multiply by −1 |
| Equity | Negative (credit balance) | Positive | Multiply by −1 |
| Revenue | Negative (credit balance) | Positive | Multiply by −1 |
| COGS / Expenses | Positive (debit balance) | Positive | Keep as-is |

### Step 3: Build the Expression

```sql
CASE
    WHEN account_type IN (<liability_types>, <equity_types>, <revenue_types>) THEN balance * -1
    ELSE balance
END
```

Replace `<liability_types>`, etc. with the actual codes from Step 1. Common NetSuite codes:
- **Assets:** `Bank`, `AR`, `OthCurrAsset`, `FixedAsset`, `OthAsset`, `UnbilledRec`
- **Liabilities:** `AcctPay`, `OthCurrLiab`, `LongTermLiab`, `CredCard`, `DeferRevenue`
- **Equity:** `Equity`, `RetainedEarnings`
- **Revenue:** `Revenue`, `Income`, `OthIncome`
- **Expenses:** `COGS`, `Expense`, `OthExpense`

Other ERPs (SAP, Oracle) will have different codes. **Always query first, never assume.**

---

## 12. Dimension Explosion Prevention

### Symptom
The ETL output (or a scaffold cross-join step) produces far more rows than expected in recent periods — 10x–100x normal. Cards show inflated totals.

### Root Cause
The GL source has high-cardinality dimension combinations in certain periods (intercompany settlements, bulk accruals, journal imports). When a scaffold cross-join hits these, row counts explode.

### Diagnosis
```sql
SELECT period_id,
       COUNT(*) as row_count,
       COUNT(DISTINCT account_number) as unique_accounts,
       COUNT(DISTINCT CONCAT(dim1, '|', dim2, '|', dim3)) as unique_dim_combos
FROM gl_source
GROUP BY period_id
ORDER BY row_count DESC
```

A healthy dataset has stable `unique_dim_combos` per period. A spike (e.g., 50 → 5,000) signals explosion risk.

### Fix
Pre-aggregate to account × period grain before the scaffold:
```sql
SELECT period_id, account_number, account_name, account_type,
       level1, level2, level3, report, data_type,
       SUM(balance) AS balance
FROM gl_source
GROUP BY period_id, account_number, account_name, account_type,
         level1, level2, level3, report, data_type
```

**Principle:** Financial reporting only needs account × period grain at the scaffold boundary. Sub-account transaction detail should be aggregated away before scaffold input.

---

## 13. ETL-Specific Lessons Learned

These apply to building the staging layer and (where noted) the minor template adjustments. Each lesson is tagged with where the fix belongs.

### Staging Layer Lessons

1. **Always deduplicate the exchange rate table before joining.** [STAGING] Multi-subsidiary ERPs store N rows per (currency, period) — one per subsidiary pair. A raw JOIN multiplies every balance by N. Use `MIN(rate) GROUP BY from_currency, period, to_currency`.

2. **Always LEFT JOIN exchange rates.** [STAGING] INNER JOIN silently drops rows for unmatched currency + period combos. Use `COALESCE(rate, 1.0)` for missing rates.

3. **Start the staging ETL from Chart of Accounts, not from GL transactions.** [STAGING] Starting from GL means zero-activity accounts disappear. CoA-base with LEFT JOIN GL ensures full account coverage with $0 for inactive accounts.

4. **Check for fan-out from wrong join keys, duplicates, or bad upstream transforms.** [STAGING] Even with correct FX handling, fan-out can occur if the staging layer joins on columns that aren't unique (e.g., joining on account without period, or on a field with duplicates in one side). Always verify join key cardinality before and after each join step.

5. **Verify the correct amount field and don't double-convert currencies.** [STAGING] The GL may have original-currency, functional-currency, and reporting-currency amount fields. If you pick the reporting-currency field and also apply FX conversion, balances are double-converted. Confirm which field the client's reports are based on.

6. **Select the right date field for period assignment.** [STAGING] Transaction date, posted date, and effective date can produce different period assignments. Test each against the client's period totals to find the correct one.

7. **Pre-aggregate to account × period grain before the scaffold boundary.** [STAGING] High-cardinality dimensions (journal ID, line number, subsidiary, dim combos) cause row explosion in the data product ETL's scaffold cross-join. Aggregate these away in staging.

8. **Dec or the earliest period may be a bulk migration load.** [STAGING] All prior history posted to one period. This IS the opening balance — treat it as the starting TB or request a proper TB export from the client.

### Data Product Template Lessons (Minor Adjustments Only)

9. **Query actual `account_type` strings before writing sign logic.** [TEMPLATE] Never assume generic labels like "Liability" — ERPs use codes like `AcctPay`, `OthCurrLiab`, etc. Update the template's sign-adjustment expression to match.

10. **RE is the most dangerous section.** [TEMPLATE] Historical opening balances can be enormous. Excluding them creates massive BS imbalances. Determine the client's RE variant (monthly/annual/hybrid) and adjust the template's RE calculation accordingly.

11. **Period sort must use numeric keys, not strings.** [TEMPLATE] String sort puts "Apr" before "Feb" before "Jan". Always sort by `year * 100 + month` for chronological order. Adjust the template's window function ORDER BY if needed.

12. **Opening balance period_id must sort before all data periods.** [TEMPLATE] If using a placeholder like `'000-Opening'`, it sorts before month names. `'ZZZ-Opening'` would sort AFTER — corrupting the running balance.

13. **IS path fan-out in the template.** [TEMPLATE] The "Drop Dims" tile only applies to BS. IS accounts keep their dim values, which can cause 100x more rows than expected if dims are high-cardinality. Pre-aggregate or blank out IS dims if reporting at account level. (Can also be mitigated in staging by collapsing dims.)

14. **When adding columns to a WindowAction GroupBy, check downstream joins for duplicate column errors.** [TEMPLATE] Both sides of a MergeJoin carrying the same column name produces `DP-0008 Duplicate column name`. Add `remove: true` in `schemaModification2` for the duplicated columns.

### General Domo ETL Lessons

15. **The BS equation is your validation anchor.** Assets − Liabilities − Equity = 0 in double-entry bookkeeping. If Domo's number ≠ 0, something is wrong — almost always in the staging layer.

16. **Never modify the data product template except where explicitly marked.** The template contains comments/notes on tiles indicating optional or client-adjustable sections. Only edit those marked sections (sign logic, RE variant, period sort, dropping optional branches). Everything else in the template is untouched. All other adaptation happens in new staging ETLs. Never edit or delete any existing client assets (ETLs, datasets, cards, pages).

17. **Verify after every `dataflow_save` call.** The API silently drops malformed tile properties. Always call `dataflow_get` after saving to confirm persistence.

18. **`preferredDatabaseEntityType` must be `TEMP_VIEW`** for all tiles in a Magic ETL. Never use `TABLE` — the API rejects it with a 400 error.

19. **Do NOT pre-create output datasets.** Set `PublishToVault.dataSource` with `type: "DataFlow"`, `name`, and `cloudId: "domo"` — no `guid`. The engine creates the dataset on first execution.

---

## 14. Full Validation Checklist

Use this as a sequential checklist when validating any finance data product:

### Phase A: Structural Validation (Before Looking at Numbers)

- [ ] CoA has a `report` field (BS/IS assignment) for all accounts
- [ ] All GL accounts exist in the CoA (no orphaned accounts)
- [ ] All TB accounts exist in the CoA
- [ ] Account types in CoA match what the sign adjustment expects
- [ ] ETL starts from CoA (not GL) to preserve zero-balance accounts
- [ ] Exchange rates are deduplicated before join
- [ ] Exchange rate join is LEFT JOIN (not INNER)
- [ ] Period sort uses numeric key, not string

### Phase B: Starting Balance Validation

- [ ] Starting TB/balance balances (A = L + E)
- [ ] Starting TB account count matches CoA (or is explainable)
- [ ] No unexpected large values (check for bulk migration artifacts)
- [ ] RE opening balance is correctly included/excluded

### Phase C: Period-by-Period Stepping

- [ ] P₁ (first GL month) maintains balance
- [ ] P₂, P₃ ... each maintain balance
- [ ] Account count is stable across periods
- [ ] No sudden spikes in row count (dimension explosion check)

### Phase D: Retained Earnings

- [ ] Determine RE method: monthly accumulation, annual close, or hybrid
- [ ] Check if GL already contains RE journal entries
- [ ] Verify net income calculation matches IS bottom line
- [ ] Confirm RE makes BS balance (try variants if it doesn't)

### Phase E: Intercompany

- [ ] IC accounts flagged in dataset
- [ ] IC elimination entries flagged
- [ ] IC nets to zero at consolidated level (or variance is explained)
- [ ] Validation cards allow IC filter toggle
- [ ] Final report cards filter IC out (if client reports post-elimination)

### Phase F: Currency

- [ ] Rate table deduplicated (one rate per currency × period)
- [ ] Correct rate type used (closing for BS, average for IS)
- [ ] Correct amount field used (original vs functional vs reporting currency)
- [ ] LEFT JOIN on rates with COALESCE fallback
- [ ] Non-reporting-currency accounts spot-checked

### Phase G: Date & Period

- [ ] Correct date field selected (transaction date vs posted date)
- [ ] Fiscal calendar join produces expected period assignments
- [ ] Open/unclosed periods excluded from comparison

### Phase H: Client Comparison

- [ ] Section-level totals compared to client report (earliest available period first)
- [ ] Account-level spot check (5–10 key accounts)
- [ ] Variance documented and explained (FX rounding, timing, etc.)
- [ ] Variance < 0.5% tolerance confirmed with client

---

## 15. Adapting to the Client's ERP / Data / Use Case

Every engagement will have unique characteristics. The data product template handles the reporting logic — **all client-specific adaptation happens in the staging layer**. The table below lists common scenarios and what to do in staging (and the rare template adjustments).

| Client Scenario | Staging Layer Adaptation | Template Adjustment |
|-----------------|------------------------|---------------------|
| **No standalone TB provided** | Build from GL since inception; request earliest-period TB export as validation | None |
| **Multiple subsidiaries** | Decide: consolidated view (with IC elimination) or per-subsidiary views; build staging to aggregate or separate | None |
| **Multiple currencies** | Deduplicate rates in staging; confirm BS vs IS rate types; spot-check volatile currencies | None |
| **Custom fiscal calendar** | Map the client's fiscal periods to the calendar join in staging; don't assume Jan = Period 1 | None |
| **Non-standard CoA hierarchy** | Map whatever hierarchy the client uses (cost center, department, project) to the template's expected level1/level2/level3 fields in staging | None |
| **Partial GL history** | Use TB-start + GL-forward approach in staging; document the cutoff | None |
| **Cash-basis vs accrual** | Confirm which basis the client's reports use; filter in staging | None |
| **Intercompany heavy** | Flag IC accounts and IC elimination entries in staging; pass through for card-level filtering | None |
| **Budget/Forecast overlay** | Add budget dataset as separate staging output matching the template's budget input slot | None |
| **Statistical accounts** | Flag and exclude non-financial accounts (headcount, units) in staging | None |
| **ERP uses non-standard account_type codes** | Ensure staging passes account_type codes through correctly | Update sign adjustment IN() list (minor) |
| **RE is calculated differently** | Understand if GL already has RE postings; adjust what staging passes | Adjust RE variant in template (minor) |
| **Period sort is alphabetical** | Ensure staging outputs a numeric period sort key | Adjust window ORDER BY (minor) |

---

## 16. Overall Strategy: GL + CoA → Balance Sheet & Income Statement

This section provides the end-to-end mental model for building a functioning BS/IS from raw GL data and a Chart of Accounts. Use this as the strategic frame before diving into ERP-specific details.

### 16a. The Core Formula

**Balance Sheet** (cumulative, point-in-time):
```
BS_balance(account, period) = starting_balance(account) + SUM(GL_activity(account, P₁..period))
```

**Income Statement** (periodic, resets each fiscal year):
```
IS_balance(account, period) = SUM(GL_activity(account, period))
```

The BS accumulates over time. The IS is a single-period view. This is why BS validation gets harder as you move forward (errors compound) while IS can be validated for any individual period.

### 16b. The Five Pillars of a Working Finance Output

Every finance data product depends on these five things being correct. If the output is wrong, one of these is broken:

| # | Pillar | What It Means | How to Test |
|---|--------|--------------|-------------|
| 1 | **Account completeness** | Every account in the CoA appears in the output (even if $0) | `COUNT(DISTINCT account)` in output vs CoA |
| 2 | **Account classification** | Every account is assigned to the correct report (BS/IS) and section (Assets/Liabilities/Equity/Revenue/Expense) | Spot-check 10 accounts across sections; verify `report` and `level1` fields |
| 3 | **Amount accuracy** | Balances reflect the correct amount in the correct currency | Compare 5–10 key accounts to client validation data for a known period |
| 4 | **Period accuracy** | Transactions are assigned to the correct fiscal period | Compare period-level totals to client data; check row counts per period for stability |
| 5 | **Accumulation logic** | BS balances accumulate correctly; IS resets at fiscal year boundary; RE bridges the two | BS equation check (A=L+E) per period; IS net income matches RE movement |

### 16c. Test Plan — Staged Validation

Execute these tests in order. Each gate must pass before moving to the next.

**Gate 1: Raw Data Profiling** (before building anything)
- [ ] How many distinct accounts in GL? In CoA? In TB (if provided)?
- [ ] What is the earliest and latest period in GL?
- [ ] How many currencies? Is there an FX rate table?
- [ ] What are the distinct `account_type` values in the CoA?
- [ ] What are the distinct `transaction_type` values in GL? (look for special types: opening balance, year-end close, IC elimination, revaluation)
- [ ] Are there any accounts in GL that are NOT in CoA? (orphans)
- [ ] What date fields are available? (transaction date, posted date, etc.)
- [ ] Row counts per period — are they stable or do certain periods spike?

**Gate 2: Starting Balance / TB Validation** (first output from staging)
- [ ] Does the starting TB balance? (A = L + E)
- [ ] Does the account count in the TB output match expectations?
- [ ] Are there any suspiciously large accounts? (potential migration artifacts or unconverted FX)
- [ ] If client provided a validation TB — does it match at section level?

**Gate 3: Single-Period GL Validation** (add one month of GL to TB)
- [ ] Does BS still balance after adding one month of GL?
- [ ] Does the IS for that month produce a reasonable net income?
- [ ] Does net income from IS equal the change in RE on BS?
- [ ] Account count remains stable (no accounts dropped by joins)

**Gate 4: Multi-Period Trending** (run full date range)
- [ ] BS balances every period (A = L + E check per period)
- [ ] Account count is stable across periods (Card 4)
- [ ] No row count spikes (dimension explosion check)
- [ ] RE accumulates correctly (growing over time for profitable company, or as expected)

**Gate 5: Client Comparison** (compare to client-provided reports)
- [ ] BS section totals within tolerance (< 0.5% variance)
- [ ] IS section totals match for at least 2 closed periods
- [ ] Any variances documented with root cause (FX rounding, timing, open period)

**Gate 6: Edge Cases & Ongoing** (production readiness)
- [ ] Intercompany flagged and filterable
- [ ] Open/unclosed period handling documented
- [ ] FX rate coverage confirmed for all currencies and periods going forward
- [ ] Validation cards built and published (Section 6)

### 16d. Debit/Credit Conventions Cheat Sheet

Understanding debit/credit is essential for sign logic:

| Account Type | Normal Balance | Debit Increases | Credit Increases | GL Sign (Debit-Positive Convention) |
|-------------|---------------|-----------------|------------------|-------------------------------------|
| Assets | Debit | Yes | No | Positive |
| Contra Assets (e.g., Accumulated Depreciation) | Credit | No | Yes | Negative |
| Liabilities | Credit | No | Yes | Negative |
| Equity | Credit | No | Yes | Negative |
| Revenue | Credit | No | Yes | Negative |
| Contra Revenue (e.g., Returns/Discounts) | Debit | Yes | No | Positive |
| COGS | Debit | Yes | No | Positive |
| Expenses | Debit | Yes | No | Positive |

Some ERPs store amounts as always-positive with a separate debit/credit indicator column. Others store as signed amounts (positive = debit, negative = credit). Others use separate debit and credit columns. **Check which convention the source GL uses** — this determines how to compute `balance = debit - credit` or whether the amount is already net.

### 16e. Fiscal Year Close & Period 13/Period 0

Many ERPs have special periods:

- **Period 0:** Opening balance period (some ERPs use this to carry forward prior-year balances)
- **Period 13 (or 14, 15...):** Adjustment periods for year-end close entries, audit adjustments, tax adjustments
- **Year-end close entries:** Journal entries that zero out IS accounts and transfer net income to RE

**What to check:**
- Does the GL include period 0 / period 13 entries? If so, should they be included or excluded?
- If the ERP auto-posts year-end close entries, and you're also calculating RE in the ETL, you'll double-count
- If the ERP does NOT auto-post year-end close entries, the ETL must calculate the IS→RE rollover

### 16f. Subsidiary / Entity Consolidation

Multi-entity companies may need:
- **Individual entity reports** (each subsidiary's standalone BS/IS)
- **Consolidated reports** (all entities combined, with IC eliminations)
- **Some combination** (consolidated at a parent level, but separate for certain subsidiaries)

**Staging considerations:**
- Does the GL have a `subsidiary` or `entity` field?
- Are IC transactions tagged? (See Section 7)
- Does the client want consolidated output only, or both?
- If consolidated: build the staging layer to aggregate across entities, flag IC, and include elimination entries
- If per-entity: build staging to pass through the entity dimension so the template can filter by entity at card level

---

## 17. ERP-Specific Reference: NetSuite

**This section is a living reference. Add to it as new NetSuite engagements reveal additional patterns.**

### Key Tables & Connector Datasets

| Domo Connector Dataset (typical name) | NetSuite Record | What It Contains |
|---------------------------------------|-----------------|------------------|
| `ns_transactions_line_*` or `TransactionLine` | `transactionLine` (SuiteAnalytics / ODBC) | GL journal lines — one row per line item per transaction |
| `ns_accounts_*` or `Account` | `account` | Chart of Accounts — account number, name, type, hierarchy |
| `NS_ConsolidatedExchangeRate_*` | `consolidatedExchangeRate` | FX rates by currency, period, subsidiary pair |
| `NS_accountingPeriod_*` | `accountingPeriod` | Fiscal calendar — period start/end dates, year, quarter |
| `TrialBalance` (if available) | Saved Search or SuiteAnalytics report | Pre-computed trial balance by period |

### NetSuite-Specific `accttype` Values

Always query to confirm, but common NetSuite `accttype` codes:

| Category | `accttype` Values |
|----------|-------------------|
| **Assets** | `Bank`, `AR`, `OthCurrAsset`, `FixedAsset`, `OthAsset`, `UnbilledRec`, `DeferExpense` |
| **Liabilities** | `AcctPay`, `OthCurrLiab`, `LongTermLiab`, `CredCard`, `DeferRevenue` |
| **Equity** | `Equity`, `RetainedEarnings` |
| **Revenue** | `Income`, `OthIncome` |
| **Expenses** | `COGS`, `Expense`, `OthExpense` |
| **Statistical** | `Stat` (non-financial — exclude from BS/IS) |
| **Non-posting** | `NonPosting` (exclude) |

**Watch out:** `DeferRevenue` is a liability (not revenue). `DeferExpense` is an asset (not expense). These are frequently miscategorized by generic sign-flip logic.

### NetSuite FX Rate Table Gotchas

The `consolidatedExchangeRate` table is the #1 source of staging bugs for NetSuite:

1. **One row per subsidiary pair.** A company with 30 subsidiaries has up to 30 rows per (fromcurrency, postingperiod, tocurrency). If you join without deduplicating, you get 30x fan-out on every transaction.

2. **`tocurrency` is an internal ID, not an ISO code.** Typically `1` = USD (or the parent's base currency). You must filter `tocurrency = 1` (or whatever the reporting currency's internal ID is) AND deduplicate.

3. **Rate types:** The table may have `currentrate` (period-end closing rate) and `averagerate` (period average). Use `currentrate` for BS, `averagerate` for IS. If only one rate column exists, use it for everything and document the limitation.

4. **Missing rates for some periods.** Newly added currencies or recently created subsidiaries may not have rates for older periods. LEFT JOIN + COALESCE(rate, 1.0) handles this, but flag it to the client.

**Dedup pattern:**
```sql
SELECT fromcurrency, postingperiod, tocurrency,
       MIN(currentrate) AS closing_rate,
       MIN(averagerate) AS average_rate
FROM NS_ConsolidatedExchangeRate
WHERE tocurrency = 1  -- reporting currency internal ID
GROUP BY fromcurrency, postingperiod, tocurrency
```

### NetSuite Retained Earnings Behavior

- NetSuite stores a `RetainedEarnings` account type in the CoA
- NetSuite auto-posts a cumulative opening balance for RE as a special transaction line (often `trantype = 'Journal'` with memo indicating it's system-generated)
- This opening balance is the total of ALL prior year net income — it can be very large
- The Jumpstart template's "Optional Adjustments" section often has a filter to exclude native RE lines — **removing this filter is frequently needed** to get correct BS totals
- Check: `SELECT SUM(netamount) FROM ns_transactions_line WHERE account = <RE_account_id>` — if this is a huge number, it's the historical opening balance and should be included

### NetSuite Date Fields

| Field | NetSuite Column | Use |
|-------|----------------|-----|
| Transaction Date | `trandate` | Most common for financial reporting |
| Period | `postingperiod` (internal ID) | Directly references the accounting period — often more reliable than date-based period assignment |
| Created Date | `datecreated` | System timestamp — not for reporting |

**Preferred approach:** Join on `postingperiod` directly (it's a foreign key to the `accountingPeriod` table) rather than deriving the period from `trandate`. This handles cases where a transaction has a different posting period than its transaction date (e.g., backdated entries).

### NetSuite Intercompany

- IC transactions in NetSuite use `trantype = 'InterCo*'` (InterCoJournalEntry, InterCoSalesOrder, etc.)
- The "Elimination" subsidiary is a dedicated entity for consolidation elimination entries
- Check `subsidiary` field — if it contains "Elimination" or "Elim", those are IC elimination entries
- Some implementations use a separate `eliminationtype` field

### NetSuite Multi-Book

Some NetSuite instances use Multi-Book Accounting (multiple sets of books for different GAAP/IFRS standards). If enabled:
- The GL may have a `accountingbook` column — filter to the correct book
- Exchange rates may differ by book
- If you don't filter by book, you'll get duplicate entries (one per book) causing fan-out

---

## 18. ERP-Specific Reference: Sage Intacct

**This section is a living reference. Add to it as new Sage Intacct engagements reveal additional patterns.**

### Key Tables & Connector Datasets

| Domo Connector Dataset (typical name) | Sage Intacct Object | What It Contains |
|---------------------------------------|---------------------|------------------|
| `GLENTRY` or `GL_Detail` | `GLENTRY` | GL journal lines — one row per entry |
| `GLACCOUNT` or `GL_Account` | `GLACCOUNT` | Chart of Accounts |
| `GLACCOUNTBALANCE` | `GLACCOUNTBALANCE` | Pre-computed account balances by period (if available) |
| `REPORTING_PERIOD` or `GL_Period` | `REPORTING_PERIOD` | Fiscal periods/calendar |
| `CURRENCY_RATE` or similar | Various | Exchange rates (if multi-currency enabled) |

### Sage Intacct Account Type Values

Sage Intacct uses a `ACCOUNTTYPE` field with these standard values:

| Category | `ACCOUNTTYPE` Values |
|----------|---------------------|
| **Assets** | `balancesheet` with `NORMALBALANCE = 'debit'` |
| **Liabilities** | `balancesheet` with `NORMALBALANCE = 'credit'` |
| **Equity** | `balancesheet` with `NORMALBALANCE = 'credit'` (check account range or `CATEGORY`) |
| **Revenue** | `incomestatement` with `NORMALBALANCE = 'credit'` |
| **Expenses** | `incomestatement` with `NORMALBALANCE = 'debit'` |

**Key difference from NetSuite:** Sage Intacct uses `balancesheet` / `incomestatement` as the top-level type, with `NORMALBALANCE` indicating debit/credit normal. You need BOTH fields to determine the correct sign flip. Additionally, Sage uses `CATEGORY` for sub-classification (e.g., "Cash and Cash Equivalents", "Accounts Receivable", etc.).

### Sage Intacct Gotchas

1. **Dimensions are first-class objects.** Sage Intacct has up to 10 custom dimensions (Department, Location, Project, Class, etc.). These are separate lookup tables, not embedded in the GL. You may need to join multiple dimension tables in staging to build the CoA hierarchy the template expects.

2. **Statistical accounts.** Sage Intacct supports statistical accounts (non-monetary tracking). These have `ACCOUNTTYPE = 'statistical'` — always exclude them from BS/IS.

3. **`GLACCOUNTBALANCE` shortcut.** If available, this table provides pre-computed period-end balances per account — potentially bypassing the need to accumulate from GL detail. Validate that it matches GL detail sums before relying on it.

4. **Multi-entity / consolidation.** Sage Intacct uses `LOCATIONID` or `ENTITY` for subsidiaries. Consolidation and IC elimination may be handled via "Consolidation" books or through a dedicated elimination entity.

5. **Date fields:** `WHENCREATED` (entry date), `WHENPOSTED` (posting date), `WHENMODIFIED`. Use `WHENPOSTED` for period assignment. Sage also has a `REPORTINGPERIODNAME` that directly identifies the fiscal period.

6. **Retained Earnings:** Sage Intacct auto-calculates RE via the year-end close process. The GL may or may not include explicit RE close entries depending on whether the fiscal year has been "soft closed" or "hard closed." If the year is only soft-closed, RE entries may not exist yet.

---

## 19. ERP-Specific Reference: SAP (S/4HANA & ECC)

**This section is a living reference. Add to it as new SAP engagements reveal additional patterns.**

### Key Tables & Connector Datasets

| Domo Connector Dataset (typical name) | SAP Table | What It Contains |
|---------------------------------------|-----------|------------------|
| `BSEG` or `GL_Line_Items` | `BSEG` | GL line items (document-level detail) |
| `BKPF` or `GL_Doc_Header` | `BKPF` | GL document headers (date, posting period, doc type) |
| `SKA1` / `SKB1` or `GL_Master` | `SKA1` (CoA) / `SKB1` (company-code-specific) | Chart of Accounts |
| `T001` | `T001` | Company codes |
| `TCURR` or `Exchange_Rates` | `TCURR` | Exchange rate table |
| `T009` / `T009B` | `T009` / `T009B` | Fiscal year variants and period definitions |
| `ACDOCA` (S/4HANA only) | `ACDOCA` | Universal Journal — the single source of truth in S/4HANA |

### SAP-Specific Considerations

1. **`ACDOCA` vs `BSEG`/`BKPF`:** In S/4HANA, the Universal Journal (`ACDOCA`) replaces the older `BSEG`/`BKPF` tables. If the client is on S/4HANA, use `ACDOCA` as the primary GL source. If on ECC, use `BSEG` joined with `BKPF`.

2. **Account type in SAP:** SAP uses `KOART` (account type) in `BSEG`:
   - `S` = GL Account, `D` = Customer (AR), `K` = Vendor (AP), `A` = Asset, `M` = Material
   - For BS/IS, you primarily need `KOART = 'S'` (GL accounts), but AR and AP postings also update the GL
   - The CoA master (`SKA1`) has `KTOKS` (account group) and `BILKT` (BS/IS indicator)

3. **Company code dimension:** SAP data is always scoped by company code (`BUKRS`). A global company may have 50+ company codes. Ensure staging filters to the correct company code(s) or aggregates for consolidation.

4. **Fiscal year variant:** SAP supports non-calendar fiscal years with special periods (period 13–16 for adjustments). The fiscal year variant (`PERIV` in `T009`) defines period boundaries. Always join `BKPF.MONAT` (posting period) + `BKPF.GJAHR` (fiscal year) to determine the correct calendar period.

5. **Special periods (13–16):** SAP allows periods 13, 14, 15, 16 for year-end close, tax adjustments, and audit entries. Decide with the client whether to include these. If included, they should map to the last month of the fiscal year (period 12).

6. **Amount fields:** `BSEG` has `DMBTR` (amount in local currency), `WRBTR` (amount in document/transaction currency), and `DMBE2`/`DMBE3` (amounts in additional currencies). Use `DMBTR` for local-currency reporting. `SHKZG` = 'H' means credit, 'S' means debit.

7. **Exchange rates (`TCURR`):** SAP stores rates as ratios with `UKURS` (rate), `FFACT` (from-factor), `TFACT` (to-factor). The actual rate = `UKURS * TFACT / FFACT`. This is unique to SAP — don't just use `UKURS` as the rate directly. Also, SAP stores rates with a rate type (`KURST`): `M` = average, `B` = buying, `V` = selling. Use the client's preferred rate type.

8. **Retained Earnings:** SAP uses a "Carried Forward Balance" program (`FAGLGVTR` in S/4 or `F.16` in ECC) to roll IS balances into RE at year-end. The RE account is configured in `T030` (automatic posting configuration). If the carry-forward hasn't been run, IS accounts from prior years will still show balances.

### SAP Sign Convention

SAP stores debit amounts as positive in `DMBTR` when `SHKZG = 'S'` (Soll/debit) and credit amounts as positive when `SHKZG = 'H'` (Haben/credit). To get a standard signed balance:
```sql
CASE WHEN SHKZG = 'H' THEN DMBTR * -1 ELSE DMBTR END AS signed_amount
```

---

## 20. ERP-Specific Reference: Oracle (Fusion Cloud / E-Business Suite)

**This section is a living reference. Add to it as new Oracle engagements reveal additional patterns.**

### Key Tables

| Source | Oracle Table/View | What It Contains |
|--------|-------------------|------------------|
| **Fusion Cloud** | `GL_JE_LINES` + `GL_JE_HEADERS` | GL journal lines + headers |
| **Fusion Cloud** | `GL_BALANCES` | Pre-computed account balances by period |
| **Fusion Cloud** | `FND_FLEX_VALUES` | CoA segment values (account, cost center, etc.) |
| **EBS** | `GL_JE_LINES` + `GL_JE_HEADERS` | Same structure as Fusion |
| **EBS** | `GL_BALANCES` | Pre-computed balances by period/currency/ledger |
| **EBS** | `GL_CODE_COMBINATIONS` | Full CoA combination (all segments concatenated) |

### Oracle-Specific Considerations

1. **Segment-based CoA:** Oracle uses a multi-segment accounting flexfield (e.g., Company-Account-CostCenter-Product-Project). The "account" is just one segment. The full CoA key is the combination of ALL segments. This means:
   - The staging layer may need to extract/concatenate specific segments
   - The "account_number" for the data product template is typically the natural account segment only
   - Segment values are defined in `FND_FLEX_VALUES` with descriptions in `FND_FLEX_VALUES_TL`

2. **`GL_BALANCES` shortcut:** Oracle pre-computes period/quarter/year-end balances in `GL_BALANCES`. This table has `PERIOD_NET_DR`, `PERIOD_NET_CR`, `BEGIN_BALANCE_DR`, `BEGIN_BALANCE_CR`, etc. Using this can be much faster than aggregating from `GL_JE_LINES`, and it's what Oracle's own financial reports use. Validate against JE detail if available.

3. **Ledger / Set of Books:** Oracle supports multiple ledgers (primary, secondary, reporting). Filter `GL_BALANCES.LEDGER_ID` or `GL_JE_HEADERS.LEDGER_ID` to the correct ledger. Using the wrong ledger gives wrong currency/amounts.

4. **Amount fields in JE Lines:** `ENTERED_DR` / `ENTERED_CR` (transaction currency), `ACCOUNTED_DR` / `ACCOUNTED_CR` (functional/ledger currency). Use the `ACCOUNTED_*` columns for functional currency reporting.

5. **Budget vs Actual:** `GL_BALANCES.ACTUAL_FLAG` distinguishes: `A` = Actual, `B` = Budget, `E` = Encumbrance. Filter to `A` for financial reporting.

6. **Period status:** Oracle periods have statuses: `O` (Open), `C` (Closed), `P` (Permanently Closed), `N` (Never Opened). Only use data from `O` or `C` periods. `N` periods have no data.

7. **Retained Earnings:** Oracle runs a "Year-End Close" process that creates journal entries to zero out IS accounts and post to RE. If this process hasn't been run for the current year, current-year IS accounts will show cumulative balances in `GL_BALANCES` and RE won't include current-year net income.

---

## 21. ERP-Specific Reference: QuickBooks (Online & Desktop)

**This section is a living reference. Add to it as new QuickBooks engagements reveal additional patterns.**

### Key Differences from Enterprise ERPs

QuickBooks is fundamentally simpler than NetSuite/SAP/Oracle:
- **Single-currency** (QuickBooks Online does support multi-currency but it's limited)
- **No subsidiary/entity structure** (single company per file)
- **Simplified CoA** (no multi-segment chart, just account name and type)
- **No special periods** (no period 13, no adjustment periods)
- **Cash or accrual basis** (can toggle, but data structure is the same)

### Connector Datasets

| Domo Connector Dataset | QuickBooks Object | What It Contains |
|-----------------------|-------------------|------------------|
| `JournalEntry` or `GeneralLedger` | Journal Entry / General Ledger report | GL line items |
| `Account` | Account | Chart of Accounts |
| `TrialBalance` (report-based) | Trial Balance report | Period-end balances |
| `BalanceSheet` (report-based) | Balance Sheet report | Pre-formatted BS |
| `ProfitAndLoss` (report-based) | Profit & Loss report | Pre-formatted IS |

### QuickBooks Account Types

QuickBooks uses human-readable account types:

| Category | QBO Account Types |
|----------|-------------------|
| **Assets** | `Bank`, `Accounts Receivable`, `Other Current Asset`, `Fixed Asset`, `Other Asset` |
| **Liabilities** | `Accounts Payable`, `Credit Card`, `Other Current Liability`, `Long Term Liability` |
| **Equity** | `Equity`, `Retained Earnings`, `Opening Balance Equity` |
| **Revenue** | `Income`, `Other Income` |
| **Expenses** | `Cost of Goods Sold`, `Expense`, `Other Expense` |

**Note:** These are the English labels. QuickBooks uses these as-is (not codes). The sign adjustment expression can use these directly.

### QuickBooks Gotchas

1. **`Opening Balance Equity`:** QuickBooks creates this account automatically when you enter opening balances. It should eventually be zero if everything was set up correctly. If it has a non-zero balance, it usually means opening balances were entered inconsistently. This is a data quality issue — flag it but don't try to fix it in the ETL.

2. **Report-based connectors vs API-based connectors:** Some Domo connectors pull pre-formatted QuickBooks reports (Balance Sheet, P&L). These are already computed by QuickBooks and may differ from raw GL data if there are journal entries in transit. Prefer the GL/Journal Entry API for staging — reports are useful only for validation comparison.

3. **Cash vs Accrual:** QuickBooks supports both bases. The same transactions can produce different period assignments depending on the basis. Confirm which basis the client uses for their reports.

4. **No posting period concept:** QuickBooks uses transaction dates directly (no separate posting period). The staging layer must derive periods from the transaction date using a simple month/year extraction.

5. **Fiscal year close:** QuickBooks auto-creates a "Net Income" entry that rolls IS into RE at the start of the fiscal year. You may see this as a transaction with type "Year-end closing" or similar. If you're building cumulative BS from GL, this entry is already included — don't calculate RE separately or you'll double-count.

---

## 22. ERP-Specific Reference: Microsoft Dynamics (365 Finance & Operations / GP / Business Central)

**This section is a living reference. Add to it as new Dynamics engagements reveal additional patterns.**

### Dynamics 365 Finance & Operations (D365 F&O)

**Key Tables:**

| Source | Table | What It Contains |
|--------|-------|------------------|
| `GeneralJournalEntry` + `GeneralJournalAccountEntry` | GL journal entries + line items |
| `MainAccount` | Chart of Accounts — account number, name, type, category |
| `FiscalCalendarPeriod` | Fiscal periods |
| `LedgerJournalTrans` | Subledger journal lines |
| `ExchangeRateCurrencyPair` + `ExchangeRate` | FX rates |

**D365 F&O Considerations:**

1. **Main Account Type:** D365 uses `MainAccountType` with values: `Blank` (regular), `Total`, `Reporting`, `ProfitAndLoss`, `BalanceSheet`, `Header`. Filter to `ProfitAndLoss` and `BalanceSheet` for financial accounts. `Total` and `Reporting` accounts are computed — don't include them or you'll double-count.

2. **Financial dimensions:** D365 uses a financial dimension framework similar to Oracle's multi-segment CoA. The dimension set determines which dimensions are active. Common dimensions: Department, CostCenter, BusinessUnit, Project.

3. **Ledger / Company:** D365 data is scoped by `DataAreaId` (legal entity/company). Filter to the correct entity.

4. **Amount sign:** D365 stores amounts in the `AccountingCurrencyAmount` field. Debits are positive, credits are negative. This is already net-signed — you may not need a sign flip in staging (but verify the data product template's expectation).

5. **Fiscal year close:** D365 has a "Year-end close" process. Opening transactions are created with transaction type = "Opening" for BS accounts. If the close hasn't been run for the current year, prior-year BS accounts may not carry forward.

### Dynamics GP (Great Plains)

**Key Tables:**

| Source | Table | What It Contains |
|--------|-------|------------------|
| `GL20000` (Open Year) / `GL30000` (History) | GL transaction detail |
| `GL00100` / `GL00105` | Account master + account index |
| `GL00200` | Account category |
| `SY40100` / `SY40101` | Fiscal period setup |

**GP Considerations:**

1. **Open vs History tables:** GP splits GL data between `GL20000` (current open year) and `GL30000` (prior closed years). You need to UNION both to get full history.

2. **Account format:** GP stores account numbers as a formatted string (e.g., `000-1100-00`) with segments separated by dashes. The delimiter and segment count vary by implementation.

3. **Account category:** GP uses `ACCATNUM` (numeric category code) to classify accounts. Map these to BS/IS using the `GL00200` table.

4. **Amount fields:** `DEBITAMT` and `CRDTAMNT` are separate columns. Compute: `balance = DEBITAMT - CRDTAMNT`.

### Dynamics Business Central (BC)

**Key Tables:**

| Source | Table/API | What It Contains |
|--------|-----------|------------------|
| `G/L Entry` | GL entries |
| `G/L Account` | Chart of Accounts |
| `Accounting Period` | Fiscal periods |
| `Currency Exchange Rate` | FX rates |

**BC Considerations:**

1. **Account type:** BC uses `Account Type` with values: `Posting`, `Heading`, `Total`, `Begin-Total`, `End-Total`. Only `Posting` accounts have actual balances — filter to `Posting` only.

2. **Income/Balance flag:** `G/L Account` has `Income/Balance` field with values `Income Statement` or `Balance Sheet`. This maps directly to the data product template's `report` field.

3. **Amount:** `G/L Entry.Amount` is already net-signed (debit positive, credit negative).

4. **Fiscal year close:** BC runs "Close Income Statement" batch job at year-end. This creates closing entries that zero IS accounts and post to RE. Check if the batch has been run for the relevant fiscal years.

---

## 23. General Staging Layer Design Patterns

These patterns apply regardless of the source ERP.

### Pattern A: The Four-Table Join

The most common staging layer pattern for GL-sourced finance:

```
GL Transactions
    LEFT JOIN Chart of Accounts    ON account_id
    LEFT JOIN Fiscal Calendar      ON period_id (or date → period lookup)
    LEFT JOIN Exchange Rates       ON currency + period (deduplicated)
        ↓
    GROUP BY account, period, CoA classification fields
        ↓
    Output: account × period × balance (in reporting currency)
```

**Variations:**
- If starting from CoA instead of GL: `CoA CROSS JOIN Periods LEFT JOIN GL LEFT JOIN FX`
- If using a pre-computed TB: skip the GL + FX join, just map TB to CoA
- If single-currency: skip the FX join entirely

### Pattern B: TB-Start + GL-Forward (Hybrid)

```
Starting Trial Balance (as of period P₀)
    UNION ALL
GL Transactions (for periods P₁ onward)
    LEFT JOIN Exchange Rates (for GL records only)
        ↓
    Accumulate: balance(account, period) = TB_balance + SUM(GL from P₁ to period)
        ↓
    Output: account × period × cumulative balance
```

### Pattern C: Pre-Aggregation Before Template Input

When the GL source is high-cardinality (many dimensions, journal lines, etc.):

```
GL Transactions
    GROUP BY account_number, period_id, account_type, level1, level2, level3, report
    SUM(balance)
        ↓
    Output: one row per account × period × classification
```

This prevents dimension explosion in the data product template's scaffold step.

### Pattern D: Intercompany Flagging

Add IC flags in staging for downstream card filtering:

```sql
SELECT *,
    CASE
        WHEN account_name LIKE '%Intercompany%'
          OR account_name LIKE '%IC %'
          OR account_number BETWEEN '<ic_range_start>' AND '<ic_range_end>'
        THEN 'Y' ELSE 'N'
    END AS is_intercompany,
    CASE
        WHEN subsidiary_name LIKE '%Elimination%'
          OR transaction_type LIKE '%Elim%'
        THEN 'Y' ELSE 'N'
    END AS is_ic_elimination
FROM staged_gl_data
```

Adapt the CASE logic to match the client's ERP conventions for IC accounts and elimination entries.
