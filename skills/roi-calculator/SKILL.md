---
name: roi-calculator
description: "Build and quantify the business value model and ROI — calculate financial impact from pain point resolution, map value drivers to discovery insights, and produce transparent cost-benefit analysis with assumptions. Trigger with 'calculate the ROI for [account]', 'build the business value case for [account]', 'quantify value for [account]', or 'develop the value model for [account]'. Requires locked Discovery Record, Solution Blueprint, and LOE Estimate."
maturity: alpha
pipeline:
  phase: commercial
  sub_phase: value-analysis
  position: 6.5
  output_type: intermediate
  wave: 2
  state: ready
  inputs:
    - agent: discovery-synthesizer
      required: true
      data: locked Discovery Record — pain points, value drivers, success criteria, stakeholder goals
    - agent: solution-blueprint
      required: true
      data: locked Solution Blueprint — use cases, platform capabilities, delivery approach
    - agent: loe-estimator
      required: true
      data: locked LOE Estimate — project hours and complexity
  outputs:
    - name: roi-analysis
      format: markdown
      downstream:
        - agent: proposal-generator
        - agent: service-matchmaker
  data_sources:
    - tool: fileset_search
      required: true
    - tool: gong_transcript_lookup
      required: false
    - tool: industry_benchmarks
      required: false
  phase_gate: false
---
## Reference Documents

Scoping reference documents (SOW templates, estimation methodology, service catalog) are stored in S3 under `cs-templates/scoping/`.

**To access reference files on demand:**
- List available files: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/list?prefix=cs-templates/scoping/"`
- Read a specific file: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/read?key=cs-templates/scoping/<filename>"`

Cache files locally in `./templates/scoping/` after first fetch. Prefer cached copies on subsequent reads.

# ROI Calculator — Business Value Model and Financial Impact

Builds and quantifies the business value model from the solution and discovery inputs — calculating financial impact, mapping value drivers to specific customer statements, and producing transparent cost-benefit analysis with explicitly stated assumptions.

The goal is to produce honest, defensible ROI — every value claim traces back to discovery. No invented numbers. If value cannot be quantified, it is stated qualitatively with confidence levels clearly labeled.

## How It Works

```
Discovery Record + Solution Blueprint + LOE Estimate
                    |
  +-------+-------+-------+-------+-------+
  |       |       |       |       |       |
Identify Cost   Productivity Revenue   Risk
Value    Savings Gains     Impact    Reduction
Drivers  Formula Formula   Formula   Formula
  |       |       |       |       |       |
  +-------+-------+-------+-------+-------+
                    |
         Apply Confidence Levels
         (HIGH / MEDIUM / LOW)
                    |
         Build Summary ROI Table
                    |
         Flag Assumptions & Risks
                    |
         🔵 OUTPUT: ROI Analysis
                    |
    → Proposal Generator + Service Matchmaker
```

## Triggers

- "calculate the ROI for [account]"
- "build the business value case for [account]"
- "quantify value for [account]"
- "develop the value model for [account]"
- "what's the payback period for [account]"

**Prerequisites:**
- Discovery Record: LOCKED
- Solution Blueprint: LOCKED
- LOE Estimate: LOCKED

---

## Estimation Reference

Pull the full ROI methodology before running calculations:

```
fileset_search("ROI business value calculation framework")
fileset_search("Domo customer ROI benchmarks by industry")
fileset_search("business value methodology value driver taxonomy")
```

The frameworks below are the standard methodology. Always verify against the fileset — if the fileset contains an updated version, the fileset takes precedence.

---

## Execution Flow

### Step 1: Load Inputs and Extract Value Drivers

```
discovery-synthesizer  → pain points, stated challenges, success criteria, KPIs that matter
solution-blueprint     → use cases, platform capabilities, data availability
loe-estimator          → project hours, timeline, complexity
gong_transcript_lookup → specific customer language and examples
fileset_search("business value opportunity framework")
```

**Map pain points to value driver categories:**

| Pain Point (from Discovery) | Value Driver Category | Potential Quantifiable Impact |
|---------------------------|----------------------|-------------------------------|
| [Customer's stated challenge] | Cost Savings / Productivity / Revenue / Risk | [High / Medium / Low potential] |

---

### Step 2: Calculate Cost Savings Value

**When applicable:** Process automation, report acceleration, reduced manual effort, error reduction, resource reallocation.

**Formula:**
```
Annual Cost Savings = (Current Hours × Rate) - (Future Hours × Rate)
                    = [(Current Hours - Future Hours) × Rate] × Frequency
```

**Template:**

```
VALUE DRIVER: [Driver name]
---
Current State: [What customer currently does / current impact]
Source: [Gong call date / who stated it / directly observed]
  • "[Customer quote about the process or its impact]"

Domo Impact: [What changes with the solution]
  • [Specific capability enabled by the solution]
  • [Measured change: from X to Y]

Calculation:
  Hours saved per [cycle]: [X] hours/[cycle]
  Frequency: [Y] [cycles] per year
  Hourly rate: $[Z] (assumed: [basis for rate])
  
  Annual Savings = [X hours] × [Y cycles] × $[Z rate]
                 = $[total]

Confidence: [HIGH / MEDIUM / LOW]
Basis: [Why high/medium/low — customer-validated, industry benchmark, directional estimate]

Assumptions to Validate:
  • [Key assumption 1 and how it could change the number]
  • [Key assumption 2]
```

**Cost Savings Examples:**

#### Manual Report Consolidation Eliminated
```
Current: Sales team spends 16 hours/week consolidating data from 5 systems into spreadsheets
Cost: 16 hrs/wk × 52 wks × $80/hr = $66,560/year

Future: Domo dashboard pulls data automatically
Cost: 0 hrs/wk

Annual Savings: $66,560
```

#### Data QA and Error Correction Reduced
```
Current: Finance team spends 40 hours/month correcting manual data entry errors
Impact: 2-3 day delay in month-end close due to rework

Domo: Automated validation and transformation eliminates 80% of errors
Future: 8 hours/month QA needed

Annual Savings: (40 - 8) hrs/mo × 12 mo × $100/hr = $38,400
Plus: 2-3 day acceleration of close = [business value of faster close]
```

---

### Step 3: Calculate Productivity Gains Value

**When applicable:** Faster decision-making, reduced reporting cycle time, earlier insights, improved data accessibility, reduced context-switching.

**Formula:**
```
Annual Productivity Gain = (Number of Decisions per Year) × (Value per Better Decision)
```

**Template:**

```
VALUE DRIVER: [Driver name]
---
Current State: [Timeline impact or decision frequency affected]
Source: [Gong call date / who stated it / observation]
  • "[Customer quote about wait time or decision impact]"

Domo Impact: [Speed or frequency improvement]
  • [How solution accelerates or enables decisions]

Calculation:
  Decisions per [period]: [X] decisions
  Time to insight reduction: from [Y] days to [Z] days
  Value per accelerated decision: $[V] (based on: [business context])
  
  Annual Gain = [X decisions/year] × $[V value per decision]
              = $[total]

Confidence: [HIGH / MEDIUM / LOW]
Basis: [Customer-validated impact / estimated based on context]

Assumptions to Validate:
  • [Key assumption about decision frequency]
  • [Key assumption about value per decision]
```

**Productivity Gains Examples:**

#### Faster Demand Planning
```
Current: Weekly demand forecast takes 3 days (Thu–Sat) to prepare; decisions happen Monday
Impact: Weekday market signals missed, inventory misalignment

Domo: Real-time dashboard updated daily
Result: Forecast prepared Friday AM; decision Monday with full week's data

Value: Fewer stockouts = 2–3% revenue protection
  → [Calculate as revenue protection or cost avoidance]
```

#### Reduced Sales Cycle Decision Wait
```
Current: Sales manager waits 2 days for pipeline report to approve deals
Impact: Customer wait time, deal risk if timeline changes

Domo: Live dashboard updated hourly
Result: Decision within 1 hour

Value: Faster close, reduced deal slippage
  → [Estimate: X% of deals accelerated × value per deal]
```

---

### Step 4: Calculate Revenue Enablement Impact

**When applicable:** Sales visibility, customer insight, pricing optimization, upsell identification, market expansion, churn reduction.

**Important:** Revenue claims must be grounded in customer insight. Do not invent revenue.

**Formula:**
```
Annual Revenue Impact = (Incremental Opportunity) × (Probability of Capture)
```

**Template:**

```
VALUE DRIVER: [Driver name]
---
Current State: [What customer is missing or unable to do]
Source: [Gong call date / who stated it / observed]
  • "[Customer quote about lost opportunity or missed insights]"

Domo Impact: [Specific capability enabled]
  • [Dashboard / capability that reveals the opportunity]

Calculation:
  Addressable opportunity: $[X] annual (based on: [calculation or customer estimate])
  Capture rate with Domo: [Y%] (based on: [comparable customer / customer estimate])
  
  Annual Impact = $[X] × [Y%]
                = $[total]

Confidence: [HIGH / MEDIUM / LOW]
Basis: [Why this confidence level]

Assumptions to Validate:
  • [Critical assumption 1]
  • [Critical assumption 2]
```

**Revenue Enablement Examples:**

#### Churn Reduction from Early Warning
```
Current: Customer churn identified during renewal cycle (too late)
Domo: Usage dashboard identifies at-risk accounts 90 days earlier

Customer data: 500 customers, 8% annual churn = 40 customers/year
Value per customer: $50K ARR

Assumption: Earlier intervention saves 25% of would-be churn
Calculation: 40 × 25% × $50K = $500K

Confidence: MEDIUM
Basis: Estimated from comparable customer experience; customer to validate actual intervention effectiveness
```

#### Upsell Opportunity Identification
```
Current: Sales team unaware of growth signals in existing accounts
Domo: Dashboard reveals product adoption growth and expansion potential

Current: 200 customers, $100K avg ARR, upsell rate 5% = $1M annual
Domo enablement: Increases upsell rate to 8% = $1.6M annual

Uplift: $600K incremental

Confidence: MEDIUM
Basis: Conservative uplift estimate; actual depends on sales execution and customer buying signals
```

---

### Step 5: Calculate Risk Reduction Value

**When applicable:** Compliance risk, data security, audit efficiency, operational continuity, brand protection, regulatory exposure.

**Formula:**
```
Annual Risk Mitigation Value = (Cost of Risk Event) × (Probability Reduction)
```

**Template:**

```
VALUE DRIVER: [Driver name]
---
Current State: [What risk exposure exists]
Source: [Gong call date / who stated it / compliance documentation]
  • "[Customer statement about risk or compliance concern]"

Domo Impact: [Risk mitigation mechanism]
  • [How solution reduces exposure]

Calculation:
  Cost of risk event: $[X] (based on: [past occurrence / compliance penalty / business impact])
  Current probability: [Y%] per year
  Residual probability with Domo: [Z%]
  
  Risk Mitigation Value = $[X] × ([Y%] - [Z%])
                        = $[total]

Confidence: [HIGH / MEDIUM / LOW]
Basis: [Why this confidence level]

Assumptions to Validate:
  • [Assumption about risk probability]
  • [Assumption about mitigation effectiveness]
```

**Risk Reduction Examples:**

#### Governance and Audit Efficiency
```
Current: Manual audit of access controls and data lineage; 80 hours/year audit response
Future: Domo PDP and governance layer enables automated audit trail

Savings: 80 hrs/yr × $150/hr = $12K
Plus: Reduced audit risk (penalty exposure if misconfigured)

Confidence: HIGH — internal process benefit
```

#### Data Security and Breach Prevention
```
Current: Scattered data across tools = compliance risk and breach exposure
Domo: Centralized governance with PDP, encryption, audit logging

Estimated breach risk: 2% annual probability
Cost of data breach: $2M (downtime, notification, remediation, brand)

Risk reduction: 50% probability reduction (from scattered to centralized security)
Value = $2M × 50% = $1M risk mitigation

Confidence: LOW — directional estimate; customer to validate risk profile
```

---

### Step 6: Build Summary ROI Table

Consolidate all value drivers:

```
BUSINESS VALUE SUMMARY

| Value Driver | Annual Value | Confidence | Source / Basis | Year 1 Realization |
|---|---|---|---|---|
| [Driver 1 — Cost Savings] | $[X] | HIGH | Customer stated in call [date] | [%] year 1 |
| [Driver 2 — Productivity] | $[X] | MEDIUM | Industry benchmark — customer to validate | [%] year 1 |
| [Driver 3 — Revenue] | $[X] | LOW | Directional estimate | [%] year 1 |
| [Driver 4 — Risk] | $[X] | HIGH | Compliance framework | [%] year 1 |
| **Total Annual Value** | **$[Total]** | | | |
| | | | | |
| **Project Investment** | $[X] | | From LOE Estimate and pricing | |
| **Annual Maintenance** | $[X] | | Estimated licensing + support | |
| | | | | |
| **Simple Payback Period** | [X] months | | | |
| **Year 1 Net Benefit** | $[X] | | After investment | |
| **Year 1 ROI** | [X%] | | | |
| **3-Year Cumulative Value** | $[X] | | | |
```

---

### Step 7: Document Assumptions and Confidence Assessment

Create a detailed assumptions log:

```
ASSUMPTIONS & CONFIDENCE ASSESSMENT

HIGH CONFIDENCE VALUE DRIVERS (Customer-validated or observed):
• [Driver]: Based on [specific customer statement or directly observed process]
  → No further validation needed; confidence threshold met

MEDIUM CONFIDENCE VALUE DRIVERS (Industry benchmark or reasonable estimate):
• [Driver]: Based on [industry benchmarks, comparable customer, conservative estimate]
  → Recommend validation: [Specific data or conversation needed]

LOW CONFIDENCE VALUE DRIVERS (Directional estimate):
• [Driver]: Based on [assumption or limited data]
  → Validation critical: [Customer to confirm scope and probability]

RISK FACTORS THAT COULD REDUCE VALUE:
  1. [Assumption] — If [scenario], value could be $[lower number]
  2. [Assumption] — If [scenario], value could be $[lower number]

OPPORTUNITIES THAT COULD INCREASE VALUE:
  1. [If customer extends use case to Y], additional value = $[X]
  2. [If adoption rate exceeds estimates], uplift = $[X]

YEAR 1 REALIZATION:
  Phased implementation may result in lower year 1 value realization:
  • [Phase 1 ready by month X] → [Value driver] at [%] realization
  • [Phase 2 ready by month Y] → [Value driver] at [%] realization
  • Full value achieved by year [Z]
```

---

## Output Template

```markdown
# ROI Analysis: [Account Name]
**Version:** 1.0
**Prepared:** [Date] | **Analyst:** [Name]
**Status:** DRAFT — Pending customer validation

---

## Executive Summary

This engagement is expected to deliver **$[Total Annual Value]** in annual business value through:
- [Driver 1]: $[X] (HIGH confidence)
- [Driver 2]: $[X] (MEDIUM confidence)
- [Driver 3]: $[X] (LOW confidence)

**Investment:** $[X] (Year 1 project + [X] annual support)
**Simple Payback:** [X] months
**Year 1 ROI:** [X%]

---

## Value Driver Breakdown

[Detailed calculation for each value driver, per Steps 2–5]

---

## ROI Summary Table

[Per Step 6]

---

## Assumptions and Confidence Assessment

[Per Step 7]

---

## Customer Validation Checklist

Before presenting this ROI to the customer, confirm:
- [ ] Current state hours/costs validated with customer
- [ ] Process changes understood and agreed
- [ ] Success metrics and KPIs defined
- [ ] Probability and timing assumptions reviewed
- [ ] Risk factors and mitigation discussed

---

## Next Steps

1. **Present to customer:** Share this ROI analysis in discovery follow-up
2. **Gather validation:** Confirm assumptions with stakeholders identified in Discovery
3. **Refine:** Update confidence levels and numbers based on customer feedback
4. **Lock:** Once validated, ROI forms foundation for Proposal Generator output

---
**Prepared by:** CS Solutions ROI Calculator Agent
**Output Type:** 🔵 INTERMEDIATE OUTPUT
**Used by:** Proposal Generator, Service Matchmaker
**Phase Gate:** NO — ROI may be refined through customer validation
```

---

## Guardrails

- **Every value claim must trace to discovery.** If the customer said it or we observed it, use it. If it comes from an industry benchmark, cite it clearly. If it is directional, label it as such. Never invent numbers.
- **Use the customer's language.** Mirror back what they told you: "You mentioned that report consolidation takes 16 hours a week..." This builds trust and ensures accuracy.
- **Separate customer-stated from estimated value.** HIGH confidence (customer-stated) → can lead with. LOW confidence (directional) → must be positioned as "to be validated."
- **State all assumptions explicitly.** Do not bury assumptions. Lay them out for review and validation.
- **Do not force value where none exists.** If a value driver cannot be credibly quantified, state it qualitatively: "Customers in similar situations report this as [qualitative outcome]. We recommend validating with your team."
- **Confidence levels drive conversation.** LOW confidence items are not failures — they are conversation starters. Use them to probe customer priorities and gather more data.
- **Year 1 realization differs from steady-state.** Be explicit about phasing and timing. A $1M annual value delivered in Year 3 is different from Year 1.
- **ROI is defensible only when peer-reviewed.** Before locking, have another SSD or partner review the calculations and assumptions.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| fileset_search | **Yes** | ROI methodology, value driver framework, industry benchmarks |
| gong_transcript_lookup | Optional | Exact customer language and specific examples to ground calculations |
| industry_benchmarks | Optional | Comparable customer data and ROI patterns by industry |

---

## Related Skills

- **Discovery Synthesizer** → Upstream — pain points and value drivers
- **Solution Blueprint** → Upstream — use cases and capabilities that drive value
- **LOE Estimator** → Upstream — project hours and timeline
- **Proposal Generator** → Downstream — ROI becomes customer-facing value narrative
- **Service Matchmaker** → Downstream — ROI informs commercial positioning and pricing
