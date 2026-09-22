# Persona Identification Template

Before making any architecture or design decisions, identify who will use this app. The audience shapes every downstream choice — layout complexity, data density, interaction patterns, and visual style.

## Dimensions to Gather

| Dimension | Question | Impact |
|-----------|----------|--------|
| **Role** | Who is the primary user? (executive, analyst, ops manager, field rep, customer) | Executives need glanceable KPIs; analysts need drill-down; ops needs action buttons |
| **Technical literacy** | How comfortable are they with data tools? | Low literacy → simpler UI, guided interactions, fewer controls. High literacy → dense tables, filters, raw data access |
| **Device context** | Desktop, tablet, mobile, or TV/kiosk? | Mobile → larger touch targets (44px min), stacked layout. TV → high contrast, no hover states |
| **Primary task** | What are they trying to DO with this app? (monitor, explore, input, compare, act) | Monitor → auto-refresh dashboards. Input → forms with validation. Compare → side-by-side layouts |
| **Frequency** | Daily driver or occasional check-in? | Daily → optimize for speed, minimize clicks. Occasional → optimize for clarity, add context/labels |
| **Success metric** | What does "this app worked" look like? | Defines the acceptance criteria — "I found the answer in <10 seconds" vs "I submitted the form without errors" |

## Usage

If the user doesn't specify the audience, ask before proceeding:

> "Who will use this app? Knowing the audience helps me make better design choices — things like layout density, interaction patterns, and how much context to show."

If the user wants to skip, default to: **mid-technical business user on desktop, daily usage, monitoring task**. Document the assumption.

Record the persona in a `PERSONA.md` file in the project root for reference during implementation.
