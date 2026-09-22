---
name: package-mapping
description: Map LOE estimates to new outcome-based packages using the 11-module weighted scoring system. Accounts for AI automation efficiencies while ensuring value delivery and appropriate pricing. Use when transitioning from hourly LOE to fixed-bid packages.
maturity: alpha
---
## Reference Documents

Scoping reference documents (SOW templates, estimation methodology, service catalog) are stored in S3 under `cs-templates/scoping/`.

**To access reference files on demand:**
- List available files: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/list?prefix=cs-templates/scoping/"`
- Read a specific file: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/read?key=cs-templates/scoping/<filename>"`

Cache files locally in `./templates/scoping/` after first fetch. Prefer cached copies on subsequent reads.

# Package Mapping Skill

## Purpose
Transform Level of Effort (LOE) estimates into recommendations for the new outcome-based service catalog packages using the 11-module weighted scoring system. Module weights and score ranges are calibrated against 34 full-build SOWs from the Mark portfolio (April 2026). LOE values remain internal-facing for planning; package recommendations drive customer-facing pricing.

The scoring model maps to six commercial tiers matching the FY2027 Service Catalog: Starter ($20K), Small ($30K), Medium ($45K), Large ($60K), X-Large ($100K), and Jumbo ($200K). The prior four-tier model (Starter / Standard / Large / Custom) is retired — use the six-tier model for all new engagements.

## Key Principles
- **Efficient LOE Baseline**: Use the lowest reasonable LOE consistent with the locked scope. Do not pad hours for package fit.
- **Module-Tier Scoring**: Score all 11 modules on a 0–5 scale (0 = N/A, 1 = X-Small … 5 = X-Large) using the tier definitions in this skill. Only score modules that are genuinely in scope.
- **Weight-Driven Fit**: Apply module-specific weights derived from observed effort distribution across 34 SOWs. High-weight modules drive the package tier; low-weight modules refine it.
- **Complexity Multiplier**: Apply a 1.0–2.0 complexity multiplier to the raw score before mapping to a package tier.
- **AI Enhancement**: Apply the AI value multiplier to traditional cost to derive effective customer value. Capture value while preserving delivery confidence.
- **Risk Transparency**: If the low estimate introduces material delivery risk, call it out explicitly.
- **Deal Type Rounding**: Corporate rounds down, Enterprise rounds up when the effective score is borderline (within 3 points of a tier boundary).

---

## Step 1 — Score Each Module (Tier 0–5)

Assign a tier to each of the 11 modules based on the scope signals from the locked Solution Blueprint and Scope Model. Use the tier definitions below. Tier 0 (N/A) contributes zero to the score.

### Tier Scale
| Tier | Label | Meaning |
|------|-------|---------|
| 0 | N/A | Module not in scope for this engagement |
| 1 | X-Small | Minimal / targeted — narrow scope, simple implementation |
| 2 | Small | Focused / defined — standard build, limited sources or components |
| 3 | Medium | Standard — full departmental build, moderate complexity |
| 4 | Large | Broad / complex — multi-source, enterprise complexity, or specialty depth |
| 5 | X-Large | Enterprise scale — maximum breadth, complexity, and delivery burden |

### Tier Hour Ranges by Module
Use the following indicative effort ranges when assigning a tier. Ranges reflect the observed distribution across 34 SOWs and the 2025 Domo estimation methodology. Actual hours should always be derived from the LOE Estimator.

| Module | T1 X-Small | T2 Small | T3 Medium | T4 Large | T5 X-Large |
|--------|-----------|---------|----------|---------|-----------|
| Data Integration | 8–20 hrs | 20–45 hrs | 45–90 hrs | 90–150 hrs | 150+ hrs |
| Data Transformation | 6–15 hrs | 15–40 hrs | 40–90 hrs | 90–160 hrs | 160+ hrs |
| Data Analytics | 8–20 hrs | 20–50 hrs | 50–90 hrs | 90–150 hrs | 150+ hrs |
| Data Powered Apps | 10–25 hrs | 25–55 hrs | 55–100 hrs | 100–175 hrs | 175+ hrs |
| AI Solutions | 6–18 hrs | 18–50 hrs | 50–100 hrs | 100–180 hrs | 180+ hrs |
| Actions & Distribution | 4–10 hrs | 10–35 hrs | 35–70 hrs | 70–130 hrs | 130+ hrs |
| Value Roadmap | 4–8 hrs | 8–18 hrs | 18–32 hrs | 32–50 hrs | 50+ hrs |
| Data Architecture | 4–8 hrs | 8–18 hrs | 18–30 hrs | 30–45 hrs | 45+ hrs |
| Governance | 2–5 hrs | 5–12 hrs | 12–20 hrs | 20–35 hrs | 35+ hrs |
| Domo COE | 4–8 hrs | 8–18 hrs | 18–32 hrs | 32–55 hrs | 55+ hrs |
| Adoptions | 2–5 hrs | 5–12 hrs | 12–22 hrs | 22–38 hrs | 38+ hrs |

### Tier Scoring Factors (beyond hours)
Hours are a signal, not the only input. Also consider:
- **Breadth**: number of sources, users, use cases, or components
- **Complexity**: custom logic, non-standard connectors, AI components, multi-system integrations
- **Scale**: dataset count, user count, page/dashboard count, audience size
- **Context**: new logo vs. existing customer, compliance requirements, Domo maturity, Cloud Amplifier / CDW strategy

---

## Step 2 — Apply Module Weights

Multiply each module's tier score by its weight. Weights are derived from observed average effort contribution (% of total project hours when present) and presence frequency across 34 SOWs.

### Module Weight Table
| # | Module | Weight | Avg % of Total (when present) | Presence Frequency |
|---|--------|--------|-------------------------------|-------------------|
| 1 | Data Transformation | **5** | 23.0% | 82% of engagements |
| 2 | Data Analytics | **5** | 23.0% | 82% of engagements |
| 3 | Data Integration | **4** | 17.3% | 79% of engagements |
| 4 | AI Solutions | **3** | 29.0% | 32% of engagements |
| 5 | Actions & Distribution | **3** | ~17% combined | ~30% of engagements |
| 6 | Data Powered Apps | **3** | 30.6% | 15% of engagements |
| 7 | Data Architecture | **2** | 7.1% | 97% of engagements |
| 8 | Value Roadmap | **1** | ~5% | ~20% of engagements |
| 9 | Governance | **1** | 3.4% | 68% of engagements |
| 10 | Adoptions | **1** | 4.3% | 94% of engagements |
| 11 | Domo COE | **1** | ~4% | ~10% of engagements |
| | **Sum** | **29** | | |

**Raw Score = Σ (module tier × module weight)**

Maximum theoretical raw score (all 11 modules at Tier 5): 145

---

## Step 3 — Apply Complexity Multiplier

Multiply the raw score by a complexity multiplier to reflect delivery burden beyond what tier assignment captures.

| Multiplier | Label | When to Apply |
|------------|-------|---------------|
| 1.0 | Standard | Clearly defined scope, established data sources, familiar platform, low unknowns |
| 1.2 | Moderate | 2–3 complex elements, some discovery required, integration complexity, or new logo |
| 1.5 | High | AI-primary engagement, multi-tenant embed, complex ERP integrations, strict compliance, or 4+ active modules |
| 2.0 | Enterprise | Multi-department, multiple specialty modules at high tiers, extensive change management, or regulated industry at scale |

**Effective Score = Raw Score × Complexity Multiplier**

---

## Step 4 — Map Effective Score to Package Tier

| Effective Score | Package Tier | Price Point |
|-----------------|--------------|-------------|
| 10–28 | Starter | $20K |
| 29–36 | Small | $30K |
| 37–47 | Medium | $45K |
| 48–55 | Large | $60K |
| 56–79 | X-Large | $100K |
| 80+ | Jumbo | $200K |

**Score ranges are calibrated against 34 observed SOWs** where traditional cost (LOE × $275/hr) maps as follows:
- Starter: ~≤$30K traditional
- Small: ~$30–45K traditional
- Medium: ~$45–65K traditional
- Large: ~$65–90K traditional
- X-Large: ~$90–150K traditional
- Jumbo: ~$150K+ traditional

### Multiple Paths to Each Package
Each tier is reachable through different module profiles:

**Starter (10–28):** Core modules (Data Integration, Transformation, Analytics) at Tier 1–2 only. No specialty modules, or one specialty module at Tier 1. Typical engagements: <100 hrs, single department, limited scope.

**Small (29–36):** Core modules at Tier 2. Architecture at Tier 1–2. One supporting module (Governance, Adoptions) at Tier 1–2. Typical engagements: 80–130 hrs, focused single-domain build.

**Medium (37–47):** Core modules at Tier 2–3. One specialty module at Tier 2 may be present (AI T2 or Actions T2). Architecture at Tier 1–2. Typical engagements: 130–200 hrs, focused departmental build with moderate complexity.

**Large (48–55):** Core modules at Tier 3–4. One specialty module at Tier 2–3, or two specialty modules at Tier 1–2. Architecture at Tier 2–3. Typical engagements: 200–310 hrs, full department or multi-use-case.

**X-Large (56–79):** Multiple modules at Tier 3–4, or one specialty module (AI, Apps, Actions) at Tier 3–4 combined with core modules at Tier 3+. Complexity multiplier often 1.2–1.5×. Typical engagements: 300–520 hrs, multi-department or specialty-primary.

**Jumbo (80+):** Multiple modules at Tier 4–5, or enterprise-scale AI/automation + core modules all at Tier 3+. Complexity multiplier typically 1.5–2.0×. Typical engagements: 500+ hrs, multi-department, regulated industry, or full-platform transformation.

---

## Step 5 — Apply AI Value Multiplier to Traditional Cost

The AI value multiplier reflects the efficiency and outcome enhancement Domo's AI capabilities deliver beyond raw hours. It converts internal traditional cost to effective customer value for commercial framing.

| Package Tier | AI Multiplier | Effective Value = Traditional Cost × Multiplier |
|--------------|---------------|------------------------------------------------|
| Starter | 1.3× | Minimal AI augmentation, efficient delivery |
| Small | 1.3× | Light AI efficiency gains |
| Medium | 1.3×–1.4× | Moderate AI efficiency gains |
| Large | 1.4×–1.5× | AI-assisted delivery, meaningful automation |
| X-Large | 1.5× | Full AI augmentation, significant outcome uplift |
| Jumbo | 1.5× | Enterprise-scale AI transformation uplift |

**Traditional Cost = LOE Hours × $275/hr**

**Effective Value = Traditional Cost × AI Multiplier**

If Effective Value and Package Tier are in conflict (e.g., score says Large but effective value suggests X-Large), favor the higher tier with a documented risk note.

---

## Step 6 — Deal Type Rounding

When the effective score lands within 3 points of a tier boundary:
- **Corporate deal**: Round down to the lower tier
- **Enterprise deal**: Round up to the higher tier

---

## Step 7 — Use Case Category Adjustment

Before finalizing the package tier, identify the engagement's primary use case category and apply any category-specific guardrails. These adjustments are derived from observed pricing gaps across 34 SOWs.

### Category Identification
| Use Case Category | Indicators |
|-------------------|------------|
| **Integration Use Cases** | Primary driver is moving/loading data. Integration hrs ≥40% of total LOE. Core deliverables are pipelines, connectors, ETL. |
| **Micro SaaS Displacement** | Custom app build replacing or augmenting an external SaaS tool. Data Powered Apps T3+ or Actions T3+ as a primary module. |
| **Business Use Cases – Analytical** | Dashboard-centric, KPI reporting, departmental analytics. Analytics hrs ≥35% of total LOE. No specialty modules dominant. |
| **Business Use Cases – Operational** | Process automation, AI agents, workflow orchestration. AI Solutions T2+ or Actions T3+ is a primary driver. |

### Category-Specific Guardrails

**Integration Use Cases**
- Integration-heavy builds tend to under-score because Integration weight (4) doesn't fully reflect pipeline complexity.
- Apply a minimum tier floor: if Integration T3+ is the primary module and total LOE ≥150 hrs, do not score below Medium.
- Add-on: Custom Integrations +$10K is almost always warranted at Integration T4+.

**Micro SaaS Displacement**
- App-centric builds (WorkJam, Digital Monitoring-style) carry high delivery risk not captured by the standard matrix.
- Guardrail: Data Powered Apps T4 → evaluate for X-Large regardless of other module scores.
- Guardrail: Data Powered Apps T3+ combined with AI Solutions T2+ → minimum Large.
- If the app replaces a licensed SaaS product, document the displacement value in the proposal narrative (license cost offsets).

**Business Use Cases – Analytical**
- The model is best calibrated for this category. Apply standard scoring with no additional floor.
- Small and Medium tiers are the primary targets for focused analytical builds (100–200 hrs).
- Add-on: Advanced Analytics +$8K is common at Analytics T4+.

**Business Use Cases – Operational**
- AI-primary engagements carry a higher delivery cost floor and outcome multiplier.
- Guardrail: AI Solutions T2+ → minimum Small ($30K).
- Guardrail: AI Solutions T3+ → minimum Large ($60K).
- Guardrail: AI Solutions T4+ with Actions T2+ → minimum X-Large ($100K).
- Required deliverables at AI T3+: AI agent spec or system prompt library, monitoring dashboard or evaluation framework.
- Apply 1.5× complexity multiplier for any engagement where AI Solutions accounts for ≥30% of LOE.

---

## Step 8 — Value-Add Module Recommendations

Include add-ons only when supported by genuine scope signals — not to inflate price.

| Add-On | Cost | Trigger |
|--------|------|---------|
| Extended Discovery | +$5K | Value Roadmap T2+, multiple unknowns, 4+ data sources unvalidated, new logo complexity |
| Advanced Analytics | +$8K | Data Analytics T4+, predictive components, statistical modeling, custom KPI frameworks |
| Custom Integrations | +$10K | Data Integration T4+, custom API connectors, ERP/middleware, federated queries |
| Change Management | +$6K | Adoptions T3+, multi-department rollout, formal training program, train-the-trainer |

---

## Worked Examples

### Small Analytics Build — 72 hrs → Starter
**Profile:** Sportsmith (72 hrs) — Architecture 8 hrs, Transform 14 hrs, Analytics 32 hrs, Adoptions 6 hrs

| Module | Tier | Weight | Points |
|--------|------|--------|--------|
| Data Transformation | T2 (14 hrs) | 5 | 10 |
| Data Analytics | T2 (32 hrs) | 5 | 10 |
| Data Architecture | T1 (8 hrs) | 2 | 2 |
| Adoptions | T1 (6 hrs) | 1 | 1 |
| All others | T0 (N/A) | — | 0 |
| **Raw Score** | | | **23** |
| Complexity Multiplier | | | × 1.0 |
| **Effective Score** | | | **23 → Starter** |

Traditional cost: 72 × $275 = $19,800 | AI Multiplier 1.3× = $25,740 effective value | **Package: Starter ($20K)**

---

### Simple Integration + Reporting — 96 hrs → Small
**Profile:** Typical integration onboarding (96 hrs) — Architecture 8 hrs, Integration 30 hrs, Transform 24 hrs, Analytics 24 hrs, Adoptions 8 hrs

| Module | Tier | Weight | Points |
|--------|------|--------|--------|
| Data Transformation | T2 (24 hrs) | 5 | 10 |
| Data Analytics | T2 (24 hrs) | 5 | 10 |
| Data Integration | T2 (30 hrs) | 4 | 8 |
| Data Architecture | T1 (8 hrs) | 2 | 2 |
| Adoptions | T2 (8 hrs) | 1 | 2 |
| All others | T0 (N/A) | — | 0 |
| **Raw Score** | | | **32** |
| Complexity Multiplier | | | × 1.0 |
| **Effective Score** | | | **32 → Small** |

Traditional cost: 96 × $275 = $26,400 | AI Multiplier 1.3× = $34,320 effective value | **Package: Small ($30K)**

---

### Focused Departmental Build — 130 hrs → Medium
**Profile:** Fluxx Labs (130 hrs) — Architecture 12, Integration 16, Transform 12, Analytics 60, Governance 10, Adoptions 8

| Module | Tier | Weight | Points |
|--------|------|--------|--------|
| Data Analytics | T3 (60 hrs) | 5 | 15 |
| Data Transformation | T2 (12 hrs) | 5 | 10 |
| Data Integration | T2 (16 hrs) | 4 | 8 |
| Data Architecture | T1 (12 hrs) | 2 | 2 |
| Governance | T2 (10 hrs) | 1 | 2 |
| Adoptions | T2 (8 hrs) | 1 | 2 |
| All others | T0 (N/A) | — | 0 |
| **Raw Score** | | | **39** |
| Complexity Multiplier | | | × 1.0 |
| **Effective Score** | | | **39 → Medium** |

Traditional cost: 130 × $275 = $35,750 | AI Multiplier 1.35× = $48,263 effective value | **Package: Medium ($45K)**

---

### Full Departmental Build — 227 hrs → Large
**Profile:** Eye Health America (227 hrs) — Architecture 12, Integration 60, Transform 60, Analytics 41, QA 16, Governance 2, Adoptions 6

| Module | Tier | Weight | Points |
|--------|------|--------|--------|
| Data Transformation | T3 (60 hrs) | 5 | 15 |
| Data Analytics | T3 (41 hrs) | 5 | 15 |
| Data Integration | T3 (60 hrs) | 4 | 12 |
| Data Architecture | T2 (12 hrs) | 2 | 4 |
| Governance | T1 (2 hrs) | 1 | 1 |
| Adoptions | T1 (6 hrs) | 1 | 1 |
| All others | T0 (N/A) | — | 0 |
| **Raw Score** | | | **48** |
| Complexity Multiplier | | | × 1.0 |
| **Effective Score** | | | **48 → Large** |

Traditional cost: 227 × $275 = $62,425 | AI Multiplier 1.4× = $87,395 effective value | **Package: Large ($60K)**

---

### AI-Centric Enterprise Build — 738 hrs → Custom
**Profile:** Cisco Comprehensive (738 hrs) — Architecture 44, AI Platform 194, AI Chat Agent 96, Workflow Automation 224, QA 32, Governance 28, Adoption 38

| Module | Tier | Weight | Points |
|--------|------|--------|--------|
| AI Solutions | T5 (290 hrs) | 3 | 15 |
| Actions & Distribution | T5 (224 hrs) | 3 | 15 |
| Data Architecture | T4 (44 hrs) | 2 | 8 |
| Governance | T4 (28 hrs) | 1 | 4 |
| Adoptions | T4 (38 hrs) | 1 | 4 |
| All others | T0 (N/A) | — | 0 |
| **Raw Score** | | | **46** |
| Complexity Multiplier (enterprise AI+Automation, multi-dept) | | | × 2.0 |
| **Effective Score** | | | **92 → Jumbo** |

Traditional cost: 738 × $275 = $202,950 | AI Multiplier 1.5× = $304,425 effective value | **Package: Jumbo ($200K)**

---

### Multi-Phase Enterprise Build — 310 hrs → X-Large
**Profile:** National PACE (310 hrs) — Architecture 20, Integration 55, Transform 110, Analytics 65, Governance 16, Adoptions 12

| Module | Tier | Weight | Points |
|--------|------|--------|--------|
| Data Transformation | T4 (110 hrs) | 5 | 20 |
| Data Analytics | T3 (65 hrs) | 5 | 15 |
| Data Integration | T3 (55 hrs) | 4 | 12 |
| Data Architecture | T2 (20 hrs) | 2 | 4 |
| Governance | T3 (16 hrs) | 1 | 3 |
| Adoptions | T3 (12 hrs) | 1 | 3 |
| All others | T0 (N/A) | — | 0 |
| **Raw Score** | | | **57** |
| Complexity Multiplier | | | × 1.0 |
| **Effective Score** | | | **57 → X-Large** |

Traditional cost: 310 × $275 = $85,250 | AI Multiplier 1.5× = $127,875 effective value | **Package: X-Large ($100K)**

---

## Scoring Worksheet Template

Use this worksheet when running a live package-mapping session:

```
PACKAGE MAPPING WORKSHEET
Customer: _______________________  Date: ____________
Deal Type: [ ] Corporate  [ ] Enterprise

MODULE SCORING
┌──────────────────────────┬────────┬────────┬────────┐
│ Module                   │  Tier  │ Weight │ Points │
├──────────────────────────┼────────┼────────┼────────┤
│ Data Transformation      │  0–5   │   5    │        │
│ Data Analytics           │  0–5   │   5    │        │
│ Data Integration         │  0–5   │   4    │        │
│ AI Solutions             │  0–5   │   3    │        │
│ Actions & Distribution   │  0–5   │   3    │        │
│ Data Powered Apps        │  0–5   │   3    │        │
│ Data Architecture        │  0–5   │   2    │        │
│ Value Roadmap            │  0–5   │   1    │        │
│ Governance               │  0–5   │   1    │        │
│ Adoptions                │  0–5   │   1    │        │
│ Domo COE                 │  0–5   │   1    │        │
├──────────────────────────┴────────┴────────┼────────┤
│ Raw Score                                   │        │
│ × Complexity Multiplier (1.0/1.2/1.5/2.0)  │   ×    │
│ = Effective Score                           │        │
└─────────────────────────────────────────────┴────────┘

EFFECTIVE SCORE → PACKAGE
[ ] 10–28 Starter ($20K)   [ ] 29–36 Small ($30K)    [ ] 37–47 Medium ($45K)
[ ] 48–55 Large ($60K)     [ ] 56–79 X-Large ($100K) [ ] 80+ Jumbo ($200K)

LOE SANITY CHECK
Internal LOE: _______ hrs  ×  $275  =  $_______ Traditional Cost
AI Multiplier: ______  ×  Traditional Cost  =  $_______ Effective Value

VALUE-ADD MODULES (check if in scope)
[ ] Extended Discovery +$5K    [ ] Advanced Analytics +$8K
[ ] Custom Integrations +$10K  [ ] Change Management +$6K

FINAL RECOMMENDATION
Package: _____________  Base Price: $_______  Add-ons: $_______
Total: $_______  Risk Notes: ______________________________________
```

---

## Calibration Notes

### Score Range Source
Score ranges are calibrated against 34 full-build SOWs from the Mark portfolio analyzed in April 2026. The mapping validates against traditional cost (LOE × $275/hr) as a sanity check:

| Hours | Traditional Cost | Expected Package |
|-------|-----------------|-----------------|
| ≤73 | ≤$20K | Starter |
| 74–109 | $20–30K | Small |
| 110–163 | $30–45K | Medium |
| 164–327 | $45–90K | Large |
| 328–545 | $90–150K | X-Large |
| 546+ | $150K+ | Jumbo |

### Guardrails
- If the package price is materially above the shadow T&M equivalent (>40%), explain the value delta or adjust.
- If the package price is materially below realistic delivery effort (<80% coverage), escalate before committing margin.
- Any engagement with multiple X-Large scores (T5), 6+ active modules, or high ambiguity should trigger director review.
- Jumbo ($200K) engagements require director sign-off before proposal delivery.
- Retainer, assessment-only, and ACE-converted engagements are not scored with this system — they require separate commercial treatment.

### When Effective Score and Traditional Cost Conflict
If the module score maps to a higher package than the traditional cost suggests:
- Favor the score — it captures scope breadth and complexity that hours alone miss.
- Document the rationale (e.g., "AI complexity and multi-tenant architecture drive enterprise-tier requirements despite moderate hours").

If the module score maps to a lower package than the traditional cost suggests:
- Validate whether the scope actually warrants the higher cost.
- Apply complexity multiplier if appropriate.
- If still in conflict, escalate to SSD review.

---

## Inputs
- Locked Scope Model (from scope-builder skill)
- LOE Estimate (from loe-estimator skill)
- Deal type (corporate / enterprise)
- Customer segment and size
- Module tier assessments (scored against this skill's tier definitions)

## Outputs
- Module tier scorecard (11 modules, each with assigned tier and points)
- Raw score, complexity multiplier, and effective score
- Recommended package tier and price
- Traditional cost, AI multiplier, and effective value
- Value-add module recommendations (only scope-supported)
- Risk assessment for low-LOE or borderline-score situations
- Final recommendation narrative for proposal-generator

## Dependencies
- Requires: loe-estimator (for original LOE and hour breakdown)
- Feeds: proposal-generator (package recommendation and value narrative)
- Position: commercial phase, post-scope-builder and post-loe-estimator

## Validation
This method ensures packages reflect both module-weighted complexity and the lowest reasonable effort estimate. It preserves competitive pricing, captures AI-derived value, and surfaces delivery risk when an efficient estimate may leave insufficient margin. Score ranges and weights are grounded in 34 observed SOWs and align with the FY2027 Service Catalog six-tier pricing model (Starter / Small / Medium / Large / X-Large / Jumbo). Ranges and weights will be updated as the portfolio grows.
