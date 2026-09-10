#!/bin/bash

# Release script for release.yaml (a GitHub Action)
# Can be run locally as well if desired
# It creates a tag based on the version in package.json and creates a GitHub release based on the tag
#
# The trigger for a release is the CHANGELOG.md entry, not the version number. Between releases `main`
# sits on the *next*, unreleased version (see docs/releases.md): bumping it is what opens the next
# TestFlight train, and that must not tag or announce anything. So a version with no `## <version>`
# entry is a version still being built — this exits without tagging.

set -e
cd "$(dirname "$0")"/..

tag=$(node -p "require('./package.json').version")

# Report back to the calling workflow (.github/workflows/cd.yml) so the announce job only runs when a
# release was actually created. GITHUB_OUTPUT is unset when this script is run locally, hence the guard.
set_output() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "$1" >> "$GITHUB_OUTPUT"
  fi
}

set_output "tag=$tag"

tagged=$(git tag -l $tag)
if [ -n "$tagged" ]; then
  echo "Tag $tag already exists"
  set_output "released=false"
  exit 0
fi

# Pull this version's entry out of CHANGELOG.md (see the file header for the format: a user-facing
# summary, a `<!--tech-->` marker, then technical details). An entry ends at the next `## ` heading or a
# `---` separator line.
notes_file=$(mktemp)
awk -v tag="$tag" '
  /^## / {
    if (found) exit
    if ($0 ~ ("^## " tag "([^0-9.]|$)")) { found=1; next }
    next
  }
  found {
    if ($0 == "---") exit
    print
  }
' CHANGELOG.md | sed -e '/./,$!d' > "$notes_file"

# No entry means this version is not being released yet — the usual case for the version bump that
# follows a release and opens the next one. Nothing to tag, nothing to announce.
if [ ! -s "$notes_file" ]; then
  rm -f "$notes_file"
  echo "No '## $tag' entry in CHANGELOG.md — $tag is not ready to release yet, skipping."
  set_output "released=false"
  exit 0
fi

git tag -a "$tag" -m "Release $tag"
git push origin "$tag"
echo "Tagged release $tag"

gh release create "$tag" \
    --repo="$GITHUB_REPOSITORY" \
    --title="$tag" \
    --notes-file "$notes_file"
echo "Created release from CHANGELOG.md entry"
rm -f "$notes_file"
set_output "released=true"

# Release to ...
