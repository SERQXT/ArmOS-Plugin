---
description: List Domo MCP servers, repoint the primary domo-mcp server, or add a new per-customer server (Codex edition)
argument-hint: "[list | <instance-name> | add <name> <subdomain>]"
---

You manage the Domo MCP servers for **OpenAI Codex** in `~/.codex/config.toml`
(or a project-local `./.codex/config.toml`). The convention matches the Claude
Code side exactly:

- **`domo-mcp`** is the **primary / active-customer** server. You *repoint* it
  (swap its `url` + token env var) as you move between customers.
- **Every additional customer** gets its **own** server named **`domo-<instance>`**
  in the same layout — an `X-DOMO-DEVELOPER-TOKEN` header sourced from
  `env_http_headers`.

Each server is a `[mcp_servers.<name>]` table. Token-gated servers use:

```toml
[mcp_servers.domo-<name>]
url = "https://<subdomain>.domo.com/api/ai/v1/assistant/mcp/toolkits/DOMO_BASIC_MCP"
env_http_headers = { "X-DOMO-DEVELOPER-TOKEN" = "DOMO_<NAME_UPPER_SNAKE>_DEVELOPER_TOKEN" }
```

`env_http_headers` maps the header name to an **environment variable name** —
Codex reads the value from your shell env at runtime, so the token itself never
goes in the file. Anonymous toolkits omit `env_http_headers` entirely.

The requested action is: **$ARGUMENTS**

Follow the branch that matches:

## No argument, or `list`
1. Read `~/.codex/config.toml` (fall back to `./.codex/config.toml` if present).
2. For each `[mcp_servers.domo-*]` table, report its name, `url`, and — for
   token-gated ones — the env var named in `env_http_headers`.
3. For each token env var, check whether it is exported in the current shell
   (`printenv <VAR> >/dev/null && echo set || echo missing`) and report
   "set" / "missing" WITHOUT ever printing the value. Anonymous servers have no var.
4. Print a table: server | url | token status. Remind the user they can repoint
   the primary with `/server <name>` or add a customer with `/server add`.

## An instance name (e.g. `/server wings-travel`)
Repoints the **primary `domo-mcp`** server at that instance.
1. Rewrite the `[mcp_servers.domo-mcp]` table so its `url` points at
   `https://<instance>.domo.com/api/ai/v1/assistant/mcp/toolkits/DOMO_BASIC_MCP`
   and its `env_http_headers` var is `DOMO_<INSTANCE_UPPER_SNAKE>_DEVELOPER_TOKEN`.
   Change ONLY the `domo-mcp` table; leave per-customer servers untouched.
2. Check that the token env var is exported (`printenv`). If missing, tell the
   user to export it (never print the value) — auth will fail without it.
3. Tell the user to **restart Codex** (or reconnect MCP) for the change to load,
   and confirm the new primary instance.

## `add <name> <subdomain>`
Stands up a **new per-customer server** `domo-<name>` alongside the existing ones.
1. Derive the env var as `DOMO_<NAME_UPPER_SNAKE>_DEVELOPER_TOKEN`.
2. Add a new `[mcp_servers.domo-<name>]` table:
   `url` = `https://<subdomain>.domo.com/api/ai/v1/assistant/mcp/toolkits/DOMO_BASIC_MCP`,
   `env_http_headers = { "X-DOMO-DEVELOPER-TOKEN" = "<that var>" }`. (If the toolkit
   id differs from `DOMO_BASIC_MCP`, ask or accept it as a further arg.) Do NOT
   disturb the other tables.
3. Tell the user to export the real token in their shell profile themselves, then
   **restart Codex** to connect the new `domo-<name>` server.

## Guardrails
- NEVER print, echo, or commit token values. Report only "set" / "missing".
- When repointing, edit ONLY the `domo-mcp` table. When adding, add a NEW
  `domo-<name>` table and leave existing servers untouched.
- After any change to `config.toml`, always remind the user Codex must be
  restarted (or MCP reconnected) for it to take effect.
