#!/bin/bash

# Release script for release.yaml (a GitHub Action)
# Can be run locally as well if desired
# It creates a tag based on the version in pyproject.toml and creates a GitHub release based on the tag

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
if [ -z "$tagged" ]; then
  git tag -a "$tag" -m "Release $tag"
  git push origin "$tag"
  echo "Tagged release $tag"

  # Pull this version's entry out of CHANGELOG.md (see the file header for the format: a user-facing
  # summary, a `<!--tech-->` marker, then technical details). An entry ends at the next `## ` heading or a
  # `---` separator line. Falls back to --generate-notes when the version has no hand-written entry yet, so
  # releases without a changelog entry still get created.
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

  if [ -s "$notes_file" ]; then
    gh release create "$tag" \
        --repo="$GITHUB_REPOSITORY" \
        --title="$tag" \
        --notes-file "$notes_file"
    echo "Created release from CHANGELOG.md entry"
  else
    gh release create "$tag" \
        --repo="$GITHUB_REPOSITORY" \
        --title="$tag" \
        --generate-notes
    echo "Created release (no CHANGELOG.md entry found for $tag, used --generate-notes)"
  fi
  rm -f "$notes_file"
  set_output "released=true"

# Release to ...

else
  echo "Tag $tag already exists"
  set_output "released=false"
fi
