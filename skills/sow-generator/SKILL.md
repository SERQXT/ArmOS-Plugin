---
name: sow-generator
tier: 1
maturity: alpha
owner: Andrew Ferguson
description: "Generate a review-ready Statement of Work by populating the DOMO SOW TEMPLATE 2025 exactly — same section order, fonts, color scheme, images, and artifacts as the official template. Populates every placeholder from locked upstream artifacts (Solution Blueprint, Scope Model, LOE Estimate, reviewed Proposal). Maps every workstream to its SOW section, applies standard and custom language, and produces a missing-field checklist for SSD completion. Trigger with 'generate SOW for [account]', 'draft the SOW for [account]', 'build the statement of work for [account]', or 'write the SOW for [account]'. Requires locked Solution Blueprint, Scope Model, and LOE Estimate."
audience: [delivery, orchestration]
pipeline:
  phase: contract
  sub_phase: sow-generation
  position: 8
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: solution-blueprint
      required: true
      data: locked Solution Blueprint — solution statement, use cases, platform components, operating model
    - agent: scope-builder
      required: true
      data: locked Scope Model — workstream deliverables, in/out of scope, assumptions, exclusions, customer responsibilities
    - agent: loe-estimator
      required: true
      data: LOE Estimate — hours by workstream, expected total, confidence assessment
    - agent: proposal-generator
      required: false
      data: Proposal Content — customer-facing narrative, package details, value proposition, ROI analysis
  outputs:
    - name: sow-draft
      format: docx
      note: "Output must be a populated version of DOMO SOW TEMPLATE 2025.docx — not a free-form document. When rendered as markdown for review purposes, section order and content must exactly mirror the template."
      downstream:
        - agent: cpq-validator
        - agent: knowledge-handoff
        - agent: sow-reviewer
  data_sources:
    - tool: fileset_search
      required: true
      fileset_id: "e5b7e2e9-79ed-499d-95ff-fc9d74157d24"
      note: "Primary: S3 bucket. Fallback: Domo FileSet ID e5b7e2e9-79ed-499d-95ff-fc9d74157d24"
    - tool: portfolio_lookup
      required: false
  phase_gate: true
---

## Scoping Reference Documents

Use the shared scoping reference documents from S3 as the authoritative runtime guidance. Fall back to the Domo FileSet if S3 is unavailable.

**Primary — S3:**
- Live scoping templates: `s3://armos-workspace-676897632200/cs-templates/scoping/`
- Fetch the SOW template: `aws s3 cp "s3://armos-workspace-676897632200/cs-templates/scoping/DOMO SOW TEMPLATE 2025.docx" ./templates/scoping/ --region us-east-2`
- Sync all templates: `aws s3 sync "s3://armos-workspace-676897632200/cs-templates/scoping/" ./templates/scoping/ --region us-east-2`

**Fallback — Domo FileSet:**
- FileSet ID: `e5b7e2e9-79ed-499d-95ff-fc9d74157d24`
- Search endpoint: `POST /api/content/v1/filesets/e5b7e2e9-79ed-499d-95ff-fc9d74157d24/aiSearch`
- Query: `{"query": "DOMO SOW TEMPLATE 2025 statement of work", "topK": 5}`
- Use `fileset_search("DOMO SOW TEMPLATE 2025")` in Code Engine context

**CRITICAL: The SOW template MUST be retrieved before execution begins.** The section order, formatting, fonts, colors, and images are defined in the template file. Do not generate a SOW from memory or approximate the structure. Always work from the retrieved template.

---

# SOW Generator — Exact Template Fill-In

Generates a Statement of Work by filling in the **DOMO SOW TEMPLATE 2025** exactly as a template is filled in — every section in order, every placeholder replaced, every formatting element preserved. The output is not an approximation of the SOW format; it is the template with the blanks completed.

## Non-Negotiable Template Fidelity Requirements

This skill has ONE primary directive: **fill in the template, do not rewrite it.**

1. **Section order is fixed.** The DOMO SOW TEMPLATE 2025 defines the exact order of all sections. Do not reorder, merge, split, or omit sections. If a section is not applicable, follow the template's standard "Not Applicable" convention, not your own.

2. **Fonts must be preserved.** The template uses specific fonts (primarily Calibri for body text, with designated heading fonts). When populating placeholders, use the same font family and size as the surrounding template text. Do not introduce new fonts or change existing ones.

3. **Color scheme must be preserved.** The Domo SOW template uses the Domo corporate color palette:
   - Primary blue: `#1A5CA8` (section headers, accents)
   - Light blue: `#00A0F0` (highlights, table headers)
   - Dark gray: `#3C3C3C` (body text)
   - White: `#FFFFFF` (background, reversed-out header text)
   - When populating tables or inserting content into colored sections, text color must match the template's specification for that area.

4. **Images and logos must be preserved.** The template contains:
   - Domo logo (cover page and header)
   - Section separator images or graphic elements
   - Table header graphic styles
   - Footer branding elements
   These must remain in place exactly as positioned in the template. Do not remove, replace, resize, or reposition any image.

5. **Template artifacts must be preserved.** All stylistic elements in the template — including borders, shading, spacing, column widths, bullet styles, numbered list formats, and table styles — must remain unchanged. Only the text content of placeholders changes.

6. **Fill in placeholders, not prose.** The template contains specific placeholder text (e.g., `[CLIENT NAME]`, `[PROJECT TITLE]`, `[EFFECTIVE DATE]`, `[INSERT USE CASE DESCRIPTION]`). Replace each placeholder with the correct content from upstream artifacts. Do not rewrite surrounding language.

7. **Output format is .docx.** The final deliverable is a populated .docx file, not a markdown conversion. When the environment supports it, use python-docx or the equivalent document manipulation library to fill in the template programmatically. When only markdown output is possible (review mode), produce a markdown representation that exactly mirrors the template's section structure, with a note that the actual deliverable must be the populated .docx.

---

## How It Works

```
Retrieve DOMO SOW TEMPLATE 2025.docx (S3 → FileSet fallback)
                    |
Parse template: identify all placeholders, section order, formatting specs
                    |
Validate all upstream artifacts are LOCKED
                    |
    +--------+--------+--------+--------+--------+
    |        |        |        |        |        |
  Cover   Exec    Initiative  Engage  Fees &  Standard
  Page   Summary   Scope     Assump  Timeline Language
    |        |        |        |        |        |
    +--------+--------+--------+--------+--------+
                    |
Fill each placeholder from the correct upstream artifact
Preserve ALL formatting, fonts, colors, images
                    |
Flag remaining placeholders requiring SSD input
                    |
🔵 OUTPUT: Populated DOMO SOW TEMPLATE 2025.docx
         + Missing-Field Checklist
                    |
→ CPQ Validator + Knowledge Handoff + SOW Reviewer
```

## Triggers

- "generate SOW for [account]"
- "draft the SOW for [account]"
- "build the statement of work for [account]"
- "write the SOW for [account]"
- "create the SOW for [account]"

**Prerequisites — all must be LOCKED or reviewed before proceeding:**
- Solution Blueprint: LOCKED
- Scope Model: LOCKED
- LOE Estimate: reviewed and accepted by SSD
- Proposal (optional but preferred): reviewed and accepted by SSD

If any prerequisite is DRAFT, stop and prompt the SSD to lock it first.

---

## Execution Flow

### Step 1: Retrieve and Parse the Template

```
S3 (primary):
  aws s3 cp "s3://armos-workspace-676897632200/cs-templates/scoping/DOMO SOW TEMPLATE 2025.docx" \
    ./templates/scoping/ --region us-east-2

FileSet fallback:
  fileset_search("DOMO SOW TEMPLATE 2025 statement of work sections")
  # FileSet ID: e5b7e2e9-79ed-499d-95ff-fc9d74157d24
```

After retrieval:
1. Parse the document structure to identify every section, its order, and its heading level
2. Extract all placeholder fields (fields in brackets, e.g., `[CLIENT NAME]`, or highlighted fields)
3. Note the font, size, and color of surrounding text for each placeholder
4. Confirm the presence of all required template images and branding elements
5. Build a placeholder inventory before filling anything

**Do not proceed without a successfully retrieved and parsed template.** If the template cannot be retrieved from either source, halt and report the failure to the SSD.

---

### Step 2: Load and Validate Upstream Artifacts

```
solution-blueprint    → confirm LOCKED → extract: solution statement, use cases, platform components, operating model, architecture
scope-builder         → confirm LOCKED → extract: workstream deliverables, in/out of scope, assumptions, exclusions, customer responsibilities
loe-estimator         → confirm reviewed → extract: hours by workstream, expected total, confidence, LOE inputs
proposal-generator    → load if available → extract: customer narrative, package details, ROI, pricing structure
service-matchmaker    → load if available → extract: commercial recommendation, package tier, engagement structure
portfolio_lookup      → load: account name, customer legal entity, ARR, CSM, AE
```

Build a metadata record for the SOW fill-in:

| Template Field | Source Artifact | Extracted Value | Status |
|---------------|-----------------|-----------------|--------|
| Client Name | portfolio_lookup | [Account Name] | ✅ / ⚠️ SSD input required |
| Customer Legal Entity | portfolio_lookup | [Legal Name] | ✅ / ⚠️ |
| Effective Date | SSD input required | — | ⚠️ |
| Project Title | solution-blueprint | [Solution Statement summary] | ✅ / ⚠️ |
| Total Project Hours | loe-estimator | [Expected total] | ✅ / ⚠️ |
| Total Project Fees | service-matchmaker or SSD | — | ⚠️ |
| Start Date | SSD input required | — | ⚠️ |
| Domo Team Members | SSD input required | — | ⚠️ |
| Customer Project Lead | scope-builder (customer responsibilities) | [Name if specified] | ✅ / ⚠️ |
| [Additional fields per template] | | | |

---

### Step 3: Fill the Template — Section by Section

Fill each section in the exact order it appears in the DOMO SOW TEMPLATE 2025. The sections below represent the standard template structure. Follow the retrieved template's actual section names and order exactly — if the template has been updated, the template version takes precedence.

#### Cover Page
- **Placeholders:** Client Name, Project Title, Effective Date, Domo Logo (pre-placed), Document Version
- **Source:** portfolio_lookup (client name), solution-blueprint (project title), SSD input (effective date)
- **Formatting:** Do not alter the cover page layout, logo placement, background color/image, or font
- **If missing:** Flag effective date and document version as SSD-required

#### Table of Contents
- **Action:** Auto-update field if using python-docx / Word automation; do not manually rewrite TOC entries
- **Note:** Section titles in the TOC must match exactly the section headings in the body — changes to body headings require TOC refresh

#### 1. Executive Summary / Project Overview
- **Placeholders:** Customer description, project goals summary, why Domo PS (1–3 paragraphs)
- **Source:** proposal-generator (executive summary narrative); fallback: solution-blueprint (solution statement + use cases)
- **Formatting:** Match template paragraph style exactly; do not alter heading color or font
- **Content:** 2–4 sentences per sub-section as structured in the template; use customer's own language mirrored from Gong where applicable

#### 2. Project Goals & Use Cases
- **Placeholders:** Numbered or bulleted use case list with one-line description per use case
- **Source:** solution-blueprint (use case list, business problem per use case)
- **Formatting:** Use the exact bullet or numbered list style from the template; do not introduce new list styles
- **Content:** One use case per line/bullet; match the template's expected level of detail (summary vs. detailed)

#### 3. Initiative Scope — by Workstream

The Initiative Scope section contains one sub-section per Domo workstream. Fill each sub-section from the locked Scope Model. Only include workstreams that are confirmed IN SCOPE. For each:

**3a. Solution & Architecture Design (always present)**
- **Placeholders:** Architecture description, deliverable list (conceptual architecture, data model, solution design doc, etc.)
- **Source:** solution-blueprint (reference architecture, platform components), scope-builder (deliverables list)
- **Content:** Standard template language for this workstream + custom deliverables from Scope Model (add rows to the deliverables table as needed)

**3b. Use Case Deployment: Connect (if data connection workstream in scope)**
- **Placeholders:** Data source inventory table (source name, type, connection method, datasets, refresh frequency, complexity, notes)
- **Source:** scope-builder (connection workstream deliverables, LOE inputs summary), connection-strategy (recommended methods per source)
- **Content:** One row per data source confirmed in scope; use the exact table format from the template; do not add columns
- **Workshops (if teach-to-fish delivery model):** Insert standard workshop row from template clause library

**3c. Use Case Deployment: Transform (if transformation workstream in scope)**
- **Placeholders:** ETL deliverable list (DataFlows, datasets, Beast Modes, DataSet Views to be built)
- **Source:** scope-builder (transform deliverables)
- **Content:** Standard template language + custom transform deliverables; if workshops included, insert standard workshop row

**3d. Use Case Deployment: Visualize (if visualization workstream in scope)**
- **Placeholders:** Dashboard inventory table (dashboard name, focus area, KPI count, breakdown count, branding, complexity)
- **Source:** scope-builder (visualization deliverables), loe-estimator (KPI and dashboard counts)
- **Content:** One row per dashboard confirmed in scope; use the exact table format; do not add columns without SSD direction

**3e. Domo Workflows & Automation (if automation workstream in scope)**
- **Placeholders:** Workflow deliverable list (workflow name, trigger, action, complexity classification, estimated hours)
- **Source:** scope-builder → scope-automation output (per-workflow classification)
- **Content:** One workflow per row; include complexity classification from scope-automation; standard template language for Workflows section

**3f. Insights Distribution (if Domo Everywhere or Publish in scope)**
- **Placeholders:** Distribution type, embed configuration, PDP scope, Sandbox scope
- **Source:** scope-builder → scope-everywhere output
- **Content:** Standard template language for distribution section + custom language from scope-everywhere; specify embed type (view-only vs. edit-connect), PDP scope (# datasets, rules), Sandbox promotion flow

**3g. App Studio & Custom Applications (if App Studio or DDX in scope)**
- **Placeholders:** App deliverable list (app name, screen count, complexity, design requirements)
- **Source:** scope-builder → scope-app-studio output
- **Content:** One application per row; include screen count, complexity classification, design round caps

**3h. Data Governance**
- **Placeholders:** Governance tier selection (Small/Medium/Large/X-Large), PDP scope, user/group management scope
- **Source:** scope-builder (governance workstream)
- **Tier selection criteria:**
  - Small: < 5 datasets with PDP, simple group structure, < 50 users
  - Medium: 5–15 datasets with PDP, multiple groups, 50–200 users
  - Large: 15–30 datasets, complex group hierarchy, 200–500 users, CoE setup
  - X-Large: 30+ datasets, enterprise-scale governance, strict compliance, 500+ users
- **Content:** Select the tier that matches the Scope Model signals; use the standard template language for the selected tier; insert custom PDP details

**3i. Solution Rollout & Enablement**
- **Placeholders:** Training session count, training audience, documentation deliverables, hypercare duration
- **Source:** scope-builder (rollout workstream)
- **Content:** Standard template language + custom training plan from Scope Model; specify sessions, duration, audience for each session

---

#### 4. Engagement Assumptions
- **Placeholders:** Numbered assumption list (standard assumptions + custom assumptions from Scope Model)
- **Source:** scope-builder (assumptions register), solution-blueprint (inherited assumptions)
- **Standard assumptions (always include, from template clause library):**
  - Customer will provide timely access to all required data sources and credentials
  - Data is assumed to be in a usable state; heavy cleansing is out of scope unless explicitly noted
  - Customer will designate a project lead with authority to make decisions and accept deliverables
  - Customer will validate finalized datasets before dashboard build phase begins
  - All change requests outside the defined scope will follow the Change Request process (Section 6)
  - [Additional standard assumptions from the template — pull from template clause library, do not paraphrase]
- **Custom assumptions:** Insert additional assumptions from the locked Scope Model's assumptions register, in the same numbered list format as the template

#### 5. Domo Delivery Methodology
- **Action:** This section uses standard boilerplate from the template (Domo Momentum methodology description). Do not alter this section. Reproduce exactly as it appears in the template.
- **If template has a placeholder for engagement type (Domo-led / Co-delivery / Teach-to-fish / Retainer):** Fill from solution-blueprint (operating model)

#### 6. Domo Resources
- **Placeholders:** Domo team members (name, role, responsibilities)
- **Source:** SSD input required (staffing not determined by upstream artifacts)
- **Format:** Use the exact team table format from the template; do not add or remove columns
- **Flag:** Mark all Domo team name fields as ⚠️ SSD INPUT REQUIRED in the missing-field checklist

#### 7. Change Request Process
- **Action:** Standard boilerplate from the template. Reproduce exactly. Do not alter.

#### 8. Other Terms and Conditions
- **Action:** Standard boilerplate from the template. Reproduce exactly. Do not alter.
- **Note:** If account-specific legal terms have been negotiated, flag for SSD/Legal to insert — do not modify standard terms without instruction.

#### 9. Project Team
- **Placeholders:** Domo team table + Customer team table (name, role, contact)
- **Source (Domo side):** SSD input required
- **Source (Customer side):** scope-builder (customer responsibilities → owner fields), portfolio_lookup (contact names if available)
- **Format:** Use exact table format from template

#### 10. Project Fees & Timeline
- **Placeholders:** Hours by workstream, total hours, rate (if T&M), total fees, payment schedule, timeline Gantt or milestone table
- **Source (hours):** loe-estimator (expected hours by workstream)
- **Source (fees):** service-matchmaker (commercial recommendation); fallback: SSD input required
- **Source (timeline):** scope-builder (delivery model, phase durations), loe-estimator (workstream sequencing)
- **Format:** Use exact fee table and timeline table format from the template; do not restructure or add columns
- **Critical:** Total fees and payment schedule are SSD-owned — if commercial recommendation is not locked, flag both as ⚠️ SSD INPUT REQUIRED

#### Signature Block / Acceptance
- **Placeholders:** Customer authorized signatory (name, title, date line), Domo authorized signatory (name, title, date line)
- **Source:** SSD input required (both signatories)
- **Format:** Reproduce exactly as in template — do not modify signature block layout

---

### Step 4: Compile Missing-Field Checklist

After populating all template sections, produce a comprehensive missing-field checklist:

```
⚠️ MISSING-FIELD CHECKLIST — Required Before Customer Send

CRITICAL (must be resolved before SOW is sent):
1. Effective Date — Section: Cover Page + Header — Source: SSD/legal agreement
2. Total Project Fees — Section: 10. Project Fees & Timeline — Source: Commercial recommendation or SSD
3. Payment Schedule — Section: 10. Project Fees & Timeline — Source: Commercial recommendation or SSD
4. Start Date / Kickoff Date — Section: 10. Project Fees & Timeline — Source: SSD
5. Customer Legal Entity (if different from account name) — Section: Cover Page, Signature Block — Source: CRM or SSD
6. Customer Authorized Signatory — Section: Signature Block — Source: SSD
7. Domo Authorized Signatory — Section: Signature Block — Source: SSD/management
8. Domo Project Team Names — Section: 6. Domo Resources, 9. Project Team — Source: Staffing assignment

IMPORTANT (should be resolved before customer send):
9. Customer Project Lead — Section: 9. Project Team — Source: Confirmed in discovery/scoping
10. Customer Data SME — Section: 9. Project Team — Source: Confirmed in discovery/scoping
11. Customer IT Contact — Section: 9. Project Team — Source: Confirmed in discovery/scoping
12. Architecture Diagram — Section: 3a. Solution & Architecture Design — Source: Solution Blueprint attachment
13. Rate (if T&M structure) — Section: 10. Project Fees & Timeline — Source: Commercial recommendation
14. Specific milestone dates (Phase 1 kickoff, Phase 2 start, Go-Live) — Section: 10. Timeline — Source: SSD + customer

ADVISORY (confirm before version is finalized):
15. Document Version — Section: Cover Page — Confirm v1.0 or per versioning convention
16. Any account-specific legal terms not yet incorporated — Section: 8. Other Terms — Flag for Legal review
```

---

### Step 5: Finalize and Version the Document

1. Confirm the document version (v1.0 for first draft; v1.1, v1.2 for SSD revisions; v2.0 for substantive changes after customer review)
2. Set document status: **DRAFT — SSD REVIEW REQUIRED**
3. Save the populated .docx preserving all original template formatting, fonts, colors, images, and element positions
4. Attach the Missing-Field Checklist as a separate tab or appendix
5. Do not send to the customer until:
   - All CRITICAL fields are resolved
   - SSD has reviewed and changed status to **READY FOR CUSTOMER**

---

## SOW Template Section Order Reference

The following order is the standard DOMO SOW TEMPLATE 2025 structure. If the retrieved template differs, follow the retrieved template. This is provided as a verification reference only.

```
Cover Page
  → Domo Logo (pre-placed, do not move)
  → Client Name [PLACEHOLDER]
  → Project Title [PLACEHOLDER]
  → Effective Date [PLACEHOLDER]
  → Document Version [PLACEHOLDER]

Table of Contents (auto-update)

1. Executive Summary / Project Overview
   → Customer/project context paragraph
   → Why Domo Professional Services paragraph

2. Project Goals & Use Cases
   → Numbered/bulleted use case list

3. Initiative Scope
   3a. Solution & Architecture Design
     → Deliverables table
   3b. Use Case Deployment: Connect
     → Data Source Inventory table
     → [Workshops row if applicable]
   3c. Use Case Deployment: Transform
     → ETL deliverables list
     → [Workshops row if applicable]
   3d. Use Case Deployment: Visualize
     → Dashboard Inventory table
     → [Workshops row if applicable]
   3e. Domo Workflows & Automation [if in scope]
     → Workflow deliverables table
   3f. Insights Distribution [if in scope]
     → Distribution scope description + table
   3g. App Studio & Custom Applications [if in scope]
     → Application deliverables table
   3h. Data Governance
     → Governance tier selection + scope
   3i. Solution Rollout & Enablement
     → Training sessions table + documentation list

4. Engagement Assumptions
   → Numbered assumption list (standard + custom)

5. Domo Delivery Methodology
   → Standard boilerplate [DO NOT ALTER]

6. Domo Resources
   → Domo team table [PLACEHOLDER: team names]

7. Change Request Process
   → Standard boilerplate [DO NOT ALTER]

8. Other Terms and Conditions
   → Standard boilerplate [DO NOT ALTER]

9. Project Team
   → Domo team table [PLACEHOLDER: names]
   → Customer team table [PLACEHOLDER: names, roles, contacts]

10. Project Fees & Timeline
    → Workstream hours table
    → Total hours + fees [PLACEHOLDER]
    → Payment schedule [PLACEHOLDER]
    → Project timeline / milestone table

Signature Block
    → Customer signatory [PLACEHOLDER]
    → Domo signatory [PLACEHOLDER]
```

---

## Key Principles

- **Template first, always.** Retrieve the template before doing anything else. Never reconstruct the SOW structure from memory.
- **Fill in, don't rewrite.** Replace placeholders. Preserve everything else.
- **No new scope.** The SOW formalizes locked upstream artifacts. Nothing enters the SOW that is not in a locked artifact or explicitly provided by the SSD.
- **Complete or flag.** Every template field is either populated from an artifact or flagged in the missing-field checklist. No field is left blank silently.
- **Version discipline.** Always version the document. Never overwrite without incrementing the version.
- **SSD owns the gate.** Status remains DRAFT until the SSD reviews and changes it to READY FOR CUSTOMER.

---

## Guardrails

- **Do not proceed without the template.** If neither S3 nor the FileSet can provide the DOMO SOW TEMPLATE 2025, halt and alert the SSD. Do not generate a freeform SOW in its place.
- **Do not alter standard boilerplate sections** (Delivery Methodology, Change Request Process, Other Terms). These are legal and process language that must not be paraphrased or summarized.
- **Do not invent numbers.** Hours come from LOE Estimator. Fees come from Commercial Recommendation or SSD. Dates come from SSD. If the source is unavailable, flag it — do not estimate.
- **Do not modify images or branding.** The Domo logo, section dividers, and branded elements are not content placeholders. They are template artifacts and must remain exactly as placed.
- **Placeholders must be specific.** When a field cannot be auto-populated, the placeholder text must be specific: "CONFIRM customer legal entity name (may differ from [Account Name])" — not "[TBD]".
- **Phase gate is enforced.** This skill outputs a DRAFT SOW. The SSD must review and approve before the document is sent to the customer. Changing status to READY FOR CUSTOMER is an explicit SSD action.

---

## Connecting Reference Sources

| Source | Priority | Access |
|--------|----------|--------|
| Local cache | Highest | `./templates/scoping/DOMO SOW TEMPLATE 2025.docx` |
| S3 bucket | Primary | `s3://armos-workspace-676897632200/cs-templates/scoping/DOMO SOW TEMPLATE 2025.docx` |
| Domo FileSet | Fallback | ID: `e5b7e2e9-79ed-499d-95ff-fc9d74157d24` · POST `/api/content/v1/filesets/{id}/aiSearch` |

---

## Related Skills

- **Solution Blueprint** → Upstream — provides solution statement, use cases, operating model, architecture
- **Scope Builder** → Upstream — provides workstream deliverables, in/out of scope, assumptions
- **LOE Estimator** → Upstream — provides hours by workstream and total
- **Proposal Generator** → Upstream (optional) — provides customer narrative and commercial framing
- **CPQ Validator** → Downstream — validates SOW hours and fees against Salesforce CPQ
- **Knowledge Handoff** → Downstream — uses signed SOW to brief the delivery team
- **SOW Reviewer** → Downstream — antagonistic review of the completed SOW for completeness and accuracy
