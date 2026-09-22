---
name: scope-everywhere
deprecated: true
superseded_by: engagement-scope
tier: 1
description: "Sub-tool invoked by the Scope Builder when Domo Everywhere, embed, Domo Publish, or external data distribution is detected in the Solution Blueprint. Defines the full scope of the distribution workstream — embed type, external audiences, PDP requirements, SSO, subscriber instance setup, and Domo Sandbox promotion. Returns a structured Scope Model block to the Scope Builder."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: discover
  sub_phase: scoping
  position: 4a
  output_type: component
  wave: 1
  state: ready
  inputs:
    - agent: scope-builder
      required: true
      data: Solution Blueprint distribution requirements, Discovery Record distribution signals
  outputs:
    - name: scope-everywhere-block
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

# scope-everywhere — Domo Everywhere & Distribution Scoping Sub-Tool

Invoked by the Scope Builder when the Solution Blueprint includes external users, embedded content, subscriber instances, Domo Publish, or Sandbox. Defines the full distribution workstream scope and returns a structured block the Scope Builder folds into the Scope Model.

This sub-tool exists because Domo Everywhere has its own licensing model, embed types, PDP complexity, SSO requirements, and technical architecture that are distinct enough from standard dashboard work to warrant dedicated scoping. Treating it as a "high complexity dashboard" consistently underscopes the work.

## Detection Signals (Scope Builder invokes this when it sees)

- External users, partners, clients, customers, or vendors needing access
- "Embed", "embedded dashboards", "white-label", "branded portal"
- Domo Everywhere, Subscriber Instance, Domo Publish
- "Customers see their own data", "row-level filtering by client"
- Sandbox, content promotion, environment management
- "Publish to another instance", "multi-tenant"

## Execution Flow

### Step 1: Classify the Distribution Model

Identify which Domo distribution model applies. There may be more than one.

```
fileset_search("Domo Everywhere embed types scoping")
fileset_search("Domo Publish subscriber instance scoping")
fileset_search("Domo Sandbox content promotion scoping")
```

| Distribution Model | Description | In Scope? |
|-------------------|-------------|-----------|
| **View-only Embed** | External users view dashboards embedded in a portal or product; no editing | Detect |
| **Edit/Connect Embed** | External users can edit or connect data within embedded experience | Detect |
| **Subscriber Instance** | A separate Domo instance receives published content from the parent | Detect |
| **Domo Publish** | Publish pages/cards to subscriber instances with PDP-filtered data | Detect |
| **Sandbox** | Dev/staging environment for content promotion before production | Detect |

### Step 2: Define External Audience and Access Requirements

| Dimension | Discovery Record Finding | Scope Decision |
|-----------|------------------------|---------------|
| Who are the external users? | [From Discovery Record] | [Role / persona] |
| How many external users / tenants? | [Count or estimate] | [Drives PDP complexity] |
| View-only or interactive? | [Confirmed in discovery] | [Determines embed type] |
| Branded experience required? | [Brand guidelines discussed?] | [Branding level] |
| SSO / federated identity required? | [Confirmed or unknown] | [In/out of scope] |
| Row-level filtering by client/tenant? | [Confirmed or unknown] | [PDP complexity signal] |
| Data isolation required between tenants? | [Confirmed or unknown] | [PDP architecture] |

### Step 3: Define PDP Architecture for Distribution

Domo Everywhere almost always requires Personalized Data Permissions (PDP). Classify the complexity:

```
fileset_search("PDP row-level security Domo Everywhere multi-tenant")
→ Reference PDP architecture patterns for external distribution
```

| PDP Scenario | Complexity | Signal |
|-------------|------------|--------|
| Single filter per user (e.g., client ID = user's company) | Low | 1 attribute, standard PDP rule |
| Multiple filters per user (e.g., region + product line) | Medium | 2–3 attributes, policy management |
| Dynamic tenant isolation (100+ tenants, programmatic PDP) | High | Attribute-based PDP at scale, policy automation |
| Cross-instance PDP with Domo Publish | High | PDP must be replicated or rebuilt in subscriber instance |

### Step 4: Define Sandbox / Promotion Scope (if applicable)

If Sandbox is in scope, define the promotion workflow:

- Source environment: [Development / Staging]
- Target environment: [Production / Subscriber Instance]
- Content to be promoted: [DataSets / DataFlows / Cards / Pages / Connectors]
- Promotion frequency: [One-time setup / recurring release process]
- Customer ownership after setup: [Who manages promotions ongoing]

### Step 5: Classify LOE Signals

Based on the above, classify the distribution workstream for the LOE Estimator:

| Signal | Classification | Rationale |
|--------|---------------|-----------|
| **Embed type** | View-only (30 hrs base) / Edit-Connect (60 hrs base) | [From Step 2] |
| **PDP complexity** | Low / Medium / High | [From Step 3] |
| **Sandbox setup** | Yes (~1–2% of Connect+Transform+Viz) / No | [From Step 4] |
| **SSO integration** | In scope / Out of scope | [From Step 2] |
| **Branding level** | Low / Standard / High | [From Step 2] |

---

## Output Block (returned to Scope Builder)

```markdown
### Domo Everywhere & Distribution

**Distribution Model:** [View-only Embed / Edit-Connect Embed / Subscriber Instance /
                         Domo Publish / Sandbox / combination]

**In scope:**
- [e.g., Embed view-only dashboards into [customer portal] for [external audience]]
- [e.g., Configure PDP rules to filter data by [attribute] for [X] tenants]
- [e.g., Set up Domo Publish from parent to subscriber instance for [audience]]
- [e.g., Configure Sandbox environment and establish promotion workflow]
- [e.g., Apply customer branding (logo, color palette) to embedded experience]

**Out of scope:**
- [e.g., SSO / identity provider integration — customer IT to handle separately]
- [e.g., Embed into mobile applications]
- [e.g., Edit or Connect access for external users — view-only only]
- [e.g., Ongoing management of subscriber instance after go-live]
- [e.g., Additional tenants beyond [X] configured at project close]

**Assumptions:**
- Customer holds the required Domo Everywhere license before project start
- External user list and tenant identifiers will be provided before PDP setup
- Customer's portal/product can accept iframe embed or SDK integration
- [SSO assumption — in or out of scope, state clearly]

**Customer responsibilities:**
- Confirm external user count and tenant structure before PDP design
- Provide portal/product technical contact for embed integration
- Obtain Domo Everywhere license if not already active
- Validate PDP filtering logic before go-live

**LOE inputs:**
- Embed type: [View-only / Edit-Connect]
- PDP complexity: [Low / Medium / High]
- Sandbox: [Yes / No]
- SSO: [In scope / Out of scope]
- Branding: [Low / Standard / High]
```

---

## Guardrails

- **Always confirm licensing before scoping.** Domo Everywhere requires a separate license. If it is not confirmed active, note it as a dependency and flag it for the AE.
- **PDP for external users is almost never optional.** If the customer has multiple external tenants who should not see each other's data, PDP is required. Do not scope Everywhere without addressing data isolation.
- **SSO is a common scope surprise.** External users often expect SSO, but SSO integration is a separate technical effort. Explicitly call it out as in or out of scope — never leave it ambiguous.
- **Do not conflate Domo Publish with Domo Everywhere.** They are different capabilities. Publish sends content to a subscriber instance. Everywhere embeds content in external applications. Scope them separately if both are present.
- **View-only and Edit/Connect are materially different efforts.** The base LOE roughly doubles. Confirm which the customer needs before scoping.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| fileset_search | **Yes** | Domo Everywhere capability reference, PDP architecture patterns, Sandbox scoping guidance |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, content summarizing: cross-platform scope analysis, integration points identified, shared data requirements across surfaces.

---

## Related Skills

- **Scope Builder** → Invoking skill — receives this sub-tool's output block
- **LOE Estimator** → Downstream — uses LOE inputs from this block to calculate distribution hours
