---
name: beast-mode-writer
tier: 1
description: "Author Beast Mode calculated-field formulas for Domo datasets — covers all Beast Mode functions, syntax rules, common patterns, and dataset-schema validation before creation. Trigger with 'beast mode', 'calculated field', 'formula', 'derived metric', 'domo calculation', 'write a beast mode', 'create a formula for [metric]', 'I need a calculated field', or any request to design or troubleshoot a Beast Mode formula. For programmatic API-driven beast-mode creation use the beast-mode-creation skill."
maturity: alpha
audience: [delivery]
---

# Beast Mode Writer

Writes Beast Mode calculated field formulas for Domo datasets. Beast Modes extend datasets with computed columns without modifying the underlying data. This skill knows the full Beast Mode function library, syntax rules, and proven patterns from real-world usage.

## Triggers

- "write a beast mode for [calculation]"
- "create a formula for [metric]"
- "I need a calculated field that [does X]"
- "fix this beast mode formula: [formula]"
- "what functions can I use for [goal]?"
- "write a YoY comparison formula"
- "calculate [metric] as a percentage of [total]"

## Execution Flow

### Step 1: Understand the Requirement

Identify:
- **What** should the formula calculate?
- **Which dataset** will it live on?
- **What columns** are available? (use `dataset_schema` if needed)
- **Is this an aggregate** (SUM, COUNT) or **row-level** (CASE, CONCAT)?
  - This distinction is CRITICAL for card wiring: aggregate beast modes (containing SUM/AVG/COUNT) must NOT have `aggregation` set on the card column, or it causes double aggregation errors. Row-level beast modes need `aggregation` on the card column.

### Step 2: Profile the Dataset (if needed)

If column names or types are unclear:

```
dataset_schema(dataset_id)    -> column names and types
dataset_profile(dataset_id)   -> cardinality, value distributions
```

This prevents writing formulas against columns that don't exist or have unexpected types.

### Step 3: Write the Formula

Apply these syntax rules:

**Column references:** Always use backticks
```
`Revenue`
`Date Column With Spaces`
```

**Aggregations:** Wrap in aggregate functions when needed
```
SUM(`Revenue`)
COUNT(DISTINCT `Customer ID`)
AVG(`Score`)
```

**CASE statements:** Full SQL CASE syntax
```
CASE
  WHEN `Status` = 'Active' THEN 'Active'
  WHEN `Status` = 'Pending' THEN 'Pending'
  ELSE 'Other'
END
```

**Nested aggregations:** Supported for percent-of-total patterns
```
SUM(`Revenue`) / SUM(SUM(`Revenue`)) * 100
```

**NULL handling:** Use IFNULL or COALESCE
```
IFNULL(`Revenue`, 0)
COALESCE(`Primary`, `Secondary`, 'Unknown')
```

### Step 4: Validate

Always validate before creating:

```
beast_mode_validate(dataset_id, formula)
```

If validation fails:
1. Check column names — exact match with backticks required
2. Check function spelling — `DATEDIFF` not `DATE_DIFF`
3. Check nesting — aggregates can't nest inside non-aggregate contexts (except SUM(SUM(...)))
4. Fix and re-validate

### Step 4b: Check for Name Conflicts

Before creating, verify the beast mode name doesn't conflict with:
1. **Existing dataset columns** — check via `dataset_schema(dataset_id)`
2. **Existing beast modes** — check via `beast_mode_list(dataset_id)`

If a conflict exists, prefix the name (e.g., "Calc: Delivery %" instead of "Delivery %"). Duplicate names cause "Rename Beast Modes to avoid conflict" errors that break cards.

### Step 5: Create

Once validated and name conflicts checked:

```
beast_mode_create(dataset_id, beast_modes=[{name, formula, description}])
```

Always provide a clear `description` so other users understand what it does.

---

## Function Reference

### Aggregate Functions
| Function | Example | Notes |
|----------|---------|-------|
| `SUM(expr)` | `SUM(\`Revenue\`)` | Sum of values |
| `AVG(expr)` | `AVG(\`Score\`)` | Mean |
| `COUNT(expr)` | `COUNT(\`ID\`)` | Count non-null |
| `COUNT(DISTINCT expr)` | `COUNT(DISTINCT \`Customer\`)` | Unique count |
| `MIN(expr)` | `MIN(\`Date\`)` | Minimum |
| `MAX(expr)` | `MAX(\`Date\`)` | Maximum |
| `STDDEV_POP(expr)` | `STDDEV_POP(\`Revenue\`)` | Population std dev |
| `VAR_POP(expr)` | `VAR_POP(\`Revenue\`)` | Population variance |
| `MEDIAN(expr)` | `MEDIAN(\`Revenue\`)` | Median value |

### Math Functions
| Function | Example |
|----------|---------|
| `ABS(x)` | `ABS(\`Profit\`)` |
| `CEILING(x)` | `CEILING(\`Score\`)` |
| `FLOOR(x)` | `FLOOR(\`Score\`)` |
| `ROUND(x, d)` | `ROUND(\`Price\`, 2)` |
| `POWER(x, y)` | `POWER(\`Base\`, 2)` |
| `MOD(x, y)` | `MOD(\`Row\`, 2)` |
| `RAND()` | Random 0-1 |

### String Functions
| Function | Example |
|----------|---------|
| `CONCAT(a, b, ...)` | `CONCAT(\`First\`, ' ', \`Last\`)` |
| `SUBSTRING(s, pos, len)` | `SUBSTRING(\`Code\`, 1, 3)` |
| `LEFT(s, n)` / `RIGHT(s, n)` | `LEFT(\`Zip\`, 5)` |
| `UPPER(s)` / `LOWER(s)` | `UPPER(\`Name\`)` |
| `TRIM(s)` | `TRIM(\`Input\`)` |
| `REPLACE(s, from, to)` | `REPLACE(\`Phone\`, '-', '')` |
| `LENGTH(s)` | `LENGTH(\`Name\`)` |
| `INSTR(s, sub)` | `INSTR(\`Email\`, '@')` |

### Date Functions
| Function | Example |
|----------|---------|
| `CURDATE()` | Current date |
| `NOW()` | Current timestamp |
| `YEAR(d)` / `MONTH(d)` / `DAY(d)` | `YEAR(\`Date\`)` |
| `QUARTER(d)` | `QUARTER(\`Date\`)` |
| `DAYNAME(d)` / `MONTHNAME(d)` | `DAYNAME(\`Date\`)` |
| `DAYOFWEEK(d)` / `DAYOFYEAR(d)` | `DAYOFWEEK(\`Date\`)` |
| `WEEKOFYEAR(d)` | `WEEKOFYEAR(\`Date\`)` |
| `DATEDIFF(d1, d2)` | `DATEDIFF(CURDATE(), \`Created\`)` |
| `DATE_ADD(d, INTERVAL n UNIT)` | `DATE_ADD(\`Date\`, INTERVAL 30 DAY)` |
| `DATE_SUB(d, INTERVAL n UNIT)` | `DATE_SUB(CURDATE(), INTERVAL 1 YEAR)` |
| `DATE_FORMAT(d, fmt)` | `DATE_FORMAT(\`Date\`, '%Y-%m')` |
| `STR_TO_DATE(s, fmt)` | `STR_TO_DATE(\`Text\`, '%m/%d/%Y')` |

### Conditional
| Function | Example |
|----------|---------|
| `CASE WHEN...THEN...ELSE...END` | See patterns below |
| `IFNULL(expr, default)` | `IFNULL(\`Revenue\`, 0)` |
| `NULLIF(a, b)` | `NULLIF(\`Value\`, 0)` — returns NULL if equal |
| `COALESCE(a, b, c)` | First non-null value |

### FIXED (Level of Detail)
| Function | Example | Notes |
|----------|---------|-------|
| `FIXED BY` | `SUM(FIXED BY \`Region\`: \`Revenue\`)` | Aggregate at specified grain |
| `FIXED ADD` | `SUM(FIXED ADD \`Region\`: \`Revenue\`)` | Add dimension to grain |
| `FIXED REMOVE` | `SUM(FIXED REMOVE \`Region\`: \`Revenue\`)` | Remove dimension from grain |

---

## Common Patterns

### Percentage of Total
```
SUM(`Revenue`) / SUM(SUM(`Revenue`)) * 100
```

### Year-over-Year Growth
```
(SUM(CASE WHEN YEAR(`Date`) = YEAR(CURDATE()) THEN `Revenue` ELSE 0 END)
 - SUM(CASE WHEN YEAR(`Date`) = YEAR(CURDATE()) - 1 THEN `Revenue` ELSE 0 END))
/ NULLIF(SUM(CASE WHEN YEAR(`Date`) = YEAR(CURDATE()) - 1 THEN `Revenue` ELSE 0 END), 0) * 100
```

### Running Total (percent of grand total)
```
SUM(`Revenue`) / SUM(SUM(`Revenue`)) * 100
```

### Conditional Count
```
SUM(CASE WHEN `Status` = 'Closed Won' THEN 1 ELSE 0 END)
```

### Win Rate
```
SUM(CASE WHEN `Stage` = 'Closed Won' THEN 1 ELSE 0 END)
/ NULLIF(COUNT(`Opportunity ID`), 0) * 100
```

### Days Since
```
DATEDIFF(CURDATE(), `Last Activity Date`)
```

### Fiscal Quarter (Oct start)
```
CASE
  WHEN MONTH(`Date`) >= 10 THEN CONCAT('FY', YEAR(`Date`) + 1, ' Q1')
  WHEN MONTH(`Date`) >= 7 THEN CONCAT('FY', YEAR(`Date`), ' Q4')
  WHEN MONTH(`Date`) >= 4 THEN CONCAT('FY', YEAR(`Date`), ' Q3')
  ELSE CONCAT('FY', YEAR(`Date`), ' Q2')
END
```

### Tier / Bucket Classification
```
CASE
  WHEN `Revenue` >= 1000000 THEN 'Enterprise'
  WHEN `Revenue` >= 100000 THEN 'Mid-Market'
  WHEN `Revenue` >= 10000 THEN 'SMB'
  ELSE 'Starter'
END
```

### Safe Division (prevent divide-by-zero)
```
CASE WHEN `Denominator` = 0 THEN 0
     ELSE `Numerator` / `Denominator`
END
```

### Moving Average (approximation via FIXED)
```
AVG(FIXED BY `Month`: SUM(`Revenue`))
```

---

## Tool Mapping

| Step | Tools |
|------|-------|
| Profile dataset | `dataset_schema`, `dataset_profile` |
| Validate formula | `beast_mode_validate` |
| Create beast mode | `beast_mode_create` |

## MCP Servers Required

- **domo-datasets** — for dataset schema and profiling
- **domo-pages** — for beast mode validation and creation

---

## Guardrails

- **Always validate before creating.** Syntax errors are caught by `beast_mode_validate`.
- **Always check for name conflicts.** Use `dataset_schema` and `beast_mode_list` before creating. Duplicate names break cards.
- **Use backticks for all column names.** Even single-word columns.
- **Watch for nulls.** Use IFNULL or NULLIF to handle NULL values in division.
- **Avoid divide by zero.** Use `NULLIF(denominator, 0)` or a CASE guard.
- **Keep formulas readable.** Use line breaks and indentation for complex CASE statements.
- **Name descriptively.** "Profit Margin %" is better than "Formula 1".
- **Include descriptions.** Explain what the beast mode calculates and why.
- **Test with `dataset_query` first.** For complex formulas, run a SQL query to verify the logic before creating the beast mode.

---

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: beast mode name(s), formula logic summary, target dataset/card, calculation rationale.

## Related Skills

- **Card Builder** (Build) — uses beast modes in card configurations
- **Card Spec Designer** (Build) — identifies which beast modes are needed for card specs
- **Chart Type Selector** (Build) — some chart types require beast mode pre-computation
