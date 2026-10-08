#!/usr/bin/env bash
set -euo pipefail
rm -rf /tmp/binso-production-artifact
mkdir -p /tmp/binso-production-artifact
unzip -q deploy/binso-one.zip -d /tmp/binso-production-artifact
test -f /tmp/binso-production-artifact/server.js
test -d /tmp/binso-production-artifact/node_modules
(
  cd /tmp/binso-production-artifact
  PORT=3100 HOSTNAME=127.0.0.1 node server.js > /tmp/binso-artifact.log 2>&1 &
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
grep -q '"status":"ok"' /tmp/binso-artifact-health.json
BINSO_BASE_URL=http://127.0.0.1:3100 node scripts/check-deployed-assets.mjs /tmp/binso-production-artifact
echo "Exact production ZIP starts successfully."