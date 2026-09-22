---
name: pptx
tier: 1
description: "Use this skill any time a .pptx file is involved in any way — as input, output, or both. This includes: creating slide decks, pitch decks, or presentations; reading, parsing, or extracting text from any .pptx file (even if the extracted content will be used elsewhere, like in an email or summary); editing, modifying, or updating existing presentations; combining or splitting slide files; working with templates, layouts, speaker notes, or comments. Trigger whenever the user mentions \"deck,\" \"slides,\" \"presentation,\" or references a .pptx filename, regardless of what they plan to do with the content afterward. If a .pptx file needs to be opened, created, or touched, use this skill."
maturity: alpha
audience: [intelligence]
license: Proprietary. LICENSE.txt has complete terms
---

## ⚠️ ArmOS Environment — READ FIRST

**In ArmOS, the Python-based pptx workflows described below do NOT run.** There is no Python runtime, no `markitdown`, no `python-pptx`, and this skill's `scripts/` are not installed. **Do NOT run any `python …` / `python -m markitdown` / `python-pptx` command** — it will not execute and the request will hang until it times out. Do not silently retry.

**Reading a `.pptx` directly is also unsafe here:** a `.pptx` is a binary zip. Do NOT `Read` (or `cat`) the raw file — it dumps binary into the context window and thrashes the session (DOMX-320). Ingestion now stores an uploaded `.pptx` as a reference stub rather than extracting its text, so its contents are not in the knowledge base.

**Native `.pptx` reading, generation, and "populate with live data" are not yet available in ArmOS.** If a user uploads a deck to populate with Domo data, tell them plainly that automated `.pptx` population isn't supported yet — do not attempt the Python path or read the binary. If you only need to *inspect* structure, `unzip -o deck.pptx -d unpacked/` (system `unzip`) exposes the slide XML without Python; use sparingly and never dump whole XML blobs into the reply.

Everything below is reference for environments that have the full Python toolchain; it does not apply in ArmOS.

# PPTX Skill

## Quick Reference

| Task | Guide |
|------|-------|
| Read/analyze content | `python -m markitdown presentation.pptx` |
| Edit or create from template | Use `python-pptx` (see [Editing Workflow](#editing-workflow)) |
| Create from scratch | Use `python-pptx` (see [Creating from Scratch](#creating-from-scratch)) |

---

## Reading Content

```bash
# Text extraction
python -m markitdown presentation.pptx

# Raw XML inspection (standard unzip, always available)
unzip -o presentation.pptx -d unpacked/
```

---

## Editing Workflow

Use `python-pptx` to load, inspect, and modify existing presentations.

1. **Read first** — extract text with markitdown to understand what's in the file:
   ```bash
   python -m markitdown input.pptx
   ```

2. **Load and modify** with python-pptx:
   ```python
   from pptx import Presentation
   from pptx.util import Inches, Pt, Emu
   from pptx.dml.color import RGBColor
   from pptx.enum.text import PP_ALIGN

   prs = Presentation('input.pptx')

   # Access slides
   for slide in prs.slides:
       for shape in slide.shapes:
           if shape.has_text_frame:
               for paragraph in shape.text_frame.paragraphs:
                   print(paragraph.text)

   # Modify text
   slide = prs.slides[0]
   for shape in slide.shapes:
       if shape.has_text_frame:
           shape.text_frame.paragraphs[0].text = "New text"
   ```

3. **Save** the modified presentation:
   ```python
   prs.save('output.pptx')
   ```

---

## Creating from Scratch

Use `python-pptx` when no template or reference presentation is available.

Write all slide generation in a **single Python script**, then execute it once. Do NOT generate slides one at a time.

```python
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

prs = Presentation()

# Set widescreen 16:9 dimensions
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Add a blank slide (layout 6 = blank)
slide = prs.slides.add_slide(prs.slide_layouts[6])

# Add a text box
from pptx.util import Inches, Pt
txBox = slide.shapes.add_textbox(Inches(1), Inches(1), Inches(8), Inches(1.5))
tf = txBox.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "Slide Title"
p.font.size = Pt(36)
p.font.bold = True
p.font.color.rgb = RGBColor(0x1E, 0x27, 0x61)
p.alignment = PP_ALIGN.LEFT

# Add an image
# slide.shapes.add_picture('image.png', Inches(1), Inches(3), width=Inches(4))

# Add a colored rectangle
from pptx.enum.shapes import MSO_SHAPE
shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), prs.slide_width, Inches(0.5))
shape.fill.solid()
shape.fill.fore_color.rgb = RGBColor(0x1E, 0x27, 0x61)
shape.line.fill.background()

prs.save('output.pptx')
```

---

## Design Ideas

**Don't create boring slides.** Plain bullets on a white background won't impress anyone. Consider ideas from this list for each slide.

### Before Starting

- **Pick a bold, content-informed color palette**: The palette should feel designed for THIS topic. If swapping your colors into a completely different presentation would still "work," you haven't made specific enough choices.
- **Dominance over equality**: One color should dominate (60-70% visual weight), with 1-2 supporting tones and one sharp accent. Never give all colors equal weight.
- **Dark/light contrast**: Dark backgrounds for title + conclusion slides, light for content ("sandwich" structure). Or commit to dark throughout for a premium feel.
- **Commit to a visual motif**: Pick ONE distinctive element and repeat it — rounded image frames, icons in colored circles, thick single-side borders. Carry it across every slide.

### Color Palettes

Choose colors that match your topic — don't default to generic blue. Use these palettes as inspiration:

| Theme | Primary | Secondary | Accent |
|-------|---------|-----------|--------|
| **Midnight Executive** | `1E2761` (navy) | `CADCFC` (ice blue) | `FFFFFF` (white) |
| **Forest & Moss** | `2C5F2D` (forest) | `97BC62` (moss) | `F5F5F5` (cream) |
| **Coral Energy** | `F96167` (coral) | `F9E795` (gold) | `2F3C7E` (navy) |
| **Warm Terracotta** | `B85042` (terracotta) | `E7E8D1` (sand) | `A7BEAE` (sage) |
| **Ocean Gradient** | `065A82` (deep blue) | `1C7293` (teal) | `21295C` (midnight) |
| **Charcoal Minimal** | `36454F` (charcoal) | `F2F2F2` (off-white) | `212121` (black) |
| **Teal Trust** | `028090` (teal) | `00A896` (seafoam) | `02C39A` (mint) |
| **Berry & Cream** | `6D2E46` (berry) | `A26769` (dusty rose) | `ECE2D0` (cream) |
| **Sage Calm** | `84B59F` (sage) | `69A297` (eucalyptus) | `50808E` (slate) |
| **Cherry Bold** | `990011` (cherry) | `FCF6F5` (off-white) | `2F3C7E` (navy) |

### For Each Slide

**Every slide needs a visual element** — image, chart, icon, or shape. Text-only slides are forgettable.

**Layout options:**
- Two-column (text left, illustration on right)
- Icon + text rows (icon in colored circle, bold header, description below)
- 2x2 or 2x3 grid (image on one side, grid of content blocks on other)
- Half-bleed image (full left or right side) with content overlay

**Data display:**
- Large stat callouts (big numbers 60-72pt with small labels below)
- Comparison columns (before/after, pros/cons, side-by-side options)
- Timeline or process flow (numbered steps, arrows)

**Visual polish:**
- Icons in small colored circles next to section headers
- Italic accent text for key stats or taglines

### Typography

**Choose an interesting font pairing** — don't default to Arial. Pick a header font with personality and pair it with a clean body font.

| Header Font | Body Font |
|-------------|-----------|
| Georgia | Calibri |
| Arial Black | Arial |
| Calibri | Calibri Light |
| Cambria | Calibri |
| Trebuchet MS | Calibri |
| Impact | Arial |
| Palatino | Garamond |
| Consolas | Calibri |

| Element | Size |
|---------|------|
| Slide title | 36-44pt bold |
| Section header | 20-24pt bold |
| Body text | 14-16pt |
| Captions | 10-12pt muted |

### Spacing

- 0.5" minimum margins
- 0.3-0.5" between content blocks
- Leave breathing room—don't fill every inch

### Avoid (Common Mistakes)

- **Don't repeat the same layout** — vary columns, cards, and callouts across slides
- **Don't center body text** — left-align paragraphs and lists; center only titles
- **Don't skimp on size contrast** — titles need 36pt+ to stand out from 14-16pt body
- **Don't default to blue** — pick colors that reflect the specific topic
- **Don't mix spacing randomly** — choose 0.3" or 0.5" gaps and use consistently
- **Don't style one slide and leave the rest plain** — commit fully or keep it simple throughout
- **Don't create text-only slides** — add images, icons, charts, or visual elements; avoid plain title + bullets
- **Don't forget text box padding** — when aligning lines or shapes with text edges, set `margin: 0` on the text box or offset the shape to account for padding
- **Don't use low-contrast elements** — icons AND text need strong contrast against the background; avoid light text on light backgrounds or dark text on dark backgrounds
- **NEVER use accent lines under titles** — these are a hallmark of AI-generated slides; use whitespace or background color instead

---

## QA (Required)

**Assume there are problems. Your job is to find them.**

Your first render is almost never correct. Approach QA as a bug hunt, not a confirmation step. If you found zero issues on first inspection, you weren't looking hard enough.

### Content QA

```bash
python -m markitdown output.pptx
```

Check for missing content, typos, wrong order.

**When using templates, check for leftover placeholder text:**

```bash
python -m markitdown output.pptx | grep -iE "\bx{3,}\b|lorem|ipsum|\bTODO|\[insert|this.*(page|slide).*layout"
```

If grep returns results, fix them before declaring success.

### Visual QA

**USE SUBAGENTS** — even for 2-3 slides. You've been staring at the code and will see what you expect, not what's there. Subagents have fresh eyes.

Convert slides to images (see [Converting to Images](#converting-to-images)), then use this prompt:

```
Visually inspect these slides. Assume there are issues — find them.

Look for:
- Overlapping elements (text through shapes, lines through words, stacked elements)
- Text overflow or cut off at edges/box boundaries
- Decorative lines positioned for single-line text but title wrapped to two lines
- Source citations or footers colliding with content above
- Elements too close (< 0.3" gaps) or cards/sections nearly touching
- Uneven gaps (large empty area in one place, cramped in another)
- Insufficient margin from slide edges (< 0.5")
- Columns or similar elements not aligned consistently
- Low-contrast text (e.g., light gray text on cream-colored background)
- Low-contrast icons (e.g., dark icons on dark backgrounds without a contrasting circle)
- Text boxes too narrow causing excessive wrapping
- Leftover placeholder content

For each slide, list issues or areas of concern, even if minor.

Read and analyze these images — run `ls -1 "$PWD"/slide-*.jpg` and use the exact absolute paths it prints:
1. <absolute-path>/slide-N.jpg — (Expected: [brief description])
2. <absolute-path>/slide-N.jpg — (Expected: [brief description])
...

Report ALL issues found, including minor ones.
```

### Verification Loop

1. Generate slides → Convert to images → Inspect
2. **List issues found** (if none found, look again more critically)
3. Fix issues
4. **Re-verify affected slides** — one fix often creates another problem
5. Repeat until a full pass reveals no new issues

**Do not declare success until you've completed at least one fix-and-verify cycle.**

---

## Converting to Images

Convert presentations to individual slide images for visual inspection. This requires LibreOffice (`soffice`) for PPTX-to-PDF conversion.

```bash
# Check if LibreOffice is available
if which soffice > /dev/null 2>&1; then
    soffice --headless --convert-to pdf output.pptx
    rm -f slide-*.jpg
    pdftoppm -jpeg -r 150 output.pdf slide
    ls -1 "$PWD"/slide-*.jpg
else
    echo "LibreOffice not installed — skipping image-based visual QA."
    echo "Use content QA via markitdown + python-pptx element inspection instead."
fi
```

**If LibreOffice IS available:** Pass the absolute paths printed above directly to the view tool. The `rm` clears stale images from prior runs. `pdftoppm` zero-pads based on page count: `slide-1.jpg` for decks under 10 pages, `slide-01.jpg` for 10-99, `slide-001.jpg` for 100+. After fixes, rerun the commands above — the PDF must be regenerated from the edited `.pptx` before `pdftoppm` can reflect your changes.

**If LibreOffice is NOT available:** Skip image-based visual QA. Instead, verify content accuracy with `python -m markitdown output.pptx` and inspect element positioning programmatically via python-pptx (check shape positions, sizes, and text content).

---

## Dependencies

- `pip install "markitdown[pptx]"` - text extraction
- `pip install python-pptx` - creating and editing presentations
- `pip install Pillow` - image processing
- LibreOffice (`soffice`) - PDF conversion for visual QA (optional — check with `which soffice`)
- Poppler (`pdftoppm`) - PDF to images (only useful if LibreOffice is also available)

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context.

### After executing
- No memory writes required for this utility skill.
