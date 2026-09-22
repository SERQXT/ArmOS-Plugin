---
name: deployinsights
description: "Deploy the white-label AI Insights Custom App (aiInsightsApp) and its three Code Engine functions (getPageCardDefinitions, queryCard, analyzeCard) to a chosen Domo instance, and optionally the audit viewer (aiInsightsDebugViewer). The skill ASKS which instance to deploy to, handles the developer token, resets the manifest for a fresh instance vs. a redeploy, and respects the Code Engine release gate. Trigger with '/deployinsights', 'deploy insights', 'deploy the white label app', 'publish aiInsightsApp to <instance>'."
maturity: stable
audience: [code]
---

# Deploy AI Insights (white-label) to a Domo instance

Publishes the **white-label `aiInsightsApp`** — the generic AI executive-narrative
Custom App with root-cause analysis and AppDB debug capture — plus its **three Code
Engine packages**, to whatever Domo instance the user names. Optionally also publishes
the **`aiInsightsDebugViewer`** audit app.

## Release safety rule (HARD)

NEVER call any Code Engine release endpoint, and never pass `--release` to `deploy.sh`,
unless the user has **explicitly said "release"** for this deploy. Do not infer release
from "publish", "deploy", "with the code engine functions", "make it work", or "finish".
If a working deploy needs release, create + publish first, then ask the user to say
"release" (or offer a "create + release + publish" vs "create + publish, no release"
choice and let them pick). Their pick of the release option counts as explicit consent.

## Locate the package

The app + CE source + deploy script live together. Find them (don't hardcode a stale path):

```bash
find ~/orca -type f -path '*aiInsightsApp-whitelabel/deploy.sh' 2>/dev/null | head -1
```

That directory (`aiInsightsApp-whitelabel/`) contains `app/` (the 5 build files +
`manifest.json`), `codeengine/` (the 3 `.js` packages), and `deploy.sh`. The audit
viewer, if wanted, is a sibling `aiInsightsDebugViewer/` with its own `deploy.sh`.

## Step 1 — Ask which instance

Ask the user for the target instance host (e.g. `acme.domo.com`). Always ask; never
assume. This is the skill's defining prompt.

## Step 2 — Developer token

`deploy.sh` needs a developer token for that instance (Admin → Security → Access tokens),
with Code Engine + Custom App rights. Keep it out of the transcript: create/open a file
for the user and read from it.

```bash
touch ~/.<slug>_token && chmod 600 ~/.<slug>_token && open -a TextEdit ~/.<slug>_token
```

(`<slug>` = the instance's first label, e.g. `acme`.) Wait for them to paste + save, then
verify it's non-empty with no whitespace before using `"$(cat ~/.<slug>_token)"`. If a
token file for the instance already exists and is valid, reuse it.

## Step 3 — Fresh instance vs. redeploy (manifest wiring)

`app/manifest.json` holds ONE instance's wiring at a time (the CE `packageId`s and the
design `id` of whichever instance it was last deployed to). It has no instance field, so
determine the case programmatically: read a `packageId` from the manifest and GET it on
the **target** instance:

```bash
curl -sS "https://<instance>/api/codeengine/v2/packages/<manifest_packageId>/versions/1.0.0" \
  -H "X-DOMO-Developer-Token: $TOKEN" | python3 -c "import sys,json;print('ok' if json.load(sys.stdin).get('packageId') else 'no')" 2>/dev/null || echo no
```

- **Fresh instance** (404 / `no`, or a placeholder `__…__` id, or blank): the packages
  and design don't exist there. **Reset the manifest** to placeholders + blank id so the
  target gets its own fresh CE packages and a new design:
  ```python
  # id -> "", packageId -> "__GET_PAGE_CARD_DEFINITIONS_PACKAGE_ID__" / "__QUERY_CARD_PACKAGE_ID__" /
  # "__ANALYZE_CARD_PACKAGE_ID__", version -> "1.0.0"; leave collectionsMapping + datasetsMapping + version.
  ```
  Before overwriting, RECORD the current wiring (design id + the 3 packageIds) back to the
  user, so the previous instance can be re-wired later if needed.
- **Redeploy to the same instance the manifest already targets** (`ok`): do NOT reset.
  For an app-only change use `--skip-ce` (no CE touched, no release needed). For a CE code
  change, run without `--skip-ce` so `deploy.sh`'s idempotent guard creates only new/
  placeholder packages.

## Step 4 — Run the deploy

From the package directory:

```bash
./deploy.sh --instance <instance> --token "$(cat ~/.<slug>_token)" [--app-name "<Name>"] [--release] [--skip-ce]
```

- `--release` ONLY if the user explicitly said release (see the hard rule).
- `--app-name` optional — sets the product name shown in the header/tab (`WL_CONFIG.appTitle`).
- `deploy.sh` creates the CE packages idempotently (skips ones already wired to a real id
  on that instance), wires their ids into the manifest, publishes the app from a clean
  5-file dir, and saves the new design id back into the manifest.

## Step 5 — Verify + report

- Confirm each released CE version has a non-null `releasedOn` (GET
  `/api/codeengine/v2/packages/<id>/versions/1.0.0`). Only meaningful if `--release` ran.
- Report the design URL (`https://<instance>/assetlibrary?designId=<id>`) and the three
  packageIds.
- Remind: the app→CE proxy runs the **latest released** version, so unreleased CE = the
  app can't fetch definitions or figures. And add the app card to an App Studio page with
  cards + filters, then open + Refresh.

## Optional — audit viewer

If the user wants the debug audit trail on that instance too, deploy the sibling
`aiInsightsDebugViewer` (publish-only, no CE, no release):

```bash
cd ../aiInsightsDebugViewer && ./deploy.sh --instance <instance> --token "$(cat ~/.<slug>_token)"
```

It reads the `aiInsightsDebug` AppDB collection, which the main app creates on its first
generation — so run one generation before expecting data.

## Cleanup

Offer to delete the staged token file(s) (`rm ~/.<slug>_token`) when the user is done
deploying. Never print token contents.

## Checklist

- [ ] Asked the user which instance
- [ ] Token staged for that instance (verified non-empty, no whitespace)
- [ ] Fresh vs. redeploy determined; manifest reset only when fresh (previous wiring recorded)
- [ ] `--release` used ONLY on explicit "release"
- [ ] Verified releasedOn (if released) + reported design URL + packageIds
- [ ] Offered the audit viewer + token cleanup
