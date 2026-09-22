# ArmOS on OpenAI Codex

ArmOS ships as a Claude Code plugin, but its two portable layers — the **skill
library** and the **Domo MCP connection** — work with the OpenAI Codex CLI too.
This directory holds the Codex-specific pieces; the `skills/` directory at the
repo root is shared by both tools.

## What maps across

| Layer | Claude Code | Codex |
|---|---|---|
| Skills | `claude plugin install` auto-loads `skills/` | `~/.agents/skills/` (user) or `.agents/skills/` (repo) — same `SKILL.md` files |
| `/server` | `commands/server.md` slash command | `~/.codex/prompts/server.md` custom prompt (`codex/prompts/server.md`) |
| Domo MCP | `.mcp.json` (`${VAR}` token refs) | `~/.codex/config.toml` `[mcp_servers.*]` (`env_http_headers` token refs) |

Both tools read the *same* `SKILL.md` format (the open agent-skills standard:
`name` + `description` frontmatter, optional `scripts/`/`references/`/`assets/`),
so no conversion is needed — only placement.

## Install

From the repo root:

```sh
scripts/install-codex.sh
```

This symlinks every skill in `skills/` into `~/.agents/skills/<name>` and the
`/server` prompt into `~/.codex/prompts/server.md`. Because they are symlinks,
re-running `scripts/build-skills.sh` refreshes what Codex sees with no reinstall.
Run `scripts/install-codex.sh --uninstall` to remove only the links it created.

Skills already present in `~/.agents/skills` are left untouched and reported, so
the script never clobbers your own skills.

## Connect a Domo instance

```sh
cp codex/config.toml.example ~/.codex/config.toml
# edit the url(s), then export the token env var(s) in your shell profile:
export DOMO_<YOUR_INSTANCE>_DEVELOPER_TOKEN=...
```

`env_http_headers` maps the `X-DOMO-DEVELOPER-TOKEN` header to an environment
variable *name*; Codex reads the value from your shell at runtime, so the token
never lands in the config file. Restart Codex after editing, then use `/server`
to list, repoint, or add instances.

## Caveats

- **MCP tool names differ.** Claude Code exposes the tools as
  `mcp__domo-mcp__*`; Codex namespaces MCP tools its own way. Skills that quote
  the `mcp__…` names still read fine as guidance — the agent calls whatever the
  connected server actually exposes — but the literal names won't match.
- **Not every skill is Codex-tuned.** OpenAI's docs note the two skill systems
  are compatible in format but "not directly interchangeable"; skills that lean
  on Claude-Code-only commands may need small edits.
- **Streamable HTTP MCP.** If your Codex build doesn't connect to HTTP MCP
  servers by default, add `experimental_use_rmcp_client = true` at the top level
  of `~/.codex/config.toml`.
