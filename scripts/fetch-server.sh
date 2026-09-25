#!/usr/bin/env bash
# Download prebuilt rl binaries into server/.
# Usage: ./scripts/fetch-server.sh [version] [only-target]
#   version: 2.2.1 (default: latest release)
#   only-target: e.g. linux-x86_64 (default: all six)
# Layout: server/<os>-<arch>/{rl,rlc,rlt,rlrepl,rlsp,rldocs,rlm}[.exe]
# Each release archive holds exactly one binary.
set -euo pipefail
cd "$(dirname "$0")/.."

ver="${1:-}"
only="${2:-}"
# GitHub API rate-limits anonymous calls (shared runner IPs burn through
# the quota fast). Pass GH_TOKEN to authenticate when available.
auth=()
[ -n "${GH_TOKEN:-}" ] && auth=(-H "Authorization: Bearer $GH_TOKEN")
if [ -z "$ver" ]; then
  ver="$(curl -fsSL "${auth[@]}" https://api.github.com/repos/rl-lang/rl-lang/releases/latest \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['tag_name'])")"
  ver="${ver#v}"
fi

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
targets="linux-x86_64 linux-aarch64 macos-x86_64 macos-aarch64 windows-x86_64 windows-aarch64"
bins="rl rlc rlt rlrepl rlsp rldocs rlm"

for t in $targets; do
  [ -n "$only" ] && [ "$t" != "$only" ] && continue
  case "$t" in
    windows-*) ext="zip" ;;
    *) ext="tar.gz" ;;
  esac
  dest="server/$t"
  rm -rf "$dest"; mkdir -p "$dest" "$tmp/x"
  for b in $bins; do
    echo "fetch: $b-$t.$ext"
    curl -fsSL "https://github.com/rl-lang/rl-lang/releases/download/v$ver/$b-$t.$ext" -o "$tmp/$b-$t.$ext"
    case "$ext" in
      zip) unzip -q -o "$tmp/$b-$t.$ext" -d "$tmp/x" ;;
      *) tar -xzf "$tmp/$b-$t.$ext" -C "$tmp/x" ;;
    esac
  done
  cp "$tmp"/x/* "$dest/"
  rm -rf "$tmp/x"; mkdir -p "$tmp/x"
  chmod +x "$dest"/rl "$dest"/rlc "$dest"/rlt "$dest"/rlrepl "$dest"/rlsp "$dest"/rldocs "$dest"/rlm 2>/dev/null || true
done

echo "fetch: done for v$ver"
ls server
