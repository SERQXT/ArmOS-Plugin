---
name: scope-automation
deprecated: true
superseded_by: engagement-scope
tier: 1
description: "Sub-tool invoked by the Scope Builder when Domo Workflows, automation, alerts, Code Engine, AI agents, or write-backs to external systems are detected in the Solution Blueprint. Classifies each automation use case by type and complexity, defines deliverables and exclusions, and returns a structured Scope Model block to the Scope Builder."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: discover
  sub_phase: scoping
  position: 4b
  output_type: component
  wave: 1
  state: ready
  inputs:
    - agent: scope-builder
      required: true
      data: Solution Blueprint automation requirements, Discovery Record automation signals
  outputs:
    - name: scope-automation-block
      format: structured-markdown
      downstream:
        - agent: scope-builder
  data_sources:
    - tool: fileset_search
      required: true
  phase_gate: false
---

## Reference Documents

Scoping reference documents (SOW templates, estimation methodology, service catalog) are stored in S3 under `cs-templates/scoping/`.

**To access reference files on demand:**
- List available files: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/list?prefix=cs-templates/scoping/"`
- Read a specific file: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/read?key=cs-templates/scoping/<filename>"`

Cache files locally in `./templates/scoping/` after first fetch. Prefer cached copies on subsequent reads.

# scope-automation — Workflows, AI & Automation Scoping Sub-Tool

Invoked by the Scope Builder when the Solution Blueprint includes automation, workflows, alerts, Code Engine, or AI components. Classifies each automation use case by type and complexity, defines explicit deliverables and exclusions, and returns a structured block the Scope Builder folds into the Scope Model.

Automation is the highest-variance workstream in any Domo engagement. A simple threshold alert is negligible effort. A complex multi-system workflow with Code Engine integrations can be 40–80+ hours. The purpose of this sub-tool is to force that classification before it reaches the LOE Estimator — not after.

## Detection Signals (Scope Builder invokes this when it sees)

- "Automate", "automation", "automated workflow", "trigger", "notify"
- Domo Workflows, workflow steps, approval routing, task assignments
- "When X happens, do Y" — any conditional business process
- Alerts, threshold notifications, anomaly detection
- Code Engine, Python, API integration, write-back, external system updates
- AI agents, conversational AI, AI Chat, predictive model, Code Engine + AI
- "Push data to", "update [system] when", "sync with [system]"

## Execution Flow

### Step 1: Inventory Every Automation Use Case

Extract each distinct automation use case from the Solution Blueprint and Discovery Record. Each one is scoped and classified separately — do not bundle them.

```
fileset_search("Domo Workflows automation scoping complexity")
fileset_search("Code Engine API integration scoping")
fileset_search("AI agent conversational AI scoping")
```

For each use case:

| Use Case | Description | Trigger | Action | Systems Involved |
|----------|-------------|---------|--------|-----------------|
| [Name] | [What it does in business terms] | [What starts it] | [What happens] | [Domo + external] |

### Step 2: Classify Each Use Case by Complexity

Apply the complexity classification from the estimation methodology:

| Complexity | Criteria | Base Effort |
|------------|---------|------------|
| **Alert (negligible)** | Simple threshold trigger, no branching, notification only | Negligible — absorbed into other phases |
| **Simple Workflow** | One trigger → one action, no branching, no external system writes | 2–5 hrs per workflow |
| **Moderate Workflow** | Multiple steps, user tasks, branch logic, one external system | 10–20 hrs per workflow |
| **Complex Workflow** | Multi-system integrations, loops, forms, error handling, strict SLAs | 40–80+ hrs per workflow |
| **AI Agent / Chat Setup** | Dataset prep, prompt tuning, guardrails, conversational interface | 6–12 hrs |
| **Custom Model (Python/R)** | Full data science cycle — build, validate, integrate, document | 20–40+ hrs |
| **Code Engine / API Integration** | Custom API call, non-standard auth, write-back to external system | 4–10 hrs per integration |

Classification rules:
- If the workflow writes back to an external system → at minimum Moderate; likely Complex
- If the workflow requires Code Engine → add Code Engine hours on top of workflow hours
- If the workflow involves forms or human task assignments → Moderate at minimum
- If the customer says "we want to automate [vague process]" → treat as Complex until scoped further

### Step 3: Apply the Scope Gate

Not every automation idea that came up in discovery should be in scope. Apply the scope gate:

**Include if:**
- The automation addresses a confirmed business process with clear trigger and action
- The customer has confirmed the target systems are accessible
- The automation is necessary to deliver the stated business outcome
- The effort is proportionate to the business value

**Exclude (or park as Phase 2) if:**
- The use case is speculative ("it would be nice if...")
- The target system API is not confirmed accessible or documented
- The complexity is high relative to the engagement budget
- The customer organization is not ready to maintain the automation after delivery

For any automation that is close to the scope gate, surface it to the SSD with a recommendation.

### Step 4: Assess External System Integration Requirements

For each workflow that touches an external system (write-back, API call, record creation):

```
fileset_search("Code Engine API integration [system name]")
→ Reference any existing patterns for the specific system
```

| System | Integration Type | API Available? | Auth Method | Notes |
|--------|-----------------|---------------|-------------|-------|
| [e.g., Salesforce] | Write-back — create/update record | Confirmed | OAuth | Standard; Domo has native connector |
| [e.g., ServiceNow] | Write-back — create incident | Confirmed | API key | Code Engine required |
| [e.g., Custom internal API] | Data push | Unknown | Unknown | Must confirm before scoping |

If the API is not confirmed, flag it as an open question — do not scope the integration until it is resolved.

### Step 5: Classify LOE Signals

| Automation Use Case | Type | Complexity | Code Engine? | Notes |
|--------------------|------|------------|-------------|-------|
| [Use case 1] | Workflow / Alert / AI / Custom Model | Simple / Mod / Complex | Yes / No | |
| [Use case 2] | | | | |

---

## Output Block (returned to Scope Builder)

```markdown
### Automation & AI

**Automation use cases in scope:** [Count and summary]

**In scope:**

| Use Case | Type | Complexity | Deliverable |
|----------|------|------------|-------------|
| [Use case 1] | [Workflow / Alert / AI / Code Engine] | [Simple / Moderate / Complex] | [What is delivered] |
| [Use case 2] | | | |

**Detailed scope per use case:**

#### [Use Case Name 1]
- **What it does:** [Business-language description]
- **Trigger:** [What starts the workflow]
- **Steps:** [High-level step summary]
- **External systems:** [List systems written to or read from]
- **Deliverable:** [What the customer receives]
- **Complexity:** [Simple / Moderate / Complex] — [rationale]

#### [Use Case Name 2]
*[Repeat structure]*

---

**Out of scope:**
- [e.g., Automation use cases not listed above]
- [e.g., Maintenance or updates to workflows after project close]
- [e.g., Custom machine learning model training — [use case] uses pre-built AI capability only]
- [e.g., Integration with [system] — API access not confirmed]
- [e.g., Real-time streaming triggers — batch refresh only]

**Assumptions:**
- APIs for all external systems listed above are accessible and documented before build begins
- Workflow logic and recipient lists will be confirmed by customer before development starts
- Customer will participate in workflow testing, including acting on task assignments during UAT
- Predictive models are experimental; accuracy targets are not guaranteed unless explicitly stated

**Customer responsibilities:**
- Provide API documentation and credentials for external systems before automation build
- Confirm workflow logic, branching rules, and escalation paths before development
- Identify workflow owners who will test and maintain automations after delivery
- Complete UAT for each workflow within agreed testing window

**LOE inputs:**
- Alerts: [count] — negligible
- Simple workflows: [count] × 2–5 hrs
- Moderate workflows: [count] × 10–20 hrs
- Complex workflows: [count] × 40–80+ hrs
- AI agent / chat setup: [count] × 6–12 hrs
- Custom models: [count] × 20–40+ hrs
- Code Engine integrations: [count] × 4–10 hrs
- QA: 10–20% of automation development time
```

---

## Guardrails

- **Classify every automation use case individually.** Do not lump multiple workflows into a single estimate. Each distinct workflow is a separate line item.
- **Confirm API access before scoping integrations.** An integration with an undocumented or inaccessible API is not scopeable. Flag it as an open question and do not include it in the scope until resolved.
- **Automation complexity is almost always underestimated.** When in doubt, classify up. A workflow that seems simple often has edge cases, error handling, and stakeholder dependencies that add hours.
- **Phase out high-complexity automation when the engagement is primarily analytics-focused.** If the customer's primary goal is dashboards and reporting, a Complex workflow is a scope risk. Recommend Phase 2 unless it is essential to the stated outcome.
- **Customer readiness matters.** An automation that routes tasks to people only works if people will act on those tasks. If customer readiness is uncertain, flag it as a risk.
- **AI is not a checkbox.** "Add AI" is not a scope item. AI scoping requires defining the dataset, the question being answered, the interface, and the guardrails. Vague AI requests must be clarified before scoping.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| fileset_search | **Yes** | Workflow complexity guidance, Code Engine patterns, AI scoping methodology, automation estimation reference |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, content summarizing: automated scope parameters, workflow triggers configured, automation boundaries defined.

---

## Related Skills

- **Scope Builder** → Invoking skill — receives this sub-tool's output block
- **LOE Estimator** → Downstream — uses LOE inputs from this block to calculate automation hours
