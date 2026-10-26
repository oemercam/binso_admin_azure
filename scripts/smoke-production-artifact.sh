#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_SHA:?Exact source SHA is required}"
ARTIFACT_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/binso-production-artifact.XXXXXX")"
ARTIFACT_PID=""
cleanup() {
  if [ -n "$ARTIFACT_PID" ]; then
    kill "$ARTIFACT_PID" 2>/dev/null || true
    wait "$ARTIFACT_PID" 2>/dev/null || true
  fi
  rm -rf "$ARTIFACT_ROOT"
}
trap cleanup EXIT
unzip -q deploy/binso-one.zip -d "$ARTIFACT_ROOT"
test -f "$ARTIFACT_ROOT/server.js"
test -d "$ARTIFACT_ROOT/node_modules"
test ! -d "$ARTIFACT_ROOT/public/public"
test ! -d "$ARTIFACT_ROOT/.next/static/static"
test -f "$ARTIFACT_ROOT/public/sw.js"
test -f "$ARTIFACT_ROOT/public/manifest-app.webmanifest"
ARTIFACT_PORT="$(node --input-type=module -e 'import net from "node:net";const server=net.createServer();server.listen(0,"127.0.0.1",()=>{console.log(server.address().port);server.close()})')"
(
  cd "$ARTIFACT_ROOT"
  node --input-type=module -e 'import {createRequire} from "node:module";const require=createRequire(process.cwd()+"/package.json");require("next/dist/server/next.js");require("@next/env");require("@swc/helpers/_/_interop_require_default");require("pdfkit");require("exceljs");require("swissqrbill/pdf");const sharp=require("sharp");await sharp({create:{width:1,height:1,channels:4,background:"#ffffff"}}).png().toBuffer();'
  exec env PORT="$ARTIFACT_PORT" FILE_SCAN_SOCKET=/tmp/binso-scanner/clamd.sock BINSO_SCANNER_SIDECAR=true node scripts/start-scanner-production.mjs
) > "$ARTIFACT_ROOT/server.log" 2>&1 &
ARTIFACT_PID=$!
READY=0
for attempt in {1..30}; do
  if curl --max-time 2 -fsS "http://127.0.0.1:$ARTIFACT_PORT/api/health" > "$ARTIFACT_ROOT/health.json"; then
    READY=1
    break
  fi
  if ! kill -0 "$ARTIFACT_PID" 2>/dev/null; then
    cat "$ARTIFACT_ROOT/server.log"
    echo "::error::Packaged production server exited before becoming ready."
    exit 1
  fi
  sleep 1
done
if [ "$READY" -ne 1 ]; then
  cat "$ARTIFACT_ROOT/server.log"
  echo "::error::Packaged production artifact did not become ready."
  exit 1
fi
BINSO_ARTIFACT_ROOT="$ARTIFACT_ROOT" node --input-type=module -e 'import fs from "node:fs";import path from "node:path";import {createHash} from "node:crypto";import {validateScope,scopeDigest} from "./scripts/compliance/release-scope.mjs";const root=process.env.BINSO_ARTIFACT_ROOT;const raw=fs.readFileSync(path.join(root,"ux-compliance/release-scope.v1.json"));const scope=validateScope(JSON.parse(raw));const meta=JSON.parse(fs.readFileSync(path.join(root,"public/deployment.json")));const health=JSON.parse(fs.readFileSync(path.join(root,"health.json")));if(health.status!=="ok"||health.sha!==process.env.GITHUB_SHA||meta.sha!==process.env.GITHUB_SHA||meta.releaseProfile!==scope.id||meta.productionAcceptance!==false||meta.releaseScopeSha256!==createHash("sha256").update(raw).digest("hex")||meta.releaseScopeSha256!==scopeDigest())throw Error("Exact ZIP runtime/source/release scope mismatch");'
test -S /tmp/binso-scanner/clamd.sock
test "$(stat -c %a /tmp/binso-scanner/clamd.sock)" = 600
test "$(stat -c %a /tmp/binso-scanner)" = 700
BINSO_BASE_URL="http://127.0.0.1:$ARTIFACT_PORT" node scripts/check-deployed-assets.mjs "$ARTIFACT_ROOT"
echo "Exact production ZIP starts successfully with its own dependencies and matching runtime SHA."
