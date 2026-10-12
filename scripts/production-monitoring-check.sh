#!/usr/bin/env bash
set -euo pipefail
RG="${AUDIT_RESOURCE_GROUP:-rg-binso-admin-prod}"
APP="${AUDIT_APP_NAME:-binso-admin-prod}"
INSIGHTS_COUNT="$(az resource list -g "$RG" --resource-type Microsoft.Insights/components --query 'length(@)' -o tsv)"
ACTION_GROUP_COUNT="$(az monitor action-group list -g "$RG" --query 'length([?enabled==`true`])' -o tsv)"
METRIC_ALERT_COUNT="$(az monitor metrics alert list -g "$RG" --query 'length([?enabled==`true`])' -o tsv)"
QUERY_ALERT_COUNT="$(az monitor scheduled-query list -g "$RG" --query 'length([?enabled==`true`])' -o tsv)"
for count in "$INSIGHTS_COUNT" "$ACTION_GROUP_COUNT" "$METRIC_ALERT_COUNT" "$QUERY_ALERT_COUNT"; do
  [[ "$count" =~ ^[0-9]+$ ]] || { echo '::error::Monitoring inventory returned an invalid count.'; exit 1; }
done
[ "$INSIGHTS_COUNT" -ge 1 ] || { echo '::error::Application Insights is missing.'; exit 1; }
[ "$ACTION_GROUP_COUNT" -ge 1 ] || { echo '::error::An enabled action group is missing.'; exit 1; }
[ $((METRIC_ALERT_COUNT + QUERY_ALERT_COUNT)) -ge 1 ] || { echo '::error::An enabled alert rule is missing.'; exit 1; }
APP_ID="$(az webapp show -g "$RG" -n "$APP" --query id -o tsv)"
[ -n "$APP_ID" ] || { echo '::error::App Service is missing.'; exit 1; }
echo 'Monitoring inventory passed; alert delivery/effectiveness still requires operational evidence.'
