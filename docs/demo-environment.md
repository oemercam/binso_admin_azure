# Binso One Demo Environment

The marketing/demo tenant is `Binso Demo AG` and is explicitly marked with `organizations.is_demo=true` so it can be excluded from commercial metrics.

Use only on a non-production database:

```powershell
$env:ALLOW_DEMO_SEED="true"
$env:NEXT_PUBLIC_APP_ENV="staging"
pnpm demo:seed
```

Optional identity mapping can be set with `DEMO_USER_ID` and `DEMO_USER_EMAIL`. The default email is `demo-marketing@binso.ch`. No password is stored in Git; the corresponding identity must be created through the configured authentication provider.

Reset is deliberately protected by the same non-production safeguards:

```powershell
$env:ALLOW_DEMO_SEED="true"
$env:NEXT_PUBLIC_APP_ENV="staging"
pnpm demo:reset
```

Never use real customer data in this tenant. The script uses fictional customers and `example.com` addresses.
