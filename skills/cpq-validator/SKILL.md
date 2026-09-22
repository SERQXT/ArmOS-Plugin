---
name: cpq-validator
tier: 1
description: "Verify consistency between the SOW draft and the CPQ quote before submission for approval — check pricing alignment, package/SKU match, required attachments, format compliance, and approval-rule readiness. Produce a pass/needs-attention/fail status with a specific discrepancy report. Trigger with 'validate CPQ for [account]', 'check the quote for [account]', 'pre-approval check for [account]', or 'is the SOW and CPQ aligned for [account]'."
maturity: alpha
audience: [delivery]
pipeline:
  phase: contract
  sub_phase: approval-validation
  position: 8
  output_type: output
  wave: 2
  state: ready
  inputs:
    - agent: sow-generator
      required: true
      data: SOW draft — workstreams, hours by workstream, total hours, fees, package selection, customer metadata
    - agent: service-matchmaker
      required: true
      data: Commercial Recommendation — locked option, pricing framework, package/tier selection
  outputs:
    - name: cpq-validation-report
      format: markdown
      downstream:
        - agent: knowledge-handoff
  data_sources:
    - tool: salesforce_lookup
      required: true
    - tool: fileset_search
      required: true
  phase_gate: true
---

# CPQ Validator — Pre-Approval Consistency Check

Systematically verifies that the SOW draft and the CPQ quote are consistent before the SSD submits for approval. Catches mismatches in pricing, hours, package selection, SKUs, and required attachments — before they become approval delays or post-signature problems.

This skill is not glamorous, but it is operationally critical. Approval cycles that fail because of a pricing mismatch or a missing attachment waste days. This skill prevents that.

## How It Works

```
SOW Draft + Commercial Recommendation + Salesforce / CPQ Data
                           |
  +--------+--------+--------+--------+--------+
  |        |        |        |        |        |
Pricing  Package  Hours   Attach-  Format
 Check    / SKU   Match   ments   Compliance
  |        |        |        |        |        |
  +--------+--------+--------+--------+--------+
                           |
          Produce Pass / Needs Attention / Fail
                           |
         🔵 OUTPUT: CPQ Validation Report
                           |
              → SSD resolves, resubmits, or escalates
```

## Triggers

- "validate CPQ for [account]"
- "check the quote for [account]"
- "pre-approval check for [account]"
- "is the SOW and CPQ aligned for [account]"
- "run the CPQ check for [account]"
- "ready to submit [account] for approval?"

**Prerequisites:**
- SOW draft: complete (not necessarily SSD-locked — can run against draft to catch issues early)
- Commercial Recommendation: SSD-selected option locked
- CPQ quote: exists in Salesforce and is accessible via salesforce_lookup

---

## Execution Flow

### Step 1: Load All Inputs

```
sow-generator output
→ Extract: total hours, hours by workstream, total fees, package/tier, customer legal name,
           engagement structure (fixed-bid/T&M/retainer), SOW version, attachment list

service-matchmaker output (locked option)
→ Extract: recommended package, pricing framework, hours, fees, commercial structure

salesforce_lookup(account_name, object="CPQ Quote")
→ Extract: quote line items, SKUs, quantities, unit prices, total fees,
           package/tier selection, attached documents, quote status, approval chain

fileset_search("CPQ approval rules validation checklist")
fileset_search("SOW CPQ alignment requirements")
→ Load current approval rules, required fields, required attachments, and format standards
```

---

### Step 2: Pricing Consistency Check

Compare fees across three sources: SOW, Commercial Recommendation, and CPQ.

| Check | SOW Value | Commercial Rec Value | CPQ Value | Match? |
|-------|-----------|---------------------|-----------|--------|
| Total project fee | $[X] | $[X] | $[X] | ✅ / ❌ |
| Rate (if T&M) | $[X]/hr | $[X]/hr | $[X]/hr | ✅ / ❌ |
| Payment schedule | [Structure] | [Structure] | [Structure] | ✅ / ❌ |
| Discount applied | [%] | [%] | [%] | ✅ / ❌ |
| Discount approved | — | — | [Yes/No/Pending] | ✅ / ❌ |

**Discrepancy types and severity:**

| Discrepancy | Severity | Action |
|-------------|---------|--------|
| Fee mismatch between SOW and CPQ | 🔴 CRITICAL | Cannot submit — must resolve before approval |
| Rate mismatch (T&M engagements) | 🔴 CRITICAL | Cannot submit |
| Discount in CPQ not reflected in SOW | 🔴 CRITICAL | Cannot submit |
| Unapproved discount in CPQ | 🔴 CRITICAL | Requires approval before submission |
| Payment schedule inconsistency | 🟡 IMPORTANT | Should resolve before customer send |
| Minor rounding difference (<$100) | 🟢 ADVISORY | Note and confirm intentional |

---

### Step 3: Package and SKU Alignment Check

Verify that the package selected in the SOW and the SKUs in the CPQ are consistent.

```
fileset_search("service catalog SKU package mapping")
→ Load current SKU-to-package mappings
```

| Check | SOW Value | CPQ Value | Match? |
|-------|-----------|-----------|--------|
| Package tier | [e.g., Gold] | [SKU / line item] | ✅ / ❌ |
| Add-on modules | [List from SOW] | [SKUs in CPQ] | ✅ / ❌ |
| Engagement structure type | [Fixed/T&M/Retainer] | [CPQ line type] | ✅ / ❌ |
| Hours quantity | [X] hrs | [X] hrs | ✅ / ❌ |
| Accelerators included | [List from SOW] | [CPQ line items] | ✅ / ❌ |

**Discrepancy types and severity:**

| Discrepancy | Severity | Action |
|-------------|---------|--------|
| Package tier mismatch | 🔴 CRITICAL | Cannot submit — SOW and CPQ must reference same tier |
| SKU not mapped to selected package | 🔴 CRITICAL | Cannot submit — invalid quote line |
| Hours quantity mismatch | 🔴 CRITICAL | SOW and CPQ must show same hours |
| Add-on in SOW not in CPQ | 🟡 IMPORTANT | Customer will receive scope but not be charged — commercial risk |
| Add-on in CPQ not in SOW | 🟡 IMPORTANT | Customer will be charged for something not in scope — legal risk |
| Accelerator not listed in SOW | 🟢 ADVISORY | Note and confirm intentional |

---

### Step 4: Required Attachments Check

```
fileset_search("CPQ required attachments approval checklist")
→ Load required attachment list for current approval rules
```

Verify that all required documents are attached to the CPQ opportunity:

| Required Document | Present? | Version | Notes |
|------------------|---------|---------|-------|
| Signed / reviewed SOW | ✅ / ❌ | v[X] | [Notes] |
| Commercial Recommendation (internal) | ✅ / ❌ | | |
| Discount approval (if discount applied) | ✅ / ❌ | | |
| Customer PO or authorization (if required) | ✅ / ❌ | | |
| [Other required attachments per fileset rules] | ✅ / ❌ | | |

**Discrepancy types and severity:**

| Discrepancy | Severity | Action |
|-------------|---------|--------|
| SOW not attached | 🔴 CRITICAL | Cannot submit without SOW |
| Discount approval not attached | 🔴 CRITICAL | Discount cannot be applied without approval |
| Customer PO missing (if required) | 🔴 CRITICAL | Revenue recognition risk |
| Internal approval doc missing | 🟡 IMPORTANT | May cause approval delay |

---

### Step 5: SOW Format and Completeness Check

Verify the SOW draft meets format and completeness standards before it is attached to the CPQ.

| Check | Status | Notes |
|-------|--------|-------|
| Customer legal name populated (not placeholder) | ✅ / ❌ | |
| All `[REQUIRES SSD INPUT]` placeholders resolved | ✅ / ❌ | [Count remaining if any] |
| Effective date / start date populated | ✅ / ❌ | |
| Project fees section complete | ✅ / ❌ | |
| Hours table matches LOE Estimate | ✅ / ❌ | |
| Customer team section populated | ✅ / ❌ | |
| Domo team section populated | ✅ / ❌ | |
| All workstream completion acceptance language present | ✅ / ❌ | |
| SOW version is current (not a stale draft) | ✅ / ❌ | v[X] — last updated [date] |
| Template type is correct for this engagement | ✅ / ❌ | |

---

### Step 6: Approval Chain Verification

```
salesforce_lookup(account_name, object="Approval Rules")
fileset_search("CPQ approval routing rules thresholds")
→ Load current approval chain requirements for this deal size and structure
```

| Check | Assessment | Status |
|-------|-----------|--------|
| Deal requires standard approval path | [Yes/No] | |
| Deal requires elevated approval (discount, size, strategic) | [Yes/No — reason] | ✅ / ❌ |
| Correct approvers identified in CPQ | [List] | ✅ / ❌ |
| Any approver out of office / unavailable | [Flag if known] | ✅ / ❌ |
| Manager pre-alignment done before formal submission | [SSD to confirm] | ✅ / ❌ |

**Note on pre-alignment:** Formal approval submissions should not be surprises. If the deal requires elevated approval, the SSD should verbally align with the approver before submitting. Flag if this has not been done.

---

### Step 7: Compile Validation Report

Produce overall status and a prioritized action list.

**Overall status:**

| Status | Criteria |
|--------|---------|
| ✅ **PASS — READY TO SUBMIT** | Zero CRITICAL items; all IMPORTANT items resolved or acknowledged |
| ⚠️ **NEEDS ATTENTION** | One or more IMPORTANT items unresolved; no CRITICAL items |
| ❌ **FAIL — DO NOT SUBMIT** | One or more CRITICAL items present |

---

## Output Template

```markdown
# CPQ Validation Report: [Account Name]
**Version:** 1.0
**Prepared:** [Date] | **SSD:** [Name]
**SOW Version:** v[X] | **CPQ Quote ID:** [ID from Salesforce]
**Commercial Recommendation:** [Locked option name]

---

## Overall Status

# [✅ PASS — READY TO SUBMIT / ⚠️ NEEDS ATTENTION / ❌ FAIL — DO NOT SUBMIT]

**Summary:** [1–2 sentences — what the status means and what action the SSD needs to take]

---

## Discrepancy Report

### 🔴 CRITICAL — Must Resolve Before Submission

| # | Check | SOW Value | CPQ Value | Action Required |
|---|-------|-----------|-----------|----------------|
| 1 | [e.g., Total fee mismatch] | $[X] | $[Y] | Update CPQ to match SOW fee of $[X] |
| 2 | [e.g., Package SKU missing] | Gold tier | [SKU not found] | Add correct SKU [SKU-XXX] to CPQ |

*[If none: "No critical discrepancies found."]*

---

### 🟡 IMPORTANT — Should Resolve Before Customer Send

| # | Check | Finding | Action Required |
|---|-------|---------|----------------|
| 1 | [e.g., Customer team incomplete in SOW] | 2 customer roles still show placeholder | Confirm names with customer before sending SOW |
| 2 | [e.g., Add-on in SOW not in CPQ] | Governance module in SOW, not in CPQ | Confirm whether to add to CPQ or remove from SOW |

*[If none: "No important issues found."]*

---

### 🟢 ADVISORY — Note and Confirm

| # | Check | Finding | Action |
|---|-------|---------|--------|
| 1 | [e.g., Minor rounding] | $0.50 difference in total — rounding | Confirm intentional — no action required |

*[If none: "No advisory items."]*

---

## Check Results Detail

### Pricing Consistency
| Check | SOW | Commercial Rec | CPQ | Status |
|-------|-----|---------------|-----|--------|
| Total fee | $[X] | $[X] | $[X] | ✅ / ❌ |
| Rate | $[X] | $[X] | $[X] | ✅ / ❌ |
| Discount | [%] | [%] | [%] | ✅ / ❌ |
| Discount approved | — | — | [Yes/No] | ✅ / ❌ |

### Package & SKU Alignment
| Check | SOW | CPQ | Status |
|-------|-----|-----|--------|
| Package tier | [Tier] | [SKU] | ✅ / ❌ |
| Hours | [X] hrs | [X] hrs | ✅ / ❌ |
| Add-ons | [List] | [List] | ✅ / ❌ |

### Required Attachments
| Document | Present | Notes |
|----------|---------|-------|
| SOW | ✅ / ❌ | v[X] |
| Discount approval | ✅ / ❌ / N/A | |
| Customer PO | ✅ / ❌ / N/A | |

### SOW Completeness
| Check | Status | Notes |
|-------|--------|-------|
| No unresolved placeholders | ✅ / ❌ | [X remaining if any] |
| Legal name populated | ✅ / ❌ | |
| Fees section complete | ✅ / ❌ | |
| Team sections complete | ✅ / ❌ | |

### Approval Chain
| Check | Status | Notes |
|-------|--------|-------|
| Approval path identified | ✅ / ❌ | [Standard / Elevated — reason] |
| Approvers in CPQ | ✅ / ❌ | [Names] |
| Pre-alignment done | ✅ / ❌ | SSD to confirm |

---

## Action Checklist

*Complete in order before submitting.*

| Priority | Action | Owner | Done? |
|----------|--------|-------|-------|
| 🔴 CRITICAL | [Action 1] | [SSD / AE / Finance] | [ ] |
| 🔴 CRITICAL | [Action 2] | | [ ] |
| 🟡 IMPORTANT | [Action 3] | | [ ] |
| 🟡 IMPORTANT | [Action 4] | | [ ] |

---

**Prepared by:** CS Solutions CPQ Validator Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Contract → Approval Validation → Position 8
**Phase Gate:** YES — SSD must resolve all CRITICAL items before submission
```

---

## Guardrails

- **CRITICAL items are hard stops.** Do not submit a quote with a CRITICAL discrepancy. The approval will either fail or create a post-signature problem that is much harder to fix.
- **Run early, not just at submission.** The CPQ Validator can be run against a draft SOW to catch issues before the SSD invests time in finalizing. Flag this as a best practice.
- **Do not approve what you cannot verify.** If the salesforce_lookup cannot retrieve the CPQ quote, stop and flag — do not assume consistency.
- **Pre-alignment is not optional for elevated approvals.** A formal approval submission that surprises an SVP is worse than asking first. Flag if pre-alignment has not been confirmed.
- **The report is the SSD's checklist, not the approver's.** The SSD resolves all CRITICAL items before the document ever reaches an approver.
- **Version discipline matters.** Always confirm the SOW version attached to the CPQ is the most current SSD-reviewed version. A stale draft going to approval is a common, preventable mistake.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| salesforce_lookup | **Yes** | CPQ quote data — line items, SKUs, pricing, attached documents, approval chain |
| fileset_search | **Yes** | Approval rules, required attachments checklist, SKU-to-package mapping, SOW format standards |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, content summarizing: CPQ validation results, pricing accuracy check, configuration issues found, quote-to-scope alignment status.

---

## Related Skills

- **SOW Generator** → Upstream — SOW draft being validated
- **Service Matchmaker** → Upstream — locked Commercial Recommendation being cross-checked
- **Knowledge Handoff** → Downstream — validated and approved deal feeds delivery team briefing
