---
name: contribute
tier: 1
description: "Share your locally-built skills and MCP tools with the team. Scans your environment for custom assets not in the core repo, validates them, and submits them for review. Trigger with 'contribute', 'share my skill', 'submit my tool', 'I built something to share', 'contribute my work', 'share what I built'."
maturity: alpha
audience: [intelligence]
version: 1.0.0
tags: [community, sharing, contribution, self-improvement]
---

# Contribute — Share Your Skills and Tools

Help grow the CS AI Platform by contributing the skills and MCP tools you've built locally. This workflow scans your environment, validates your assets, and submits them for team review.

## Workflow

### Step 1: Scan for Local Assets

Use the `contribution_scan` tool to detect skills and MCP tools in your local environment that aren't already in the core repository.

- Scans your `~/.claude/CLAUDE.md` and `./.claude/CLAUDE.md` for skill references
- Scans your `~/.claude/mcp.json` and `./.claude/mcp.json` for MCP server entries
- Compares against core skills in `core/skills/` and core MCPs in `core/mcps/`
- Returns a list of potential contributions with their source paths

### Step 2: Select Assets to Contribute

Present the scan results to the user. For each found asset, show:
- **Name/ID** of the asset
- **Type** (skill or MCP tool)
- **Source path** where it lives locally
- **Description snippet** if available

Ask the user which asset(s) they want to contribute. If none are found, let them know and suggest they can manually specify a path.

### Step 3: Collect Context

Before submitting, gather from the contributor:
- **Your name** — For attribution in the contribution record (or "anonymous")
- **Target plugin** — Which plugin this belongs in (suggest one based on the asset's name and description, e.g. `compass-core`, `custom`, or a domain-specific plugin)
- **Notes** — Any additional context about what the asset does, why it's useful, or known limitations

### Step 4: Submit the Contribution

Use the `contribution_submit` tool for each selected asset with the collected information.

The tool will:
1. Read all source files from the asset
2. Run validation checks (frontmatter, hardcoded paths, credentials)
3. Package everything into a contribution file in the enhancement queue
4. Return validation results and the suggested placement

### Step 5: Report Results

For each submitted contribution, report:
- The contribution filename (for tracking)
- Validation results — highlight any warnings that need attention
- Suggested placement in the core repo
- **Next steps**: The contribution is queued for review. A platform maintainer will review it and merge via PR.

## Guardrails

- **Never submit assets containing credentials.** If credentials are detected, stop and help the user remove them before resubmitting.
- **Flag hardcoded local paths.** If paths like `/Users/yourname/...` are found, warn the user and suggest making them configurable (use environment variables or relative paths).
- **No duplicates.** If a scanned asset already exists in the core repo, skip it and let the user know.
- **Always confirm before submitting.** Show the user what will be submitted and ask for explicit confirmation before calling `contribution_submit`.

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context.

### After executing
- No memory writes required for this utility skill.

## Example Interaction

```
User: I want to contribute my custom skill

Agent: Let me scan your environment for local skills and tools not in the core repo.
[calls contribution_scan]

Found 2 local assets not in core:
1. **my-custom-skill** (skill) — ~/.claude/skills/my-custom-skill/SKILL.md
2. **mcp-custom-api** (MCP) — ~/.claude/mcps/mcp-custom-api/

Which would you like to contribute? (Enter numbers or "all")

User: 1

Agent: Great! A few questions:
- What name should I attribute this to? (or "anonymous")
- Which plugin should this go in? I'd suggest "custom" based on the name.
- Any notes about this skill?

User: Alex D, put it in compass-core, it helps with data validation

Agent: Here's what I'll submit:
- Asset: my-custom-skill (skill)
- Contributor: Alex D
- Target plugin: compass-core
- Source: ~/.claude/skills/my-custom-skill/SKILL.md

Proceed? (yes/no)

User: yes

Agent: [calls contribution_submit]
Submitted! Contribution file: contrib-my-custom-skill-20260317-143022.md
Validation: All checks passed.
Next steps: Your contribution is queued for review. A maintainer will review and merge it via PR.
```
