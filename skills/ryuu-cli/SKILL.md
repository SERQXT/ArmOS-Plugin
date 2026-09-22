---
name: ryuu-cli
tier: 0
description: "Domo Ryuu CLI (@domoinc/ryuu) — domo login, domo init, domo dev, domo publish, token management, owner management, recommended auth flow for agents. Trigger with 'ryuu cli', 'domo login', 'domo publish', 'domo dev', 'domo cli'."
maturity: alpha
audience: [code]
---

# Ryuu CLI (domo) — Complete Reference

> **CLI is the primary path** for the commands documented here. Use them directly. Two narrow caveats:
>
> 1. **`domo login` needs a TTY** — the agent doesn't have one. To add a Ryuu session for a new instance, call `mcp__armos-control__authenticate_instance` instead. It spawns the browser OAuth flow and writes the same Ryuu session file that `domo login` would. After that, `domo publish` and other CLI commands work normally.
> 2. **Never edit files under `~/.config/configstore/ryuu/`** — the CLI manages those itself, and the runtime relies on them. Reading for diagnosis is fine; mutating is forbidden.
>
> Beyond those two: run `domo publish`, `domo dev`, `domo init`, etc. directly. There's a `procode_publish` MCP tool that's a useful **fallback** when `domo publish` fails (it adds manifest validation + a direct-API publish path), but don't reach for it as the default.

The official CLI for developing, publishing, and managing Domo Custom Apps. Also provides the authentication layer used by all Domo MCP tools.

## Installation

npm install -g ryuu

Requires Node.js 16+, npm 7+, and a Domo account with developer access.

---

## Authentication (CRITICAL — Used by ALL MCP Tools)

Ryuu auth creates session files at `~/.config/configstore/ryuu/{instance}.domo.com.json` that ALL Domo MCP tools read for API authentication.

### OAuth Login (Interactive)

domo login                                    # Interactive login
domo login -i company.domo.com               # Login to specific instance
domo login -u user@company.com -i company.domo.com  # Specify user

Options: -i/--instance, -u/--user-email, --migrate, --no-upgrade-check, --upgrade-download

### NEVER use token-based login

Do NOT use `-t`, `--token`, `--token-only`, or `token add` commands. The browser-based `domo login` handles all authentication. No developer tokens are needed for any CLI operation.

### Recommended Auth Flow for Agents

Before any Domo API operation, follow this sequence:

1. **Check status**: `ryuu_login_status(instance: "company")` — returns auth state
2. **If not authenticated**: `ryuu_login(instance: "company")` — triggers browser login, tell user to complete it
3. **If expired**: `ryuu_login(instance: "company")` — re-authenticate
4. **Proceed** with CLI commands or MCP tool calls

**NEVER create, request, or use developer tokens.** The browser-based login handles everything. If login fails, tell the user to re-authenticate — do not look for alternative auth methods.

### Session Management

domo logout                                  # Sign out current instance
domo logout -i company.domo.com             # Sign out specific instance
domo remove                                  # Remove saved login (interactive)
domo remove --instance company.domo.com     # Remove specific instance
domo remove --all                            # Remove all saved logins

---

## App Development

### Initialize New App

domo init                                    # Interactive
domo init -n "My App" -t "hello world"      # Non-interactive
domo init --no-datasets                      # Skip dataset prompts

Options: -n/--design_name, -t/--template (hello world, manifest only, basic chart, map chart, sugarforce), --no-datasets, -i/--dataset-id, -a/--dataset-alias

Templates: hello world (HTML/JS/CSS), manifest only (just manifest.json), basic chart (D3.js), map chart (geographic), sugarforce (Salesforce integration)

### Development Server

domo dev                                     # Start dev server (localhost:3000)
domo dev -u USER_ID                          # Use specific user ID
domo dev -e                                  # Allow external connections

Options: -u/--userId, -e/--external

### Download Existing App

domo download                                # Interactive
domo download -i DESIGN_ID                   # Download specific design
domo download -i DESIGN_ID -d latest         # Specific version

Options: -i/--design-id, -d/--design-version (default: latest)

---

## Publishing & Release

### Publish App

domo publish                                 # Publish from current directory
domo publish -g                              # Publish and open in browser
domo publish --build-dir ./dist              # Publish from build directory

Options: -g/--go, -d/--build-dir

### Release to App Store

domo release                                 # Interactive version selection
domo release -v latest                       # Release latest version
domo release -v 1.0.0                        # Release specific version

Options: -v/--version

### Delete / Restore App

domo delete                                  # Delete app in current directory
domo delete DESIGN_ID                        # Delete specific design
domo delete -f                               # Force delete (skip confirmation)
domo undelete                                # Restore deleted app
domo undelete DESIGN_ID                      # Restore specific design

Options: -f/--force, -c/--confirm

---

## Management

### List Apps

domo ls                                      # List all published apps
Shows: Design Name, Design ID, Version, Last Published, Asset Library URL

### Manage Owners

domo owner ls                                # List owners
domo owner add [user@company.com](mailto:user@company.com)              # Add owner
domo owner rm [user@company.com](mailto:user@company.com)               # Remove owner
domo owner add [user1@co.com](mailto:user1@co.com) [user2@co.com](mailto:user2@co.com)    # Add multiple

Options: -i/--designId

### Proxy Configuration

domo proxy proxy.company.com 8080            # Set proxy
domo proxy proxy.company.com 8080 -a         # With authentication
domo proxy -r                                # Remove proxy

Options: -r/--remove-proxy, -a/--auth

---

## Gotchas

1. **Auth is the foundation** — `domo login` creates the Ryuu session file that ALL Domo MCP tools depend on. No login = no API access. No tokens needed — browser login only.
2. **Manifest rewrite after publish** — `domo publish` rewrites manifest.json with API-format keys. Use `procode_publish` MCP tool (auto-normalizes) or manually fix after CLI publish.
3. **Instance format** — Always `company.domo.com` (not just `company`).
4. **Multi-instance support** — Can be logged into multiple Domo instances simultaneously. Each has its own session file.
5. **domo dev requires login** — The dev server proxies API calls through the authenticated session.
6. **Never disable TLS verification.** Do NOT set `NODE_TLS_REJECT_UNAUTHORIZED=0`, and do not hand-write raw `https`/`node -e` scripts against Domo APIs to work around a tool. Disabling certificate validation exposes the session to interception, and hand-rolled API calls bypass the auth, retry, and schema handling the MCP tools provide. If a Domo operation isn't working through the CLI or an MCP tool, surface that as the problem rather than scripting around it. (A genuine corporate-proxy/self-signed case is an environment fix — a trusted CA cert — not a reason to turn verification off.)

---

## See Also

- `**publish`** — The build-and-deploy workflow for Custom Apps. Covers the full `domo publish` lifecycle, manifest management, and deployment patterns.
- `**community-cli-howto**` — The community CLI (`community-domo-cli`) alternative for Domo API automation. Covers installation, profile management, and all available command groups beyond what Ryuu provides.