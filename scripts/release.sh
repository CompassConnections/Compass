#!/bin/bash

# Release script for release.yaml (a GitHub Action)
# Can be run locally as well if desired
# It creates a tag based on the version in pyproject.toml and creates a GitHub release based on the tag

set -e
cd "$(dirname "$0")"/..

tag=$(node -p "require('./package.json').version")

tagged=$(git tag -l $tag)
if [ -z "$tagged" ]; then
  git tag -a "$tag" -m "Release $tag"
  git push origin "$tag"
  echo "Tagged release $tag"

  gh release create "$tag" \
      --repo="$GITHUB_REPOSITORY" \
      --title="$tag" \
      --generate-notes
  echo "Created release"

# Release to ...

else
  echo "Tag $tag already exists"
fi
