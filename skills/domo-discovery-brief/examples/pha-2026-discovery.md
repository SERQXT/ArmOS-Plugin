# Discovery Brief — Pacific Healthcare Association (PHA)

**Brief date:** April 23, 2026 · **Version:** v1.0 · **Confidentiality:** Internal — Pre-Sales
**Author:** Mark Lees

---

## Discovery Context

**Discovery date:** April 23, 2026

**Attendees:**

- Maya Chen, SVP, Quality & Compliance (Client)
- David Reeves, Sr. Director, Technology (Client)
- Mark Lees, Solutions Director (Domo)
- Anika Patel, Implementation Consultant (Domo)
- Marcus Brown, Technical Resource (Domo)


**Source material:**

- March 18, 2026 proposal review with PHA (scoping conversation)
- Marcus Brown's existing QHR portal POC scaffolding (prior engagement)
- Notes from Aaron Cole re: existing Data 360 crosswalk scripts (meeting notes)


---

## Client Snapshot

**Pacific Healthcare Association** — Healthcare association — Healthcare quality reporting consortium · 150+ member member healthcare organizations with parent/child site hierarchy

**Strategic posture:** Mid-transformation. Decommissioned legacy QHR portal, currently on interim SharePoint site, looking to consolidate fragmented stack onto Domo before the next collection cycle forces a temporary fix.


**Prior Domo relationship:** Existing Domo platform license including HIPAA-eligible environment. Active POC scaffolding from Marcus Brown. ACE support package included (80 hours/year).


### Strategic context

PHA's data infrastructure challenge isn't a single problem — it's a collection of compounding constraints. PHI clinical data flows through ad-hoc transfers, financial and operational data through manual spreadsheet intake, and QA/ETL through a patchwork of SQL scripts, MS Access, Data 360, and Tableau. The headline symptom is a 12-to-18-month lag from data collection to published QHR report, which has eroded PHA's analytical credibility with its membership. Leadership has identified closing this gap as the single most important outcome. The window is narrow: PHA needs a permanent intake channel before the next collection cycle forces them to point members at the interim SharePoint site, which would mean two member-facing transitions instead of one. Domo is positioned to consolidate the full stack (Tableau, AWS, Data 360, Access, custom portals) into a single environment PHA can operate independently long-term.


---

## Stakeholder Map

| Name | Title | Authority | Disposition | Key concerns |
|------|-------|-----------|-------------|--------------|
| Maya Chen | SVP, Quality & Compliance | Decider | Supporter | Member experience cannot be compromised — PHA is a member-facing organization. Wants change management built into rollout, not an afterthought. Pushing for one transition, not two. |
| David Reeves | Sr. Director, Technology | Approver | Champion | Wants the data team to become self-sufficient on Domo over time. Concerned about the dual-login experience while AMS replacement is pending. Confirmed the 'one transition, not two' principle as a goal. |
| Aaron Cole | Data Team — Owner of existing QHR crosswalk scripts | User | Neutral | Existing Data 360 crosswalk scripts and QA logic are tribal knowledge. Solution 2 success depends on porting his work cleanly. |
| Nadia Park | Domo MSP Lead | Influencer | Champion | MSP add-on is a natural fit during Year 1 ramp-up. Will present separately as complement to implementation SOW. |


---

## Current State

### Tech stack today

- **QHR Portal (legacy)** — PHI clinical data submission from member orgs *(decommissioned)*
- **Interim SharePoint site** — Bridge for PHI submissions until permanent solution is live *(interim)*
- **Email + spreadsheet intake** — Non-PHI financial, staffing, quality/compliance data collection
- **Microsoft Access** — Intermediate data store and ETL staging
- **Data 360** — QHR taxonomy crosswalk and data transformation (Aaron Cole's scripts)
- **SQL scripts (custom)** — Manual data QA and pipeline operations
- **Tableau** — Reporting; PDF distribution to members via email
- **AWS** — Hosting infrastructure for legacy QHR portal *(deprecated)*



### Data flow today

Members submit PHI via the (now decommissioned) QHR portal — currently being directed to interim SharePoint. Files land in AWS infrastructure. Data is manually QA'd via SQL and Access, transformed through Data 360 crosswalks (Aaron Cole's scripts), then loaded into Tableau for reporting. Reports get exported as static PDF and emailed to members annually. Non-PHI financial and operational data follows a parallel manual path through email + spreadsheet intake. The combined cycle stretches 12 to 18 months from data collection to published report.


### Pain points


**1. QHR reporting lag of 12 to 18 months from data collection to published report**

> PHA's QHR report for 2024 data — collected by end of Q2 2025 — was not published until early 2026.

*Implied impact:* Member trust in PHA's analytical relevance has eroded. Member retention and renewal at risk if the lag continues.



**2. Decommissioned legacy QHR portal leaves no permanent submission channel**

> Interim SharePoint site has been prepared as a bridge, but using it would mean directing members through a temporary process and re-transitioning to Domo within the same year.

*Implied impact:* Two member-facing transitions in one year — communication burden, rollout fatigue, friction at exactly the wrong moment.



**3. Manual ETL and crosswalk work across SQL scripts, Access, and Data 360**

> Aaron Cole maintains the QHR taxonomy crosswalk by hand. EHR column changes from vendor updates require manual rework each cycle.

*Implied impact:* Significant analyst capacity locked in repetitive plumbing work. Single-point-of-failure risk if Aaron Cole is unavailable.



**4. Static PDF email distribution — no member self-service**

> Reports produced in Tableau, exported to PDF, distributed via email annually.

*Implied impact:* Members can't access their own data on demand or compare against peer benchmarks. PHA's value proposition as a data resource is muted.



**5. Submission tracking happens in spreadsheets — no real-time visibility**

> PHA staff currently track who has submitted via manual spreadsheet maintenance.

*Implied impact:* Reminder cycles are slow and error-prone. Late submissions are caught after the fact rather than prevented.



**6. QHR taxonomy crosswalk requires recurring manual rework**

> EHR vendors update column names and coding values; Aaron Cole reconciles each change by hand.

*Implied impact:* Each EHR vendor update creates rework cycles and risk of silent data corruption if changes aren't caught in time.



**7. Fragmented vendor stack — Tableau, AWS, Data 360, Access, custom portals**

> Multiple vendors, multiple training surfaces, multiple integration points across the data team.

*Implied impact:* License cost, training burden, integration fragility, and unclear single-vendor accountability when issues surface.



### What's working (do not replace)

- Domo platform license including HIPAA-eligible environment is already in place
- Marcus Brown's existing POC scaffolding is reusable directly into Solution 1
- Aaron Cole's existing Data 360 crosswalk scripts have proven QA logic that can be ported
- ACE support package (80 hours/year) is included and can run concurrent with implementation



---

## Target Outcomes

### Business outcomes

- Reduce QHR reporting cycle from 12–18 months to near-real-time after validated submission
- Establish a permanent, Domo-native PHI submission channel before the next collection cycle
- Replace manual spreadsheet collection of non-PHI data with governed Domo Forms with required-field validation
- Provide members with self-service access to their own data, peer benchmarks, and trend analysis (replacing annual PDF emails)
- Consolidate Tableau, AWS, Data 360, Access, and custom-built portals into a single Domo environment
- Build a foundation PHA's data team can operate independently long-term


### Success criteria

- Solution 1 QHR PHI Intake Portal live by end of June 2026 — before PHA needs to direct members to interim SharePoint
- Member experience does not degrade through the transition — pilot cohort completes upload smoothly with feedback incorporated before broader rollout
- AI validation agent operational by mid-August, eliminating manual QA on intake
- QHR reporting available near-real-time on validated submission by late September
- All four non-PHI forms (PMPM, Financial Ratios, Staffing, Quality/Compliance) live by late October
- Quality intelligence engine and extended EHR coverage operational by late November



### Strategic implications

This engagement repositions PHA from a data-publishing organization with a 12–18 month lag to a real-time data platform for the PHA community. It elevates PHA's value proposition to its membership, builds the foundation for member-facing analytics products PHA could potentially monetize in the future, and establishes the operational model for adding adjacent capabilities (predictive submission prompts, longitudinal quality audits, peer benchmarking) without rebuilding the foundation.


---

## Hidden Value & Secondary Use Cases

The client did not explicitly ask for these, but they become possible once the explicit ask is delivered:


**Member experience uplift drives retention and growth** — Client asked for a faster reporting cycle; with the self-service member dashboards built on top of the validated pipeline, PHA's value proposition strengthens and member retention/growth becomes a quantifiable outcome rather than a hope. · *Already in scope as Solution 3 — included in baseline LOE*


**Vendor stack consolidation savings** — Client framed Domo as the new platform; what they haven't yet quantified is the eliminated license, infrastructure, and integration cost from retiring Tableau, Data 360, MS Access, and the AWS-hosted QHR portal. Retired vendor spend is recurring annual savings on top of capability gains. · *No additional consulting cost — savings come from decommissioning*


**Staff capacity recaptured for higher-value work** — Manual ETL/QA/crosswalk work eliminated through agentic validation and Magic ETL recaptures analyst FTE time. Aaron Cole's tribal knowledge gets codified into the platform rather than living as recurring manual work. · *Captured automatically through Solution 2 deliverables*


**Predictive submission prompts and quality intelligence** — Solution 5 adds longitudinal quality tracking and AI-generated submission nudges per org. Once Solution 2's agent framework is in place, this is a configuration exercise rather than a new build — high-value capability at marginal additional cost. · *Reuses Solution 2 logs and agent framework — Solution 5 LOE is small for the capability gained*


**Foundation for adjacent member-facing data products** — Once members are in a self-service Domo portal authenticated via PHA's login wall, PHA has the infrastructure to add adjacent products (e.g. policy advocacy data tools, member benchmarking products, training analytics) with marginal additional engineering. Future revenue lever PHA hasn't yet articulated.



---

## Proposed Solution Shape *(DRAFT — to be refined in the proposal)*


### Solution 1: QHR PHI Intake Portal — Immediate Priority

*Weeks 1–5* · **58–80 hours**

**Rationale:** Solution 1 must hit late-June go-live to avoid directing members to the interim SharePoint site. Scope is intentionally narrow — upload portal, Filesets governance, PHA staff submission tracker, no visualization layer. The Fileset/AppDB architecture is designed to scale into all subsequent solutions without rebuild.

Key deliverables:

- Member-facing custom app embedded behind phaonline.org member login
- Domo Filesets PHI upload with org-level partitioning (HIPAA-isolated)
- Member authentication and RBAC for 150+ orgs with parent/child hierarchy
- PHA staff submission tracker dashboard
- Pilot onboarding for 5–10 early-adopter member orgs




### Solution 2: Agentic QHR Validation & Taxonomy Engine

*Weeks 4–12 (overlaps with Solution 1 UAT)* · **112–158 hours**

**Rationale:** Adds intelligence on top of Solution 1's data plumbing. AI agent reviews uploaded files, flags issues, routes for human approval. Taxonomy crosswalk ports Aaron Cole's existing Data 360 logic with AI-assisted translation. Big 3 EHR vendors first (~80% of submission volume); long tail in Solution 5.

Key deliverables:

- Agentic validation pipeline against required field checklist
- Human-in-loop approval workflow for PHA staff
- QHR taxonomy crosswalk engine (ported from Aaron Cole's Data 360 scripts)
- EHR pathway routing for top 3 vendors with column-change detection




### Solution 3: QHR Analytics Dashboard & Member Reporting

*Weeks 10–17* · **82–118 hours**

**Rationale:** Replaces the Tableau → PDF → email distribution model with self-service member dashboards. Members see their own data plus anonymized peer benchmarks in near-real time. Retires the 12–18 month lag.

Key deliverables:

- Member-facing QHR portal (self-service, PDP-scoped per Member ID)
- PHA staff aggregate dashboard with org/region/EHR drill-downs
- 5-year historical data integration for trend continuity
- On-demand PDF export




### Solution 4: Non-PHI Form Ingestion & Financial Dashboards

*Weeks 14–21* · **96–136 hours**

**Rationale:** Sequenced after the QHR PHI portal launch per Mia's directive. PHA's financial collection is already underway and concludes within the original window, so this work picks up once QHR is established and member experience is stable. ~50 Tableau visuals migrate to Domo using Pacific Drift palette.

Key deliverables:

- Domo Forms for PMPM, Financial Ratios, Staffing, Quality/Compliance
- ~50 Tableau visual migrations to Domo (consolidated into 4 dashboards)
- Staggered form calendar matching annual collection schedule




### Solution 5: Data Quality Intelligence, Extended EHR Coverage & SSO

*Weeks 19–26* · **66–98 hours**

**Rationale:** Extends coverage to the full membership and establishes durable quality intelligence. EHR coverage expanded beyond Big 3 to all 15 vendors. SSO planning scopes future AMS integration.

Key deliverables:

- Data quality audit engine with longitudinal per-org tracking
- Extended EHR pathway coverage for 12 additional vendors
- Predictive submission prompts (AI-generated nudges)
- SSO planning for future AMS integration





---

## Out of Scope (Initial)

- Migration or data extraction from the interim SharePoint site (PHA's responsibility)
- Direct live EHR API connections / automated data pulls (future state beyond Solution 5)
- SSO / single sign-on implementation (pending AMS replacement — separate engagement)
- Modification or maintenance of PHA's existing Tableau environment
- Managed Services / ongoing platform administration (separate Domo MSP engagement to be presented by Nadia Park's team)
- AWS infrastructure or Data 360 decommissioning (PHA's internal responsibility once Domo is live)



---

## Risks & Dependencies

- **Dependency (critical):** Contract execution by approximately May 15 to enable team mobilization within one week and Solution 1 late-June go-live.
- **Dependency (high):** Aaron Cole's existing Data 360 crosswalk scripts and QA logic must be shared before Solution 2 architecture begins.
- **Dependency (high):** David/IT must enable Domo app embedding on phaonline.org behind the existing member login wall before Solution 1 UAT.
- **Dependency (medium):** EHR system mapping (which org uses which EHR) must be provided from existing PHA records before Solution 2 routing logic is built.
- **Risk (medium):** Pilot cohort selection — 5 to 10 orgs need to be identified by Mia. Wrong cohort selection (e.g. all sympathetic orgs, no critical voices) reduces feedback signal quality.
- **Constraint (medium):** PHA accepts dual-login experience as interim state until AMS replacement enables SSO. Communication strategy must explain this clearly.



---

## Commercial Signals

**Timing pressure:** Contract execution by approximately May 15 to position Solution 1 go-live in late June, before PHA would need to direct members to an interim SharePoint solution. Full five-solution engagement completes within six months (late November 2026).


**Budget signals:** Not explicitly discussed during March 18 review. Existing license investment indicates PHA is committed; the question is consulting scope, not platform commitment.


**Rate context:** Standard $275/hr Domo blended consulting rate assumed. AI-accelerated delivery model produces 40–50% leaner estimates than traditional integrators — this is a competitive lever if rate is challenged.


**Competing solutions:**

- **Custom rebuild of legacy QHR portal** — Ruled out · Would not consolidate the broader stack and creates ongoing maintenance burden PHA's data team can't sustain.
- **Continuing fragmented stack (Tableau + AWS + Data 360 + Access)** — Ruled out · Cycle lag is the headline problem — staying on this stack means staying with the lag.




---

## External Guidance *(internal — not from the discovery itself)*

Pricing, delivery, and timeline guidance the brief author brought in from outside the source material — Salesforce, prior calls, account-team tribal knowledge. Treat as high-trust internal context for sizing decisions; do not quote verbatim to the customer.

### Account economics

- **ACV:** $340K (FY26)
- **TCV:** $1.02M across the current 3-year term (FY25–FY27)
- **Contract term:** 3-year platform agreement, mid-term
- **Renewal window:** Q3 FY27 — formal renewal review begins April 2027; account team wants services momentum visible by then
- **License footprint:** Standard tier with HIPAA-eligible environment, ~250 user seats provisioned (active usage closer to 80), AI Service add-on not yet purchased, ACE support package (80 hours/year) already included
- **Expansion potential:** Strong — Nadia Park's MSP team flagged for Year 1 ramp; AI Service add-on is the natural FY27 expansion lever once Solution 2's agentic validation proves credit pull-through; member-facing analytics products in Solution 3 open a use-case-billing conversation



### Pricing guidance

- **Rate posture:** Standard $275/hr blended consulting rate. Account team has not pre-cleared a discount and does not believe one is needed — PHA's existing license commitment and the late-June calendar pressure are the primary leverage points, not rate.
- **Discount authority:** Solutions Director (Mark Lees) has authority up to 10% on services for strategic accounts; anything beyond requires VP approval. Hold the line at standard rate unless the customer raises rate as a blocker.
- **Package preference:** Fixed-fee per solution preferred over T&M. Solution boundaries align with PHA's review cadence and make scope-change conversations cleaner if they arise mid-engagement.
- **Competitive pressure:** No active vendor competing for this scope — the competing solutions in the brief (custom rebuild, status-quo stack) are internal options, not external bidders. Rate negotiation should be framed against PHA's *internal* alternatives, not against a phantom competitor.
- **Target Total Investment:** $160K–$180K sweet spot; $200K ceiling. Account team's read is that anything above $200K triggers a procurement review cycle that would jeopardize the late-June Solution 1 go-live. Sizing should aim for the sweet spot with the AI-accelerated delivery model and use the high-end Total Investment as the ceiling commitment number on the proposal.
- **Notes:** PHA has historically priced consulting against an internal benchmark of ~$200/hr from prior vendors. The $275/hr rate has not been raised as a concern in any prior conversation — likely because the AI-accelerated hour count is materially lower than the traditional-integrator equivalent.



### Delivery guidance

- **Preferred model:** AI-accelerated solo Solutions Architect lead (Anika Patel) with Marcus Brown retained as the Solution 1 technical resource and Mark Lees as part-time Solutions Director / engagement architect. No full pod; PHA's data team has the capacity to absorb a leaner delivery shape and the SOW math leans on AI-acceleration.
- **Team composition:** Marcus Brown must stay on Solution 1 — he owns the existing POC scaffolding and the relationship with Aaron Cole's Data 360 logic. Anika Patel is the right SA for the agentic validation work in Solution 2 (recent comparable build at a sister healthcare association). Avoid rotating the SA mid-engagement; Maya Chen explicitly values continuity.
- **Phasing preference:** Solution 2 overlaps with Solution 1 UAT (weeks 4–12) — enables agentic validation to come online concurrent with the broader pilot rollout rather than serializing. Solution 4 (non-PHI forms) holds until Solution 1 is stable per Maya's 'one transition, not two' principle.
- **Customer capacity:** PHA's data team is capable but stretched. Aaron Cole is single-threaded on the QHR taxonomy work. David Reeves can sponsor but cannot operate day-to-day. Plan for ~4–6 hours/week of customer-side capacity per solution, not 10+. Enablement and knowledge transfer must be embedded continuously — a final-week handoff workshop will not stick.
- **Notes:** Account team's strong preference is for in-person kickoff in San Francisco (PHA HQ) — Maya and David both place high value on face time at engagement start. Budget travel for one consultant for kickoff.



### Timeline guidance

- **Target start:** Late May 2026 — within one week of contract execution. Account team is positioning May 15 as the contract execution target.
- **Must finish by:** End of November 2026 — full five-solution engagement. Solution 1 hard finish: late June 2026 to avoid directing members to interim SharePoint.
- **Blackout periods:** PHA's annual member conference is mid-September 2026 — Maya and David are unavailable that week and the Solution 3 dashboard rollout should not coincide with conference week. Late-November US holidays compress the Solution 5 close.
- **Sequencing constraints:** AMS replacement project (separate vendor selection) is in flight at PHA and concludes Q4 2026 — SSO planning in Solution 5 must remain *planning only* (not implementation) until AMS vendor is selected. Do not let SSO scope creep ahead of PHA's AMS decision.
- **Notes:** Contract execution by May 15 is genuinely calendar-driven, not artificially urgent — slipping it past late May means Solution 1 cannot hit the late-June member-facing window.



### Anecdotal context

Maya Chen and David Reeves are aligned and trust each other — that's unusual and load-bearing for the engagement. Don't engineer scope decisions that force them to negotiate with each other; bring decisions to them as a unified pair. Maya is the executive sponsor and the harder review on member experience; David is the operational champion and the easier review on technical scope. Aaron Cole is friendly but quiet — his contribution will be Solution 2 architecture review and crosswalk hand-off, not co-design. Nadia Park's MSP team has informally flagged interest in operating the Solution 5 quality intelligence engine as part of the Year 1 ramp; that's a separate engagement we should not surface in the implementation SOW but should keep teed up for a follow-on conversation. PHA leadership has recently lost two member organizations to a competing healthcare association over reporting timeliness — the 12–18 month lag isn't an abstract concern, it's tied to real renewal risk for PHA's own membership business.



---

## Stakeholder Dynamics

**Decision criteria mentioned:**

- Solution 1 go-live before next collection cycle (calendar-pressured)
- Member experience preserved through transition — Mia's red line
- One transition, not two — Derek confirmed this principle
- Foundation PHA's team can operate independently long-term
- Reusable architecture — Solution 1 patterns must scale into Solutions 2–5 without rebuild



**Concerns and objections raised:**

- Members are PHA's customers — any friction during the transition is unacceptable
- Long-tenured members have years of context with how PHA operates; communication must acknowledge the change rather than minimize it
- Data team needs to become self-sufficient — implementation should teach, not just deliver
- Dual-login experience while AMS replacement is pending is a known interim friction



**Internal dynamics:** Mia and Derek are aligned on the strategic outcome and on the 'one transition, not two' principle. Mia leads on member experience and change management; Derek leads on technology and team capability. Aaron Cole's tribal knowledge is a Solution 2 dependency. Nadia Park's MSP team will present separately as a complementary engagement during Year 1 ramp.



---

## Key Quotes


> PHA is a member-facing organization and member experience cannot be compromised.

— **Maya Chen**, SVP, Quality & Compliance *(Pushing back on any sequenced rollout that risks member friction during transition.)*


> We tell members once. Here is the new platform, and here is how you will submit data going forward. No interim step, no second announcement when Domo is ready.

— **Maya Chen**, SVP, Quality & Compliance *(Establishing the 'one transition, not two' principle.)*


> The goal is for the data team to become self-sufficient.

— **David Reeves**, Sr. Director, Technology *(Setting expectation for Domo's role as enabler, not perpetual operator.)*


> We're producing a 2024 QHR report in early 2026. That's the gap our members are talking about.

— **David Reeves**, Sr. Director, Technology *(Quantifying the reporting cycle lag and member feedback that's driving leadership's prioritization.)*



---

## Open Questions

The following could not be determined from the source material and need to be resolved before (or during) proposal drafting:

- **Scope:** Are there other non-PHI data types beyond PMPM, Financial Ratios, Staffing, and Quality/Compliance that PHA collects annually? Solution 4 assumes these four are the complete set.
- **Stakeholders:** Who will be PHA's designated internal project lead day-to-day? Mia and Derek are executive sponsors; the operational lead has not been named.
- **Scope (blocking):** Has PHA confirmed which 5–10 member orgs will be the Solution 1 pilot cohort? Pilot selection drives the kickoff calendar.
- **Technical:** What's the exact embedding mechanism for phaonline.org — iframe, JS embed, or full-page redirect? Affects Solution 1 architecture detail but not LOE.
- **Scope:** Are the 50 Tableau visuals listed (36 PMPM + 14 Financial Ratio) the complete migration set, or does PHA have additional dashboards beyond those two reports? Solution 4 LOE assumes the 50.
- **Commercial:** Is the rate negotiation expected to apply to all solutions at $275/hr, or are there volume-based or solution-specific adjustments PHA wants to discuss?
- **Current state:** How many distinct EHR vendors does the long tail of 12 (beyond Big 3) include? Solution 5 LOE assumes 12 routing rule sets — exact list affects scope.
- **Client:** Does PHA have public commitments (regulatory, accreditation, or member-facing) tied to QHR reporting cadence that should inform the Solution 1 deadline beyond the late-June target?



---

## Brief Author Notes

The March 18 review surfaced the 'one transition, not two' principle as the operational anchor for the rollout. This shifted Solution 1 scope from 'QHR + non-PHI forms' to 'QHR only' so the immediate priority hits late-June without forcing members through the interim SharePoint site. The non-PHI work moves to Solution 4 (Weeks 14–21). This sequencing is the most important scope decision in the brief and should be reinforced explicitly in the SOW's Executive Summary.


---

*Generated by `domo-discovery-brief` v0.3.0. Once reviewed and approved, this brief feeds directly into `domo-interactive-proposal-builder` as starting context — invoke the proposal builder with this JSON file in hand.*
