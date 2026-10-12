#!/usr/bin/env bash
set -euo pipefail
rm -rf /tmp/binso-production-artifact
mkdir -p /tmp/binso-production-artifact
unzip -q deploy/binso-one.zip -d /tmp/binso-production-artifact
test -f /tmp/binso-production-artifact/server.js
test -d /tmp/binso-production-artifact/node_modules
test ! -d /tmp/binso-production-artifact/public/public
test ! -d /tmp/binso-production-artifact/.next/static/static
test -f /tmp/binso-production-artifact/public/sw.js
test -f /tmp/binso-production-artifact/public/manifest-app.webmanifest
(
  cd /tmp/binso-production-artifact
  PORT=3100 FILE_SCAN_SOCKET=/tmp/binso-scanner/clamd.sock BINSO_SCANNER_SIDECAR=true node scripts/start-scanner-production.mjs > /tmp/binso-artifact.log 2>&1 &
  echo $! > /tmp/binso-artifact.pid
)
ARTIFACT_PID="$(cat /tmp/binso-artifact.pid)"
trap 'kill "$ARTIFACT_PID" 2>/dev/null || true' EXIT
READY=0
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1:3100/api/health > /tmp/binso-artifact-health.json; then
    READY=1
    break
  fi
  if ! kill -0 "$ARTIFACT_PID" 2>/dev/null; then
    cat /tmp/binso-artifact.log
    echo "::error::Packaged production server exited before becoming ready."
    exit 1
  fi
  sleep 1
done
if [ "$READY" -ne 1 ]; then
  cat /tmp/binso-artifact.log
  echo "::error::Packaged production artifact did not become ready."
  exit 1
fi
grep -q "$GITHUB_SHA" /tmp/binso-production-artifact/public/deployment.json
node --input-type=module -e 'import fs from "node:fs";import {createHash} from "node:crypto";import {validateScope,scopeDigest} from "./scripts/compliance/release-scope.mjs";const raw=fs.readFileSync("/tmp/binso-production-artifact/ux-compliance/release-scope.v1.json");const scope=validateScope(JSON.parse(raw));const meta=JSON.parse(fs.readFileSync("/tmp/binso-production-artifact/public/deployment.json"));if(meta.sha!==process.env.GITHUB_SHA||meta.releaseProfile!==scope.id||meta.productionAcceptance!==false||meta.releaseScopeSha256!==createHash("sha256").update(raw).digest("hex")||meta.releaseScopeSha256!==scopeDigest())throw Error("Exact ZIP release scope mismatch");'
grep -q '"status":"ok"' /tmp/binso-artifact-health.json
test -S /tmp/binso-scanner/clamd.sock
test "$(stat -c %a /tmp/binso-scanner/clamd.sock)" = 600
test "$(stat -c %a /tmp/binso-scanner)" = 700
BINSO_BASE_URL=http://127.0.0.1:3100 node scripts/check-deployed-assets.mjs /tmp/binso-production-artifact
echo "Exact production ZIP starts successfully."
