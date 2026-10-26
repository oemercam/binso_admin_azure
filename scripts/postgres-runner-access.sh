#!/usr/bin/env bash
set -euo pipefail
# Only the known application database; never derives a target from user text.
RULE="binso-ci-${GITHUB_RUN_ID:?}-${GITHUB_RUN_ATTEMPT:?}"
case "${1:-}" in
  open)
    IP="$(curl --fail --silent --show-error --max-time 15 https://api.ipify.org)"
    node scripts/validate-runner-ip.mjs "$IP"
    # Mark cleanup necessary BEFORE creating the rule: a failed CLI response may
    # still mean Azure accepted it. The always() step removes this exact name.
    echo 'BINSO_RUNNER_FIREWALL_REQUESTED=true' >> "${GITHUB_ENV:?}"
    az postgres flexible-server firewall-rule create --subscription 57c41f8a-69de-4655-bea5-fad30de6921a --resource-group rg-binso-admin-prod --server-name binso-platform-db --name "$RULE" --start-ip-address "$IP" --end-ip-address "$IP" --output none
    ;;
  close)
    [ "${BINSO_RUNNER_FIREWALL_REQUESTED:-false}" = true ] || exit 0
    az postgres flexible-server firewall-rule delete --subscription 57c41f8a-69de-4655-bea5-fad30de6921a --resource-group rg-binso-admin-prod --server-name binso-platform-db --name "$RULE" --yes --output none
    ;;
  *) echo 'Expected open or close' >&2; exit 1 ;;
esac
