# Visual Design Standard — 500 Apps

## Goal

Apps must look **Domo-native but elevated** — they sit inside a Domo page (don't clash with the nav chrome) but clearly a step above a standard card page. The customer should feel "this was designed for us" not "this is a template." Every app should match the customer's brand personality and audience. Every app should be a **workflow optimizer** — each surface makes the user massively better at their job.

## Viewport-first design (the #1 priority)

The initial viewport is sacred. For every surface in the app:

1. **The hero metric and primary CTA must be visible without scrolling** at 1440x900. If the user must scroll to find the primary action, the design fails.
2. **One primary CTA per surface** — action-colored, visually dominant. Never two equally weighted CTAs above the fold.
3. **The 3-second rule** — a first-time user must articulate "this surface is for X and the next click is Y" within 3 seconds. If wireframe testing fails this, the surface fails.
4. **No filters above the fold** unless the surface IS a filter. Filters create cognitive cost. Default them; let power users open them.
5. **No "welcome" text, no decorative chrome** above the fold — every pixel serves the task.

Define viewport content per surface in BUILD-SPEC (see `modules/prd-quality-patterns.md` for the blueprint format).

## Brand kit (first-class artifact)

Before writing any code, stage F produces `spec/BRAND-KIT.md` — the customer's design identity:

- **Logo**: Sourced online, background removed. Clear-space rules.
- **Color tokens**: Customer's brand colors mapped to semantic roles (primary, accent, surface, ink, state colors). Restraint rules ("never use accent as text fill").
- **Typography**: Customer's brand font for MVP apps. Open Sans for the engagement context template. Inter only as fallback when customer font is unknown. Tabular numerals (`font-feature-settings: 'tnum' 1`) for all KPI/currency displays.
- **CTA pattern**: Primary (filled, action color), secondary (outlined), tertiary (text link). Exact CSS for each.
- **Voice and microcopy**: Domain-appropriate language. "Write like a dispatcher" for logistics. "Write like a CFO's aide" for finance. No generic SaaS copy.

See `modules/prd-quality-patterns.md` section 5 for the full template.

## Technology choices

Use whatever CSS approach produces the best result — hand-written CSS, Tailwind, or a mix. The goal is a polished product, not adherence to a framework. Guidelines:

- **Chart.js** for data visualization (CDN: `https://cdn.jsdelivr.net/npm/chart.js`)
- **Icons**: Lucide, Heroicons, Material Icons, or inline SVG — never emoji
- **Fonts**: Customer's brand font for the MVP app. Open Sans for the engagement context template. Inter only as a fallback when customer font is unknown. Load via Google Fonts CDN.
- **CSS**: Write a dedicated `styles/main.css` with a custom design system (CSS custom properties for colors, spacing, typography scale). If using Tailwind, configure it with brand colors — don't use Tailwind defaults.
- **Structural patterns**: Use the shadow system, border-radius scale, animation keyframes, and easing curves from `modules/domo-design-playbook.md` regardless of brand. These apply to ALL apps.

## Visual personality — match the brief

Read the brief's industry, contact title, problem statement, and tuesday_user to pick a personality. Document the choice in BUILD-SPEC.

### Executive Scannable
**When:** C-suite / SVP audience, board-facing, "CFO opens on day 5"
- Large KPI numbers (2xl–4xl) with comparison context (vs prior period, trend arrow)
- Generous whitespace — exec scans in 5 seconds, doesn't read dense tables
- Muted color palette, one accent color for "attention here"
- Minimal navigation — 2-3 tabs max, no deep drill-downs
- Typography does the heavy lifting (size and weight hierarchy, not color)

### Operational Dense
**When:** Ops teams, analysts, coordinators, "opens app and processes a queue"
- Data tables dominate — 8+ columns, 15+ rows visible above the fold
- Status badges with semantic colors (green/amber/red pills)
- Action buttons per row (View, Approve, Escalate)
- Dark or navy header bar with app identity, counts in tab badges
- Tight spacing — `gap-2`, `p-3`, `text-sm` — information density over breathing room
- Queue/inbox pattern: list on left, detail drawer on right

### Analytical Storytelling
**When:** Data teams, analysts, "show me trends and breakdowns"
- Charts are the primary content — 60-70% of screen area
- 2/3 + 1/3 layouts (main chart + supporting breakdown)
- KPI row at top with sparklines/trend indicators
- Horizontal bar charts for category rankings (better than pie charts)
- Time-series with proper axes, muted gridlines, comparison lines (vs target, vs prior year)
- Filter bar across top for slicing

### Bold Brand-Forward
**When:** Customer-facing, sales, marketing, brand-conscious industries (retail, media)
- Customer's primary brand color used on header, primary buttons, active states
- Larger type, card-based layouts with subtle shadows
- More visual flair — gradient accents on hero KPI, rounded corners, micro-animations on state changes
- Progress bars, completion rings, leaderboards with rankings
- Celebration/urgency: gold/green for wins, pulsing red for at-risk

### Per-surface adaptation (IMPORTANT)

Personality applies **per surface/tab**, not uniformly across the entire app. A single app often has surfaces that serve different purposes:

- **Action/workflow screens** (queues, triage, inbox) → Operational Dense — tight spacing, tables, status badges, per-row actions. The user is *working* here.
- **Reporting/monitoring screens** (daily brief, trends, dashboards) → Analytical Storytelling — charts dominate, more whitespace, trend lines, comparison context. The user is *reviewing* here.
- **Config/admin screens** (settings, routing rules, preferences) → Clean and functional, card-based, toggle/form patterns. Not dense, not flashy.
- **Overview/KPI screens** (team performance, executive summary) → Executive Scannable — large KPIs with context, sparklines, leaderboard patterns. The user is *scanning* here.

The brand system (colors, fonts, header, badge styles) stays consistent across all surfaces. What changes is the **density, layout pattern, and visual emphasis** per surface.

**Operational does not mean ugly.** Dense data tables should still have excellent typography, semantic color, proper alignment, and thoughtful hover states. "Easy to use" and "looks good" reinforce each other — they are not trade-offs.

### Blending across the app
Document in BUILD-SPEC which personality applies to which surface. Example for a triage app:
- Queue tab → Operational Dense
- Daily Brief tab → Analytical Storytelling  
- Team Performance tab → Executive Scannable
- Routing Config tab → Clean admin

The overall app identity (header, color system, font) unifies them.

## Design tokens — first file before any components

Before writing `app.js` or any component, generate `code/styles/tokens.js`:

```javascript
(function() {
  window.APP_TOKENS = {
    brand: {
      primary: '#1e3a5f',    // derived from customer industry/brand
      secondary: '#64748b',
      accent: '#0ea5e9',
    },
    semantic: {
      success: '#16a34a',
      warning: '#d97706',
      danger: '#dc2626',
      info: '#2563eb',
    },
    neutral: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
      300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
      600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
    },
    personality: 'operational-dense', // from BUILD-SPEC
  };
})();
```

Derive the `brand.primary` from:
- Customer's known brand color (if recognizable — US Bank = navy, healthcare = clinical blue, logistics = industrial teal)
- Industry convention (finance = navy/dark blue, healthcare = calming blue/teal, tech = modern purple/blue, retail = warmer tones)
- Contact title seniority (C-suite = more muted/sophisticated, manager = can be bolder)

Apply tokens via CSS custom properties (`var(--primary)`) in your stylesheet, or reference `window.APP_TOKENS` in JS components.

## Component patterns

These are verbal descriptions — implement using whatever CSS approach works best.

### KPI hero row
- Full width, 3-6 KPIs in equal columns
- Each KPI: large number (text-3xl font-bold), label below (text-xs uppercase tracking-wide text-gray-500), comparison context (small text with green/red arrow + "vs last period")
- Primary KPI gets the brand accent border-left or background tint
- Never just numbers alone — always "what does this mean" context

### Data table
- Header row: bg-gray-50, text-xs uppercase tracking-wide, sticky on scroll
- Rows: hover:bg-gray-50, border-b border-gray-100
- Status column: rounded-full pill badges (px-2 py-0.5 text-xs font-medium) with semantic background colors
- People columns: circular avatar with initials (w-8 h-8 rounded-full bg-primary text-white text-xs flex items-center justify-center)
- Action column: right-aligned, small buttons or icon buttons
- Dense: text-sm, py-2. Spacious (exec): text-base, py-3

### Navigation header
- Dark header (bg-gray-900 or brand primary dark variant) with app name in white
- Tab bar below: text-sm font-medium, active tab has brand color border-bottom and text color
- Badge counts on tabs: rounded-full bg-brand text-white text-xs px-2
- Right side: date/time context, user avatar if applicable

### Status badges
- Semantic colors with subtle backgrounds: 
  - Success: bg-green-50 text-green-700 (not bright green background)
  - Warning: bg-amber-50 text-amber-700
  - Danger: bg-red-50 text-red-700
  - Neutral: bg-gray-100 text-gray-600
- Pill shape: rounded-full px-2.5 py-0.5 text-xs font-medium

### Cards / sections
- bg-white rounded-lg shadow-sm border border-gray-200
- Internal padding p-4 or p-6
- Section title: text-sm font-semibold text-gray-900, optional subtitle in text-xs text-gray-500
- Never a card with just one number — always context, comparison, or supporting detail

### Charts
- Use Chart.js with brand-derived colors
- Muted gridlines (color: 'rgba(0,0,0,0.05)')
- Clean axis labels (text-xs, gray-500)
- Always a title and timeframe context
- Horizontal bar charts for rankings/categories (more readable than vertical for labels)
- Sparklines in KPI rows: tiny (h-8 w-24), no axes, just the trend shape

## CTA strength

Every app surface must have a clear, visually dominant primary call to action:

- **One primary CTA per surface** — filled background using the brand's action color, white text, prominent size. The user's eye lands here naturally.
- **Visual distinction**: The primary CTA must pass a 3:1 contrast ratio against its container. If it blends with surrounding cards or panels, it fails.
- **Action-oriented labels**: "Reconcile next folio" not "Submit." "Start audit" not "Begin." The label describes the outcome, not the mechanism.
- **Secondary CTAs**: Outlined or ghost buttons. Never compete visually with the primary.
- **No competing CTAs above the fold**: If two buttons look equally important, neither gets clicked.

## Dual-persona design

Every app must serve two users simultaneously:

### Power user (1000th visit)
- Keyboard shortcuts for common actions where applicable
- Dense views available (toggle or default for operational surfaces)
- Quick filters that remember last-used state
- Minimal onboarding friction — the app gets out of the way
- The primary task completes in 3 clicks or fewer

### First-time user (day 1)
- Clear labels on every interactive element — no icon-only buttons without tooltips
- Guided happy path — the primary CTA is unmissable
- Empty states provide explicit guidance ("Drop a folio PDF here to start")
- Loading states show meaningful progress, not generic spinners
- Context cues explain what data means ("vs last quarter" next to a number)

Both personas share the same UI — the design serves both through **clear hierarchy** and **progressive disclosure**, not separate modes.

## Happy-path optimization

The primary workflow must be frictionless:

- **Zero dead clicks** — every interactive element produces visible feedback
- **Immediate visual feedback** — button press shows loading state within 100ms
- **No unnecessary modals or confirmations** on the hot path (the action the user does most often)
- **Optimistic UI** only when safe — show the result immediately, sync in background
- **Error recovery** — if something fails, the user can retry without losing their work
- **Count the clicks** — from app open to primary task completion, target 3 clicks or fewer. Document the count in BUILD-SPEC and verify at G1/J1.

## Anti-patterns (never do these)

- Default browser blue (#0000EE) links or bright Bootstrap blue (#0d6efd) buttons
- Rainbow color schemes — more than 3 hues outside of semantic states
- Marketing-page whitespace in operational tools (huge padding, centered single column)
- Identical gray-on-white for every app regardless of customer
- Giant cards with one number and no context
- Tables where every cell is the same visual weight (no hierarchy)
- Emojis as icons (use Lucide or inline SVG)
- Centered layouts for data-heavy apps (left-align is faster to scan)
- Default form styling (unstyled inputs, default checkboxes)
- Purple gradients (`linear-gradient(135deg, #667eea, #764ba2)`) — banned
- Flat single-source shadows (`box-shadow: 0 4px 6px rgba(0,0,0,0.1)`) — use layered shadows from `domo-design-playbook.md`
- Generic blues (#3B82F6, #2563EB) for buttons — use customer's action color
- Pure black (#000000) — use #3F454D or the customer's ink color
