ARG CLAMAV_BASE_IMAGE=clamav/clamav@sha256:b5b910ce43d595bf8a2fe401e34db56434602b2c755b7c2b07f00c917d04d469
FROM ${CLAMAV_BASE_IMAGE}
COPY clamd.conf freshclam.conf /etc/clamav/
COPY entrypoint.sh /binso-scanner-entrypoint.sh
RUN chmod 0555 /binso-scanner-entrypoint.sh
ENTRYPOINT ["/binso-scanner-entrypoint.sh"]
