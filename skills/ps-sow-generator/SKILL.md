---
name: ps-sow-generator
tier: 1
description: "Generate a Domo Professional Services Statement of Work (SOW) from discovery context, Compass data, Gong calls, and conversation notes. Supports both Custom Scope and Retainer engagement types. Use this skill whenever someone says: 'generate SOW', 'draft SOW', 'create statement of work', 'build the SOW', 'write the SOW', 'SOW for [customer]', 'scope the engagement', 'draft scope of work', 'create SOW for [customer]', 'retainer SOW', 'custom SOW', or any request to produce a Statement of Work for a Domo PS engagement. Also trigger on 'formalize the scope', 'write up the engagement', or 'SOW from discovery'. This skill bridges the Discover and Align phases."
maturity: alpha
audience: [delivery, code]
---

# PS SOW Generator

You are helping a Domo Professional Services team member generate a Statement of Work (SOW) for a customer engagement. The SOW is the formal document that defines scope, deliverables, team structure, timeline, and pricing — it's what the customer signs to kick off the engagement.

## Why This Matters

The SOW is the single most important document in the PS engagement lifecycle. A well-written SOW sets clear expectations, prevents scope creep, and gives the delivery team a roadmap. A poorly written one leads to misaligned expectations, budget overruns, and unhappy customers. This skill ensures every SOW is thorough, consistent, and grounded in real discovery data.

## Two SOW Templates

There are two SOW templates, each designed for a different engagement model. **Always ask the user which type they need before generating.**

### 1. Custom Scope SOW (`[Customer_Name]_Domo_SOW_[mm_dd_yyyy].dotx`)
- **When to use**: Project-based engagements with a defined scope, specific deliverables, and phased workstreams.
- **Structure**: Executive Summary, Initiative Scope (with detailed workstreams: Solution & Architecture Design, Use Case Deployment, Insights Distribution, Data Governance, Solution Rollout & Enablement, Project Management), Engagement Assumptions, Domo Momentum Methodology, Domo Resources, Customer Project Team, Project Fees & Timeline, Change Requests, Other Terms, Appendix.
- **Best for**: New implementations, large-scale deployments, multi-workstream engagements, engagements with specific deliverables and milestones.

### 2. Retainer Services SOW (`[Customer_Name]_Domo_Retainer_Services_SOW_[mm_dd_yyyy].dotx`)
- **When to use**: Flexible, on-demand retainer engagements where the customer buys a pool of hours and draws from them project by project.
- **Structure**: Domo Retainer Services Overview, Engagement Model (Initiation & Scoping, Scope Alignment, Agreement on Project, Resource Assignment, Kickoff, Completion & Acceptance), Engagement Assumptions, Domo Resources, Customer Project Team, Project Fees & Timeline, Change Requests, Other Terms.
- **Best for**: Ongoing support relationships, customers who need flexible access to PS resources, engagements where scope evolves over time.

**Template locations** (relative to workspace root):
- Custom Scope: `templates/cs-solutions/[Customer_Name]_Domo_SOW_[mm_dd_yyyy].dotx`
- Retainer: `templates/cs-solutions/[Customer_Name]_Domo_Retainer_Services_SOW_[mm_dd_yyyy].dotx`

## How to Use This Skill

### Step 0: Ask Clarifying Questions

Before doing any work, use the `AskUserQuestion` tool to gather essential context. Ask the following:

**Question 1 — Engagement Type:**
> "Which type of SOW do you need for this engagement?"
> - **Custom Scope SOW** — Project-based with defined deliverables, phased workstreams, and specific milestones
> - **Retainer Services SOW** — Flexible hours-based engagement where scope is defined project by project

**Question 2 — Output Style:**
> "How complete should the draft be?"
> - **Fully populated draft** — Fill in everything possible from available data; only leave true unknowns (pricing, specific hour allocations) as placeholders
> - **Guided draft with placeholders** — Fill in what's known but keep highlighted placeholders for anything needing human sign-off (hours, pricing, specific commitments, assumptions)

**Question 3 — Data Sources:**
> "Should I pull account data from Compass and Gong call history to inform the SOW?"
> - **Yes, pull from Compass & Gong** — I'll look up account health, signals, recent calls, and services data
> - **No, I'll provide the context** — I have what I need or prefer to give you the details directly

### Step 1: Gather Context

Pull from every available source to build the richest possible picture. The more context, the better the SOW.

#### From Compass (if user approved):
- `portfolio_lookup` or `portfolio_summary` — Account health, ARR, renewal date, CSM/AE, segment, signals
- `calls_lookup` — Recent Gong calls for tone, commitments, and specific asks from the customer
- `hggrades_lookup` — Health grade components to understand where the customer is struggling
- `spp_lookup` — Existing services engagement, hours purchased/remaining, active projects
- `actions_lookup` — AI-recommended actions that may inform scope
- `sfopportunities_lookup` — Active deal context: opportunity name, ACV, deal code, type, stage, partner involvement. Automates the financial and deal reference sections instead of requiring manual input.
- `spp_project_assignments_lookup` — If there's an existing engagement, shows current task assignments and completion status to inform follow-on scope.

#### From Discovery Outputs (check workspace):
Look for any existing discovery artifacts in the workspace folder for this customer:
- **Discovery Readout** — The most comprehensive source; if this exists, it contains most of what you need
- **Use Case Inventory** — Prioritized use cases with value calculations → maps directly to Initiative Scope
- **Current State Assessment** — Tech stack, data landscape, maturity → informs architecture design and connection strategy
- **Stakeholder Map** — Key players → informs the Customer Project Team section
- **Discovery Questionnaire** — Raw inputs from early calls

Search the workspace for files containing the customer name:
```
Look in compass_cowork/ for any documents, presentations, or outputs related to [Customer Name]
```

#### From the User:
- Customer name and any context not captured elsewhere
- Specific use cases or solutions to include in scope
- Pricing decisions (hourly rate, total hours, budget)
- Timeline expectations
- Special requirements, constraints, or commitments
- Names and roles for the customer project team
- Any notes from calls or meetings

### Step 2: Map Context to SOW Sections

#### For Custom Scope SOW:

| SOW Section | Data Source |
|---|---|
| **Executive Summary** | Discovery Readout exec summary, Compass portfolio context, user-provided framing |
| **Project Goals and Solution** | Use Case Inventory (top-priority use cases), user-provided goals |
| **Initiative Scope — Solution & Architecture Design** | Current State Assessment (data landscape, sources), Use Case Inventory (what to build) |
| **Initiative Scope — Use Case Deployment (Connect)** | Current State Assessment (data sources table), discovery notes on source systems |
| **Initiative Scope — Use Case Deployment (Transform)** | Current State Assessment (data flow), Use Case Inventory (data requirements) |
| **Initiative Scope — Use Case Deployment (Visualize)** | Use Case Inventory (dashboards, audiences, KPI counts) |
| **Initiative Scope — Domo Workflows** | Only include if workflows/automation are in scope — remove section if not |
| **Initiative Scope — Insights Distribution** | Only include if Domo Everywhere or Campaigns are in scope — remove section if not |
| **Initiative Scope — Data Governance** | Current State Assessment (maturity score) → select S/M/L/XL governance tier |
| **Initiative Scope — Solution Rollout & Enablement** | Discovery Readout (rollout strategy), Stakeholder Map (change management needs) |
| **Initiative Scope — Project Management** | Standard section — customize timeline and cadence |
| **Engagement Assumptions** | Current State Assessment (technical constraints), discovery notes |
| **Domo Resources** | Based on scope — which roles are needed; remove roles not applicable |
| **Your Project Team** | Stakeholder Map (named contacts), or leave as template roles |
| **Project Fees & Timeline** | User-provided pricing, or leave as placeholders; estimate hours by phase from use case complexity |
| **Appendix** | Workflow diagrams, architecture mockups, reference reports |

#### For Retainer SOW:

| SOW Section | Data Source |
|---|---|
| **Retainer Services Overview** | Standard framing — customize for customer's strategic objectives |
| **Engagement Model** | Standard process — no major customization needed |
| **Engagement Assumptions** | Current State Assessment, discovery notes, technical constraints |
| **Domo Resources** | Based on expected project types — include relevant roles |
| **Your Project Team** | Stakeholder Map or leave as template roles |
| **Project Fees & Timeline** | User-provided: total hours, hourly rate ($275/hr standard), total fees |

### Step 3: Generate the Document

**CRITICAL: Always start from the template file. NEVER create a SOW from scratch.**

#### Document Generation Workflow:

1. **Copy the appropriate template** to the working directory:
   ```bash
   cp "templates/cs-solutions/[Customer_Name]_Domo_SOW_[mm_dd_yyyy].dotx" working_sow.docx
   # or for retainer:
   cp "templates/cs-solutions/[Customer_Name]_Domo_Retainer_Services_SOW_[mm_dd_yyyy].dotx" working_sow.docx
   ```

2. **Unpack the template**:
   ```bash
   python scripts/office/unpack.py working_sow.docx unpacked_sow/
   ```

3. **Edit `unpacked_sow/word/document.xml`** — Replace placeholder content with actual data:

   **Key replacements:**
   - `[Customer]` → Actual customer name (find and replace all occurrences)
   - `[Insert Team Member Name]` → PS team member name (ask user if not known)
   - `[Insert Team Member Job Title]` → PS team member title
   - All yellow-highlighted placeholder text → Actual content from discovery
   - Solution descriptions → Real use cases from Use Case Inventory
   - Data source tables → Actual data sources from Current State Assessment
   - Dashboard tables → Actual dashboards from Use Case Inventory
   - Hour estimates (`xx`) → Real estimates or clear placeholders
   - Pricing (`$xx,xxx`) → Real pricing or clear placeholders
   - `[Add additional custom deliverables as required for the project]` → Either add real deliverables or remove these lines

   **For Custom Scope SOW — Workstream decisions:**
   - **Domo Workflows**: If workflows are NOT in scope, remove the entire "Domo Workflows Configuration" subsection
   - **Insights Distribution**: If Domo Everywhere / Campaigns are NOT in scope, remove the entire section
   - **Data Governance tier**: Select ONE tier (Small/Medium/Large/X-Large) based on customer maturity and scope — remove the other three tiers
   - Remove any workstream subsections that don't apply to this engagement

   **Output style — Fully Populated:**
   - Fill in every section with real content derived from discovery
   - Only leave `[XX]` placeholders for pricing and hour numbers the user hasn't provided
   - Write real solution descriptions, real data source tables, real dashboard lists

   **Output style — Guided Draft with Placeholders:**
   - Fill in sections where we have clear data
   - Use `[PLACEHOLDER: description of what goes here]` format for sections needing human input
   - Add XML comments or bold notes explaining what information is needed

4. **Remove the instruction page** — The first page of each template is a "How to use this SOW template" page. Delete it from the XML.

5. **Repack the document**:
   ```bash
   python scripts/office/pack.py unpacked_sow/ "[Customer_Name]_Domo_SOW_[date].docx" --original working_sow.docx
   ```

6. **Name the output file**:
   - Custom Scope: `[CustomerName]_Domo_SOW_[YYYY_MM_DD].docx`
   - Retainer: `[CustomerName]_Domo_Retainer_Services_SOW_[YYYY_MM_DD].docx`
   - Save to workspace folder so the user can access it

### Step 4: Present the Output

After generating the SOW, provide a summary to the user:

1. **What was populated**: List which sections were filled with real data and their sources
2. **What needs attention**: List any placeholders or sections that still need human input
3. **Key decisions needed**: Call out any scoping decisions the user needs to make (e.g., governance tier, specific hour allocations, workstreams to include/exclude)
4. **Link to the document**: Provide the computer:// link to the generated file

### Step 5: Iterate

The user will likely want to refine the SOW. Be ready to:
- Add or remove workstreams
- Adjust hour estimates
- Modify solution descriptions
- Update the data source or dashboard tables
- Change the governance tier
- Add appendix content (workflow diagrams, architecture mockups)

For each iteration, unpack → edit → repack the document again.

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent "prep" (`engagement-working`, DiscoveryReadout, UseCaseInventory, CurrentStateAssessment, StakeholderMap, SolutionArchitecture from `engagement-artifacts`); use `memory_bundle` to load the full discovery stack.
### After executing
- Call `memory_remember` with SOW scoping observations for `engagement-working` scoped to `{account_id}`.
- Call `memory_store_artifact` for the SOW in `engagement-artifacts`.

## Effort Estimation Framework

Use the following estimation methodology (sourced from the Domo Solution & Scoping Guide) to calculate effort hours for each SOW workstream. When the user provides scope details — number of data sources, dashboards, workflows, etc. — apply these formulas to generate hour estimates. When details are unknown, use the mid-range estimates and flag them as assumptions.

### Master Estimation Formula

```
Total Engagement Hours =
    Architecture & Design Hours
  + Connect Hours
  + Transform Hours
  + Visualize Hours (incl. QA)
  + Workflow Hours (if in scope)
  + Distribution Hours (if in scope)
  + Governance Hours
  + Enablement Hours
  + Project Management Hours (15-20% of above subtotal)
  + Contingency Buffer (10-15% of total)
```

Always present the estimation as a breakdown table in the SOW summary so the user can see how the total was derived.

---

### Estimation: Solution Architecture & Design

Almost always included. Covers discovery workshops, solution design, and architecture documentation.

| Activity | Hours |
|---|---|
| Discovery & Current State Assessment | 8 – 40 |
| Solution Architecture Design | 16 – 60 |

**Complexity factors that push toward the high end:** Multiple business units, complex security/PDP requirements, hybrid cloud architecture, large number of source systems (10+), data science / ML requirements, Domo Everywhere in scope.

**Typical total for this workstream:** 24 – 100 hrs depending on complexity.

---

### Estimation: Use Case Deployment — Connect

Estimate per data source/connector, then add architecture overhead.

| Connector Complexity | Hours per Connector | When to Apply |
|---|---|---|
| **Simple** | 2 – 4 | Standard cloud connectors (Salesforce, Google Sheets, etc.) with default config |
| **Moderate** | 8 – 16 | Connectors requiring custom queries, multiple datasets, credential coordination, or moderate transformation at source |
| **Complex** | 16 – 40 | Custom API connectors, ODBC/JDBC to on-prem databases, federated queries, Domo Everywhere writeback, complex authentication (OAuth chains, VPN tunnels) |

**Formula:**
```
Total Connect Hours = Σ (per-source estimate) + Architecture Overhead (10-20%)
```

**Architecture Overhead** covers: connector scheduling strategy, data refresh orchestration, error handling design, and source-to-target mapping documentation.

---

### Estimation: Use Case Deployment — Transform

Estimate per dataflow/ETL pipeline.

| Dataflow Complexity | Hours per Dataflow | When to Apply |
|---|---|---|
| **Simple** | 2 – 4 | Single-source append/replace, basic filtering, column renaming |
| **Moderate** | 8 – 16 | Multi-source joins, date spine generation, calculated fields, moderate business logic, windowing functions |
| **Complex** | 24 – 40 | Multi-step pipelines, recursive/snapshot logic, complex business rules, data quality checks, historical reconciliation |
| **Data Science / ML Pipeline** | 40 – 80 | Predictive models, R/Python scripts, AutoML integration, model training and validation |

**Formula:**
```
Total Transform Hours = Σ (per-dataflow estimate)
```

---

### Estimation: Use Case Deployment — Visualize

Estimate per dashboard, or per card if granular detail is available.

#### Per-Dashboard Estimates

| Dashboard Complexity | Hours per Dashboard | When to Apply |
|---|---|---|
| **Simple** | 8 – 16 | 4-6 cards, single data source, standard chart types, minimal interactivity |
| **Moderate** | 16 – 32 | 6-12 cards, multiple data sources, drill paths, filters, moderate beast modes |
| **Complex** | 32 – 60 | 12+ cards, custom apps, DDX/Phoenix, complex beast modes, multi-level drill paths, advanced interactivity |
| **Executive** | 40 – 80 | C-suite audience, heavy design requirements, storytelling narrative, multiple views/pages, embedded alerts |

#### Per-Card Estimates (when granular)

| Card Complexity | Hours per Card |
|---|---|
| **Simple** | 1 – 2 |
| **Moderate** | 2 – 4 |
| **Complex** | 4 – 8 |

**Formula:**
```
Total Visualize Hours = Σ (per-dashboard or per-card estimates) + QA & Revision (15-20%)
```

**QA & Revision** covers: data validation, UAT support, stakeholder review cycles, and visual polish.

---

### Estimation: Domo Workflows

Only include if workflows/automation are in scope. Remove this workstream from the SOW if not applicable.

| Workflow Complexity | Hours per Workflow | When to Apply |
|---|---|---|
| **Simple** | 4 – 8 | Notifications, basic alerts, single-trigger automations |
| **Moderate** | 16 – 24 | Multi-step workflows, conditional branching, form-triggered processes |
| **Complex** | 24 – 40 | API integrations, external system calls, error handling, retry logic |
| **Enterprise** | 40 – 80 | Multi-system orchestration, complex approval chains, custom code actions, high-volume processing |

---

### Estimation: Insights Distribution / Domo Everywhere

Only include if Domo Everywhere or Campaigns/Publications are in scope. Remove from SOW if not applicable.

| Component | Hours |
|---|---|
| **Embedded Analytics Base Setup** (programmatic filters, auth integration, styling) | 40 – 80 |
| **Per Embed — Simple** (single dashboard, standard filters) | 8 – 16 |
| **Per Embed — Complex** (multi-dashboard, custom interactivity, row-level security) | 24 – 40 |
| **Programmatic Filters Configuration** | 16 – 32 |
| **Publications / Campaigns** (per distribution) | 8 – 24 |

---

### Estimation: Data Governance

Select ONE tier based on customer maturity, user base size, and engagement scope. Remove the other tiers from the SOW.

| Tier | Hours | When to Use |
|---|---|---|
| **Small** | 24 – 40 | New to Domo, basic governance needs, <50 users. Covers: naming conventions, basic PDP, folder structure, certification basics. |
| **Medium** | 40 – 80 | Growing Domo program, needs structured governance, COE setup, 50-200 users. Covers: PDP strategy, beast mode governance, certification program, access policies, basic audit processes. |
| **Large** | 80 – 160 | Established program, multiple departments, proactive governance required, 200-500 users. Covers: comprehensive PDP design, data lineage documentation, governance council setup, automated compliance checks. |
| **X-Large** | 160 – 300 | Enterprise-wide deployment, complex security requirements, 500+ users. Covers: full governance overhaul, multi-instance governance, advanced PDP with dynamic policies, regulatory compliance frameworks. |

---

### Estimation: Solution Rollout & Enablement

Recommended for all engagements. Scale based on user base size and organizational complexity.

| Activity | Hours |
|---|---|
| Training Development (per session/module) | 8 – 16 |
| End-User Training Delivery (per session) | 4 – 8 |
| Admin / Power User Training | 16 – 24 |
| Champion Program Development | 24 – 40 |
| Change Management Planning & Execution | 16 – 40 |
| UAT Support & Facilitation | 16 – 32 |
| Go-Live Support | 8 – 16 |
| Documentation & Knowledge Transfer | 8 – 16 |

**Typical total for this workstream:** 40 – 120 hrs depending on rollout scope and user base.

---

### Estimation: Project Management

Always included. Calculate as a percentage of total delivery hours.

| Method | Formula |
|---|---|
| **Percentage-based** | 15 – 20% of total delivery hours (all other workstreams combined) |
| **Minimum threshold** | 4 hrs/week for actively managed projects |

PM hours cover: project planning, status reporting, RAID log management, timeline tracking, resource coordination, stakeholder communication, and change request administration.

**Guidance:** Use 15% for straightforward engagements (single workstream, small team). Use 20% for complex engagements (multi-workstream, multiple stakeholders, external dependencies).

---

### Estimation: Contingency Buffer

Add a contingency buffer to the total estimated hours to account for unknowns, scope clarification, and rework.

| Scenario | Buffer |
|---|---|
| Well-defined scope with complete discovery | 10% |
| Partially defined scope or limited discovery | 15% |
| Ambiguous scope or greenfield engagement | 20% |

---

### Outcomes-Based Pricing: Data Use Case Tiers

When using outcomes-based pricing (instead of pure hourly), classify each data use case into one of the following tiers. Each tier defines the scope, deliverables, and estimated hours for a complete use case delivery — from source connection through curated analytics-ready datasets.

**IMPORTANT — Tier Justification:** When selecting a tier for a use case, ALWAYS include a written justification explaining WHY that tier was chosen. Reference the specific scoping criteria that drove the classification (e.g., number of sources, table count, transform complexity, refresh requirements, backfill needs). This justification should appear in the SOW alongside the tier selection so the customer understands the rationale and can validate it.

#### Tier Definitions

| Dimension | X-Small | Small | Medium | Large | X-Large |
|---|---|---|---|---|---|
| **Estimated Hours** | 16–24 (target 20) | 28–44 (target 36) | 56–88 (target 72) | 96–144 (target 120) | 150–220 (target 180) |
| **Sources** | 1 source system; standard connector or simple file drop | 1–2 source systems; standard connectors | 2–3 sources; mixed connection types (API + DB + files common) | 3–5 sources; enterprise constraints possible (security, networking, multiple owners) | 5+ sources and/or major security/network complexity |
| **Tables/Entities** | Up to ~5 core tables/entities | ~6–12 core tables/entities | ~13–25 tables/entities | ~26–50 tables/entities | 50+ tables/entities; multiple domains or high schema volatility |
| **Transform Complexity** | Light transforms (renames, basic joins, simple derived fields) | Moderate transforms (multi-step staging, multiple joins, basic business rules) | Higher complexity (standardization, deduping, conformed dims, derived metrics) | Complex transforms (multi-domain joins, complex business rules, DQ remediation patterns) | Very high complexity, cross-domain modeling |
| **Refresh & Backfill** | Daily or less frequent refresh; minimal historical backfill | Daily refresh; possibly multiple schedules; some historical load, limited complexity | Daily or intraday refresh; meaningful backfill + incremental loads | Intraday refresh and/or strict timing SLAs; larger backfill; possible restatement handling | Near-real-time/CDC expectations or advanced incremental patterns; large backfill + multi-stakeholder reconciliation |

#### Deliverables/Outcomes by Tier

**X-Small:**
- 1 configured connector/ingestion method
- 1 curated dataset layer for the use case (single primary dataset acceptable)
- Basic refresh schedule configured
- High-level validation notes (spot checks)
- Light connection + dataset documentation

**Small:**
- Configured connectors for 1–2 sources
- Curated dataset layer with core entities modeled for analytics
- Simple incremental logic where appropriate
- Reconciliation summary (defined checks)
- Basic monitoring view or operational checklist
- Practical lineage notes (source → curated)

**Medium:**
- Multi-source ingestion pipelines with coordinated scheduling
- Curated dataset layer with defined model (facts/dims where relevant)
- Standardized derived metrics set (defined list)
- Incremental load logic implemented + documented
- Reconciliation report with sign-off checkpoints
- Monitoring + alerting basics (detect failures/drift)
- Documentation package (sources, refresh, transform overview)

**Large:**
- Production-grade ingestion + transformation library for the domain/use case
- Curated layer plus intermediate layers as needed
- Defined DQ checks + remediation approach for common failure modes
- Robust reconciliation pack with sign-off gates
- Monitoring with ownership assignments + operational runbook
- Documentation sufficient for ongoing support/iteration

**X-Large:**
- Enterprise-level ingestion + transformation architecture for defined domain
- Curated layer designed for scale, reuse, extension
- Strong operational controls (monitoring, alerting, runbook, escalation model)
- Formal reconciliation/validation process across stakeholder groups
- Documentation package suitable for long-term operational ownership

#### Tasks/Playbook by Tier

**X-Small:**
1. Validate access + connector path
2. Profile fields; confirm required entities
3. Build ingestion + schedule
4. Implement required transforms
5. Validate key totals + sample rows
6. Document connection, cadence, dataset purpose

**Small:**
1. Source discovery + field mapping confirmation
2. Connector setup + scheduling
3. Draft practical data model
4. Build multi-step transformations
5. Configure simple incremental loads (if applicable)
6. Run reconciliation checks + remediation loop
7. Monitoring setup + handoff notes

**Medium:**
1. Detailed entity mapping + joins plan
2. Build ingestion by source + align cadence
3. Implement conformed model + standardized business rules
4. Configure incremental loads + backfill strategy
5. Build reconciliation checks; iterate with SMEs
6. Implement monitoring + escalation steps
7. Produce documentation + handoff walkthrough

**Large:**
1. Coordinate access/refresh windows/validation across owners
2. Build layered ETL with clear lineage
3. Implement DQ rules + exception handling patterns
4. Define restatement/backfill approach for historical corrections
5. Create operational runbook + handoff session
6. Stabilization support within scope boundaries

**X-Large:**
1. Architecture-level design for ingestion, transforms, and operations
2. Implement advanced incremental/CDC patterns (as required)
3. Build structured DQ framework for the domain
4. Manage multi-stakeholder validation cycles
5. Operationalize and transition to BAU ownership

#### How to Apply Outcomes-Based Pricing in the SOW

1. **Classify each use case** — Evaluate the use case against the scoping criteria (sources, tables, transform complexity, refresh/backfill needs) and assign a tier.

2. **Write the tier justification** — For each use case, include a paragraph explaining the tier selection. Example:
   > *"This use case is classified as **Medium** based on the following: it connects 3 source systems (Salesforce, Google Ads, and a PostgreSQL warehouse), involves ~18 core tables/entities, requires standardized metric derivation (CAC, ROAS, attribution) with conformed dimensions, and needs daily refresh with incremental loading and 12-month historical backfill."*

3. **Use target hours for pricing** — Price each use case at the tier's target hours (20, 36, 72, 120, or 180) multiplied by the hourly rate. The range provides flexibility during delivery but pricing is based on the target.

4. **Sum across use cases** — Total engagement hours = Σ (target hours per use case) + PM overhead + contingency.

5. **Present in the SOW** — Include a use case pricing table:
   ```
   | Use Case                  | Tier    | Target Hours | Justification Summary |
   |---------------------------|---------|-------------|----------------------|
   | Marketing Analytics       | Medium  | 72          | 3 sources, ~18 tables, derived metrics, daily refresh |
   | Executive Scorecard       | Small   | 36          | 1 source (curated), 8 entities, standard transforms |
   |---------------------------|---------|-------------|----------------------|
   | Subtotal (Delivery)       |         | 108         |                      |
   | PM (18%)                  |         | 19          |                      |
   | Contingency (10%)         |         | 13          |                      |
   | **Total**                 |         | **140**     |                      |
   ```

---

### How to Apply Estimation During SOW Generation

When generating a Custom Scope SOW:

1. **Inventory the scope** — Count: number of data sources (by complexity), number of dataflows/ETL jobs (by complexity), number of dashboards (by complexity), number of workflows, Domo Everywhere embeds, governance tier, enablement activities.

2. **Calculate per-workstream hours** — Apply the tables above to each inventory item. Sum per workstream.

3. **Calculate PM hours** — Take the subtotal of all delivery workstreams and multiply by 15-20%.

4. **Add contingency** — Apply 10-15% buffer to the grand total.

5. **Calculate pricing** — Multiply total hours by the hourly rate ($275/hr standard, or user-specified rate).

6. **Present as a table** — Include the estimation breakdown in the SOW output summary so the user can validate and adjust before finalizing:

```
| Workstream                        | Estimated Hours |
|-----------------------------------|-----------------|
| Solution Architecture & Design    | XX              |
| Use Case Deployment — Connect     | XX              |
| Use Case Deployment — Transform   | XX              |
| Use Case Deployment — Visualize   | XX              |
| Domo Workflows                    | XX              |
| Insights Distribution             | XX              |
| Data Governance                   | XX              |
| Rollout & Enablement              | XX              |
| Project Management (X%)           | XX              |
| Contingency Buffer (X%)           | XX              |
|-----------------------------------|-----------------|
| **Total Estimated Hours**         | **XXX**         |
| **Estimated Fees (@$275/hr)**     | **$XX,XXX**     |
```

When generating a **Retainer SOW**, estimation is less prescriptive since scope is defined project-by-project. However, use the estimation tables to help the user right-size the total hour pool. Suggest a total retainer pool based on the expected mix of project types over the engagement period.

---

## Reference: Standard Pricing

The standard Domo PS hourly rate is **$275/hr**. The user may override this for specific engagements. Common engagement sizes:

| Engagement Size | Typical Hours | Typical Fees |
|---|---|---|
| Small | 100-200 hrs | $27,500 - $55,000 |
| Medium | 200-500 hrs | $55,000 - $137,500 |
| Large | 500-1,000 hrs | $137,500 - $275,000 |
| X-Large | 1,000+ hrs | $275,000+ |

## Reference: Domo Resource Roles

Include only the roles relevant to the engagement:

| Role | Include When |
|---|---|
| **Engagement Manager** | Large/complex engagements with multiple workstreams |
| **Project Manager** | Almost always — manages timeline, status, hours tracking |
| **Technical Architect** | Data-heavy engagements with complex architecture |
| **Business Consultant** | Dashboard building, visualization, user adoption |
| **Technical Consultant** | Data connection, ETL, pipeline development |
| **Domo Everywhere Developer Engineer** | Only when Domo Everywhere / embedded analytics is in scope |

## Reference: Data Governance Tiers

Select based on customer maturity and engagement scope (see detailed hours in Estimation section above):

| Tier | Hours | When to Use |
|---|---|---|
| **Small** | 24 – 40 | New to Domo, basic governance needs, small user base |
| **Medium** | 40 – 80 | Growing Domo program, needs structured governance, COE setup |
| **Large** | 80 – 160 | Established program, multiple departments, proactive governance required |
| **X-Large** | 160 – 300 | Enterprise-wide deployment, complex security requirements, full governance overhaul |

## Reference: Custom Scope Workstreams

The Custom Scope SOW template includes these workstreams. Remove any that don't apply:

1. **Solution & Architecture Design** — Almost always included (24-100 hrs)
2. **Use Case Deployment** (Connect / Transform / Visualize / QA) — Almost always included (varies by inventory)
3. **Domo Workflows Configuration** — Only if automation/workflows are in scope (4-80 hrs per workflow)
4. **Insights Distribution** (Domo Everywhere / Campaigns) — Only if external distribution is in scope (40-80 hrs base + per embed)
5. **Data Governance** — Include at appropriate tier; can be excluded for small tactical engagements (24-300 hrs)
6. **Solution Rollout & Enablement** — Recommended for all engagements; can be scaled down (40-120 hrs)
7. **Project Management** — Always included (15-20% of delivery hours)

## DOCX Editing Notes

When editing the SOW template XML:

- **Preserve all existing styles** — The templates use built-in Word styles. Don't add custom styles.
- **Preserve headers/footers** — The Domo branded headers and footers must remain intact.
- **Preserve the cover page** — The cover page formatting and branding elements should stay.
- **Table editing** — The templates contain tables for data sources, dashboards, pricing, and project team. Edit cell content but preserve table structure and formatting.
- **Remove instruction page** — The first page with "How to use this SOW template" instructions must be removed. Find the paragraphs between the start of the document and the cover page, and delete them.
- **Use the docx skill** — Always read the docx SKILL.md before editing for the latest XML editing patterns and pack/unpack workflow.
