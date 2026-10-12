ARG CLAMAV_BASE_IMAGE
FROM ${CLAMAV_BASE_IMAGE}
COPY clamd.conf freshclam.conf /etc/clamav/
COPY entrypoint.sh /binso-scanner-entrypoint.sh
RUN chmod 0555 /binso-scanner-entrypoint.sh
ENTRYPOINT ["/binso-scanner-entrypoint.sh"]
