#!/bin/sh
#
# Build the random-cover manifest.
#
# A Handlebars theme cannot list a directory, and Ghost exposes no endpoint that
# enumerates /content/images/. So this script writes the listing out as a small
# JSON file that the theme's coverPool() in assets/js/main.js can fetch.
#
# Usage:
#   scripts/build-cover-manifest.sh [covers-directory]
#
# Environment overrides:
#   COVERS_DIR  directory holding the cover images
#               (default /opt/ghost/ghost-content/images/covers)
#   BASE_URL    public URL prefix for that directory, trailing slash included
#               (default /content/images/covers/)
#   OUT         manifest path (default $COVERS_DIR/covers.json)
#
# The manifest is written atomically via a temporary file, so re-running is safe
# and a half-written manifest is never served. Re-running with no changes
# produces the same file apart from the "generated" timestamp.
#
# Filenames containing a newline are not supported and are skipped with a
# warning; everything else, spaces included, is fine.

set -eu

COVERS_DIR="${1:-${COVERS_DIR:-/opt/ghost/ghost-content/images/covers}}"
BASE_URL="${BASE_URL:-/content/images/covers/}"
OUT="${OUT:-$COVERS_DIR/covers.json}"

warn() {
    printf '%s\n' "$*" >&2
}

if [ ! -d "$COVERS_DIR" ]; then
    warn "build-cover-manifest: no such directory: $COVERS_DIR"
    warn "build-cover-manifest: create it and drop cover images in, then re-run."
    exit 1
fi

if [ ! -w "$COVERS_DIR" ]; then
    warn "build-cover-manifest: cannot write to $COVERS_DIR"
    exit 1
fi

TMP="$(mktemp "${OUT}.XXXXXX")"
# Never leave a stray temp file behind, whatever happens.
trap 'rm -f "$TMP"' EXIT INT TERM

# Escape the two characters that are not legal raw inside a JSON string.
# Filenames are emitted unescaped otherwise; the theme percent-encodes them.
json_escape() {
    printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

count=0
{
    printf '{\n'
    printf '  "generated": "%s",\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    printf '  "base": "%s",\n' "$(json_escape "$BASE_URL")"
    printf '  "images": ['
} >"$TMP"

# -maxdepth 1: the pool is one flat folder, not a tree.
# Extension filter: anything that is not a browser-renderable image - the
# manifest itself, stray .txt/.DS_Store/RAW files - is ignored rather than
# handed to the browser as a cover.
# LC_ALL=C sort keeps the output stable between runs so a no-op re-run is a
# no-op diff.
find "$COVERS_DIR" -maxdepth 1 -type f \
    \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \
       -o -iname '*.webp' -o -iname '*.gif' -o -iname '*.avif' \) \
    -print 2>/dev/null | LC_ALL=C sort | while IFS= read -r file; do
    # A filename containing a newline arrives here split across two reads, so
    # neither fragment names a real file. Drop it rather than emit nonsense.
    if [ ! -f "$file" ]; then
        warn "build-cover-manifest: skipping unusable filename fragment: $file"
        continue
    fi

    name="$(basename "$file")"

    # A nightly prune job on the server deletes anything with a literal "_o."
    # before the extension. Such a cover would silently vanish, so refuse it.
    case "$name" in
        *_o.*)
            warn "build-cover-manifest: skipping '$name' - names containing '_o.' are deleted by the nightly image prune. Rename it."
            continue
            ;;
    esac

    if [ "$count" -gt 0 ]; then
        printf ',' >>"$TMP"
    fi
    printf '\n    "%s"' "$(json_escape "$name")" >>"$TMP"
    count=$((count + 1))
done

# The loop above runs in a subshell, so recount here for the log line.
total="$(grep -c '^    "' "$TMP" || true)"

if [ "$total" -gt 0 ]; then
    printf '\n  ]\n}\n' >>"$TMP"
else
    printf ']\n}\n' >>"$TMP"
fi

mv "$TMP" "$OUT"
trap - EXIT INT TERM
chmod 644 "$OUT"

if [ "$total" -eq 0 ]; then
    warn "build-cover-manifest: no images found in $COVERS_DIR - wrote an empty manifest, the theme will keep using the cover set in Ghost Admin."
fi

printf 'build-cover-manifest: wrote %s (%s image(s))\n' "$OUT" "$total"
