#!/usr/bin/env bash
#
# Uploads the rendered hero clips to Cloudflare R2.
#
# The videos (~1.8 MB each) and their posters are deliberately not committed — see the root
# .gitignore. R2 is the store; the web build downloads them into public/ so Vercel still serves
# everything same-origin, which is why the posters can live here too without costing the LCP
# anything.
#
# R2 speaks the S3 API, so the AWS CLI is all that is needed — no extra dependency.
#
# Setup, once:
#   1. Cloudflare dashboard -> R2 -> create a bucket (e.g. `compass-media`).
#   2. R2 -> Manage API tokens -> create a token with "Object Read & Write" on that bucket.
#   3. Bucket -> Settings -> Public access -> enable the **r2.dev** development URL. Copy it; it
#      looks like https://pub-<hash>.r2.dev.
#      No custom domain is needed. One would require the domain to be a zone in the same Cloudflare
#      account, and compassmeet.com is on Vercel DNS. r2.dev's rate limit does not bite here because
#      the bucket is read at build time, roughly once per deploy, not once per visitor.
#   4. Put the credentials in the repo-root .env (already gitignored):
#         R2_ACCOUNT_ID=...
#         R2_BUCKET=compass-media
#         R2_ACCESS_KEY_ID=...
#         R2_SECRET_ACCESS_KEY=...
#   5. Set MEDIA_SOURCE_BASE_URL=https://pub-<hash>.r2.dev in Vercel's project env vars. The web
#      build (web/scripts/fetch-media.mjs) downloads the clips into public/videos/ from there, so
#      Vercel's CDN serves them same-origin and R2 is never in a visitor's request path.
#
# Then, after every render (or after `npm run capture:vote`, which needs no render):
#   npm run upload:media
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
OUT_DIR="$HERE/../out"

# shellcheck disable=SC1091
if [ -f "$ROOT/.env" ]; then
  set -a
  # Only the R2_* keys — the rest of .env is not ours to import.
  eval "$(grep -E '^R2_[A-Z_]+=' "$ROOT/.env" || true)"
  set +a
fi

missing=()
for var in R2_ACCOUNT_ID R2_BUCKET R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY; do
  [ -n "${!var:-}" ] || missing+=("$var")
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "Missing: ${missing[*]}" >&2
  echo "Add them to $ROOT/.env — see the setup notes at the top of this script." >&2
  exit 1
fi

ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION=auto
# AWS CLI v2.23+ sends integrity checksums that R2 rejects with a 501. Restricting them to requests
# that actually require one is the documented workaround.
export AWS_REQUEST_CHECKSUM_CALCULATION=when_required
export AWS_RESPONSE_CHECKSUM_VALIDATION=when_required

# One day rather than immutable: filenames are stable across re-renders, so a long TTL would strand
# viewers on an old clip. A day is short enough to not think about and long enough to be cached for
# any real session. Purge in the Cloudflare dashboard if a fix needs to land sooner.
CACHE_CONTROL="public, max-age=86400"

upload() {
  local src="$1" key="$2" type="$3"
  if [ ! -f "$src" ]; then
    echo "Missing $src — run the render/still scripts first (npm run render:search[:dark], still:search[:dark])." >&2
    exit 1
  fi
  echo "  $key  ($(du -h "$src" | cut -f1))"
  aws s3 cp "$src" "s3://${R2_BUCKET}/${key}" \
    --endpoint-url "$ENDPOINT" \
    --content-type "$type" \
    --cache-control "$CACHE_CONTROL" \
    --only-show-errors
}

# Posters are uploaded as JPEG from web/public, where the render step already converted them; the
# .png files in out/ are the raw Remotion stills.
WEB_IMAGES="$ROOT/web/public/images"

echo "Uploading to r2://${R2_BUCKET} ..."
upload "$OUT_DIR/compass-search-demo-light.mp4" "videos/search-demo-light.mp4" "video/mp4"
upload "$OUT_DIR/compass-search-demo-dark.mp4" "videos/search-demo-dark.mp4" "video/mp4"
upload "$WEB_IMAGES/search-demo-poster-light.jpg" "images/search-demo-poster-light.jpg" "image/jpeg"
upload "$WEB_IMAGES/search-demo-poster-dark.jpg" "images/search-demo-poster-dark.jpg" "image/jpeg"
# About-page vote card (A1). Written straight to web/public by capture-vote.mjs — no render step.
upload "$WEB_IMAGES/vote-tally-light.jpg" "images/vote-tally-light.jpg" "image/jpeg"
upload "$WEB_IMAGES/vote-tally-dark.jpg" "images/vote-tally-dark.jpg" "image/jpeg"

echo
echo "Done. The next Vercel build pulls these into web/public/videos via MEDIA_SOURCE_BASE_URL."
echo "Re-deploy to publish a new render — visitors are served from Vercel, not from R2."
