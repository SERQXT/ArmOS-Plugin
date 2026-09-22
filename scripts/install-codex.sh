#!/bin/sh
# install-codex.sh — make ArmOS usable from the OpenAI Codex CLI, mirroring what
# `claude plugin install` does for Claude Code.
#
#   Skills  -> symlinked into ~/.agents/skills/<name>    (Codex user-level skills)
#   /server -> symlinked into ~/.codex/prompts/server.md (Codex custom prompt)
#
# Codex discovers skills from ~/.agents/skills and prompts from ~/.codex/prompts,
# so after this runs the whole skill library and the /server prompt are available
# in every Codex session.
#
# MCP servers are NOT touched — they carry per-customer tokens. Configure them
# yourself from codex/config.toml.example (see the printed hint below).
#
# Symlinks (not copies) are used, so re-running scripts/build-skills.sh refreshes
# the skills Codex sees with no reinstall. Re-run this script to pick up brand new
# skill directories. Use --uninstall to remove ONLY the links this script created.
set -e

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
SKILLS_SRC="$ROOT/skills"
PROMPT_SRC="$ROOT/codex/prompts/server.md"

SKILLS_DEST="${ARMOS_CODEX_SKILLS_DIR:-$HOME/.agents/skills}"
PROMPTS_DEST="${CODEX_HOME:-$HOME/.codex}/prompts"

uninstall() {
  removed=0
  if [ -d "$SKILLS_DEST" ]; then
    for link in "$SKILLS_DEST"/*; do
      [ -L "$link" ] || continue
      case "$(readlink "$link")" in
        "$SKILLS_SRC"/*) rm -f "$link"; removed=$((removed + 1)) ;;
      esac
    done
  fi
  if [ -L "$PROMPTS_DEST/server.md" ] && [ "$(readlink "$PROMPTS_DEST/server.md")" = "$PROMPT_SRC" ]; then
    rm -f "$PROMPTS_DEST/server.md"
    removed=$((removed + 1))
  fi
  echo "install-codex: removed $removed ArmOS symlink(s)"
  exit 0
}

[ "$1" = "--uninstall" ] && uninstall

if [ ! -d "$SKILLS_SRC" ]; then
  echo "install-codex: skills/ not found at $SKILLS_SRC" >&2
  exit 1
fi

mkdir -p "$SKILLS_DEST" "$PROMPTS_DEST"

linked=0
skipped=0
conflicts=""
for dir in "$SKILLS_SRC"/*/; do
  [ -f "$dir/SKILL.md" ] || continue
  name=$(basename "$dir")
  src="${dir%/}"
  target="$SKILLS_DEST/$name"
  if [ -L "$target" ]; then
    if [ "$(readlink "$target")" = "$src" ]; then
      linked=$((linked + 1)) # already ours
      continue
    fi
    conflicts="$conflicts $name"
    skipped=$((skipped + 1))
    continue
  fi
  if [ -e "$target" ]; then
    conflicts="$conflicts $name"
    skipped=$((skipped + 1))
    continue
  fi
  ln -s "$src" "$target"
  linked=$((linked + 1))
done

if [ -f "$PROMPT_SRC" ]; then
  ln -sfn "$PROMPT_SRC" "$PROMPTS_DEST/server.md"
  echo "install-codex: linked /server prompt -> $PROMPTS_DEST/server.md"
fi

echo "install-codex: linked $linked skill(s) into $SKILLS_DEST"
if [ -n "$conflicts" ]; then
  echo "install-codex: skipped $skipped name(s) already present (left untouched):$conflicts"
fi
echo ""
echo "Next — connect a Domo instance for Codex (tokens stay in your shell env):"
echo "  cp $ROOT/codex/config.toml.example ${CODEX_HOME:-$HOME/.codex}/config.toml"
echo "  export DOMO_<YOUR_INSTANCE>_DEVELOPER_TOKEN=...   # in your shell profile"
echo "  # then restart Codex, and use /server to manage instances"
