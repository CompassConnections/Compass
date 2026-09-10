#!/bin/bash

# Bump the shared product version, or the two store build counters — deliberately two separate moves.
#
# The version number is one number across root `package.json`, `android/app/build.gradle` and the iOS
# project file — see docs/releases.md. The build counters (`versionCode`, `CURRENT_PROJECT_VERSION`)
# are *not* shared: they have separate histories, each store requires its own to strictly increase per
# upload, and raising one is what triggers that platform's release workflow.
#
# They move at different moments, which is why they are different commands:
#
#   * Version, right after a release is promoted to the stores. Apple closes a version's TestFlight
#     train the moment that version goes live, so `main` has to sit on the *next*, unreleased version
#     for the whole development window — otherwise the next dev build is rejected with "Invalid
#     Pre-Release Train". No counter moves here, so nothing builds and nothing ships: it only opens
#     the next train. The release itself is triggered by the CHANGELOG.md entry (scripts/release.sh).
#
#   * Counters, for every dev build sent to TestFlight and Play's internal track in between. The
#     version is already the right one, so only the counters advance.
#
# The failure mode this exists to prevent is silent — a shell left on the previous number still
# builds, still uploads, and only looks wrong in the store listing.
#
# The new version is derived from the *highest* of the three currently on disk, not from the root
# alone. The numbers have drifted before (root 1.15.0 while both shells were at 1.42.0), and both
# stores refuse a version that goes backwards, so converging means coming up to the leader rather than
# reissuing a number Apple has already seen.
#
# Usage:
#   ./scripts/bump-version.sh              # open the next version: highest of the three, minor + 1, patch 0
#   ./scripts/bump-version.sh 2.0.0        # open an explicit version instead
#   ./scripts/bump-version.sh --build      # advance both build counters, leave the version alone
#   ./scripts/bump-version.sh --dry-run    # print what would change, write nothing
#
# Editing the numbers is all this does: no commit, no tag, no push. Tagging is scripts/release.sh,
# which runs from CI once the CHANGELOG.md entry for the version is on main.

set -e
cd "$(dirname "$0")"/..

PBX=ios/App/App.xcodeproj/project.pbxproj
GRADLE=android/app/build.gradle

dry_run=false
build_only=false
explicit_version=""

for arg in "$@"; do
  case "$arg" in
    --dry-run | -n) dry_run=true ;;
    --build | -b) build_only=true ;;
    -h | --help)
      sed -n '3,36p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
    *)
      if [ -n "$explicit_version" ]; then
        echo "Only one version can be given (got '$explicit_version' and '$arg')" >&2
        exit 1
      fi
      explicit_version="$arg"
      ;;
  esac
done

if $build_only && [ -n "$explicit_version" ]; then
  echo "--build advances the counters only; it takes no version argument" >&2
  exit 1
fi

# Read the current state. Each `read_*` fails loudly rather than returning an empty string: a silent
# miss here would write "1..0" into a store-facing file.
read_or_die() {
  local value
  value=$(perl -ne "print \$1 and exit if /$2/" "$1")
  if [ -z "$value" ]; then
    echo "Could not read $3 from $1" >&2
    exit 1
  fi
  echo "$value"
}

root_version=$(node -p "require('./package.json').version")
android_version=$(read_or_die "$GRADLE" 'versionName\s+"([^"]+)"' versionName)
android_code=$(read_or_die "$GRADLE" 'versionCode\s+(\d+)' versionCode)
ios_version=$(read_or_die "$PBX" 'MARKETING_VERSION = ([^;]+);' MARKETING_VERSION)
ios_build=$(read_or_die "$PBX" 'CURRENT_PROJECT_VERSION = (\d+);' CURRENT_PROJECT_VERSION)

is_semver() { [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; }

for pair in "root package.json:$root_version" "$GRADLE:$android_version" "$PBX:$ios_version"; do
  if ! is_semver "${pair#*:}"; then
    echo "Version '${pair#*:}' in ${pair%%:*} is not X.Y.Z — fix it by hand first" >&2
    exit 1
  fi
done

# highest = the one all three have to converge onto, since neither store lets a version go backwards.
highest=$(printf '%s\n%s\n%s\n' "$root_version" "$android_version" "$ios_version" | sort -V | tail -1)

# Every number defaults to what is already on disk; each mode raises only the ones it owns. Writing
# and reading back all five either way keeps the verification below meaningful in both modes — an
# untouched number is substituted with its own value, which is a no-op on the file.
new_root_version=$root_version
new_android_version=$android_version
new_ios_version=$ios_version
new_android_code=$android_code
new_ios_build=$ios_build

if $build_only; then
  new_android_code=$((android_code + 1))
  new_ios_build=$((ios_build + 1))
else
  if [ -n "$explicit_version" ]; then
    if ! is_semver "$explicit_version"; then
      echo "'$explicit_version' is not a X.Y.Z version" >&2
      exit 1
    fi
    new_version="$explicit_version"
    # sort -V puts the smaller first; if the highest current version doesn't sort before the requested
    # one, the request is a step sideways or backwards and the stores would reject the upload.
    if [ "$new_version" != "$highest" ] &&
      [ "$(printf '%s\n%s\n' "$highest" "$new_version" | sort -V | head -1)" != "$highest" ]; then
      echo "$new_version is lower than the highest current version ($highest) — stores reject that" >&2
      exit 1
    fi
    if [ "$new_version" = "$highest" ]; then
      echo "$new_version is already the highest current version — nothing to bump" >&2
      exit 1
    fi
  else
    IFS=. read -r major minor _patch <<<"$highest"
    new_version="$major.$((minor + 1)).0"
  fi

  new_root_version="$new_version"
  new_android_version="$new_version"
  new_ios_version="$new_version"

  if [ "$root_version" != "$android_version" ] || [ "$android_version" != "$ios_version" ]; then
    echo "Note: versions had drifted (root $root_version, android $android_version, ios $ios_version)."
    echo "      Converging all three on $new_version."
    echo
  fi
fi

printf '%-22s %-24s %-8s -> %s\n' \
  "package.json" "version" "$root_version" "$new_root_version" \
  "build.gradle" "versionName" "$android_version" "$new_android_version" \
  "build.gradle" "versionCode" "$android_code" "$new_android_code" \
  "project.pbxproj" "MARKETING_VERSION" "$ios_version" "$new_ios_version" \
  "project.pbxproj" "CURRENT_PROJECT_VERSION" "$ios_build" "$new_ios_build"

if $dry_run; then
  echo
  echo "--dry-run: nothing written."
  exit 0
fi

# Root package.json: replace the first "version" key only — workspace deps further down the file also
# carry version strings. Slurp mode (-0) with a non-global s/// stops at the first match.
perl -0pi -e "s/(\"version\"\s*:\s*)\"[^\"]*\"/\${1}\"$new_root_version\"/" package.json

perl -pi -e "s/(versionCode\s+)\d+/\${1}$new_android_code/" "$GRADLE"
perl -pi -e "s/(versionName\s+)\"[^\"]*\"/\${1}\"$new_android_version\"/" "$GRADLE"

# The pbxproj carries one copy of each per build configuration (Debug and Release), so these are /g.
perl -pi -e "s/(CURRENT_PROJECT_VERSION = )\d+;/\${1}$new_ios_build;/g" "$PBX"
perl -pi -e "s/(MARKETING_VERSION = )[^;]+;/\${1}$new_ios_version;/g" "$PBX"

# Read it all back rather than trusting the substitutions — a regex that quietly matched nothing is
# exactly the silent half-bump this script exists to prevent.
check() {
  if [ "$2" != "$3" ]; then
    echo "Bump failed: $1 is '$2', expected '$3'" >&2
    exit 1
  fi
}
check "package.json version" "$(node -p "require('./package.json').version")" "$new_root_version"
check "$GRADLE versionName" "$(read_or_die "$GRADLE" 'versionName\s+"([^"]+)"' versionName)" "$new_android_version"
check "$GRADLE versionCode" "$(read_or_die "$GRADLE" 'versionCode\s+(\d+)' versionCode)" "$new_android_code"
check "$PBX MARKETING_VERSION" "$(read_or_die "$PBX" 'MARKETING_VERSION = ([^;]+);' MARKETING_VERSION)" "$new_ios_version"
check "$PBX PROJECT_VERSION" "$(read_or_die "$PBX" 'CURRENT_PROJECT_VERSION = (\d+);' CURRENT_PROJECT_VERSION)" "$new_ios_build"

# Both pbxproj configurations must have moved, not just the one `read_or_die` happened to find first.
for key in "MARKETING_VERSION = $new_ios_version;" "CURRENT_PROJECT_VERSION = $new_ios_build;"; do
  found=$(grep -c "$key" "$PBX" || true)
  if [ "$found" -lt 2 ]; then
    echo "Bump failed: '$key' appears $found time(s) in $PBX, expected one per build configuration" >&2
    exit 1
  fi
done

echo

if $build_only; then
  echo "Bumped the build counters (android $new_android_code, ios $new_ios_build) on $new_ios_version."

  # A tag means this version already had its GitHub release, so it is at least on its way to the
  # stores. Once Apple actually *releases* it, its TestFlight train closes and this upload comes back
  # as "Invalid Pre-Release Train" — the repo cannot see that promotion, hence a warning rather than a
  # refusal: rebuilding a version that is tagged but still in review is legitimate.
  if [ -n "$(git tag -l "$new_ios_version")" ]; then
    echo
    echo "Warning: $new_ios_version is already tagged, so it has been released."
    echo "         If it is live on the App Store its TestFlight train is closed and this build will be"
    echo "         rejected ('Invalid Pre-Release Train'). Run 'yarn bump' first to open the next version."
  fi
else
  echo "Opened $new_version (build counters left at android $new_android_code, ios $new_ios_build)."
  echo "Nothing ships from this: the counters are what trigger the store workflows."

  # The version being left behind should have been released before opening the next one. No entry for
  # it means it never was — bumping past it strands it, since the CHANGELOG entry is what
  # scripts/release.sh releases on.
  if ! grep -q "^## $highest\([^0-9.]\|$\)" CHANGELOG.md; then
    echo
    echo "Warning: CHANGELOG.md has no '## $highest' entry, so $highest was never released."
    echo "         Bumping past it strands it — scripts/release.sh only tags a version that has an entry."
  fi
fi
