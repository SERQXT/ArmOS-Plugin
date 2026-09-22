---
name: connection-strategy
maturity: alpha
owner: Andrew Ferguson
description: "Determine the optimal data connection method for each identified data source by evaluating available options — Domo connectors, APIs, databases, reports, or custom integration. Systematically assess pre-aggregated databases, API availability, authentication complexity, and data fit. Trigger with 'build connection strategy for [account]', 'determine connection approach for [data source]', or 'what's the best way to get [data source] into Domo'. Requires data source inventory from discovery and stakeholder input on reporting needs."
pipeline:
  phase: discover
  sub_phase: solution-design
  position: 2.5
  output_type: framework
  wave: 1
  state: ready
  inputs:
    - agent: discovery-synthesizer
      required: true
      data: validated Discovery Record — data sources identified, required data elements, reporting granularity needs, existing systems inventory
    - agent: pre-scoping-brief
      required: false
      data: account context, existing Domo instance, current integrations, API access level
  outputs:
    - name: connection-strategy
      format: markdown
      downstream:
        - agent: solution-blueprint
        - agent: scope-builder
  data_sources:
    - tool: fileset_search
      required: true
      fileset_id: "e5b7e2e9-79ed-499d-95ff-fc9d74157d24"
      note: "Primary: S3 bucket. Fallback: Domo FileSet ID e5b7e2e9-79ed-499d-95ff-fc9d74157d24 via /api/content/v1/filesets/{id}/aiSearch"
    - tool: portfolio_lookup
      required: false
  phase_gate: false
---
## Scoping Reference Documents

Use the shared scoping reference documents from S3 as the authoritative runtime guidance for all scoping, LOE estimation, solution design, and SOW drafting activities.

- Live scoping templates: `s3://armos-workspace-676897632200/cs-templates/scoping/`
- Recommended fetch command:
  `aws s3 sync "s3://armos-workspace-676897632200/cs-templates/scoping/" ./templates/scoping/ --region us-east-2`
- To fetch a single file:
  `aws s3 cp "s3://armos-workspace-676897632200/cs-templates/scoping/DOMO SOW TEMPLATE 2025.docx" ./templates/scoping/ --region us-east-2`
- Read the downloaded document and extract the relevant structure, terms, formulas, or methodology sections before using it to shape the output.

The skill should prefer existing local reference files in `./templates/scoping/`, fetch from S3 when not cached, and fall back to the Domo FileSet when S3 is unavailable.

**Fallback — Domo FileSet:**
- FileSet ID: `e5b7e2e9-79ed-499d-95ff-fc9d74157d24`
- Search endpoint: `POST /api/content/v1/filesets/e5b7e2e9-79ed-499d-95ff-fc9d74157d24/aiSearch`
- Query format: `{"query": "<relevant search terms>", "topK": 5}`
- In Code Engine context: `fileset_search("<query>")` — uses FileSet ID `e5b7e2e9-79ed-499d-95ff-fc9d74157d24`

# Connection Strategy — Data Ingestion Assessment

Systematically determines the optimal connection method for each identified data source. Evaluates available options in priority order — pre-aggregated databases, Domo connectors, APIs, database connections, scheduled reports — and flags decisions requiring team validation or customer involvement.

This skill ensures data integration decisions are technically sound, operationally feasible, and aligned with project scope and timeline. It surfaces assumptions and risks early, preventing integration surprises during implementation.

## How It Works

```
Data Source Inventory + Reporting Requirements + Existing Systems
                              |
              Evaluate each data source systematically
                              |
    +--------+--------+--------+--------+--------+--------+
    |        |        |        |        |        |        |
  Database  Connector   API   Database Report  Custom
  Priority   Check    Assessment  Check  Check  Flag
    |        |        |        |        |        |        |
    +--------+--------+--------+--------+--------+--------+
                              |
        🔵 OUTPUT: Connection Strategy Document
                              |
             → Solution Blueprint + Scope Builder
```

## Triggers

- "build connection strategy for [account]"
- "determine connection approach for [data source]"
- "what's the best way to get [data source] into Domo"
- "map data ingestion options for [account]"
- "evaluate connection methods for [account]"

**Prerequisite:** Data sources must be identified during discovery with clear requirements for columns, granularity, and refresh frequency.

---

## Execution Flow

### Step 1: Load Inputs and Inventory

```
discovery-synthesizer    → data sources identified, reporting requirements, existing systems
pre-scoping-brief        → account type, Domo environment, existing integrations, API access level
portfolio_lookup         → account context, CSM, AE, prior integration history

fileset_search("Domo connector registry")
fileset_search("PS data connection best practices")
fileset_search("integration security guardrails")
→ Load connector catalog, connection assessment framework, security requirements
```

Build a working inventory:

| Data Source | Reporting Needs | Granularity | Refresh Freq | Status |
|-------------|-----------------|-------------|--------------|--------|
| [Name] | [Columns needed] | [Daily/Hourly/etc] | [Frequency] | Assess |

---

### Step 2: Priority Assessment Framework

Evaluate each data source through this decision hierarchy:

#### **Priority 1: Pre-Aggregated Database (Highest)**
**Applies when:**
- Database contains data from 2+ sources already aggregated/transformed
- Database adds existing value to the process (ETL, consolidation)
- Customer is not interested in removing the database
- Discussion includes write-back to database for feedback loops

**Assessment:**
- [ ] Is data pre-aggregated or transformed?
- [ ] Do 2+ sources feed this database?
- [ ] Does customer maintain/depend on this database?
- [ ] Potential write-back use cases?

**If YES to all:** Recommend database connection as primary method
**If NO:** Proceed to Priority 2

---

#### **Priority 2: Existing Domo Connector**
**Assessment:**
- [ ] Check Domo connector registry for data source
- [ ] Connector available and supported?
- [ ] Authentication method supported?
- [ ] Required endpoints available?
- [ ] Data granularity sufficient?

**If YES to all:** Recommend Domo connector
**If NO:** Proceed to Priority 3

---

#### **Priority 3: Direct API Integration**
**Assessment Framework:**

**3a. API Availability Search:**
- [ ] Search pattern 1: "[Data Source] API"
- [ ] Search pattern 2: "[Data Source] Developer"
- [ ] Search pattern 3: "[Data Source] Integration"
- [ ] Check tools: apitracker.io, developer portals, Postman collections
- [ ] Check GitHub for SDKs, examples, community integrations

**Result Options:**
- **Found & Accessible**: → Continue to 3b
- **Found but Behind Credentials/Demo Wall**: → Flag for customer input (see Step 3)
- **Not Found**: → Try web scraping (3c)
- **Web scraping unsuccessful**: → Proceed to Priority 4

**3b. API Compatibility Assessment** (if API found and accessible):
- [ ] API documentation complete and public?
- [ ] Authentication method supported? (OAuth, API Key, Basic Auth)
- [ ] No two-factor authentication required?
- [ ] No session tokens requiring token refresh chains?
- [ ] Required endpoints available?
- [ ] Supports needed data granularity?
- [ ] Rate limits acceptable?
- [ ] Pagination supported for large datasets?

**If YES to most:** Recommend API integration
**If NO to several:** Flag risks and proceed to Priority 4

**3c. Web Scraping Fallback** (if direct doc search unsuccessful):
- [ ] Attempt documentation crawl using industry tools
- [ ] Extract specification if available
- [ ] Document what was found
- [ ] Flag reverse-engineering as high-risk approach

**If unsuccessful:** Proceed to Priority 4

---

#### **Priority 4: Database Connection**
**Assessment:**
- [ ] Is data in accessible database?
- [ ] Can Domo authenticate to database?
- [ ] Direct query access allowed?
- [ ] Customer willing to provide/enable credentials?
- [ ] Sufficient performance for Domo refresh cycles?
- [ ] VPN/firewall access possible if needed?

**If YES to most:** Recommend database connection
**If NO:** Proceed to Priority 5

---

#### **Priority 5: Scheduled Report Ingestion**
**Assessment:**
- [ ] Reports available from data source?
- [ ] Reports contain required data elements?
- [ ] Report granularity matches needs?
- [ ] Reports available in supported format (CSV, Excel, etc)?
- [ ] Report refresh schedule matches Domo refresh needs?
- [ ] Downloadable automatically or manual process?

**If YES to most:** Recommend scheduled report approach
**If NO:** Proceed to Priority 6

---

#### **Priority 6: Fallback — Manual Upload + Challenge Validation**

**Trigger Fallback Decision:**
- [ ] No viable automated connection found
- [ ] Multiple options available but all high-risk

**Fallback Process:**
1. **Validate Data Source Name**: Challenge team member to confirm data source is correct
   - Generic names can have multiple tools (e.g., "Analytics")
   - Verify with customer if needed
   - Check if different product/version might exist

2. **If validation confirms data source is correct:**
   - Recommend manual file uploads as interim solution
   - Document upload process and frequency
   - List all explored alternatives in notes

3. **Document Alternative Solutions:**
   - Custom API integration via custom connector
   - Extract to database then connect to database
   - Data warehouse ETL from data source
   - Third-party integration service (Zapier, Integromat, custom)

---

### Step 3: Customer Dependency Resolution

**For connections requiring customer action:**

If API is behind credentials/demo wall OR database requires customer access setup:

```
🚩 CUSTOMER DEPENDENCY IDENTIFIED

Data Source: [Name]
Recommended Method: [Method]
Customer Action Required: [Specific action needed]
Who Handles: Implementation team (coordinates with customer)
Timeline Impact: [Setup time estimate]
```

Document but do NOT halt assessment. Implementation team handles customer coordination.

---

### Step 4: Security & Complexity Assessment

For each recommended connection method, evaluate:

| Factor | Assessment | Risk Level | SOW Note |
|--------|-----------|-----------|----------|
| **Authentication** | [Method + complexity] | Low/Med/High | Document if complex |
| **Data Sensitivity** | [PII/Sensitive/Public] | Low/Med/High | Note security handling |
| **Network Access** | [Public/VPN/IP Restrict] | Low/Med/High | List prerequisites |
| **Rate Limits** | [Requests/sec or daily] | Low/Med/High | Note if refresh affected |
| **Token Handling** | [Simple/Session/Refresh] | Low/Med/High | Flag if complex |
| **Error Handling** | [Robust/Limited] | Low/Med/High | Note manual monitoring |

**Security Findings** → Add to SOW Assumptions section with specific risk callouts and mitigation strategies

---

### Step 5: Generate Connection Strategy Document

**Output Format:**

```
# Connection Strategy — [Account Name]

## Executive Summary
- [Number] data sources assessed
- [Number] connections recommended
- [Number] requiring customer coordination
- [Key timeline or risk factor]

## Detailed Assessment by Data Source

### [Data Source 1]
**Reporting Need:** [Columns, granularity, frequency]
**Recommended Method:** [Primary method]
**Rationale:** [Why this method]
**Authentication:** [Auth method, complexity]
**Prerequisites:** [What needs to be set up]
**Implementation Timeline:** [Estimate]
**Risks/Considerations:** [Any flags or assumptions]
**Alternatives:** [If primary fails]

---

### [Data Source 2]
[Same structure]

---

## Summary Table

| Data Source | Method | Complexity | Timeline | Status |
|-------------|--------|-----------|----------|--------|
| [Name] | [Method] | Low/Med/High | [Days] | ✅/⚠️ |

---

## Assumptions
- [Database will not be removed per customer]
- [API authentication is standard OAuth, not multi-factor or session-based]
- [Customer will provide database credentials for security team setup]
- [Connector may require enterprise license upgrade]
- [Manual upload process will be used during API setup delay]

---

## Risks & Mitigation
- [Risk]: API documentation incomplete
  - [Mitigation]: Reverse engineering via web scraping + customer validation
  
- [Risk]: Database credentials have restricted lifecycle
  - [Mitigation]: Implement token refresh automation + monitoring

---

## Next Steps
1. SSD review and approval of recommended connections
2. Customer notification of any required credentials/access setup
3. Implementation team execution (order: [Priority])
4. Data validation after each connection activation
```

---

## Key Principles

- **Systematic Evaluation**: Every data source gets complete assessment before recommendation
- **Pre-Aggregated Priority**: Database aggregation/transformation takes priority over simpler methods
- **Risk Documentation**: All security and complexity concerns called out upfront
- **Customer Coordination**: Implementation team owns customer dependencies, not this skill
- **Data Source Validation**: Challenge generic names and confirm correct tool before defaulting to manual
- **Fallback Pragmatism**: Manual uploads acceptable as interim while pursuing better solutions

---

## Integration & Dependencies

- **Inputs:** discovery-synthesizer (data inventory), pre-scoping-brief (account context)
- **Feeds:** solution-blueprint (technical architecture), scope-builder (integration workstreams)
- **Phase:** Discover, solution-design sub-phase
- **Gate:** Non-blocking gate — informs architecture but doesn't gate scope building
- **Output Usage:** Referenced by LOE estimator (connection complexity multipliers), scope builder (integration workstreams), proposal generator (delivery complexity)