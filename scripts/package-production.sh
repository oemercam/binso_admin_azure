#!/usr/bin/env bash
set -euo pipefail
test -f .next/standalone/server.js
rm -rf deploy
mkdir -p deploy/app/.next
cp -R .next/standalone/. deploy/app/
# Install the locked production dependencies without pnpm symlinks.
# ZIP extraction and Azure startup must preserve module resolution.
rm -rf deploy/runtime
mkdir -p deploy/runtime
cp package.json pnpm-lock.yaml pnpm-workspace.yaml deploy/runtime/
pnpm --dir deploy/runtime install --prod --frozen-lockfile --config.node-linker=hoisted
rm -rf deploy/app/node_modules
mv deploy/runtime/node_modules deploy/app/node_modules
rm -rf deploy/runtime
(
  cd deploy/app
  node -e "require('next/dist/server/next.js'); require('@next/env'); require('@swc/helpers/_/_interop_require_default')"
)
mkdir -p deploy/app/.next/static
cp -R .next/static/. deploy/app/.next/static/
mkdir -p deploy/app/public
if [ -d public ]; then cp -R public/. deploy/app/public/; fi
printf '{"sha":"%s"}\n' "$GITHUB_SHA" > deploy/app/public/deployment.json
cd deploy/app
zip -qr ../binso-one.zip .
cd ../..
test -s deploy/binso-one.zip
unzip -l deploy/binso-one.zip > /tmp/binso-zip-contents.txt
grep -q 'server.js' /tmp/binso-zip-contents.txt