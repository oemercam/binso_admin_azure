#!/bin/sh
set -eu
mkdir -p /var/lib/clamav /run/clamav
chown clamav:clamav /var/lib/clamav /run/clamav
chmod 0750 /var/lib/clamav /run/clamav
# Sidecars inherit app settings. The scanner processes must not inherit DB/Graph/Stripe credentials.
exec env -i PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin TZ=UTC CLAMD_STARTUP_TIMEOUT=600 FRESHCLAM_CHECKS=12 CLAMAV_NO_MILTERD=true /init
