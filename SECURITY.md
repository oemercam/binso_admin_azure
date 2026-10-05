# Security Policy

## Supported version

Binso One is operated as a continuously deployed SaaS service. Security fixes are applied to the current production version; older repository states and historic deployments are not supported.

## Reporting a vulnerability

Do not report security vulnerabilities through public GitHub issues, discussions, pull requests, support tickets, or social media.

Use GitHub Private Vulnerability Reporting for this repository when it is enabled. Until then, report suspected vulnerabilities privately to:

**Binso GmbH**  
security@binso.ch  
Weissbadstrasse 8b  
9050 Appenzell  
Switzerland

Include, where possible:

- a concise description of the issue and affected area;
- reproduction steps or a proof of concept that does not access or alter third-party data;
- observed and expected behaviour;
- security impact and prerequisites;
- affected URL, route, API or component;
- relevant timestamps, request IDs or screenshots with secrets and personal data removed.

## Response process

Reports are triaged according to severity and exploitability. We may request additional information, coordinate a remediation window, and ask the reporter to delay public disclosure until a fix has been deployed and customers are protected.

## Safe-harbour expectations

Good-faith security research must avoid service disruption, social engineering, credential harvesting, privacy violations, destructive testing, persistence, lateral movement, and access to data that does not belong to the researcher.

If sensitive customer or personal data is encountered, stop testing immediately, do not retain or redistribute the data, and include only the minimum information necessary to identify the issue.

## Secrets

Never commit credentials, API keys, tokens, private certificates, connection strings, customer data or production exports to this repository. GitHub secret scanning and the repository security checks are intended to complement, not replace, secure secret handling.
