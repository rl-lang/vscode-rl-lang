#!/usr/bin/env bash
# Download prebuilt rl binaries for every platform into server/.
# Usage: ./scripts/fetch-server.sh [version]   (default: latest release)
# Layout: server/<os>-<arch>/{rl,rlc,rlt,rlrepl,rlsp,rldocs,rlm}[.exe]
set -euo pipefail
cd "$(dirname "$0")/.."

ver="${1:-}"
if [ -z "$ver" ]; then
  ver="$(curl -fsSL https://api.github.com/repos/rl-lang/rl-lang/releases/latest \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['tag_name'])")"
  ver="${ver#v}"
fi

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
targets="linux-x86_64 linux-aarch64 macos-x86_64 macos-aarch64 windows-x86_64 windows-aarch64"
bins="rl rlc rlt rlrepl rlsp rldocs rlm"

for t in $targets; do
  case "$t" in
    windows-*) ext="zip" ;;
    *) ext="tar.gz" ;;
  esac
  echo "fetch: rl-$t"
  curl -fsSL "https://github.com/rl-lang/rl-lang/releases/download/v$ver/rl-$t.$ext" -o "$tmp/rl-$t.$ext"
  dest="server/$t"
  rm -rf "$dest"; mkdir -p "$dest" "$tmp/x-$t"
  case "$ext" in
    zip) unzip -q -o "$tmp/rl-$t.$ext" -d "$tmp/x-$t" ;;
    *) tar -xzf "$tmp/rl-$t.$ext" -C "$tmp/x-$t" ;;
  esac
  for b in $bins; do
    found="$(find "$tmp/x-$t" -name "$b" -o -name "$b.exe" | head -1)"
    [ -n "$found" ] || { echo "fetch: WARNING: $b missing in rl-$t" >&2; continue; }
    cp "$found" "$dest/"
  done
  rm -rf "$tmp/x-$t"
done

echo "fetch: done for v$ver"
ls server
