# Slide Editing Guide

Detailed XML editing instructions for each customizable slide in the Project Kickoff template.

## General Rules

- Use the **Edit tool** (not sed or Python scripts) for XML text replacements
- **Bold all headers**: `b="1"` on `<a:rPr>`
- **Preserve formatting**: Copy `<a:pPr>` from original paragraphs when adding new ones
- **Smart quotes**: Use XML entities (`&#x201C;` / `&#x201D;`) not ASCII quotes
- **Remove instruction text**: Anything highlighted yellow or saying "EXAMPLE ONLY", "Please Update", "Please identify" must be removed or replaced

---

## Slide 1 — Title / Cover

**File:** `slide1.xml`

**Key shapes:**
- `Title 1` — Contains "Project Kickoff" heading
- `Text Placeholder 3` — Contains "Domo Consulting [Insert Name & Date]"
- `Picture 2` — Example customer logo (General Mills) with "EXAMPLE ONLY" banner
- `Left Arrow 7` + `Rectangle 10` — Yellow callout saying "Insert Customer Logo" and "Please Update"

**Edits:**
1. In `Text Placeholder 3`: Replace `[Insert Name & Date]` with actual consultant name and kickoff date
   - Example: `Domo Consulting | Jane Smith | March 15, 2026`
2. Remove the yellow callout shapes: `Left Arrow 7`, `Rectangle 10`, `Left Arrow 11`
   - Delete their entire `<p:sp>` elements from the slide XML
3. Remove the "EXAMPLE ONLY" text shape if it's a separate element (search for `EXAMPLE ONLY` in the XML)

**To replace the General Mills example logo with the customer's logo:**

1. Search the web for the customer's logo: `"[Company Name] logo PNG transparent background` or check their press kit
2. Download and save as `unpacked/ppt/media/customer_logo.png`
3. In `unpacked/ppt/slides/_rels/slide1.xml.rels`, add a new relationship:
   ```xml
   <Relationship Id="rIdCUSTLOGO" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/customer_logo.png"/>
   ```
4. In `slide1.xml`, find the `<p:pic>` element for `Picture 2` (the General Mills logo)
5. Change the `r:embed` attribute in `<a:blip>` to `rIdCUSTLOGO`
6. Adjust the `<p:spPr><a:xfrm>` dimensions (`cx`/`cy` in EMUs) if the logo has a different aspect ratio
   - 1 inch = 914400 EMUs — keep height reasonable (e.g., `cy="457200"` = 0.5 inch)
7. The "DOMO +" graphic and positioning should remain unchanged

---

## Slide 4 — Your Domo Team

**File:** `slide4.xml`

**Key shapes:**
- `Title 8` — "Your Domo Team" heading
- `Rectangle: Rounded Corners 18` — Account Team box (left)
- `Rectangle: Rounded Corners 19` (first) — Leadership Support box (right)
- `Rectangle: Rounded Corners 30` (first) — Project Manager / Engagement Manager (center)
- `Rectangle: Rounded Corners 30` (second) — Solution Strategy & Design (left bottom)
- `Rectangle: Rounded Corners 19` (second) — Delivery Excellence (right bottom)

**Account Team box** (shape with "Account Team" header):
Replace placeholder names:
```
[Name]– Account Executive        → {AE name from portfolio_lookup}
[Name]– Customer Success Manager → {CSM name from portfolio_lookup}
[Name]– Solutions Consultant     → {SC name if applicable, or remove line}
```

**Leadership Support box** (already populated):
- Casey Moes – Director, Consulting PMO
- Ed Engalan – Director, Consulting
- Julia Conner – Sr Manager, Consulting
- Verify these are still current; update if org has changed

**Project Manager / Engagement Manager box**:
Replace `[Name]` with the PM/EM from spp_project_assignments_lookup.
Replace `[Choose Project Manager or Engagement Manager]` with the actual role title.

**Solution Strategy & Design box**:
Replace `[Name] – Business Consultant` and `[Name] –Technical Architect` with actual team members from SPP assignments.

**Delivery Excellence box**:
Same pattern — fill from SPP assignment data. If only one consultant is assigned, remove the extra line.

---

## Slide 7 — Customer Team Key Roles Table

**File:** `slide7.xml`

**Key shapes:**
- `Title 5` — "[Insert Customer Name] Project Team Key Roles"
- `Table 4` — The roles table

**Table structure:** 3 columns (Stakeholders | Project Role | Time Zone), 8 rows including header.

**Edits:**
1. Replace "[Insert Customer Name]" in the title with the actual customer name
2. For each table row, replace `[Name] [Job Title]` with actual stakeholder info from calls_lookup attendees
3. If stakeholders aren't known yet, leave as placeholders but note for the user

**Table rows map to these roles:**
| Row | Role |
|-----|------|
| 1 | Exec Sponsor |
| 2 | Business Unit Sponsor |
| 3 | Data Specialist |
| 4 | Program Owner |
| 5 | Data/Business Analyst(s) |
| 6 | Data Engineer |
| 7 | Platform Administrator |

---

## Slide 10-15 — Support Package Slides

**Common edits for whichever slide is kept:**

1. Remove "Please identify purchased package." instruction text
   - Find the `<a:p>` containing this text and either remove it or replace with empty paragraph
2. The table content is pre-populated and accurate — generally no changes needed
3. Verify the package details match current Domo support offerings

---

## Slide 16 — What Services: Kickstarters (T4)

**File:** `slide16.xml`

**Edits:**
1. Replace "What Kickstarter did you Purchase?" and "[Copy & Paste directly from boiler plate SOW/Hub]" with actual kickoff scope
2. Replace "Project Outcomes you can expect?" section with actual outcomes from the SOW/opportunity
3. Remove "EXAMPLE ONLY" label
4. Remove or replace the example screenshot images with scope description text
5. Specify whether it's "Use Case Deployment" or "Feature Enablement" path

---

## Slide 17 — What Services: Tier 1 & 2

**File:** `slide17.xml`

The default template uses low-quality screenshot images as examples. **The recommended approach is to remove the images entirely and replace with structured text.** This produces a much cleaner, professional result.

**Recommended approach (text-based replacement):**

1. **Delete the `<p:pic>` image shapes** from the slide XML — search for `<p:pic>` elements and remove them
2. **Add two text sections** with this structure:
   - Section header (bold, all-caps, Domo blue `#1F78B4`): "DATA CONNECTIONS"
   - Bulleted list: `• **OpenTable API** – Reservation & guest experience data` (bold source name, dash, plain description)
   - Section header: "DASHBOARDS OF INTEREST"
   - Bulleted list: `• **Reputation Management App** – Centralized review monitoring & response tracking`
3. **Source content** from: SF opportunity name/description, Gong call recaps, and any SOW details

**Quick fallback (if image replacement is too complex):**
1. Remove "EXAMPLE ONLY" label shape
2. Replace the placeholder instruction text with actual scope description
3. Leave the images removed and use a plain bulleted text box

**Bullet formatting in XML:**
```xml
<a:p>
  <a:pPr marL="342900" indent="-342900">
    <a:buChar char="•"/>
  </a:pPr>
  <a:r><a:rPr b="1"/><a:t>OpenTable API</a:t></a:r>
  <a:r><a:rPr b="0"/><a:t>  –  Reservation &amp; guest experience data</a:t></a:r>
</a:p>
```

---

## Slide 18 — What Services: Tier 2 & 3

**File:** `slide18.xml`

Like slide 17, the default template uses images. **The recommended approach is to replace with a clean two-column text layout.**

**Recommended layout:**

**Left column (engagement summary):**
- Small label: "ENGAGEMENT TYPE" (bold, blue, small font ~14pt)
- Large bold text: Engagement name (e.g., "Custom Consulting")
- Smaller text: Type (e.g., "Fixed Bid Engagement")
- Large stat: Hours number (e.g., "467") in Domo blue, large font ~60pt
- Small label: "TOTAL HOURS"

**Divider:** Thin vertical rectangle (1px wide, full height, gray or blue)

**Right column (goals):**
- Small label: "PROJECT GOALS & OUTCOMES" (bold, blue, small font ~14pt)
- Bulleted list of 4-6 actual project goals from the SOW/opportunity

**Content sources:**
- Hours: from `spp_lookup → project_hours_purchased` or SF opportunity ACV estimate
- Engagement type: from SF opportunity type field
- Goals: from SF opportunity description, Gong call recaps about expected outcomes

**Old edits (if sticking with original template structure):**
1. Replace "[Copy & Paste Table of Hours]" with actual hours breakdown
2. Replace "Copy and past goal summary from page 1 of SOW" with actual goals
3. Remove "EXAMPLE ONLY" labels
4. Fill in the deliverables/outcomes section

---

## Slide 21 — Implementation Process by Phases

**File:** `slide21.xml`

**Key structure:** Complex grouped shapes with chevrons and text boxes.

**Edits:**
1. Replace `[Insert Hours]` (appears 3 times) with actual phase hours:
   - Phase 1 (First Mile): ~20% of total hours
   - Phase 2 (Solution Execution): ~60% of total hours
   - Phase 3 (Last Mile): ~20% of total hours
2. Replace `[Insert Allocated Hours]` with total hours
3. Search for these strings in all text frames within the slide XML

---

## Slide 24 — Proposed Timeline

**File:** `slide24.xml`

**Key shapes:** Group 25 contains the timeline with rectangular bars and text boxes for each phase.

This is one of the most complex slides to edit because the timeline is built from grouped shapes with specific positioning.

**Edits:**
1. Update month headers (June, July, August, September) to actual engagement months
2. Update phase date ranges and durations
3. Update phase labels if needed

**Timeline calculation from hours:**

| Hours | Total Duration | Phase Distribution |
|-------|---------------|-------------------|
| 20-40 (T4) | 2-4 weeks | Simplified: Design 1wk, Build 1-2wk, Deploy 1wk |
| 40-150 (T3) | 4-10 weeks | Design 2wk, Build 4-6wk, Deploy 2wk |
| 150-500 (T2) | 10-20 weeks | Design 3wk, Connect 3wk, Build 6-10wk, UAT 2wk, Deploy 2wk |
| 500+ (T1) | 20+ weeks | Full 6-phase breakdown |

**Shape names for month headers:** Look for TextBox shapes in the Group 25 area.
**Shape names for phase bars:** Rectangle 26, 27, 28, 29 are the colored timeline bars.

---

## Slide 26 — Next Steps

**File:** `slide26.xml`

**Key shapes:**
- `Title 1` — "Next Steps" heading
- `Table 6` — Next steps table (2 columns)

**Table structure:**
| Col 0 | Col 1 |
|-------|-------|
| DOMO | Schedule Domo Education Walk-through |
| DOMO | Schedule Workshops |
| [Insert Customer] | Grant Admin Access to Domo Consulting Team [Slide 3] |

**Edits:**
1. Replace `[Insert Customer]` with actual customer name
2. Update next steps if engagement requires different actions
3. Add rows if additional next steps are needed

---

## Slide 33 — Success Criteria

**File:** `slide33.xml`

**Key shapes:**
- `Content Placeholder 2` — Contains the success criteria items
- `Rectangle 3`, `Rectangle 1` — Background shapes

**Content structure:** 4 success criteria items, each with a header ("Item #1") and details.

**Edits:**
1. Replace "Item #1" through "Item #4" with actual success criteria headers
2. Replace "Details" under each item with specifics
3. Derive from:
   - Upstream kickoff-brief success criteria (if available)
   - SF opportunity description
   - Gong call recaps mentioning goals/outcomes
   - Standard criteria for the engagement tier

**Example success criteria for a Tier 2 engagement:**
- Item 1: "Executive Dashboard Suite" — Deliver 3 dashboards for C-suite with real-time KPIs
- Item 2: "Data Pipeline Automation" — Automate daily ETL from 4 source systems
- Item 3: "User Adoption" — Train 20+ users across 3 departments
- Item 4: "Self-Service Enablement" — Customer team can build new cards independently

---

## Shapes to Always Remove

These shapes appear on various slides as internal instructions and must be removed from the final deck:

| Shape/Text Pattern | Slides | Why Remove |
|-------------------|--------|------------|
| "EXAMPLE ONLY" | 1, 9, 16, 17, 18 | Template instruction |
| "Please Update" | 1 | Template instruction |
| "Please identify purchased package" | 10-15 | Template instruction |
| Yellow-highlighted callout arrows | 1 | Template instruction |
| "[Slide 3]" references | 26 | Internal cross-reference |
| Speaker notes with "FROM SOW TEMPLATE:" | 5, 6 | Internal reference |
| "CONFIDENTIAL" footer | 32, 33 | Already in slide master — duplicates |
