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
grep '^NEXT_PUBLIC_' "$ROOT_ENV" > "$WEB_ENV"

echo "Copied NEXT_PUBLIC_ variables to $WEB_ENV:"

echo "NEXT_PUBLIC_FIREBASE_ENV=prod" >> "$WEB_ENV"

cat "$WEB_ENV"

cd web

rm -rf .next

# Hack to ignore getServerSideProps, getStaticProps and getStaticPaths for mobile webview build
# as Next.js doesn't support SSG, SSR and ISR on mobile
USERNAME_PAGE=pages/[username]/index.tsx
HOME_PAGE=pages/index.tsx

# rename getStaticProps to _getStaticProps
sed -i.bak 's/\bgetStaticProps\b/_getStaticProps/g' $USERNAME_PAGE

# rename getStaticPaths to _getStaticPaths
sed -i.bak 's/\bgetStaticPaths\b/_getStaticPaths/g' $USERNAME_PAGE

# rename getServerSideProps to _getServerSideProps
sed -i.bak 's/\bgetServerSideProps\b/_getServerSideProps/g' $HOME_PAGE

yarn build

sed -i.bak 's/\b_getStaticProps\b/getStaticProps/g' $USERNAME_PAGE
sed -i.bak 's/\b_getStaticPaths\b/getStaticPaths/g' $USERNAME_PAGE
sed -i.bak 's/\b_getServerSideProps\b/getServerSideProps/g' $HOME_PAGE
