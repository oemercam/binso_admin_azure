#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_SHA:?Exact source SHA is required}"
test -f .next/standalone/server.js
rm -rf deploy
mkdir -p deploy/app/.next
cp -R .next/standalone/. deploy/app/
# Install the locked production dependencies without pnpm symlinks.
# ZIP extraction and Azure startup must preserve module resolution.
rm -rf deploy/runtime
mkdir -p deploy/runtime
cp package.json pnpm-lock.yaml pnpm-workspace.yaml deploy/runtime/
node scripts/package-patches.mjs deploy/runtime
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
mkdir -p deploy/app/scripts deploy/app/lib/server
mkdir -p deploy/app/ux-compliance
cp ux-compliance/release-scope.v1.json deploy/app/ux-compliance/
cp scripts/scanner-bridge.mjs scripts/start-scanner-production.mjs scripts/rescan-pending-files.mjs scripts/private-manifest.mjs deploy/app/scripts/
cp lib/server/clamav-protocol.mjs lib/server/file-rescan.mjs deploy/app/lib/server/
if [ -d public ]; then cp -R public/. deploy/app/public/; fi
node --input-type=module -e 'import fs from "node:fs";import {readScope,scopeDigest} from "./scripts/compliance/release-scope.mjs";const scope=readScope();fs.writeFileSync("deploy/app/public/deployment.json",JSON.stringify({sha:process.env.GITHUB_SHA,releaseProfile:scope.id,releaseScopeSha256:scopeDigest(),productionAcceptance:false})+"\n");'
node scripts/verify-runtime-package.mjs deploy/app "$GITHUB_SHA"
cd deploy/app
zip -qr ../binso-one.zip .
cd ../..
test -s deploy/binso-one.zip
unzip -l deploy/binso-one.zip > /tmp/binso-zip-contents.txt
grep -q 'server.js' /tmp/binso-zip-contents.txt
