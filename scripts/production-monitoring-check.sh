#!/usr/bin/env bash
set -euo pipefail
# Resource names and groups are not globally unique across subscriptions.
# Reuse the canonical exact-ID, GET-only contracts instead of broad counts.
node scripts/azure-readiness-check.mjs monitoring
node scripts/production-monitoring-check.mjs
