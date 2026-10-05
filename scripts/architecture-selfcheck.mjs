import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root=process.cwd();
const backend=await fs.readFile("lib/client/backend.ts","utf8");
assert.ok(!backend.includes("NEXT_PUBLIC_SUPABASE"),"Backend mode must use Azure APIs.");

for(const script of Object.values(JSON.parse(await fs.readFile("package.json","utf8")).scripts)){
  for(const match of script.matchAll(/node (scripts\/[\w.-]+\.mjs)/g))await fs.access(match[1]);
}

async function exists(target){
  try{await fs.access(target);return true}catch{return false}
}
assert.equal(await exists(path.join(root,"supabase")),false,"Retired Supabase directory must not exist.");
assert.equal(await exists(path.join(root,"lib/server/service-role.ts")),false,"Retired service-role compatibility module must not exist.");
assert.equal(await exists(path.join(root,"app/api/auth/recovery-session/route.ts")),false,"Retired recovery-session endpoint must not exist.");

const forbidden=[
  "RESEND_API_KEY",
  "api.resend.com",
  "EMAIL_DELIVERY_MODE",
  "provider:\"resend\"",
  "provider:'resend'",
  "NEXT_PUBLIC_SUPABASE",
  "SUPABASE_SERVICE_ROLE_KEY",
  "privilegedSupabase",
  "inviteSupabaseUser",
  "legacy_backend_removed",
  "legacy_rpc_removed",
  "supabase/migrations"
];

const extensions=new Set([".ts",".tsx",".js",".mjs",".md",".yml",".yaml",".json"]);
async function walk(dir){
  const out=[];
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
    if([".git","node_modules",".next","deploy"].includes(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(full));
    else if(extensions.has(path.extname(entry.name))||entry.name===".env.example")out.push(full);
  }
  return out;
}

for(const file of await walk(root)){
  const relative=path.relative(root,file).replaceAll("\\","/");
  const source=await fs.readFile(file,"utf8");
  for(const artifact of forbidden){
    assert.ok(!source.includes(artifact),relative+" contains retired architecture artifact "+artifact);
  }
}

console.log("Architecture entry points, scripts and repository cleanliness passed.");
