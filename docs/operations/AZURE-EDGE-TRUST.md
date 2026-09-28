# Azure edge trust and client IP handling

## Purpose

Binso One uses client IP information only as an abuse-control signal for rate limiting. It is not an authentication or authorization factor.

## Required production topology

- The Azure App Service production endpoint must have an explicitly documented ingress model.
- If Azure Front Door, Application Gateway, another reverse proxy, or a private ingress is used, direct bypass access to the App Service must be blocked with Azure App Service Access Restrictions or a private endpoint.
- Access Restrictions for the SCM/Kudu endpoint must be reviewed separately from the main site.
- If Azure Front Door is used, restrict ingress to the intended Front Door path and use the Azure-supported header restriction where applicable, for example `X-Azure-FDID` together with the appropriate service-tag/IP restriction.
- `X-Forwarded-For` and similar forwarding headers are trusted only when the network layer guarantees that clients cannot bypass or impersonate the trusted proxy path.

## Application behaviour

`lib/http/rate-limit.ts` derives a rate-limit bucket from the forwarded client address. This value is deliberately treated as a throttling hint only. Tenant selection, authentication, permissions and data isolation must never depend on this value.

The distributed PostgreSQL rate limiter fails closed when the database-backed limiter cannot be evaluated for protected public endpoints. The in-memory limiter remains a local-development fallback when PostgreSQL is not configured.

## Production verification checklist

1. Record the production ingress path in the operations runbook.
2. Verify App Service Access Restrictions for both the main site and SCM/Kudu.
3. Verify that the application cannot be reached through an unintended direct origin path when a trusted proxy is expected.
4. Send a test request through the supported ingress and confirm the effective client-IP header seen by the application.
5. Attempt a direct request with a forged forwarding header and verify that network restrictions prevent the request from reaching the application whenever proxy trust is required.
6. Re-run this verification whenever Front Door, Application Gateway, App Service networking or DNS routing changes.
