# ArmOS-Plugin

**ArmOS** packages various Domo skills and tools into a single installable
package, letting agents talk to a Domo instance to query datasets and build
pro-code applications. It works with both **Claude Code** (as a plugin) and
**OpenAI Codex** (as skills + a custom prompt + MCP config).

> **Disclaimer:** This is not an official Domo tool. Use at your own risk.

Installing it gives your agent the full ArmOS skill library: ~210 skills
covering the Domo platform (App Studio, cards, beast modes, Magic ETL, AppDB,
Code Engine, datasets/SQL, filesets), the PS engagement pipeline
(discover to align to build to adopt), proposals and client-ready deliverables,
and Compass portfolio intelligence — plus the `/server` command for pointing the
agent at a customer's Domo instance over MCP.

## What's in the box

| Component | Claude Code | Codex | Notes |
|---|---|---|---|
| ~210 skills | Yes (`skills/`) | Yes (`~/.agents/skills`) | Same `SKILL.md` files; both tools read them natively. |
| `/server` command | `commands/server.md` | `~/.codex/prompts/server.md` | Lists / repoints / adds Domo MCP servers. |
| Domo MCP servers | **No** — build with `/server` | **No** — build from `codex/config.toml.example` | Per-customer and secret-bearing; you create them post-install. |
| Model / auth wiring | `templates/settings.example.json` | shell env + `config.toml` | Never shipped — secrets stay yours. |
| Helper scripts | `scripts/` | `scripts/install-codex.sh` | `build-skills.sh`, `armos` launcher, `cortex-key-helper.sh`, `install-codex.sh`. |

No MCP server or token is ever bundled: the Claude manifest sets
`"mcpServers": {}`, and the Codex config is a token-free `.example`. Installing
ArmOS never leaks a developer token and never hardcodes one operator's customers.

## Install — Claude Code

```sh
claude plugin marketplace add SERQXT/ArmOS-Plugin
claude plugin install ArmOS-Plugin@ArmOS-Plugin
```

Skills and the `/server` command are available immediately. Two things are then
set up per-environment (not shipped in the plugin):

### 1. Connect a Domo instance (MCP + tokens)

ArmOS talks to Domo over per-customer MCP servers you declare in your
**project** root, not in the plugin:

1. Copy the templates into your working project:
   - `templates/env.example` -> `.env`
   - `templates/mcp.example.json` -> `.mcp.json`
   - `templates/instances.example.json` -> `.claude/instances.json`
2. Put a real Domo developer token in `.env` (generate under
   **Admin -> Authentication -> Access Tokens** in the Domo instance).
   `.env` is git-ignored — never commit it.
3. Use `/server` to manage instances:
   - `/server list` — show connected servers
   - `/server add <name> <subdomain>` — add a per-customer server
   - `/server <instance-name>` — repoint the primary `domo-mcp` server

The primary server is always `domo-mcp` (repoint it per engagement). Additional
customers become `domo-<instance>` with an `X-DOMO-DEVELOPER-TOKEN` header set to
`${DOMO_<INSTANCE>_DEVELOPER_TOKEN}`. Anonymous toolkits need no token.

### 2. Model auth (Domo Cortex, optional)

If you run Claude Code against Domo's Snowflake Cortex Anthropic endpoint rather
than the public API, copy `templates/settings.example.json` into your project's
`.claude/settings.json`, place `scripts/cortex-key-helper.sh` at
`bin/cortex-key-helper.sh`, and store the Snowflake PAT in the macOS Keychain
under service name `domo-ai-devkit-snowflake-pat`. The `scripts/armos`
launcher sources `.env` and execs `claude` for convenience.

## Install — OpenAI Codex

Clone this repo, then from its root:

```sh
scripts/install-codex.sh
cp codex/config.toml.example ~/.codex/config.toml   # edit urls, export token vars
```

`install-codex.sh` symlinks every skill into `~/.agents/skills/` and the
`/server` prompt into `~/.codex/prompts/`, so Codex picks them up in every
session. See [`codex/README.md`](codex/README.md) for the full walkthrough,
the MCP config format (`[mcp_servers.*]` with `env_http_headers`), and the
cross-tool caveats.

## Refreshing the skill library

`scripts/build-skills.sh` re-flattens skills from an ArmOS source tree
(`~/.armos/skills` by default, or `$ARMOS_SKILLS_DIR`) into `skills/`,
dereferencing symlinks so the repo ships real directories. Because the Codex
install uses symlinks into `skills/`, that refresh reaches Codex with no
reinstall. After refreshing, bump `version` in `.claude-plugin/plugin.json` and
`marketplace.json`, then commit and push.

## Layout

```
.claude-plugin/
  plugin.json            # Claude manifest (mcpServers:{} opt-out; no hooks/agents fields)
  marketplace.json       # makes it claude-plugin-installable
  PLUGIN_SCHEMA_NOTES.md # validator rules — read before editing plugin.json
skills/                  # ~210 skill directories, each <name>/SKILL.md  (shared)
.agents/skills           # -> ../skills  (repo-level Codex skill discovery)
commands/server.md       # the /server slash command (Claude Code)
codex/
  README.md              # Codex setup + caveats
  config.toml.example    # Domo MCP servers in Codex TOML (no tokens)
  prompts/server.md      # /server as a Codex custom prompt
scripts/                 # build-skills.sh, armos launcher, cortex-key-helper.sh, install-codex.sh
templates/               # env / mcp / instances / settings examples (no secrets)
```

## License

MIT.
