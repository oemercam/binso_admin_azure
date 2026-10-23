#!/usr/bin/env bash
set -euo pipefail

# The hosted runner's Azure mirror repeatedly stalls on browser font/media packages.
# Use the same signed Ubuntu archive through its official HTTPS endpoint.
for source in /etc/apt/sources.list /etc/apt/sources.list.d/ubuntu.sources /etc/apt/apt-mirrors.txt; do
  if [ -f "$source" ]; then
    sudo sed -i 's|https\?://azure.archive.ubuntu.com/ubuntu|https://archive.ubuntu.com/ubuntu|g' "$source"
    if grep -qF 'azure.archive.ubuntu.com/ubuntu' "$source"; then
      echo "::error::The browser dependency source still selects the stalled Azure mirror."
      exit 1
    fi
  fi
done

# Keep package signature/TLS verification and the complete Playwright dependency set.
printf '%s\n' 'Acquire::Retries "3";' 'Acquire::http::Timeout "30";' 'Acquire::https::Timeout "30";' \
  | sudo tee /etc/apt/apt.conf.d/80binso-browser-downloads >/dev/null
