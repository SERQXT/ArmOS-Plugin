---
name: scope-app-studio
deprecated: true
superseded_by: engagement-scope
tier: 1
description: "Sub-tool invoked by the Scope Builder when App Studio, DDX Bricks, custom applications, or pixel-perfect branded experiences are detected in the Solution Blueprint. Classifies each custom app component by type and complexity, defines deliverables and exclusions, and returns a structured Scope Model block to the Scope Builder."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: discover
  sub_phase: scoping
  position: 4c
  output_type: component
  wave: 1
  state: ready
  inputs:
    - agent: scope-builder
      required: true
      data: Solution Blueprint custom app requirements, Discovery Record visualization complexity signals
  outputs:
    - name: scope-app-studio-block
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

# scope-app-studio — App Studio & Custom Application Scoping Sub-Tool

Invoked by the Scope Builder when the Solution Blueprint includes App Studio, DDX Bricks, custom applications, or experiences that go beyond standard Domo dashboard capabilities. Classifies each custom component by type and complexity, defines explicit deliverables and exclusions, and returns a structured block the Scope Builder folds into the Scope Model.

App Studio and DDX Brick development is fundamentally different from dashboard work. It requires front-end development skills, a longer design-build-test cycle, and a higher risk of scope creep from iterative design feedback. Treating it as "high complexity visualization" consistently underscopes the work and creates delivery problems.

## Detection Signals (Scope Builder invokes this when it sees)

- "App Studio", "custom app", "custom application", "Domo app"
- "DDX Brick", "custom brick", "DDX", "custom visualization"
- "Pixel-perfect", "matches our brand exactly", "custom layout"
- "Custom interactivity", "custom user interface", "embedded form"
- "Looks like [our website / our product]", "white-labeled experience"
- "We want something that doesn't look like Domo"
- "Interactive tool", "calculator", "input form within a dashboard"
- "form", "intake form", "submission form", "data entry"
- "workflow button", "approval button", "automation trigger"
- Branding requirement classified as HIGH in the Discovery Record

## Execution Flow

### Step 1: Clarify What "Custom" Actually Means

Before scoping, determine whether App Studio or DDX is actually required — or whether standard Domo dashboard capabilities with custom branding and layout can meet the need.

```
fileset_search("App Studio capabilities overview")
fileset_search("DDX Bricks custom visualization overview")
```

Apply this decision tree:

| Customer Request | Standard Dashboard? | App Studio? | DDX Brick? |
|----------------|--------------------|-----------|-----------|
| Custom colors, logo, font | ✅ Yes — branding in Domo | Not required | Not required |
| Custom page layout with mixed content | ✅ Yes — Story pages | Not required | Not required |
| Fully custom navigation or multi-page app experience | ❌ No | ✅ Required | Not required |
| Custom chart type not available natively | ❌ No | Not required | ✅ Required |
| Input form or data entry within dashboard | ❌ No | ✅ Required | Not required |
| Custom calculator or decision tool | ❌ No | ✅ Required | May be needed |
| Pixel-perfect match to external brand guide | ❌ No | ✅ Required | May be needed |
| Custom drill-through or dynamic navigation | ✅ Sometimes | Sometimes | Sometimes |

If standard dashboard capabilities can meet the need: recommend standard approach, do not invoke App Studio scope. Document the recommendation in the Scope Model.

### Step 2: Inventory Every Custom Component

For each custom app or DDX component, define it as a discrete scope item:

```
fileset_search("App Studio scoping estimation")
fileset_search("DDX Brick development scoping complexity")
```

| Component | Type | Description | Screens / Views | Interactivity Level |
|-----------|------|-------------|----------------|-------------------|
| [Name] | App Studio App / DDX Brick / Hybrid | [What it does] | [Count] | Low / Medium / High |

### Step 3: Classify Each Component by Complexity

#### App Studio Applications

| Complexity | Criteria | Base Effort |
|------------|---------|------------|
| **Simple** | 1–3 screens, standard layout, basic navigation, minimal custom logic | 20–40 hrs |
| **Moderate** | 4–8 screens, custom navigation, dynamic content, moderate interactivity | 40–80 hrs |
| **Complex** | 8+ screens, full custom UX, data write-back, advanced state management, extensive custom logic | 80–150+ hrs |

Drivers of increased complexity:
- **Form creation** — App Studio native forms (7-step API chain per form, backing dataset auto-created, 11 field types). Each form adds ~4-8 hrs depending on field count and validation complexity. Multiple forms compound.
- **Workflow button binding** — Connecting existing Domo Workflow models to App Studio buttons (7-step API chain, requires pre-existing published workflow model). Adds ~2-4 hrs per workflow binding.
- Write-back or form submission to Domo datasets
- Dynamic data-driven navigation (content changes based on user or data state)
- Mobile responsiveness requirement
- Integration with Code Engine for custom data operations
- Accessibility requirements (WCAG compliance)
- Multi-user or role-based experience differences within the same app

#### DDX Bricks (Custom Visualizations)

| Complexity | Criteria | Base Effort |
|------------|---------|------------|
| **Simple** | Adaptation of an existing DDX template, minimal custom code | 8–16 hrs |
| **Moderate** | Custom chart type or interaction pattern, moderate JavaScript | 16–40 hrs |
| **Complex** | Fully custom visualization, D3 or third-party library integration, advanced animation | 40–80+ hrs |

### Step 4: Assess Design Requirements

Custom apps require design work that standard dashboards do not. Classify the design effort:

| Design Dimension | Assessment | Impact |
|-----------------|------------|--------|
| Brand guide provided? | Yes / No / Partial | No brand guide = assumption risk |
| Mockups or wireframes from customer? | Yes / No | Yes = reduces iteration rounds |
| Pixel-perfect adherence required? | Yes / No | Yes = significantly more QA cycles |
| Design approval process? | Formal / Informal | Formal = add approval milestone to project plan |
| Number of revision rounds included | [X rounds] | State explicitly — open-ended revision is a scope risk |

### Step 5: Define the Build and Test Approach

Custom app development follows a different cycle than dashboards:

1. **Design** — wireframes or mockups reviewed and approved before build begins
2. **Build** — iterative development with agreed checkpoints
3. **Review** — customer reviews working prototype
4. **Revise** — limited rounds of revision (must be defined in scope)
5. **UAT** — formal user acceptance testing
6. **Deploy** — production deployment and handoff

Define which of these phases are in scope and what the customer's role is at each step.

### Step 6: Classify LOE Signals

| Component | Type | Complexity | Design Effort | Code Engine? | Notes |
|-----------|------|------------|--------------|-------------|-------|
| [Component 1] | App Studio / DDX | Simple / Moderate / Complex | Low / Med / High | Yes / No | |
| [Component 2] | | | | | |

---

## Output Block (returned to Scope Builder)

```markdown
### App Studio & Custom Applications

**Custom components in scope:** [Count and summary]

**Standard dashboard recommendation applied:** [Yes / No]
*[If yes: "X customer request(s) can be met with standard Domo dashboards + branding.
  App Studio is not required for: [list]. App Studio is required for: [list]."]*

**In scope:**

| Component | Type | Complexity | Deliverable |
|-----------|------|------------|-------------|
| [Component 1] | App Studio App / DDX Brick | Simple / Moderate / Complex | [What is delivered] |
| [Component 2] | | | |

**Detailed scope per component:**

#### [Component Name 1]
- **What it does:** [Business-language description of purpose and user experience]
- **Type:** App Studio App / DDX Brick
- **Screens / Views:** [Count]
- **Key interactions:** [List key user interactions or dynamic behaviors]
- **Write-back:** Yes / No — [if yes, describe]
- **Brand guide:** [Provided / Not provided / Partial]
- **Complexity:** [Simple / Moderate / Complex] — [rationale]
- **Revision rounds included:** [X rounds]

#### [Component Name 2]
*[Repeat structure]*

---

**Out of scope:**
- [e.g., Custom app components not listed above]
- [e.g., Mobile app development — Domo mobile responsive only]
- [e.g., Revision rounds beyond [X] — additional rounds via change request]
- [e.g., Pixel-perfect adherence if brand guide is not provided before build]
- [e.g., Accessibility / WCAG compliance unless explicitly listed]
- [e.g., App maintenance or feature additions after project close]

**Assumptions:**
- Customer will provide approved brand guide and design assets before build begins
- Customer will review and approve wireframes/mockups before development starts
- Up to [X] revision rounds are included; subsequent rounds are a change request
- Write-back forms will collect data into Domo datasets only; external system writes are out of scope unless listed

**Customer responsibilities:**
- Provide brand guide, logos, color palette, and typography before design phase
- Assign a design reviewer with authority to approve wireframes and mockups
- Complete UAT for each custom component within [X] business days
- Provide feedback in consolidated form — round-by-round, not piecemeal

**LOE inputs:**
- App Studio apps: [list by complexity] — Simple: 20–40 hrs / Moderate: 40–80 hrs / Complex: 80–150+ hrs
- DDX Bricks: [list by complexity] — Simple: 8–16 hrs / Moderate: 16–40 hrs / Complex: 40–80+ hrs
- Design overhead: [Low / Medium / High] based on brand guide availability and revision requirements
- QA: 10–20% of App Studio / DDX development time
```

---

## Guardrails

- **Always assess whether standard dashboards suffice first.** Recommending App Studio when a standard dashboard would work is an over-scope. Recommending standard dashboards when App Studio is needed is an under-scope. Apply the decision tree.
- **Design work is not free.** App Studio apps require design effort — wireframes, mockups, revision cycles — that does not exist in standard dashboard work. This must be reflected in the scope and LOE.
- **Revision rounds must be defined and capped.** Open-ended design iteration is the single biggest source of scope creep in App Studio work. Define the number of included revision rounds explicitly and call out the change request process for additional rounds.
- **Brand guide must be a prerequisite.** Pixel-perfect work without a brand guide is a recipe for unlimited revision cycles. If the customer does not have a brand guide, note it as a risk and make "brand guide provided" a go/no-go dependency before build begins.
- **DDX Bricks require front-end development skills.** If the Domo PS team does not have a resource with JavaScript / D3 experience, this is a staffing risk. Flag it.
- **Write-back adds meaningful complexity.** Any form submission or data entry within an App Studio app that writes to a Domo dataset or external system adds design, development, and testing effort. Do not treat it as a minor add-on.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| fileset_search | **Yes** | App Studio capability reference, DDX Brick documentation, estimation guidance for custom development |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, content summarizing: App Studio scope decisions, page-to-app conversion parameters, layout adjustments planned.

---

## Related Skills

- **Scope Builder** → Invoking skill — receives this sub-tool's output block
- **LOE Estimator** → Downstream — uses LOE inputs from this block to calculate App Studio / DDX hours
