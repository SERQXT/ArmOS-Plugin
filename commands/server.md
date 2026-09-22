---
description: List Domo MCP servers, repoint the primary domo-mcp server, or add a new per-customer server
argument-hint: "[list | <instance-name> | add <name> <subdomain>]"
allowed-tools: Read, Edit, Bash(grep:*)
---

You manage the Domo MCP servers in `.mcp.json`. The convention:

- **`domo-mcp`** is the **primary / active-customer** server. You *repoint* it
  (swap its `url` + token var) as you move between customers. Its tools arrive as
  `mcp__domo-mcp__*`.
- **Every additional customer** you need concurrently gets its **own** server
  named **`domo-<instance>`** in the same layout — an `X-DOMO-DEVELOPER-TOKEN`
  header set to `${DOMO_<INSTANCE_UPPER_SNAKE>_DEVELOPER_TOKEN}`. Its tools arrive
  as `mcp__domo-<instance>__*`.

Known instances live in `.claude/instances.json` (each records its `server`,
`url`, and `tokenVar`); tokens live in `.env` (git-ignored), referenced by env
var name only.

The requested action is: **$ARGUMENTS**

Follow the branch that matches:

## No argument, or `list`
1. Read `.claude/instances.json` and `.mcp.json`.
2. For each server in `.mcp.json`, identify its instance (match `url` to the
   registry) and whether it's the primary `domo-mcp` or a per-customer server.
3. For each, check whether its `tokenVar` appears in `.env`
   (run `grep -oE '^<TOKENVAR>=' .env` — report token as "set" / "missing"
   WITHOUT ever printing the value). Note that `domo-stark` needs no token.
4. Print a table: server | instance | token status. Then remind them: repoint the
   primary with `/server <name>`, or stand up a new customer with `/server add`.

## An instance name (e.g. `/server wings-travel`)
Repoints the **primary `domo-mcp`** server at that instance.
1. Read `.claude/instances.json`. If the name isn't registered, list the known
   names and stop (suggest `/server add`).
2. Read `.mcp.json`. Rewrite the `domo-mcp` server block so its `url` = the
   registry `url` and its `X-DOMO-DEVELOPER-TOKEN` header = `${<tokenVar>}`.
   Change ONLY the `domo-mcp` block; leave any per-customer servers untouched.
3. Check the instance's `tokenVar` is present in `.env` via grep. If missing, tell
   them to add it (never print token values) — the switch will fail to auth
   without it.
4. Tell the user the switch is written and they MUST **reload MCP** for it to take
   effect: run `/mcp` (reconnect) or restart the session. Confirm the new primary
   instance.

## `add <name> <subdomain>`
Stands up a **new per-customer server** `domo-<name>` alongside the existing ones.
1. Derive `tokenVar` as `DOMO_<NAME_UPPER_SNAKE>_DEVELOPER_TOKEN`.
2. Read `.mcp.json` and add a new server block keyed `domo-<name>`:
   `url` = `https://<subdomain>.domo.com/api/ai/v1/assistant/mcp/toolkits/DOMO_BASIC_MCP`,
   header `X-DOMO-DEVELOPER-TOKEN` = `${<tokenVar>}`. (If the user knows the
   toolkit id differs from `DOMO_BASIC_MCP`, ask or accept it as a further arg.)
   Do NOT disturb the other server blocks.
3. Add a matching entry to `.claude/instances.json` (`server` = `domo-<name>`,
   `url`, `tokenVar`).
4. Add the `tokenVar` line to `.env.example` with a placeholder.
5. Tell the user to add the real token to `.env` themselves (via `!` prefix so it
   stays out of the transcript), then **reload MCP** (`/mcp` or restart) to
   connect the new `domo-<name>` server. Its tools will be `mcp__domo-<name>__*`.

## Guardrails
- NEVER print, echo, or commit token values. Report only "set" / "missing".
- When repointing, edit ONLY the `domo-mcp` block. When adding, add a NEW
  `domo-<name>` block and leave existing servers untouched.
- After any change to `.mcp.json`, always remind the user MCP must be reloaded.
