# UX Design Validation Checklist

Before publishing, review the implemented code against UX best practices. This is a code review focused on the user experience, not functionality. Reference the persona and spec throughout.

## Layout & Visual Hierarchy

- [ ] Clear visual hierarchy — the most important information is the most prominent (larger, bolder, higher on page)
- [ ] Consistent spacing — margins and padding follow a consistent scale (e.g., 8px grid)
- [ ] Logical grouping — related elements are visually grouped; unrelated elements have clear separation
- [ ] No orphaned elements — nothing floats alone without context or label
- [ ] Responsive behavior — layout doesn't break at common viewport widths (if applicable to device context)

## Typography & Readability

- [ ] Font sizes are readable — body text >= 14px, labels >= 12px, headings clearly differentiated
- [ ] Line lengths are comfortable — 45-75 characters per line for body text
- [ ] Sufficient contrast — text meets WCAG AA minimum (4.5:1 for body text, 3:1 for large text)
- [ ] Data values are formatted — numbers have thousands separators, dates are human-readable, percentages have consistent decimals

## Interaction Design

- [ ] Interactive elements are obvious — buttons look clickable, links are distinguishable, hover states exist (desktop)
- [ ] Touch targets are adequate — minimum 44x44px for mobile/tablet contexts
- [ ] Loading states exist — users see feedback while data loads (spinner, skeleton, or progress indicator)
- [ ] Empty states are handled — if no data, show a helpful message instead of blank space
- [ ] Error states are handled — if a data call fails, show a user-friendly message instead of a broken UI

## Information Density (calibrate to persona)

- [ ] Executive users → high-level KPIs first, details on demand
- [ ] Analyst users → dense data is OK, provide filter/sort controls
- [ ] Ops/field users → action-oriented layout, minimal scrolling to key actions
- [ ] Low-tech users → generous whitespace, clear labels, guided flow

## Color & Branding

- [ ] Color is used meaningfully — not decoratively (green = good, red = alert, not random)
- [ ] Color is not the ONLY indicator — patterns, icons, or text reinforce color meaning (accessibility)
- [ ] Palette is limited — 2-3 primary colors max, plus neutrals. Avoid rainbow charts unless categorical data demands it

## Review Process

1. Read through the app's HTML, CSS, and JS/TSX files checking each item above
2. For any failures, fix the issue directly in the code
3. Re-check the fixed item
4. Log what was fixed (include in deployment notes)

> **This is a SOFT gate** — not every item must pass for every app (a simple KPI card doesn't need loading states for a single `domo.get()` call). Use judgment calibrated to the app's complexity and persona. But any app with 3+ UX failures should be fixed before publishing.
