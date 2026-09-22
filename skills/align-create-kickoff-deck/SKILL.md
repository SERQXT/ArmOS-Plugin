---
name: align-create-kickoff-deck
tier: 1
description: "Generate a customized Project Kickoff presentation (PPTX) for a Domo PS engagement using the standard kickoff template. Pulls live account data from Compass MCP tools, Salesforce opportunities, SPP project assignments, web research, and Gong calls to populate the deck with real team members, scope, timeline, support packages, and methodology slides. Automatically removes irrelevant slides (wrong tier, wrong support package, asset/appendix slides). Trigger with 'kickoff deck for [account]', 'create kickoff presentation for [customer]', 'project kickoff slides for [account]', 'build kickoff deck for [account]', 'kickoff pptx for [account]', or any request to create a kickoff slide deck or presentation for a PS engagement. Also trigger when the user says 'align-create-kickoff-deck' or mentions creating a kickoff deck alongside a company or account name. This is distinct from 'kickoff-brief' which produces a markdown document — this skill produces the actual PPTX presentation file."
maturity: alpha
audience: [delivery, intelligence]
pipeline:
  phase: align
  sub_phase: planning-and-kickoff
  position: 5
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: kickoff-brief
      required: false
      data: engagement context, success criteria, team roster
    - agent: offering-matchmaker
      required: false
      data: package selection, engagement tier
    - agent: solution-architect
      required: false
      data: technical approach
  outputs:
    - name: kickoff-deck
      format: pptx
      downstream:
        - agent: alignment-gate
  data_sources:
    - tool: portfolio_lookup
      required: true
    - tool: sfopportunities_lookup
      required: true
    - tool: spp_project_assignments_lookup
      required: true
    - tool: hggrades_lookup
      required: false
    - tool: calls_lookup
      required: false
    - tool: WebSearch
      required: false
  phase_gate: false
---

# Project Kickoff Deck Generator

Produces a polished, customer-ready Project Kickoff PPTX by pulling live data from Compass MCP tools and populating the standard Domo PS kickoff template. The template has 46 slides covering multiple engagement tiers and support packages — this skill selects only the relevant slides for the specific engagement and fills in all placeholder content with real account data.

## How It Works

```
User says: "kickoff deck for [Account]"
        |
   +---------+----------+---------+---------+
   |         |          |         |         |
Portfolio  SF Opps   SPP Assign  Calls   Web Research
   |         |          |         |         |
   +---------+----------+---------+---------+
        |
   Determine engagement parameters:
   - Tier (Kickstarter/T3/T2/T1/Enterprise)
   - Hours purchased
   - Support package (Std/Bronze/Silver/Gold/Plat/Diamond)
   - Domo team members & roles
   - Customer contacts
        |
   Select slides → Remove irrelevant ones
        |
   Populate each slide with real data
        |
   QA → Deliver PPTX
```

## Step 1: Gather Account Data

Run these MCP calls in parallel to collect everything needed:

```
portfolio_lookup(account_name, fields="all")
  → Account name, ARR, segment, CSM, AE, renewal, health, products

sfopportunities_lookup(account_name, type="Upsell")
  → Recent PS opportunity: hours, ACV, stage, type
  Also try: sfopportunities_lookup(account_name) for all opps

spp_project_assignments_lookup(account_name, project_active="Yes")
  → Active project team: consultant names, roles, tasks, allocation

spp_lookup(account_name)
  → Project hours purchased, hours remaining, project names

calls_lookup(account_name, limit=5)
  → Recent Gong calls for context, stakeholder names mentioned

hggrades_lookup(account_id)
  → Health baseline (get account_id from portfolio_lookup → bks_account_id)

WebSearch("[Account Name] company overview")
  → Industry context, recent news, company size
```

### Key Data Extraction Map

| Data Needed | Primary Source | Fallback |
|-------------|---------------|----------|
| **Customer name** | portfolio_lookup → bks_account_name | User input |
| **Engagement tier** | sfopportunities_lookup → opportunity details, SOW | User input |
| **Hours purchased** | spp_lookup → project_hours_purchased | SF opp ACV estimate |
| **Support package** | portfolio_lookup → support fields | User input |
| **Domo team - Consultants** | spp_project_assignments_lookup → user_name, role | User input |
| **Domo team - AE** | portfolio_lookup → bks_ae | — |
| **Domo team - CSM** | portfolio_lookup → bks_csm | — |
| **Customer contacts** | calls_lookup → attendees, stakeholder-map | User input |
| **Project scope/goals** | sfopportunities_lookup → opp name + calls_lookup recaps | User input |
| **Timeline** | spp_lookup → project_start_date, hub_hours_expiration_date | Estimate from hours |
| **Industry/company info** | WebSearch + portfolio_lookup | User input |

### Engagement Tier Detection

Determine the tier from the SF opportunity and hours:

| Tier | Typical Hours | SOW Indicators |
|------|--------------|----------------|
| **Kickstarter (T4)** | 20-40 hrs | "Kickstarter" in opp name, use case deployment or feature enablement |
| **Tier 3** | 40-150 hrs | Smaller scope, fewer use cases |
| **Tier 2** | 150-500 hrs | Multiple use cases, connections + dashboards |
| **Tier 1** | 500-1000+ hrs | Large enterprise, complex data strategy |
| **Enterprise (T1+)** | 1000+ hrs | Custom slides needed, reach out for support |

If the tier can't be determined automatically, ask the user.

### Support Package Detection

**This is critical** — you must include exactly one support slide and delete the other five. Check these sources in order:

1. **`portfolio_lookup` → `support_package` field** — most reliable, comes directly from Compass
2. **SF opportunity description** — may mention "Standard", "Silver", "Gold", etc.
3. **`calls_lookup` recaps** — may mention package in sales context
4. **Default**: If no data is found, assume **Standard** (most common for new engagements)

**Package → Slide mapping (keep one, delete all others):**

| Package | Keep | Delete |
|---------|------|--------|
| Standard | slide10.xml | slides 11, 12, 13, 14, 15 |
| Bronze | slide11.xml | slides 10, 12, 13, 14, 15 |
| Silver | slide12.xml | slides 10, 11, 13, 14, 15 |
| Gold | slide13.xml | slides 10, 11, 12, 14, 15 |
| Platinum | slide14.xml | slides 10, 11, 12, 13, 15 |
| Diamond | slide15.xml | slides 10, 11, 12, 13, 14 |

⚠️ **Never include more than one support slide in a customer deck.** Standard is the most common package for new engagements — when in doubt, use Standard and note the assumption for the user.

### Scope Slide Selection (by Tier)

Similarly, keep only the relevant scope slides:

| Tier | Keep | Delete |
|------|------|--------|
| T4 (Kickstarter) | slide16.xml | slides 17, 18, 19 |
| T2 | slides 17 + 18 | slides 16, 19 |
| T3 | slide18.xml only | slides 16, 17, 19 |
| T1 | slides 17 + 19 | slides 16, 18 |

### Workshop Schedule Selection (by Tier)

| Tier | Keep | Delete |
|------|------|--------|
| T1 or T2 | slide22.xml | slide23.xml |
| T3 | slide23.xml | slide22.xml |
| T4 | neither | slides 22, 23 |

## Step 2: Template Slide Map and Selection

**Template location:** `assets/TEMPLATE_Project_Kickoff.pptx` (bundled with this skill)

The template has 46 slides. The table below shows every slide, its purpose, and which engagement contexts it applies to.

Read `references/slide-map.md` for the complete slide-by-slide map with XML shape names and editing instructions for each slide.

### Slide Retention Logic

**Always keep** (all engagements):
- Slide 1: Title
- Slide 4: Your Domo Team
- Slide 8: Education: Role-based Learning
- Slide 20: Implementation Process
- Slide 25: Communication Tools
- Slide 32: How Hours Are Consumed

**Keep one agenda** (based on hours):
- Slide 2: Agenda (projects over 150 hours) — if hours >= 150
- Slide 3: Agenda (projects under 150 hours) — if hours < 150

**Keep one support package slide** (based on customer's package):
- Slide 10: Standard
- Slide 11: Bronze
- Slide 12: Silver
- Slide 13: Gold
- Slide 14: Platinum
- Slide 15: Diamond

**Keep one or two scope slides** (based on tier):
- Slide 16: Kickstarters (Tier 4)
- Slide 17: Tier 1 & 2 (connections & dashboards)
- Slide 18: Tier 2 & 3 (hours table + goals)
- Slide 19: Tier 1 Enterprise (custom — placeholder)

**Keep the right workshop schedule**:
- Slide 22: First Mile Workshops — Tier 1 & 2
- Slide 23: First Mile Workshops — Tier 3

**Keep based on engagement complexity**:
- Slide 5: Customer Extended Team — if Tier 1 or 2 (larger engagements)
- Slide 6: Customer Core Project Team — always for Tier 1-3
- Slide 7: Customer Team Key Roles table — always keep
- Slide 21: Implementation Process by Phases — if Tier 1-3
- Slide 24: Proposed Timeline — always keep
- Slide 26: Next Steps — always keep
- Slide 33: Success Criteria — if Tier 1-3
- Slide 34: Next Steps (detailed) — optional, can replace slide 26

**Always remove** (asset/reference slides not for customer delivery):
- Slide 9: Service & Education Package overview (reference only)
- Slide 27: Appendix divider
- Slides 28-31: Workshop detail appendix slides
- Slide 35: Domo PowerPoint Assets header
- Slides 36-46: Domo logos, colors, icons (internal assets)

### Slide Selection Algorithm

```python
def select_slides(hours, tier, support_package):
    # ALWAYS KEEP
    keep = [1, 4, 7, 8, 20, 24, 25, 26, 32]

    # AGENDA — pick one based on hours
    if hours >= 150:
        keep.append(2)   # >150 hrs agenda
        # delete: slide3.xml
    else:
        keep.append(3)   # <150 hrs agenda
        # delete: slide2.xml

    # TEAM STRUCTURE — based on tier
    if tier in ['T1', 'T2']:
        keep.extend([5, 6])   # Extended Team + Core Team
    elif tier in ['T3', 'T4']:
        keep.append(6)        # Core Team only
        # delete: slide5.xml

    # SUPPORT PACKAGE — keep exactly one, delete the other 5
    pkg_map = {'Standard': 10, 'Bronze': 11, 'Silver': 12,
               'Gold': 13, 'Platinum': 14, 'Diamond': 15}
    pkg_slide = pkg_map.get(support_package, 10)  # default: Standard
    keep.append(pkg_slide)
    # delete: all slides 10-15 EXCEPT pkg_slide

    # SCOPE SLIDES — based on tier
    if tier == 'T4':
        keep.append(16)
        # delete: slides 17, 18, 19
    elif tier == 'T1':
        keep.extend([17, 19])
        # delete: slides 16, 18
    elif tier == 'T2':
        keep.extend([17, 18])
        # delete: slides 16, 19
    elif tier == 'T3':
        keep.append(18)
        # delete: slides 16, 17, 19

    # WORKSHOP SCHEDULE — based on tier
    if tier in ['T1', 'T2']:
        keep.append(22)
        # delete: slide23.xml
    elif tier == 'T3':
        keep.append(23)
        # delete: slide22.xml
    else:  # T4
        pass  # delete: slides 22, 23

    # METHODOLOGY PHASES + SUCCESS CRITERIA — for Tier 1-3
    if tier in ['T1', 'T2', 'T3']:
        keep.extend([21, 33])
    # else (T4): delete slides 21, 33

    # ALWAYS DELETE — reference slides, appendix, asset slides
    # delete: slides 9, 27, 28, 29, 30, 31, 34, 35-46

    return sorted(set(keep))

# Example: Fogo de Chao — Tier 2, 467 hours, Standard support
# select_slides(467, 'T2', 'Standard')
# → keeps: [1, 2, 4, 5, 6, 7, 8, 10, 17, 18, 20, 21, 22, 24, 25, 26, 32, 33]
# → 18 slides in final deck
```

**After running the algorithm, generate a checklist before touching any XML:**

```
Tier: T2 | Hours: 467 | Support: Standard
────────────────────────────────────────────
KEEP:   slides 1, 2, 4, 5, 6, 7, 8, 10, 17, 18, 20, 21, 22, 24, 25, 26, 32, 33
DELETE: slides 3, 9, 11, 12, 13, 14, 15, 16, 19, 23, 27, 28, 29, 30, 31, 34, 35–46
────────────────────────────────────────────
```

Show this checklist to the user before proceeding so they can catch any incorrect assumptions about tier/package.

## Step 3: Build the Deck

Use the pptx skill's editing workflow (unpack → manipulate → edit → clean → pack):

1. **Copy the template** to your working directory
2. **Unpack**: `doc_unpack(file_path="template.pptx", output_dir="unpacked/")`
3. **Analyze**: Review `ppt/presentation.xml` for `<p:sldIdLst>` to identify slide-to-file mapping
4. **Delete unwanted slides**: Remove `<p:sldId>` entries for slides not in your keep list
5. **Reorder slides**: Arrange remaining `<p:sldId>` entries in final presentation order
6. **Edit content**: Update text in each remaining slide XML file (use Edit tool)
7. **Clean**: `python scripts/clean.py unpacked/`
8. **Pack**: `doc_pack(unpacked_dir="unpacked/", output_path="output.pptx", original_path="template.pptx")`

### Content Editing Instructions Per Slide

Read `references/slide-editing-guide.md` for detailed XML editing instructions for each slide, including shape names, text placeholders, and table structures.

**High-level content map:**

#### Slide 1 — Title
- Replace "Insert Customer Logo" text with customer name (or leave as placeholder note)
- Replace "[Insert Name & Date]" with lead consultant name and kickoff date
- Remove "EXAMPLE ONLY" banner and "Please Update" callouts

#### Slide 2/3 — Agenda
- No text changes needed (agenda items are standard)
- Remove any "Projects Over/Under 150 Hours" banner if desired

#### Slide 4 — Your Domo Team
- **Account Team section**: Fill [Name] placeholders with AE, CSM, SC from portfolio_lookup
- **Leadership Support**: Already has Casey Moes, Ed Engalan, Julia Conner — verify current
- **Project Manager / Engagement Manager**: From spp_project_assignments_lookup (look for PM/EM role)
- **Solution Strategy & Design**: Business Consultant + Technical Architect from SPP assignments
- **Delivery Excellence**: Business Consultant + Technical Architect from SPP assignments

#### Slide 5 — Customer Extended Team
- Replace descriptions with customer-specific context if known from calls
- Populate stakeholder names if identified from calls_lookup or stakeholder map

#### Slide 6 — Customer Core Project Team
- Same approach — populate with known customer contacts from calls

#### Slide 7 — Customer Team Key Roles Table
- Fill table rows with actual stakeholder names, titles, roles, and time zones
- Data from calls_lookup attendees + any stakeholder mapping done

#### Slide 10-15 — Support Package (whichever one is kept)
- Remove "Please identify purchased package" instruction text
- Verify the package details are current

#### Slide 16/17/18/19 — Services Scoped
- Replace "[Copy & Paste directly from boiler plate SOW/Hub]" with actual scope
- Replace "EXAMPLE ONLY" screenshots with actual scope description text
- Fill in connections, dashboards, use cases from SF opportunity details
- Replace example images with text descriptions of actual deliverables

#### Slide 20 — Implementation Process
- Standard methodology — no changes needed unless engagement has custom phases

#### Slide 21 — Implementation by Phases
- Fill "[Insert Hours]" for each phase based on hours allocation
- Phase 1 (First Mile): ~20% of hours
- Phase 2 (Solution Execution): ~60% of hours
- Phase 3 (Last Mile): ~20% of hours
- Update "[Insert Allocated Hours]" with total

#### Slide 22/23 — First Mile Workshop Schedule
- Standard content — no changes typically needed

#### Slide 24 — Proposed Timeline
- Replace example months/dates with actual engagement timeline
- Calculate phases based on start date and hours:
  - Kickoff & Design: Weeks 1-2
  - Connect & Transform: Weeks 2-4
  - Dashboard Visualizations: Weeks 3-5
  - UAT & Governance: Week 5-6
  - Deployment: Final week
- Adjust duration proportionally for engagement size

#### Slide 25 — Communication Tools
- Standard slide — verify tools match what customer uses (Zoom, Asana, etc.)

#### Slide 26 — Next Steps
- Replace "[Insert Customer]" with actual customer name
- Update next steps based on engagement context

#### Slide 32 — How Hours Are Consumed
- Standard content — no changes needed

#### Slide 33 — Success Criteria
- Fill "Item #1" through "Item #4" with actual success criteria
- Derive from calls_lookup, SF opportunity, or upstream kickoff-brief output

## Step 4: QA

### Content QA
```bash
python -m markitdown output.pptx | grep -iE "\[Insert|EXAMPLE ONLY|Please Update|Please identify|\[Name\]|\[Customer|xxxx|lorem|ipsum|TODO"
```
Any hits = leftover placeholder text that must be fixed.

### Visual QA
```bash
libreoffice --headless --convert-to pdf output.pptx
rm -f slide-*.jpg
pdftoppm -jpeg -r 150 output.pdf slide
ls -1 "$PWD"/slide-*.jpg
```
Use a subagent to visually inspect the customized slides. Key things to check:
- No "EXAMPLE ONLY" banners remaining
- Names properly populated (no [Name] placeholders)
- Correct support package shown
- Correct tier-specific slides included
- Timeline dates make sense
- Hours add up correctly in phase breakdown

## Step 5: Deliver

```bash
cp output.pptx <workspace>/{AccountName}_Project_Kickoff.pptx
```

Present to the user with a summary of:
- Which slides were included and why
- What data was pulled vs. what needs manual completion
- Any placeholders that still need customer-specific input (logos, screenshots)

## Data Not Available — Graceful Degradation

Not all MCP data will be available for every account. Handle missing data gracefully:

| Missing Data | Impact | Fallback |
|-------------|--------|----------|
| No SF opportunity | Can't auto-detect tier/hours | Ask user for tier and hours |
| No SPP assignments | Can't populate Domo team | Leave [Name] placeholders, note for user |
| No calls data | Can't populate customer contacts | Leave customer team slides as templates |
| No portfolio data | Can't get AE/CSM/segment | Ask user for basics |
| No web search results | No company context | Skip company overview customization |

When data is missing, always tell the user what couldn't be filled automatically so they know what to complete manually.

## Guardrails

- **NEVER deliver a deck with "EXAMPLE ONLY" banners** — these must be removed
- **NEVER include multiple support package slides** — pick exactly one
- **NEVER include both agenda slides** — pick the one matching the hours threshold
- **NEVER include the asset/reference slides** (35-46) in a customer deliverable
- **ALWAYS verify the Domo team names are real people** from SPP data, not placeholders
- **ALWAYS remove the yellow highlight/callout annotations** meant for internal template users
- **ALWAYS preserve the Domo branding** (colors, logos, slide masters) from the template

---

## Learnings & Gotchas (from real engagements)

### PPTX Corruption / Repack Failures

The template PPTX can produce a corrupted output if the unpack/pack cycle encounters issues with relationships or content types. **Symptoms:** PowerPoint shows "repair" prompt on open; images missing; slides out of order.

**Fix:** Always use `--original template.pptx` in the pack command:
```bash
doc_pack(unpacked_dir="unpacked/", output_path="output.pptx", original_path="assets/TEMPLATE_Project_Kickoff.pptx")
```
If the file is still broken after packing, the nuclear option is:
1. Unpack the original template to `template_base/`
2. Copy your edited slide XMLs into `template_base/ppt/slides/`
3. Edit `template_base/ppt/presentation.xml` to match your slide selection
4. Pack from `template_base/`

### Customer Logo Replacement

The template ships with the General Mills logo as the example. To replace it with the customer's logo:

1. **Find the customer logo**: Search the web for "[Company Name] logo PNG transparent" or check their press kit page
2. **Save to unpacked media**: Download to `unpacked/ppt/media/customer_logo.png`
3. **Add a relationship in the slide's .rels file** (`unpacked/ppt/slides/_rels/slide1.xml.rels`):
   ```xml
   <Relationship Id="rIdLOGO" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/customer_logo.png"/>
   ```
4. **Update the `<a:blip>` element in slide1.xml**: Find the `<p:pic>` element for the customer logo and change `r:embed` to `rIdLOGO`
5. **Adjust size/position** if the logo has a different aspect ratio — look for `<p:spPr><a:xfrm>` and adjust `cx`/`cy` values (in EMUs: 1 inch = 914400)
6. After replacement, **also remove**: the "EXAMPLE ONLY" text overlay and any "Please Update" callout shapes on that slide

### Removing Yellow Highlights from Text

The template uses yellow highlighting on placeholder text to indicate "fill this in." Once filled, the highlighting must be removed.

**How to find:** Search the slide XML for `<a:highlight>` or the fill color `FFFF00`:
```bash
grep -l "FFFF00\|highlight" unpacked/ppt/slides/*.xml
```

**How to remove:** Delete the entire `<a:highlight>` element from within `<a:rPr>`:
```xml
<!-- BEFORE -->
<a:rPr lang="en-US" b="1">
  <a:highlight><a:srgbClr val="FFFF00"/></a:highlight>
</a:rPr>

<!-- AFTER -->
<a:rPr lang="en-US" b="1"/>
```

### Redesigning Scope Slides (17 & 18) for Better Readability

The default scope slides (17 and 18) use low-quality screenshot images as "examples" that must be replaced. Rather than inserting new images, **replace image placeholders with structured text content** — this produces a far cleaner, more professional result.

**Slide 17 (Connections & Dashboards — Tier 1 & 2):**
Replace the images with two bulleted sections:
- Header "DATA CONNECTIONS" in Domo blue (`1F78B4` or similar) — bold, all-caps
- Bulleted list of actual data sources being connected (e.g., "**OpenTable API** – Reservation & guest experience data")
- Header "DASHBOARDS OF INTEREST" — same style
- Bulleted list of dashboards/apps being built

To do this, **delete the `<p:pic>` image shapes** and **add `<p:sp>` text box shapes** with appropriate positioning. Copy the XML structure from other text slides in the deck.

**Slide 18 (Hours/Goals — Tier 2 & 3):**
Replace the hours table image with a clean split layout:
- **Left panel**: "ENGAGEMENT TYPE" label → large bold text (engagement name) → smaller text (e.g., "Fixed Bid Engagement") → large stat number for hours → "TOTAL HOURS" label
- **Dividing line**: A thin vertical rectangle between columns
- **Right panel**: "PROJECT GOALS & OUTCOMES" label → bulleted list of 4-6 actual project goals from the SOW

This approach uses all text shapes (no images), is fully editable, and renders much more professionally than the template's placeholder images.

### Slide Number Drift After Slide Deletion

After removing slides (asset slides, wrong tier slides, etc.), the slide numbers in the rendered deck shift. The `slide-map.md` references the **original 46-slide template numbers** — after your deletions, the actual slide positions will be different. Keep a mapping log as you delete:

```
Template slide 17 → kept as position 9 in final deck (after removing 8 others before it)
Template slide 18 → kept as position 10 in final deck
```

The file names (`slide17.xml`, `slide18.xml`) don't change — only the display order changes based on `ppt/presentation.xml`. Always use the filename, not the slide number, when referring to specific slides during editing.

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and engagement artifacts.

### After executing
- Call `memory_store_artifact` scoped to `{account_id}` with the produced artifact.

## Related Skills

- **kickoff-brief** (Align) → Upstream markdown brief — use its output for success criteria and engagement context if available
- **template-registry** (Global) → Brand standards reference
- **offering-matchmaker** (Discover) → Package tier and hours
- **alignment-gate** (Align) → Downstream — validates kickoff readiness
- **call-prep** (Align) → Preparing for the actual kickoff call
