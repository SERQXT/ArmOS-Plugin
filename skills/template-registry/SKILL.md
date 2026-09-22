---
name: template-registry
tier: 1
description: "Global standard for all Compass deliverables. Every agent and skill that produces a document, presentation, or email MUST reference this skill first to select the correct template and apply Domo brand standards. Trigger automatically whenever generating output — this is not user-invoked, it's agent-invoked."
maturity: alpha
audience: [intelligence]
---

# Template Registry

**Every Compass deliverable must use the correct template and follow Domo brand standards.** This skill is the single source of truth. Before generating any output file, check this registry to determine: which template to use, where it lives, and what brand rules to follow.

## Template Catalog

### PowerPoint Templates

| Template | Location | When to Use | Used By |
|----------|----------|-------------|---------|
| **Adoption Roadmap** | `templates/adoption/Adoption_Roadmap_Templatev2.pptx` | Strategic roadmap planning with a customer. Discovery-through-roadmap workflow. Contains company overview, timeline, use case matrix, value roadmap, architecture diagrams, LOE estimates. | Scouting Agent, Roadmap Agent, Blueprint Agent, Adoption Acceleration |
| **Adoption Proposal** | `templates/adoption/Adoption_Proposal_Template.pptx` | Customer-facing engagement proposal. NOT a SOW — this is the "why and how" deck that sells the engagement. Contains challenges, objectives, methodology ("Momentum"), architecture, team, LOE, investment. | Offering Matchmaker, SOW Builder, Solution Architecture |
| **Steering Committee Deck** | `templates/pmo/[Template] Domo + [Customer Name] Steering Committee.pptx` | Executive steering committee meeting presentation. 9 slides: title, agenda, progress/outcomes, upcoming priorities, value/alignment, close. Governance-focused with speaker notes. | Weekly Status Agent, Delivery Risk Radar |
| **Domo PowerPoint Template** | `templates/brand/24_12_13 Powerpoint template.potx` | Master branded PowerPoint template. Use when creating general presentations, internal decks, or any slide deck that doesn't fit a specific template above. Start from this for any new presentation. | Any agent needing branded slides |

### Word Document Templates

| Template | Location | When to Use | Used By |
|----------|----------|-------------|---------|
| **Domo Word Doc** | `templates/brand/Domo Word Doc Template.docx` | ALL formal Word document output. SOWs, reports, blueprints, runbooks, anything .docx. Copy this template and populate it — never create a blank Word doc. | SOW Builder, Blueprint Agent, Design Summary, any agent producing .docx |
| **Acceptance Criteria - First Mile** | `templates/pmo/06[Template] Acceptance Criteria - First Mile.docx` | First-mile phase completion and client sign-off. Lists deliverables (kickoff, solution design, measurement planning, data strategy, metric mapping, Asana project plan) with hours and acceptance signature. | Engagement Setup Agent, Alignment Gate |
| **Change Request Process** | `templates/pmo/Change request process.docx` | Internal operational playbook for handling change requests. 10-step process from requirements gathering through approval, payment, and hours adjustment. | Delivery Risk Radar, Weekly Status Agent |
| **Needs Tracking** | `templates/pmo/Template Needs Tracking Document.docx` | PMO template inventory and completeness tracking. Internal reference document — do not use as customer-facing output. | (Internal PMO reference) |

### SOW Templates

| Template | Location | When to Use | Used By |
|----------|----------|-------------|---------|
| **Custom Scope SOW** | `templates/cs-solutions/[Customer_Name]_Domo_SOW_[mm_dd_yyyy].dotx` | Custom engagement SOW. Use for project-based engagements with defined scope, deliverables, and timeline. Word template (.dotx) format — replace bracketed placeholders with actual customer name and date. | SOW Builder |
| **Retainer Services SOW** | `templates/cs-solutions/[Customer_Name]_Domo_Retainer_Services_SOW_[mm_dd_yyyy].dotx` | Retainer engagement SOW. Use for ongoing advisory/retainer engagements with recurring hours. Word template (.dotx) format — replace bracketed placeholders with actual customer name and date. | SOW Builder |

### Email Templates — Engagement Lifecycle

These templates follow the engagement lifecycle from kickoff to close. They are the standard PMO communication cadence.

| # | Template | Location | When to Use | Phase | Used By |
|---|----------|----------|-------------|-------|---------|
| 01 | **Client Welcome Email** | `templates/pmo/01[Template] Client Welcome Email.docx` | First outreach to customer after engagement is sold. Introduces EM, sets kickoff meeting, requests instance access, and shares 2-week availability. | Align | Engagement Setup Agent |
| 02 | **Proposed Agenda - Weekly Calls** | `templates/pmo/02[Template] Proposed Agenda - Weekly Calls.docx` | Standard weekly meeting agenda. Three sections: Progress & Outcomes, Upcoming Priorities, Value & Alignment. Send before each weekly call. | Build | Weekly Status Agent |
| 03 | **Meeting Minutes - Post Call** | `templates/pmo/03[Template] Meeting Minutes email - post call.docx` | Post-call summary with key topics, action items (owners + deadlines), and clarifications needed. Send after every customer meeting. | Build | Weekly Status Agent |
| 04 | **Weekly Project Summary (Single)** | `templates/pmo/04[Template] Weekly Project Summary Email - Single Use Case.docx` | Single use-case weekly status. Sections: project status/health, hours/velocity, recent accomplishments (3 quantifiable), next steps, risks & mitigation, education/training. | Build | Weekly Status Agent |
| 05 | **Weekly Multi-Project Status** | `templates/pmo/05[Template] Weekly Multi-Project Status and Hours Report.docx` | Portfolio-level multi-project status. Table with project, hours purchased/consumed/remaining, % consumed, status, phase, accomplishments, next steps. Use when customer has 2+ concurrent engagements. | Build | Weekly Status Agent, Delivery Risk Radar |
| 06 | **Acceptance Criteria - First Mile** | `templates/pmo/06[Template] Acceptance Criteria - First Mile.docx` | First-mile deliverables sign-off. Lists activities with hours and requires client acceptance signature. | Align → Design | Alignment Gate, Engagement Setup Agent |
| 07 | **Steering Committee Email** | `templates/pmo/07[Template] Steering Committee email.docx` | Executive-level status to steering committee. Sections: progress/outcomes, upcoming priorities, value/alignment, leadership input requested. More formal than weekly status. | Build | Weekly Status Agent, Delivery Risk Radar |
| 08 | **Formal Change Request Email** | `templates/pmo/08[Template] Formal Change Request email.docx` | Cover letter for change request submission. Explains scope/timeline/approach changes and references attached CR document. Requires approval before work proceeds. | Design/Build | Delivery Risk Radar |
| 09 | **Project Close Email** | `templates/pmo/09[Template] Project Close Email.docx` | Formal project closure. Confirms completion, lists deliverables, attaches SOW and ETL docs, recommends Domo Community/Education, includes acceptance section for sign-off. Hands off to CSM/AE. | Adopt | Value Realization, Adoption Enablement |
| 10 | **Executive Summary (Estaff)** | `templates/pmo/10[Template] Executive Summary Estaff.docx` | Internal executive briefing. Sections: immediate focus (delivery momentum, scope discipline, adoption), why this matters (growth rationale), status & outlook (risk, near-term). Not customer-facing. | All | Weekly Status Agent (internal) |

### Reference Materials (Not Templates — Do Not Edit)

| Document | Location | Purpose |
|----------|----------|---------|
| **Domo Brand Identity** | `templates/brand/Domo Brand Identity_122024.pptx` | Official brand guidelines. Reference for colors, fonts, voice, logo usage. Read-only. |

---

## Domo Brand Standards

**These rules apply to EVERY deliverable, regardless of template.**

### Colors

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary** | Domo Blue | `#99CCEE` | Headers, accents, logos, primary brand element |
| **Neutral 1** | Light Gray | `#F1F6FA` | Backgrounds, cards |
| **Neutral 2** | Mid Gray | `#DCE4EA` | Borders, dividers |
| **Neutral 3** | Dark Gray | `#B7C1CB` | Secondary text |
| **Neutral 4** | Slate | `#68737F` | Body text |
| **Neutral 5** | Charcoal | `#3F454D` | Headers, primary text |
| **Accent Orange** | Orange | `#FF9922` | Alerts, callouts, emphasis |
| **Accent Purple** | Purple | `#776CB0` | Secondary accent |
| **Accent Pink** | Pink | `#C179BD` | Tertiary accent |
| **Accent Rose** | Rose | `#ECA4DD` | Quaternary accent |
| **Accent Green** | Mint | `#ADD4C1` | Success, positive signals |

**Rules:**
- Domo Blue is the anchor — it should be the dominant brand color in every deliverable
- Grays for structure and support, never as primary
- Accent colors used sparingly to enhance, never overpower Domo Blue
- Never modify logo colors, apply gradients, or stretch the logo

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| **Titles** | Open Sans | Bold | 36-44pt (PPTX) / 24pt (DOCX) |
| **Subtitles** | Open Sans | Light | 20-24pt (PPTX) / 18pt (DOCX) |
| **Body** | Open Sans | Regular | 14-16pt (PPTX) / 11pt (DOCX) |
| **Captions** | Open Sans | Regular | 10-12pt (PPTX) / 9pt (DOCX) |

**Fallback:** If Open Sans is unavailable, use Calibri.

### Voice & Tone

- **Voice (always):** Ambitious, bold, confident. Straight talk. Positive and motivating. Data-backed claims.
- **Tone (varies):** More casual in customer communications, more formal in proposals and reports.
- **Writing style:** Clear, straightforward, conversational, active voice. No jargon without context.
- **Personality:** Ambitious, Focused, Personable, Fun-Loving, Resilient, Smart.

### Positioning Language

When describing Domo, use the current positioning:
- **Platform name:** "The AI and Data Products Platform"
- **Tagline:** "Data is Hard. Domo is Easy."
- **Value prop:** Domo enables organizations to prepare, analyze, visualize, automate, and distribute data — amplified by AI.

---

## Template Selection Logic

When a Compass agent needs to produce a deliverable, follow this decision tree:

```
What are you producing?
│
├─ PowerPoint presentation?
│  ├─ Is it a customer adoption roadmap? → Adoption_Roadmap_Templatev2.pptx
│  ├─ Is it an engagement proposal? → Adoption_Proposal_Template.pptx
│  ├─ Is it a steering committee deck? → [Template] Domo + [Customer Name] Steering Committee.pptx
│  └─ General/internal/other presentation? → 24_12_13 Powerpoint template.potx
│
├─ SOW document?
│  ├─ Custom scope engagement? → [Customer_Name]_Domo_SOW_[mm_dd_yyyy].dotx
│  └─ Retainer engagement? → [Customer_Name]_Domo_Retainer_Services_SOW_[mm_dd_yyyy].dotx
│
├─ Word document (formal)?
│  └─ Always → Domo Word Doc Template.docx
│
├─ Customer email?
│  ├─ Engagement kickoff welcome? → 01[Template] Client Welcome Email.docx
│  ├─ Weekly call agenda? → 02[Template] Proposed Agenda - Weekly Calls.docx
│  ├─ Post-call meeting minutes? → 03[Template] Meeting Minutes email - post call.docx
│  ├─ Weekly status (single project)? → 04[Template] Weekly Project Summary Email - Single Use Case.docx
│  ├─ Weekly status (multi-project)? → 05[Template] Weekly Multi-Project Status and Hours Report.docx
│  ├─ Steering committee update? → 07[Template] Steering Committee email.docx
│  ├─ Change request? → 08[Template] Formal Change Request email.docx
│  └─ Project close? → 09[Template] Project Close Email.docx
│
├─ Internal communication?
│  ├─ Executive briefing? → 10[Template] Executive Summary Estaff.docx
│  └─ Other internal? → Follow brand voice guidelines
│
├─ First-mile acceptance? → 06[Template] Acceptance Criteria - First Mile.docx
│
├─ HTML artifact (dashboard, report)?
│  └─ Apply brand colors and typography from standards above
│
└─ Markdown or other?
   └─ Apply brand voice guidelines, no template needed
```

---

## Engagement Communication Cadence

The PMO templates follow a standard lifecycle cadence. Agents should follow this rhythm:

```
Engagement Sold
    │
    ├─ 01 Client Welcome Email (Engagement Setup Agent)
    │
    ├─ First Mile
    │  └─ 06 Acceptance Criteria sign-off (Alignment Gate)
    │
    ├─ Weekly Delivery Rhythm (repeating)
    │  ├─ 02 Proposed Agenda → before each call
    │  ├─ Call happens
    │  ├─ 03 Meeting Minutes → after each call
    │  └─ 04/05 Weekly Status → end of week (single or multi-project)
    │
    ├─ Governance (as needed)
    │  ├─ 07 Steering Committee email → executive updates
    │  ├─ Steering Committee Deck → exec presentations
    │  ├─ 08 Change Request email → scope changes
    │  └─ 10 Executive Summary → internal leadership
    │
    └─ 09 Project Close Email (Value Realization)
```

---

## How to Use a Template

Use the `doc_*` MCP tools for the full document lifecycle. All template paths below are relative to the templates root (provided in the system prompt as Templates location).

### PowerPoint (PPTX / POTX) — XML Surgery

1. **`doc_create_from_template`** — Copy the template to the working directory
2. **`doc_unpack`** — Extract the PPTX to expose raw XML (ppt/slides/*.xml)
3. **`doc_read_structure`** — Analyze slides: shape names, placeholder text, image refs
4. **Edit** slide XML directly using the Edit tool — change `<a:t>` text content while preserving all `<a:rPr>` formatting attributes
5. **`doc_pack`** — Rezip into valid PPTX (always pass `original_path` to prevent corruption)
6. **`doc_qa`** — Scan for leftover placeholders before delivery

### Word (DOCX) — XML Surgery

1. **`doc_create_from_template`** — Copy the Domo Word Doc Template
2. **`doc_unpack`** — Extract to expose word/document.xml
3. **`doc_read_structure`** — Analyze headings, styles, tables, placeholders
4. **Edit** word/document.xml using the Edit tool — change `<w:t>` text while preserving `<w:rPr>` and `<w:pStyle>` formatting
5. **`doc_pack`** — Rezip with `original_path` for relationship integrity
6. **`doc_qa`** — Verify no placeholder text remains

### SOW (CS-Solutions)

1. **`doc_create_from_template`** — Copy the appropriate SOW template (Custom Scope or Retainer)
2. **`doc_unpack`** → **Edit** → **`doc_pack`** — Same XML surgery workflow as DOCX above
3. **Replace** all bracketed placeholders: [Customer_Name], [mm_dd_yyyy], etc.
4. **Populate** scope, deliverables, timeline, and pricing from discovery data
5. **Preserve** legal boilerplate sections and formatting

### Email (DOCX — PMO Templates)

1. **`doc_create_from_template`** — Copy the numbered PMO email template
2. **`doc_unpack`** → **Edit** → **`doc_pack`** — XML surgery to replace placeholders
3. **Replace** all bracketed placeholders: [Customer Name], [Date], [EM Name], [Project Name], etc.
4. **Fill** each section with account-specific data from MCP tools (Portfolio, SPP, Health Grade, Asana)
5. **Preserve** the section structure — these have been vetted by PMO leadership
6. **Tone:** Warm and professional for customer-facing; concise and data-driven for internal
7. **`doc_qa`** — Final check before delivery

---

## Agent-to-Template Mapping

This table shows which template each Compass agent should use for its primary output:

| Agent | Primary Output | Template |
|-------|---------------|----------|
| Scouting Agent | Scouting Report | Domo Word Doc Template |
| Customer ROI Hypothesis | ROI Analysis | Domo Word Doc Template |
| Offering Matchmaker | Proposal Deck | Adoption Proposal Template |
| Solution Architecture | Architecture Deck | Adoption Roadmap Template (arch slides) |
| SOW Builder | SOW Document | CS-Solutions SOW Template (Custom Scope or Retainer) |
| Staffing Agent | Staffing Rec | (internal, no template) |
| Engagement Setup Agent | Welcome Email | PMO 01 Client Welcome Email |
| Alignment Gate | First-Mile Sign-off | PMO 06 Acceptance Criteria |
| Roadmap Agent | Roadmap Deck | Adoption Roadmap Template |
| Blueprint Agent | Requirements Spec | Domo Word Doc Template |
| Wireframe Agent | Wireframes | Adoption Roadmap Template (arch slides) |
| Design Summary | Design Review Package | Adoption Roadmap Template |
| Weekly Status Agent | Weekly Status Email | PMO 04 (single) or 05 (multi-project) |
| Weekly Status Agent | Meeting Agenda | PMO 02 Proposed Agenda |
| Weekly Status Agent | Meeting Minutes | PMO 03 Meeting Minutes |
| Weekly Status Agent | Steering Committee | PMO 07 Steering Committee Email + Steering Committee Deck |
| Weekly Status Agent | Executive Summary | PMO 10 Executive Summary Estaff |
| Backlog Agent | Backlog Sync | (Asana, no template) |
| Delivery Risk Radar | Change Request | PMO 08 Formal Change Request Email |
| Delivery Risk Radar | Risk Report | PMO 05 Multi-Project Status (risk section) |
| Adoption Enablement | Enablement Plan | Domo Word Doc Template |
| Adoption Radar | Health Alert | (internal, no template) |
| Value Realization | Value Report | Domo Word Doc Template |
| Value Realization | Project Close | PMO 09 Project Close Email |
| Growth Navigator | Growth Playbook | Adoption Proposal Template |

---

## Guardrails

- **NEVER create a blank presentation or document.** Always start from a template.
- **NEVER modify the original template files.** Copy first, then edit the copy.
- **NEVER use colors outside the brand palette** unless the customer's brand requires it.
- **NEVER use fonts other than Open Sans** (or Calibri as fallback).
- **ALWAYS preserve template headers, footers, and slide masters** — they contain logo placement and branding.
- **ALWAYS check for leftover placeholder text** ([Customer Name], [Date], Lorem ipsum, XXXX, etc.) before delivering.
- **ALWAYS follow the PMO numbered sequence** — templates are ordered by engagement lifecycle for a reason.
- **Reference the Brand Identity guide** if unsure about any visual standard.
- **Reference the Change Request Process doc** before generating any change request communication.

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context.

### After executing
- No memory writes required for this utility skill.
