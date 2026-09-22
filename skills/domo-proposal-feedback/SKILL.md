---
name: domo-proposal-feedback
tier: 0
maturity: alpha
owner: Mark Lees
description: "Cloudflare Worker proxy for client feedback on published Domo proposals. Adds a floating Feedback button, stores comments in a Domo Dataset, supports SA inline replies. Infrastructure companion to domo-interactive-proposal-builder."
---

# domo-proposal-feedback

Companion to `domo-interactive-proposal-builder`. Deploys a Cloudflare Worker proxy that lets unauthenticated clients submit feedback on a published Domo proposal card, and lets the SA respond inline — all stored in a Domo Dataset.

---

## What this plugin does

- Adds a floating **Feedback** button to any proposal card that has `feedback.enabled: true` in its engagement JSON.
- Clients leave comments without needing a Domo account.
- SA replies appear inside the card under the original comment.
- New client comments trigger a Domo Buzz notification to the SA.
- All data lives in a single Domo Dataset (one row per comment, keyed by `proposal_id`).

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Cloudflare account (free tier OK) | [cloudflare.com](https://cloudflare.com) |
| Wrangler CLI | `npm install -g wrangler` |
| Domo OAuth client | Create at **Admin → Security → Access Tokens → OAuth Clients**; needs `data` + `buzz` scopes |
| Domo Dataset | Webform or CSV-type dataset — see schema below |

---

## Step 1 — Create the Domo feedback Dataset

In your Domo instance, create a new **Webform** dataset named `proposal-feedback` with these columns:

| Column | Type |
|---|---|
| proposal_id | Text |
| comment_id | Text |
| created_at | Text |
| author_type | Text |
| author_name | Text |
| message | Text |
| parent_id | Text |
| status | Text |

Note the **Dataset ID** from the URL: `https://YOUR_INSTANCE.domo.com/datasources/{DATASET_ID}/details/overview`

---

## Step 2 — Deploy the Cloudflare Worker

```bash
cd plugins/domo-proposal-feedback/worker
npm install -g wrangler   # if not already installed
wrangler login
wrangler deploy
```

Set secrets (you will be prompted for each value):

```bash
wrangler secret put DOMO_CLIENT_ID       # OAuth client ID from Domo
wrangler secret put DOMO_CLIENT_SECRET   # OAuth client secret from Domo
wrangler secret put SIGNING_SECRET       # Any random string — keep this private
wrangler secret put DATASET_ID           # Dataset ID from Step 1
wrangler secret put BUZZ_CHANNEL_ID      # (Optional) Domo Buzz channel ID for SA alerts
```

Your Worker URL will be: `https://domo-proposal-feedback.YOUR_ACCOUNT.workers.dev`

---

## Step 3 — Generate a proposal signature

For each proposal you want to enable feedback on, run:

```bash
cd plugins/domo-proposal-feedback/worker
python3 setup-sig.py pha-2026-v1
# (enter SIGNING_SECRET when prompted, or set env var)
```

This outputs the `proposal_sig` value to add to your engagement JSON.

---

## Step 4 — Add feedback config to your engagement JSON

```json
"feedback": {
  "enabled": true,
  "worker_url": "https://domo-proposal-feedback.YOUR_ACCOUNT.workers.dev",
  "proposal_id": "pha-2026-v1",
  "proposal_sig": "abc123...hex..."
}
```

Re-render the proposal with `generate.py` and re-publish the card in Domo.

---

## SA response mode

When reviewing a proposal, append `?sa=1&sa_name=Mark+Lees` to the card URL. This:
- Pre-fills your name in the compose field (read-only)
- Shows **Reply** buttons under each client comment
- Marks submissions as `author_type: sa` (displayed as "Domo SA")

---

## Security model

- Each proposal card has its `proposal_sig` baked in at render time.
- `proposal_sig = HMAC-SHA256(SIGNING_SECRET, proposal_id)` — generated offline by the SA.
- The Worker validates the sig on every request. A stolen card can only post to its own `proposal_id` — not forge sigs for other proposals.
- `SIGNING_SECRET` never leaves your Cloudflare Worker secrets store.
- SA mode is via URL param — adequate for internal review use; not a hard auth boundary.
