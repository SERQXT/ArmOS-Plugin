# Discovery call prep — “already in their head”

Use in **stage H** (`06-discovery-handoff.md`) when drafting **internal consultant prep**, **engagement context app** copy, and aligning channels. The goal is **seamless conversation**: the consultant arrives understanding **their** problem, **our** interpretation, **what the demo proves**, and **exactly what to ask** so the next MVPs hit the mark.

## Principles

1. **Survey first** — Lead with what the customer **actually said** (fields, quotes). Then **our synthesis** — label inference vs evidence.  
2. **Outcome line** — One tight sentence: *we built this MVP to validate …* (ties to **`NORTHSTAR.md`**).  
3. **Show / don’t show** — Be blunt about gaps so nobody is embarrassed mid-call.  
4. **Probe, don’t interrogate** — Discovery areas are **themes + sample questions**, not a script.  
5. **Two channels** — **Internal email** (to sales/consultant — see below) + **engagement context app** (separate template app — see **`engagement-context-app-template.md`**). Same **substance**, different audience.

---

## Audiences (do not confuse)

| Channel | **To** | **Purpose** |
|---------|--------|-------------|
| **`DISCOVERY-EMAIL.md`** | **Sales / consultant (internal)** — not the end client | Prep them; links to **engagement context app** + **MVP1 app**. They may **miss** this email — **do not rely on it alone**. |
| **Engagement context app** | **Anyone** — client, new Domo consultant, expanded stakeholders | **Separate app** from MVP1; **zero assumed prior knowledge**. Backup when email wasn’t read. |
| **`DISCOVERY-HANDOFF.md`** | **Source of truth** | Master narrative; email + context app copy **derive** from here. |

---

## Content blocks (produce all that apply)

### A — Problem from the survey

| Element | Content |
|---------|---------|
| **Verbatim** | Short quotes or field values (with field names). |
| **Synthesis** | 2–4 bullets: what we believe the core problem is. |
| **Confidence** | High / medium / low per bullet; **what discovery must confirm**. |

### B — What we assumed (and built toward)

- Explicit **assumptions** (data, users, workflow, politics) — not hidden in prose.  
- How **`NORTHSTAR.md`** and **MVP1** reflect those assumptions.  
- **If we’re wrong**, what breaks — so the consultant can listen for disconfirming evidence.

### C — What MVP1 shows vs does not show yet

| Shows (demo-ready) | Does not show yet (honest) |
|----------------------|----------------------------|
| … | … |

Include **`MVP-built`** vs **`mock-teaser`** rows from **`BUILD-SPEC.md`** — mocks are **conversation starters**, not shipped features.

### D — Future build areas (for later MVPs)

Prioritized list: **area → why it matters → dependency** (data, org, tech). Ties to **upsell** without over-promising.

### E — Discovery Conversation Guide (canonical — use when drafting `DISCOVERY-HANDOFF.md`)

**Purpose:** Pre-sales discovery should align with this guide. **AEs and SEs may already train on these questions** — generated briefs still need to **apply** them: what the call must accomplish, what to ask, and how questions **thread from the customer’s form answers**. Tone: **partners talking**, not a technical intake.

When drafting section 5 of the handoff, **build on** the survey, NORTHSTAR, and MVP notes — rephrase questions in the customer’s vocabulary; **do not** output a flat list of 15 generic prompts unless tailored.

---

#### Following the story

1. **Winning vs today** — They described what winning looks like — walk through what happens **today** from the moment someone needs this information to the moment something actually gets done about it.  
   *Surfaces: current state, process flow, pain points.*

2. **Where people go** — Who uses this on a typical day — when they need this data **right now**, where do they go? Report someone sends, system they log into, spreadsheet pulled together?  
   *Identifies data sources and SaaS displacement candidates.*

3. **Hero metric effort** — That hero metric — roughly how much time does someone spend pulling that number together each week, and how many people touch it along the way?  
   *Quantifies manual effort and ROI inputs.*

#### Understanding the flow of work

4. **Handoffs and bottlenecks** — How does this work move through the team — who kicks it off, who touches it next, where does it slow down or sit waiting?  
   *Maps operational workflow — handoffs, bottlenecks, automation candidates.*

5. **How misses surface** — When something gets missed or delayed, how does someone find out — notification, or only when it’s already a problem?  
   *Operational risk and cost of failure.*

6. **Information moving** — Steps where someone is basically moving information from one place to another — copy into email, update tracker, ping for status?  
   *Automation opportunities and process waste.*

#### Understanding the data

7. **Domo today vs new** — Is any of this information already in Domo, or are we bringing in something new?  
   *Domo readiness and prerequisite data work.*

8. **How many systems** — How many different places does the data live — one system or stitching several for the full story?  
   *Integration complexity.*

9. **Cadence** — Does this need to feel real-time through the day, or would a fresh view each morning be enough?  
   *Refresh requirements and architecture.*

#### Who owns it and who benefits

10. **Maintainer** — Once built, who keeps it going — filters, views, when things change? More comfortable with drag-and-drop or okay going deeper?  
    *Informs App Studio vs custom app and maintainer skill set.*

11. **Footprint** — How many people use this in a given week — immediate team or across departments?  
    *User count for ROI and adoption scope.*

12. **Expansion path** — If it works — saves time, replaces a tool, smooths the process — who above or beside them wants to see it? Who says “we need more of this”?  
    *Expansion buyer and champion path.*

#### Shaping what we build

13. **Displacement** — Is there a tool or subscription paid for today that this could make unnecessary — even if only the piece you actually use?  
    *Micro-SaaS displacement and hard-dollar savings.*

14. **Analytical vs operational** — Picture the finished app — team opens to check on things, or **works inside it** (submit, approve, move work forward)?  
    *Analytical vs operational; build complexity.*

15. **Acceptance bar** — If we put a working version in front of you next week, what’s the **one thing** it has to do for you to say “yes, this is it — and I want to show my boss”?  
    *Locks acceptance criteria; seeds champion selling upward.*

---

#### What these questions extract (internal reference for brief authors)

Use this mapping when writing **“listen for”** cues and the **show vs don’t show** table — not as copy-paste for the client.

- **1–3:** Current state, process, manual effort — without sounding like an audit.  
- **4–6:** Operational workflow — handoffs, bottlenecks, automation candidates.  
- **7–9:** Data sources and Domo readiness.  
- **10:** Maintainer skill → App Studio vs custom app.  
- **11–12:** User count, expansion buyer, ROI inputs.  
- **13:** Micro-SaaS displacement and hard savings.  
- **14:** Analytical vs operational; build complexity.  
- **15:** Acceptance criteria; champion path upward.

---

#### How to translate into `DISCOVERY-HANDOFF.md` section 5

- For each **block** (Following the story → … → Shaping what we build), provide **2–4 tailored questions** derived from the numbered prompts above, tied to **this** customer’s survey fields and MVP.  
- Add **listen-for** bullets: what answers imply for scope, risk, data work, or build type.  
- Aim for **roughly 10–18 total probes** across the call — enough to steer, not a script to read line-by-line.  
- Keep **partner tone**; avoid interrogation or internal jargon.

### F — Internal email pack (`DISCOVERY-EMAIL.md`) — **to sales/consultant**

Draft **paste-ready sections** for an email **to the consultant or sales owner**, **not** to the customer:

- **To:** (role) — e.g. “Account consultant / sales lead”  
- **Subject line** idea — internal, scannable  
- **Opening** — what this engagement is, link to **handoff doc**  
- **Two links** — (1) **Engagement context app** (template — discovery content), (2) **MVP1 app** (functional demo)  
- **What we heard (from survey)** — 2–3 bullets  
- **What we built / what MVP shows vs doesn’t**  
- **Discovery: what to probe** — top themes from the **Discovery Conversation Guide** (section E), tailored to this account — not a full repeat of the handoff  
- **If you didn’t read this** — *“Open the engagement context app first — same story; then Tab 2 / scroll to MVP.”*

Tone: **internal teammate**, crisp, respectful of their time.

---

## Engagement context app (separate from MVP1)

This is **not** inside the MVP1 codebase. See **`engagement-context-app-template.md`**: **pre-built** org template, **two layout options** (stacked page or **App Studio Tab 1** = context, **Tab 2** = MVP1). **H** fills **`ENGAGEMENT-CONTEXT-COPY.md`** (discovery section). **G2** UX-passes the context app as **first impression**.

---

## Anti-patterns

- Embedding context UI **inside** the MVP1 app build — use **sibling** template app instead.  
- Sending **`DISCOVERY-EMAIL.md`** to the **client** as-is — it’s **internal prep**.  
- Walls of text — **skimmable** beats complete; assume **rotating audience** with **no prior context**.  
- **Drift** between handoff, email, and context app — **H** is single source of truth.
