import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const source=await fs.readFile(new URL("../lib/permissions.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const temp=path.join(os.tmpdir(),`binso-permissions-${process.pid}.mjs`);
await fs.writeFile(temp,compiled,"utf8");
try{
 const {tenantCan,operatorCan,permissionForModule,ownRecordOnly}=await import(`${pathToFileURL(temp).href}?v=${Date.now()}`);
 assert.equal(tenantCan("owner","billing:write"),true);
 assert.equal(tenantCan("admin","billing:write"),false);
 assert.equal(tenantCan("finance","accounting:write"),true);
 assert.equal(tenantCan("finance","payroll:read"),false);
 assert.equal(tenantCan("hr","payroll:write"),true);
 assert.equal(tenantCan("hr","bank:write"),false);
 assert.equal(tenantCan("project_manager","projects:write"),true);
 assert.equal(tenantCan("member","invoices:write"),false);
 assert.equal(tenantCan("reader","payroll:read"),false);
 assert.equal(permissionForModule("rechnungen","write"),"invoices:write");
 assert.equal(ownRecordOnly("member","zeiterfassung"),true);
 assert.equal(ownRecordOnly("member","projekte"),false);
 assert.equal(operatorCan("platform_support","organizations:read"),true);
 assert.equal(operatorCan("platform_support","operators:manage"),false);
 assert.equal(operatorCan("platform_billing","subscriptions:read"),true);
 assert.equal(operatorCan("platform_billing","platform_audit:read"),false);
 assert.equal(operatorCan("platform_auditor","platform_audit:read"),true);
 assert.equal(operatorCan("platform_auditor","operators:manage"),false);
 console.log("Permission self-check passed.");
}finally{await fs.unlink(temp).catch(()=>{})}
