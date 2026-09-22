# Engagement context app — canonical template on domo-squads

**This is a pre-built Domo ProCode app** that already exists on the internal instance. Agents do NOT build it from scratch — they clone/copy it for each engagement and inject customer-specific copy.

## Template reference

| Item | Value |
|------|-------|
| **Template design ID** | `577df218-2be1-43bf-9b51-56abe8c679e1` |
| **Instance** | `domo-squads.domo.com` (internal) |
| **Pro-Code editor** | https://domo-squads.domo.com/pro-code-editor/577df218-2be1-43bf-9b51-56abe8c679e1 |
| **Behavior & slots** | [`modules/engagement-context-app-template.md`](../../modules/engagement-context-app-template.md) |
| **Copy to inject** | `spec/ENGAGEMENT-CONTEXT-COPY.md` (generated at stages F and H) |

## How agents use this (G1 instruction)

1. **Clone the template** — use `domo-publish` or the Domo design API to create a **copy** of design `577df218-2be1-43bf-9b51-56abe8c679e1` for this engagement. Name it `500Apps|{customer}|Context`.
2. **Inject copy** — read `spec/ENGAGEMENT-CONTEXT-COPY.md` and update the app's content slots (problem, outcome, metrics, features, scope). The template already has the layout, branding, and structure.
3. **Deploy on the same page as MVP** — either stacked (context above, MVP below) or App Studio Tab 1 (context) / Tab 2 (MVP). Document the layout in `artifacts/MVP-V1-NOTES.md`.
4. **Do NOT rebuild the template layout** per engagement — only parameterize content.

## Updating the template

If the template design needs changes (layout, branding, structure), edit the original at `577df218-2be1-43bf-9b51-56abe8c679e1` on domo-squads. All future clones inherit the update.

## Local preview (standalone HTML)

`index.html` in this folder is a **standalone HTML version** of the presentation for local preview and ArmOS modal viewing. It parses `ENGAGEMENT-CONTEXT-COPY.md` slots and renders them. This is NOT what gets deployed to Domo — the Domo version is the ProCode app at the design ID above.
