import fs from "node:fs/promises";
import assert from "node:assert/strict";

const backend=await fs.readFile("lib/client/backend.ts","utf8");
assert.ok(!backend.includes("DATABASE_URL"),"Client backend must not expose server database configuration.");

const packageJson=JSON.parse(await fs.readFile("package.json","utf8"));
for(const script of Object.values(packageJson.scripts)){
  for(const match of script.matchAll(/node (scripts\/[\w.-]+\.mjs)/g)){
    await fs.access(match[1]);
  }
}

await fs.access("database/migrations/0001_baseline.sql");
await fs.access("lib/server/db.ts");
await fs.access("lib/server/email.ts");
await fs.access("lib/server/invitations.ts");

console.log("Architecture entry points and package scripts passed.");
