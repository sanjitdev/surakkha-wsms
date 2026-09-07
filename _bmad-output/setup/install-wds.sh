#!/usr/bin/env bash
# install-wds.sh — Install Whiteport Design Studio (WDS) for Claude Code
#
# What it does:
#   - Clones whiteport-design-studio into ~/.claude/wds/
#   - Creates ~/.claude/commands/{saga,freya,mimir,sync}.md wrappers
#   - Writes ~/.claude/wds-config.yaml
#   - Optionally writes {project_root}/_progress/wds-project-outline.yaml
#
# Usage:
#   ./install-wds.sh                           # install only
#   ./install-wds.sh /path/to/project          # install + project setup
#   ./install-wds.sh --reinstall               # wipe and reinstall
#   ./install-wds.sh --uninstall               # remove everything
#
# Requirements:
#   - bash, git on PATH
#   - Internet access to github.com
#   - Writes to ~/.claude/ (Unix) or %USERPROFILE%\.claude\ (Windows + Git Bash)
#
# Tested on: Git Bash on Windows (MINGW64), macOS, Ubuntu.

set -euo pipefail

# ---------- args ----------
REINSTALL=0
UNINSTALL=0
PROJECT_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reinstall) REINSTALL=1; shift ;;
    --uninstall) UNINSTALL=1; shift ;;
    -h|--help)
      sed -n '2,17p' "$0"; exit 0 ;;
    *)
      PROJECT_PATH="$1"; shift ;;
  esac
done

# ---------- constants ----------
WDS_REPO="https://github.com/whiteport-collective/whiteport-design-studio.git"
WDS_VERSION="1.0.0"

# ---------- home detection ----------
if [[ -n "${USERPROFILE:-}" ]] && [[ -d "$USERPROFILE" ]]; then
  HOME_DIR="$USERPROFILE"
else
  HOME_DIR="$HOME"
fi

CLAUDE_DIR="$HOME_DIR/.claude"
WDS_DIR="$CLAUDE_DIR/wds"
COMMANDS_DIR="$CLAUDE_DIR/commands"
CONFIG_FILE="$CLAUDE_DIR/wds-config.yaml"

# ---------- helpers ----------
log()  { printf '\033[1;34m[wds]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[wds]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[wds]\033[0m %s\n' "$*" >&2; }
err()  { printf '\033[1;31m[wds]\033[0m %s\n' "$*" >&2; }
die()  { err "$*"; exit 1; }

# ---------- uninstall ----------
if [[ "$UNINSTALL" == "1" ]]; then
  log "Uninstalling WDS from $CLAUDE_DIR"
  if [[ -d "$WDS_DIR" ]]; then
    rm -rf "$WDS_DIR"; ok "removed $WDS_DIR"
  fi
  for cmd in saga freya mimir sync; do
    f="$COMMANDS_DIR/$cmd.md"
    if [[ -f "$f" ]]; then
      rm -f "$f"; ok "removed $f"
    fi
  done
  if [[ -f "$CONFIG_FILE" ]]; then
    rm -f "$CONFIG_FILE"; ok "removed $CONFIG_FILE"
  fi
  ok "WDS uninstalled."
  exit 0
fi

# ---------- preflight ----------
command -v git >/dev/null 2>&1 || die "git not found on PATH. Install git first."
mkdir -p "$CLAUDE_DIR" "$COMMANDS_DIR"

# ---------- reinstall handling ----------
if [[ -d "$WDS_DIR" && "$REINSTALL" != "1" ]]; then
  warn "WDS already installed at $WDS_DIR. Use --reinstall to wipe and reinstall, or --uninstall first."
  if [[ -d "$WDS_DIR/.git" ]]; then
    log "Pulling latest in place..."
    git -C "$WDS_DIR" pull --ff-only || warn "pull failed (probably divergent); use --reinstall for a clean clone"
  fi
else
  if [[ -d "$WDS_DIR" ]]; then
    log "Removing existing $WDS_DIR for clean reinstall"
    rm -rf "$WDS_DIR"
  fi
  log "Cloning WDS $WDS_VERSION into $WDS_DIR"
  git clone --depth 1 "$WDS_REPO" "$WDS_DIR"
fi

# ---------- config ----------
if [[ ! -f "$CONFIG_FILE" ]]; then
  cat > "$CONFIG_FILE" <<EOF
# WDS config — written by install-wds.sh
sync-source:
  repo: $WDS_REPO
  branch: main
project_root: ${PROJECT_PATH:-}
EOF
  ok "wrote $CONFIG_FILE"
fi

# ---------- command wrappers ----------
write_command_wrapper() {
  local cmd="$1"
  local skill_dir="$2"
  local wrapper="$COMMANDS_DIR/$cmd.md"
  cat > "$wrapper" <<EOF
# $cmd — Whiteport Design Studio
#
# Installed by install-wds.sh
# WDS base: $WDS_DIR
#
# Read the file at $WDS_DIR/src/skills/$skill_dir/SKILL.md and follow its
# instructions exactly. The full handoff / activation logic lives there.

Skill source: $WDS_DIR/src/skills/$skill_dir/SKILL.md
Use /sync to refresh WDS before invoking this skill.
EOF
  ok "wrote $wrapper"
}

# Feedback is not its own slash command — it's a skill embedded in other agents.
# We only wrap saga, freya, mimir, sync per the documented install.
write_command_wrapper "saga"  "saga"
write_command_wrapper "freya" "freya"
write_command_wrapper "mimir" "mimir"
write_command_wrapper "sync"  "sync"

# ---------- optional project setup ----------
if [[ -n "$PROJECT_PATH" ]]; then
  if [[ ! -d "$PROJECT_PATH" ]]; then
    err "Project path does not exist: $PROJECT_PATH"
    exit 1
  fi
  PROGRESS_DIR="$PROJECT_PATH/_progress"
  OUTLINE_FILE="$PROGRESS_DIR/wds-project-outline.yaml"
  mkdir -p "$PROGRESS_DIR"
  if [[ ! -f "$OUTLINE_FILE" ]]; then
    cat > "$OUTLINE_FILE" <<EOF
# Whiteport Design Studio — Project Outline
# Written by install-wds.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ)
project: $(basename "$PROJECT_PATH")
status: fresh-install
phases:
  product-brief: pending
  trigger-map: pending
  ux-scenarios: pending
  ux-design: pending
  development: pending
links:
  wds_config: $CONFIG_FILE
  wds_repo: $WDS_DIR
notes: |
  Run /saga first to begin the Product Brief suite.
EOF
    ok "wrote $OUTLINE_FILE"
  else
    log "Skipped (already exists): $OUTLINE_FILE"
  fi
fi

# ---------- success ----------
cat <<EOF

  Whiteport Design Studio installed
    Version: $WDS_VERSION
    Location: $WDS_DIR
    Config:   $CONFIG_FILE
    Commands: $COMMANDS_DIR/{saga,freya,mimir,sync}.md

  Slash commands (Claude Code only):
    /saga   Strategic analyst (Product Brief + Trigger Map)
    /freya  UX designer (UX Scenarios + UX Design)
    /mimir  Implementation (tech audit, PRD, build)
    /sync   Refresh WDS to latest

  Notes:
    - WDS targets Claude Code (~/.claude/commands/).
      Puku-CLI and other agents will not see these commands.
    - WDS does NOT ship design tokens, components, or CSS.
      It is a methodology + agent workflow.
    - Conflicts with bmad-* skills? Both are forks of bmad-method.
      Expect some slug and convention overlap.

EOF
