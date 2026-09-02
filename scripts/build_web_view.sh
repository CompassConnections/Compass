#!/bin/bash

set -e

cd "$(dirname "$0")"/..

# Paths
ROOT_ENV=".env"           # your root .env
WEB_ENV="web/.env"        # target for frontend

# Backup existing web/.env if it exists
if [ -f "$WEB_ENV" ]; then
  cp "$WEB_ENV" "${WEB_ENV}.bak"
  echo "Backed up existing $WEB_ENV to ${WEB_ENV}.bak"
fi

# Filter NEXT_PUBLIC_* lines
if [ -f "$ROOT_ENV" ]; then
  set -a
  source "$ROOT_ENV"
  set +a
  echo "Sourced variables from $ROOT_ENV"
fi
env | grep '^NEXT_PUBLIC_' > "$WEB_ENV" || true

echo "Copied NEXT_PUBLIC_ variables to $WEB_ENV:"

echo "NEXT_PUBLIC_FIREBASE_ENV=prod" >> "$WEB_ENV"

cat "$WEB_ENV"

cd web

export NEXT_PUBLIC_WEBVIEW=1

rm -rf .next/* .next/.* 2>/dev/null || true

# Hack to ignore getServerSideProps, getStaticProps and getStaticPaths for mobile webview build
# as Next.js doesn't support SSG, SSR and ISR on mobile. A dynamic route is worse than unsupported:
# `fallback: 'blocking'` fails the export outright ("Found pages with `fallback` enabled"), so every
# page listed here has to be stripped or there is no APK at all. What is left is a plain
# client-rendered page, which is what the app wants anyway — it reads the API at runtime.
#
# Add a page here whenever it grows a getStaticProps/getStaticPaths/getServerSideProps, and make sure
# the page itself can render with none of those props (read the route from `router.query`).
SSG_PAGES=(
  "pages/[username]/index.tsx"
  "pages/blog/[slug].tsx"
  "pages/vote/[id].tsx"
  "pages/index.tsx"
)

# Put the sources back whatever happens — a failed build must not leave the working tree holding
# `_getStaticProps` and no proxy.ts.
restore_sources() {
  for page in "${SSG_PAGES[@]}"; do
    if [ -f "$page.bak" ]; then
      mv -f "$page.bak" "$page"
    fi
  done
  if [ -f _proxy.ts ]; then
    mv -f _proxy.ts proxy.ts
  fi
}
trap restore_sources EXIT

# rename getStaticProps/getStaticPaths/getServerSideProps to _getStaticProps/... so Next.js doesn't
# see them (the .bak each command leaves behind is the pristine original, and is what restores it)
#
# perl, not sed: `\b` is a GNU extension. BSD sed on the macOS runner that builds iOS matched nothing
# and exited 0, so the rename silently no-oped, Next built `/[username]` and `/blog/[slug]` as real
# SSG routes, and emitted no `[username].html` / `blog/[slug].html` template at all — leaving the app
# to fall back to the home page on every profile and blog link. Android never saw it: it builds on
# Ubuntu, where GNU sed honours `\b`.
for page in "${SSG_PAGES[@]}"; do
  perl -pi.bak -e 's/\bgetStaticProps\b/_getStaticProps/g; s/\bgetStaticPaths\b/_getStaticPaths/g; s/\bgetServerSideProps\b/_getServerSideProps/g' "$page"

  # A silent no-op here costs a whole build+upload+install cycle to discover, so check rather than trust.
  if grep -qE '\bexport (const|async function) (getStaticProps|getStaticPaths|getServerSideProps)\b' "$page"; then
    echo "build_web_view: failed to strip data-fetching exports from $page" >&2
    exit 1
  fi
done

# rename proxy to _proxy
mv proxy.ts _proxy.ts

yarn build

# The dynamic-route templates are what the native shells resolve extension-less URLs onto (see
# NextExportRouter in ios/, and Capacitor's WebViewLocalServer on Android). If a page in SSG_PAGES
# still had getStaticPaths at build time, Next silently emits no template for it and every link to
# that route lands on the home page instead — with no error anywhere.
for page in "${SSG_PAGES[@]}"; do
  case "$page" in *'['*) ;; *) continue ;; esac
  template="out/$(echo "$page" | sed -e 's|^pages/||' -e 's|/index\.tsx$|.html|' -e 's|\.tsx$|.html|')"
  if [ ! -f "$template" ]; then
    echo "build_web_view: expected dynamic-route template $template was not generated" >&2
    exit 1
  fi
done
