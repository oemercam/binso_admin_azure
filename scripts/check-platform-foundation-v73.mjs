import fs from 'node:fs'
const must=[
'database/migrations/0011_saas_platform_foundation.sql','app/api/support/cases/route.ts','app/api/platform/support/route.ts','app/api/platform/audit/route.ts','app/api/platform/feature-flags/route.ts','app/api/health/live/route.ts','app/api/health/ready/route.ts','components/navigation/platform-nav.tsx','components/support/customer-support.tsx','components/platform/platform-support-view.tsx','app/(app)/platform/customers/page.tsx','app/(app)/platform/subscriptions/page.tsx','app/(app)/platform/registrations/page.tsx','app/(app)/platform/support/page.tsx','app/(app)/platform/operations/page.tsx','app/(app)/platform/audit/page.tsx','app/(app)/platform/settings/page.tsx']
for(const f of must)if(!fs.existsSync(f))throw new Error(`V73 foundation missing: ${f}`)
const domain=fs.readFileSync('types/domain.ts','utf8');for(const role of ['platform_owner','platform_admin','platform_support','platform_billing','platform_auditor'])if(!domain.includes(role))throw new Error(`Missing platform role ${role}`)
const server=fs.readFileSync('lib/auth/server.ts','utf8');if(!server.includes("@binso.ch"))throw new Error('Binso operator identity boundary missing')
const migration=fs.readFileSync('database/migrations/0011_saas_platform_foundation.sql','utf8');for(const table of ['support_cases','support_messages','platform_feature_flags','organization_entitlement_overrides','in_app_notifications'])if(!migration.includes(table))throw new Error(`V73 table missing: ${table}`)
console.log('V73 SaaS platform foundation check passed')
