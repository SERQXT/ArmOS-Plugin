#!/bin/sh
# build-skills.sh — (re)populate this plugin's skills/ directory by flattening
# ArmOS's skill plugins, so the packaged plugin ships every skill as a real
# directory (SKILL.md plus templates/assets).
#
# Source layout : ~/.armos/skills/<plugin>/skills/<skill>/SKILL.md
# Target layout : <plugin-root>/skills/<skill>/SKILL.md
#
# Name collisions across plugins are reported and skipped (first one wins).
# Symlinked skills in the source are DEREFERENCED (copied as real dirs) so the
# published repo has no dangling links.
set -e

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
SRC="${ARMOS_SKILLS_DIR:-$HOME/.armos/skills}"
DEST="$ROOT/skills"

if [ ! -d "$SRC" ]; then
  echo "build-skills: source not found: $SRC" >&2
  echo "              set ARMOS_SKILLS_DIR to override" >&2
  exit 1
fi

mkdir -p "$DEST"

copied=0
skipped=0
collisions=""

for skill_md in "$SRC"/*/skills/*/SKILL.md; do
  [ -f "$skill_md" ] || continue
  skill_dir=$(dirname "$skill_md")
  name=$(basename "$skill_dir")
  target="$DEST/$name"
  if [ -d "$target" ]; then
    collisions="$collisions $name"
    skipped=$((skipped + 1))
    continue
  fi
  # -L dereferences symlinks so the copy is a real directory tree.
  cp -RL "$skill_dir" "$target"
  copied=$((copied + 1))
done

echo "build-skills: copied $copied skill(s) into $DEST"
if [ -n "$collisions" ]; then
  echo "build-skills: skipped $skipped duplicate name(s):$collisions"
  echo "              (first occurrence kept; rename in source if you need both)"
fi
