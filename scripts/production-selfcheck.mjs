import fs from "node:fs";
const required=[
 "database/migrations/005_production_readiness.sql","lib/server/email.ts","lib/server/totp.ts","lib/server/storage.ts",
 "app/api/auth/password-reset/request/route.ts","app/api/auth/mfa/setup/route.ts","app/api/invitations/route.ts",
 "app/api/notifications/route.ts","app/api/billing/portal/route.ts","app/api/operator/metrics/route.ts",
 "app/api/account/export/route.ts","app/api/files/route.ts"
];
const missing=required.filter(x=>!fs.existsSync(x));if(missing.length)throw new Error(`Missing production files: ${missing.join(", ")}`);
const env=fs.readFileSync(".env.example","utf8");for(const key of ["APP_ENCRYPTION_KEY","RESEND_API_KEY","DATABASE_SSL_REJECT_UNAUTHORIZED","STRIPE_PORTAL_RETURN_URL"]){if(!env.includes(key+"="))throw new Error(`.env.example missing ${key}`)}
const next=fs.readFileSync("next.config.mjs","utf8");for(const h of ["Content-Security-Policy","Strict-Transport-Security","X-Content-Type-Options","Permissions-Policy"]){if(!next.includes(h))throw new Error(`Missing security header ${h}`)}
const migrations=fs.readdirSync("database/migrations").filter(x=>x.endsWith(".sql")).sort();if(new Set(migrations).size!==migrations.length)throw new Error("Duplicate migration names");
console.log(`Production self-check passed (${required.length} required files, ${migrations.length} migrations).`);
