---
name: adoption-roadmap
tier: 1
description: "Generate a PS Adoption Roadmap presentation for a Domo customer account. Triggers on 'adoption roadmap for [account]', 'create roadmap for [account]', 'build a roadmap for [company]', 'adoption roadmap [company]', or any request to generate, create, or build an adoption or value roadmap for a specific account. Also trigger when the user mentions 'roadmap' alongside a company or account name. Use this skill proactively whenever the context involves creating an adoption plan deck for a customer."
maturity: alpha
audience: [delivery]
---

# PS Adoption Roadmap Generator

Build a polished, data-driven Adoption Roadmap PPTX for any Domo customer account by pulling live data from Compass and populating a branded template.

## Workflow Overview

1. **Identify the account** — Extract the account name from the user's request
2. **Pull account data** — Query Compass/Domo for portfolio, health, calls, and actions + web research for tech stack
3. **Select the template** — Default: `templates/adoption/Adoption_Roadmap_Templatev2.pptx`
4. **Trim and reorder** — Remove example/appendix slides, reorder to final 20-slide structure
5. **Edit slides** — Customize each slide with account data using python-pptx and raw XML
6. **QA** — Visual inspection and content verification
7. **Deliver** — Save to workspace and present to user

## Step 1: Gather Account Data

Use Compass/Domo tools to pull everything you need. Run these in parallel:

```
portfolio_lookup(account_name, fields="identity,renewal,health,pacing,signals,team,segmentation,services,financial,adoption")
actions_lookup(account_name)
calls_lookup(account_name, limit=5)
hg_summary_lookup(account_id)  # get account_id from portfolio_lookup → bks_account_id
hggrades_lookup(account_id)
web_search("{account_name} tech stack")  # for enterprise systems slide
```

If Compass tools are unavailable, ask the user to provide:
- Company name, industry, headcount, revenue estimate
- Current Domo usage (MAU, power users, card views, key use cases)
- Business goals and priorities
- Key contacts and stakeholders
- Known challenges or blockers

### Key Data Points to Extract

From **portfolio_lookup**:
- Company name, industry, segment, ownership
- Headcount, estimated revenue
- Health grade, GPA, health trend
- Renewal date, ARR, days to renewal
- Credit pacing, credits allocated vs consumed
- MAU, power users, card views, cards created, dataflows
- CSM, AE, SC names
- Risk and growth signals
- Active projects, billable hours remaining

From **calls_lookup**:
- Recent meeting topics, action items, sentiment
- Key stakeholder names and roles mentioned
- Technology initiatives discussed (tools being replaced, new capabilities desired)

From **actions_lookup**:
- Recommended de-risk and growth actions
- Plays with priority and urgency

From **hggrades_lookup**:
- Per-category health grades (Commercial, Value Realization, Relationship, Education, etc.)
- Trends (30/90/180 day changes)

From **web_search** (tech stack):
- Cloud hosting (AWS, GCP, Azure)
- Source systems by department (CRM, ecommerce, databases, marketing tools)
- Data movement tools (Kafka, Boomi, MuleSoft, etc.)
- CDW/Data Lakes (Snowflake, Redshift, Databricks, BigQuery)

## Step 2: Template Trimming and Reordering

**Default template path:** `templates/adoption/Adoption_Roadmap_Templatev2.pptx`

The template has 25 slides. We trim to 20 and reorder:

### Trimming (Remove 5 slides)

Remove slides 21, 22, 23, 24, and 25 from `<p:sldIdLst>` in the presentation element. These are example/appendix slides.

```python
from pptx import Presentation
from lxml import etree

prs = Presentation('template.pptx')
ns = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
pres_elem = prs.part._element
sldIdLst = pres_elem.find('.//p:sldIdLst', ns)
sldIds = sldIdLst.findall('p:sldId', ns)

# Remove in reverse order to preserve indices
for idx in [24, 23, 22, 21, 20]:  # 0-indexed: slides 25,24,23,22,21
    sldIdLst.remove(sldIds[idx])

prs.save('trimmed.pptx')
# Re-save to normalize
prs2 = Presentation('trimmed.pptx')
prs2.save('trimmed.pptx')
```

### Reordering (Move Enterprise Systems to slide 16)

After trimming, slide 20 (Customer Enterprise Systems) needs to move to position 16, shifting slides 16-19 down by one:

```python
prs = Presentation('trimmed.pptx')
pres_elem = prs.part._element
sldIdLst = pres_elem.find('.//p:sldIdLst', ns)
sldIds = list(sldIdLst.findall('p:sldId', ns))

# Move index 19 (Enterprise Systems) to index 15 (slide 16 position)
ent_systems = sldIds[19]
sldIdLst.remove(ent_systems)
remaining = list(sldIdLst.findall('p:sldId', ns))
sldIdLst.insert(list(sldIdLst).index(remaining[15]), ent_systems)

prs.save('reordered.pptx')
prs2 = Presentation('reordered.pptx')
prs2.save('reordered.pptx')
```

### Final 20-Slide Structure

| Slide | Content | Customize? | Data Source |
|-------|---------|-----------|-------------|
| 1 | Title | YES | portfolio_lookup |
| 2 | Company Overview | YES | portfolio_lookup, web research |
| 3 | Key Events | YES | calls_lookup, actions_lookup |
| 4 | Value Roadmap (divider) | No | — |
| 5 | Speed to Value | No | — |
| 6 | Use Case Depth | No | — |
| 7 | Most Implemented Use Cases | No | — |
| 8 | Umbrella Use Cases | No | — |
| 9 | Use Case Services | No | — |
| 10 | Business Goals | YES | calls_lookup, actions_lookup |
| 11 | Current State Assessment | YES | hg_summary, hggrades, portfolio |
| 12 | Use Case & Quick Hit Summary | YES | actions_lookup, calls_lookup |
| 13 | Project Brainstorming | YES | Synthesized |
| 14 | Value Roadmap | YES | Synthesized |
| 15 | Architecture Mapping (divider) | No | — |
| 16 | Customer Enterprise Systems | YES | calls_lookup, web research |
| 17 | Domo Data Flow | YES (rebuild) | portfolio_lookup, calls_lookup, web |
| 18 | Customer Feature Map | No | — |
| 19 | Thank You | No | — |
| 20 | Internal LOE | YES | Calculated |

**Slides that MUST be customized:** 1, 2, 3, 10, 11, 12, 13, 14, 16, 17, 20

## Step 3: Edit Slides

Use python-pptx for all editing. For complex slides (13, 14, 17), build shapes via raw XML using `lxml.etree.SubElement` on the slide's `_spTree`.

### Font Standard: Open Sans (MANDATORY)
All text MUST use Open Sans:
- python-pptx: `run.font.name = "Open Sans"` on every run
- XML: `<a:latin typeface="Open Sans"/>` in `<a:rPr>` elements
- "Open Sans ExtraBold" for titles/headers only
- Never use Calibri, Arial, or any other font

### Theme Accent Colors (from template)
These colors are used consistently across slides 13, 14, and 17:
- accent1: #99CBED (blue)
- accent2: #FF8721 (orange)
- accent3: #8247AD (purple)
- accent4: #BF17A1 (magenta)
- accent5: #F478C3 (pink)
- accent6: #5B89B3 (dark blue)

---

### Slide 1 (Title)
- Replace "COMPANY NAME" with account name
- Update date

### Slide 2 (Company Overview)
- "Who They Are" — 2-3 sentences: industry, specialization, key clients, headquarters
- "Where They're Going" — 2-3 sentences: strategic direction with Domo
- Fast Facts: Industry/Segment, Founded/Ownership, Headcount, Estimated Revenue

### Slide 3 (Key Events Timeline)
**CRITICAL: This slide uses Rectangle shapes, NOT tables.** The timeline events are in Rectangle shapes (named "Rectangle 8", "Rectangle 11", "Rectangle 14", "Rectangle 17", "Rectangle 19") and date circles are inside Group shapes (named "Group 3", "Group 4", "Group 9", "Group 10", "Group 28").

- Pull 3-5 significant events from the last 6-12 months
- Each Rectangle has 3 paragraphs: Title (bold), Description, Date
- Date circles are inside Group shapes — iterate `shape.shapes` to access child text frames
- To find the rectangles: `for shape in slide.shapes: if shape.name.startswith('Rectangle') and shape.has_text_frame`
- To find date groups: `for shape in slide.shapes: if shape.shape_type == 6 (GROUP)`

### Slide 10 (Business Goals)
- 3-5 business goals from call recaps and actions
- Table: 5 columns (Goals | Domo Initiatives | Responsible Persons | Timeline | Status)
- **IMPORTANT: Column 0 has multi-paragraph structure:**
  - Para 0: Goal name (bold)
  - Para 1: (empty spacer)
  - Para 2: "Value Achieved When: " + value statement
  - Para 3+: (empty)
- Do NOT flatten — preserve multi-paragraph structure
- Status column (col 4): "In Progress", "Planning", or "Discovery"
- Use `cell.text_frame.paragraphs` to set each para individually

### Slide 11 (Current State Assessment)
- Column 1 (Strong Foundation): Platform usage stats, what's working well
- Column 2 (Modernization Efforts): Transitions, integration plans
- Column 3 (UX & Data Quality): Dashboard governance, data trust

### Slide 12 (Use Case & Quick Hit Summary)
- 5 prioritized use cases
- Table: 5 columns (Priority | Use Cases | Challenge | Persons | Timeline)
- **IMPORTANT: Column 1 has multi-paragraph structure:**
  - Para 0: Use case name (bold)
  - Para 1: (empty spacer)
  - Para 2: "Value Achieved When Completed: " + value statement
  - Para 3: (empty)
- Do NOT flatten — preserve multi-paragraph structure

### Slide 13 (Project Brainstorming Matrix)
Plot use cases from slides 12/14 on the Value (Y) vs Ease of Implementation (X) quadrant.

**Remove template placeholders first:**
- Delete all `Rounded Rectangle` shapes with "Use Case" text
- Delete "TextBox 16" (Enables label) and "Straight Arrow Connector 5"
- Use `sp_tree.remove(shape._element)`

**Quadrant coordinate system:**
- X axis: left=1280310 (Hard) to right=10867930 (Easy)
- Y axis: top=941565 (High value) to bottom=5576940 (Low value)
- Position as (x_fraction, y_fraction) where 0,0 = Hard/High and 1,1 = Easy/Low

**Color matching** (matches slide 14 columns, left to right):
- Column 1: accent5 #F478C3 (pink)
- Column 2: accent4 #BF17A1 (magenta)
- Column 3: accent3 #8247AD (purple)
- Column 4: accent2 #FF8721 (orange)
- Column 5: accent1 #99CBED (blue)
- Tint formula for box fill: `color * 0.35 + 255 * 0.65`
- Border: 1pt solid in full accent color

**Box specs:** 1600000 x 700000 EMU, `roundRect` preset, bold 9pt (sz=900) Open Sans, centered, dark #1C1C1C text.

**Placement guidelines:**
- Quick wins (low effort, fast ROI): top-right quadrant
- Core analytics (existing data): upper-right
- Integration projects: upper-center
- Complex multi-system: upper-left
- New platform onboarding: middle-left

### Slide 14 (Value Roadmap)
Populate the 5-column phased timeline.

**Template structure:** 5 background Rectangles + 5 Group shapes. Each Group contains:
- Child 0: Straight Connector (colored bar)
- Child 1: TextBox (date range)
- Child 2: TextBox (content: name, persona, value, enablement)

**Title:** Change "VALUE ROADMAP EXAMPLE" → "VALUE ROADMAP"

**CRITICAL: Group shapes cannot be edited via python-pptx `.text` — use raw XML:**
```python
ns = {'p': '...presentationml...', 'a': '...drawingml...'}
grpSps = slide._element.findall('.//p:grpSp', ns)
# Sort by x position for left-to-right order
groups = sorted(grpSps, key=lambda g: int(g.find('.//a:off', ns).get('x', 0)))
```

**Content textbox rebuild** (remove all `<a:p>`, add new):
- Use Case Name (bold, sz=1200)
- Empty spacer
- Persona: {name} (bold, sz=1000)
- Value: {statement} (bold, sz=1000)
- Enablement Resources: {list} (regular, sz=1000)

**Column-to-accent mapping** (left to right): accent5, accent4, accent3, accent2, accent1

**Gotchas:**
- Use plain `&` in Python strings — lxml handles XML escaping
- Do NOT use `\n` in names — let text wrap naturally
- Dates chronological left to right (Q1-Q2 left, Q3-Q4 right)

### Slide 16 (Customer Enterprise Systems)
Uses the template's existing table structure. Edit via python-pptx tables.

- Title: "ARCHITECTURE : CUSTOMER ENTERPRISE SYSTEMS"
- **Hosting Platforms:** Cloud providers (AWS, Azure, GCP)
- **Source Systems table** (7 columns): Operations, Marketing, Finance, Sales, Manufacturing, Security/IT, Other
- **Operational Data Movement:** Kafka, Boomi, MuleSoft, etc. or "TBD"
- **Automation & Orchestration:** Workflow tools or "TBD"
- **Right-side Domo stack:**
  - CDW/Data Lake: customer warehouses + Domo
  - Analytics ETL: Domo Magic ETL + any customer ETL
  - Analytics BI: Domo + legacy BI tools
  - Other Analytics Systems: Elasticsearch, Google Analytics, etc.
- Mark deprecated tools with asterisk (*)

### Slide 17 (Domo Data Flow) — REBUILD FROM SCRATCH
Clear ALL shapes except title and slide number, then build a pipeline flow diagram.

**3-tier layout:**
- **Top row:** 5 detail columns (Data Sources, Connectors, ETL Methods, Storage, Output Channels)
- **Center row:** 5 pipeline chevrons: INGEST → TRANSFORM → MODEL & STORE → ANALYZE → DISTRIBUTE
- **Bottom row:** Use Cases (color-matched) + key metrics bar

**Pipeline stage colors:**
- INGEST: #FF8721 (orange)
- TRANSFORM: #8247AD (purple)
- MODEL & STORE: #99CBED (blue)
- ANALYZE: #BF17A1 (magenta)
- DISTRIBUTE: #5B89B3 (dark blue)

**Title:** "{ACCOUNT NAME} : DOMO DATA FLOW"

**Construction:**
- Chevrons: `homePlate` preset geometry, evenly spaced across slide width
- "DOMO DATA EXPERIENCE PLATFORM" label centered below pipeline
- Detail columns: colored headers + item lists, connected by vertical arrows to pipeline
- Data Sources: 2-sub-column layout (handles many items)
- Use cases row: color-matched boxes (same colors as slides 13/14)
- Metrics bar: dark background (#1C1C1C) with stats in Domo blue (#99CBED)

**Populating columns:**
- **Data Sources:** From calls_lookup + web_search tech stack research
- **Connectors:** Cloud SaaS → Domo Cloud Connectors; On-prem → Workbench; Multi-cloud → Cloud Amplifier; Custom → REST API
- **ETL:** Magic ETL, SQL DataFlows, Adrenaline (Domo managed) + customer's own (custom scripts, streaming)
- **Storage:** Domo Warehouse + external (Snowflake, Redshift, BigQuery, Databricks)
- **Distribution:** Standard Domo channels (Dashboards, App Studio, Reports, Everywhere, MS Add-Ons, Custom Apps, Alerts)

### Slide 20 (Internal LOE)
- Estimate hours per workstream (training, dashboards, governance, data products, office hours)
- Sum to total

## Step 4: Clean and Normalize

After all edits, re-save through python-pptx to normalize relationships:

```python
from pptx import Presentation
prs = Presentation('edited.pptx')
prs.save('final.pptx')
```

This prevents PowerPoint repair errors from orphaned OOXML relationships.

## Step 5: QA

### Content QA
```bash
python -m markitdown final.pptx | grep -iE "xxxx|lorem|ipsum|Customer Name|COMPANY NAME|Use Case [0-9]|VALUE ROADMAP EXAMPLE"
```
Any leftover placeholder text must be replaced.

### Visual QA
Run `doc_qa(file_path="final.pptx")` to scan for leftover placeholders.
For visual inspection, convert to PDF if LibreOffice is available:
```bash
libreoffice --headless --convert-to pdf final.pptx
pdftoppm -jpeg -r 150 final.pdf slide
```
Inspect customized slides: **1, 2, 3, 10, 11, 12, 13, 14, 16, 17, 20**

### Common Issues
- Double-encoded ampersands (`&amp;` showing on slides) — use plain `&` in Python lxml
- Leftover "Value Achieved When:" labels with no value filled in
- Slide 3 events not populating (Rectangle shapes, not tables)
- Group shapes on slide 14 not updating (must use raw XML, not python-pptx `.text`)
- Text overflow in narrow table cells
- Wrong slide numbers after reordering

## Step 6: Deliver

Save to workspace and present:
```
cp final.pptx <workspace>/{AccountName}_Adoption_Roadmap.pptx
present_files([{"file_path": "<workspace>/{AccountName}_Adoption_Roadmap.pptx"}])
```

---

## Memory

### Before executing
- Call `memory_recall` or `memory_bundle` with scope **account**, **engagement-artifacts**, and **patterns-library** (adoption patterns), intent: adoption roadmap.

### After executing
- Call `memory_store_artifact` for **AdoptionRoadmap**; `memory_remember` with value narrative, phased priorities, and LOE highlights.
