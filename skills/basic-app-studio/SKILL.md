---
name: basic-app-studio
tier: 0
description: "Router skill for Domo App Studio — CLI authentication, conventions, and directory of component-specific skills. Start here for App Studio work, then follow links to component skills. Trigger with 'app studio', 'app studio help', 'which app studio skill'."
maturity: beta
audience: [code]
---


# App Studio Skill — CLI Edition (Router)

Start here for all App Studio work. This skill covers CLI authentication and conventions, then routes you to the component-specific skill for the task at hand.

---

## Authentication

Run once per instance. No manual token or header management needed after this.

```bash
domo login -i myinstance.domo.com
```

The CLI reads the saved session automatically on every command. Set a default instance so you
don't have to pass `--instance` every time:

```bash
community-domo-cli config set-profile --name default --instance myinstance --make-default
```

All examples below assume a default profile is set. If not, prepend
`--instance myinstance.domo.com` to every command.

---

## CLI Conventions

```bash
# Global flags come BEFORE the subcommand group
community-domo-cli --output json --instance myco app-studio get 12345

# Mutating commands require --yes (-y) to skip confirmation
community-domo-cli -y app-studio create --body-file app.json

# Dry-run shows the exact HTTP request without executing
community-domo-cli --dry-run app-studio layout-set $APP_ID $VIEW_ID --body-file layout.json

# Capture JSON output for scripting
APP_ID=$(community-domo-cli --output json app-studio create --body '{"title":"My App"}' -y \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['dataAppId'])")
```

---

## Component Skills

For detailed API payloads and workflows, use the component-specific skill:

| Need | Skill |
|---|---|
| KPI chart cards (207 chart types) | `card-creation` |
| Banner component | `appstudio-banner` |
| Details / record view | `appstudio-details` |
| Filter list | `appstudio-filter-list` |
| Gallery / card grid | `appstudio-gallery` |
| List component | `appstudio-list` |
| Action buttons | `appstudio-action-button` |
| Tab container | `appstudio-tab` |
| Pages & navigation | `appstudio-pages` |
| Layout grid system | `appstudio-layouts` |
| Header / text divider | `appstudio-header` |
| Static image | `appstudio-image` |
| Dashboard design rules | `appstudio-dashboard-design` |
| Themes & colors | `domo-app-theme` |
| Beast modes / calculated fields | `beast-mode-creation` |
| Card variables & controls | `variable-creation` |
| Pro-code custom apps in App Studio | `app-studio-pro-code` |

---

## Endpoint Reference

| Operation | CLI command | Notes |
|---|---|---|
| List apps | `app-studio list` | |
| Get app | `app-studio get APP_ID` | Includes views, nav, theme |
| Create app | `app-studio create --body-file` | Returns dataAppId + landingViewId |
| Update app | `app-studio update APP_ID --body-file` | Full body required |
| Create view | `app-studio create-view APP_ID --body-file` | Returns view + layout |
| **List views** | *(use `app-studio get`, read `views[]`)* | Dedicated endpoint is dead (405) |
| Get layout | `app-studio layout-get APP_ID VIEW_ID` | |
| Update layout | `app-studio layout-set APP_ID VIEW_ID --body-file` | Auto write lock |
| Get navigation | `pages nav-get` | Instance-wide |
| Reorder pages | `pages nav-reorder --body` | |
| List page cards | `pages list-cards PAGE_ID` | |
| Add card to page | `pages add-card PAGE_ID CARD_ID` | Goes to appendix |
| Create card | `cards create --page-id PAGE_ID --body-file` | Goes to appendix |
| Update card | `cards update CARD_ID --body-file` | |
| Read card definition | `cards definition CARD_ID` | Fix format mismatches before write |
| Dataset schema | `datasets schema DATASET_ID` | |
| Upload file/icon | `files upload --file-path FILE` | |
| DomoApps context | `domoapps context-create --body-file` | |
| DomoApps card | `domoapps card-create --page-id PAGE_ID --body` | |
| Create variable | `beast-modes create --body-file` | Set `variable: true` |

---

## Source

Adapted from [stahura/domo-ai-vibe-rules](https://github.com/stahura/domo-ai-vibe-rules) — Riley Stahura's Domo AI skills collection.
