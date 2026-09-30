import fs from "node:fs";
const required=[
 "database/migrations/0017_v150_code_schema_alignment.sql","database/archive/simplified-v1.4/005_production_readiness.sql","database/bootstrap/app-role.sql",
 "lib/server/email.ts","lib/server/totp.ts","lib/server/storage.ts","lib/support/diagnostics.ts",
 "app/api/auth/password-reset/request/route.ts","app/api/auth/password-change/route.ts","app/api/auth/verify-email/resend/route.ts","app/api/auth/mfa/setup/route.ts",
 "app/api/invitations/route.ts","app/api/notifications/route.ts","app/api/billing/portal/route.ts","app/api/operator/metrics/route.ts",
 "app/api/account/export/route.ts","app/api/files/route.ts","app/api/support/attachments/route.ts","app/api/support/attachments/[id]/route.ts",
 "docs/operations/PRODUCTION-RUNBOOK.md","docs/deployment/GITHUB-AZURE.md"
];
const missing=required.filter(x=>!fs.existsSync(x));if(missing.length)throw new Error(`Missing production files: ${missing.join(", ")}`);
const env=fs.readFileSync(".env.example","utf8");for(const key of ["APP_ENCRYPTION_KEY","RESEND_API_KEY","DATABASE_SSL_REJECT_UNAUTHORIZED","STRIPE_PORTAL_RETURN_URL","NEXT_PUBLIC_SITE_URL"]){if(!env.includes(key+"="))throw new Error(`.env.example missing ${key}`)}
const next=fs.readFileSync("next.config.mjs","utf8");for(const h of ["Content-Security-Policy","Strict-Transport-Security","X-Content-Type-Options","Permissions-Policy"]){if(!next.includes(h))throw new Error(`Missing security header ${h}`)}
const migrations=fs.readdirSync("database/migrations").filter(x=>x.endsWith(".sql")).sort();if(migrations.join("|")!=="0017_v150_code_schema_alignment.sql")throw new Error(`Unexpected active migration set: ${migrations.join(", ")}`);
const support=fs.readFileSync("components/support/support-new.tsx","utf8");for(const value of ["Diagnose anhängen","Screenshot aufnehmen","Datei anhängen","Foto aufnehmen","removeAttachment"]){if(!support.includes(value))throw new Error(`Support hardening missing: ${value}`)}
const storage=fs.readFileSync("lib/server/storage.ts","utf8");if(!storage.includes("deleteBlobByUrl"))throw new Error("Blob delete helper missing");
const status=fs.readFileSync("components/status/status-client.tsx","utf8");if(status.includes("Alle Systeme betriebsbereit"))throw new Error("Status page must not claim unverified systems are operational");
console.log(`Production self-check passed (${required.length} required files, ${migrations.length} migrations).`);
