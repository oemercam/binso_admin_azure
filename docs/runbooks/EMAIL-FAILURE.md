# Email Failure Runbook
Do not roll back a completed business transaction solely because email failed. Record/monitor failure; bounded retry if implemented; no endless retries/hard-bounce loops; no secrets/excessive PII in logs.
