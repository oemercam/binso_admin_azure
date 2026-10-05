import fs from "node:fs/promises";
import path from "node:path";

const root=process.cwd();
const retiredBackend=["sup","abase"].join("");
const retiredMailProvider=["re","send"].join("");
const ignoredDirs=new Set([".git",".next","node_modules","deploy"]);
const roots=["app","components","config","docs","lib","scripts",".github"];
const rootFiles=["README.md",".env.example","package.json"];

async function exists(p){
  try{await fs.access(p);return true;}catch{return false;}
}

async function walk(dir){
  const out=[];
  if(!(await exists(dir)))return out;
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
    if(ignoredDirs.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(full));
    else if(/\.(?:ts|tsx|js|mjs|md|yml|yaml|json|sql)$/.test(entry.name))out.push(full);
  }
  return out;
}

if(await exists(path.join(root,retiredBackend))){
  throw new Error("Retired backend directory must not exist in the active repository.");
}

for(const retiredPath of [
  "lib/server/"+["service","role"].join("-")+".ts",
  "app/api/auth/"+["recovery","session"].join("-")+"/route.ts",
  "scripts/"+["stripe","price","migration"].join("-")+".mjs",
  "scripts/lib/"+["stripe","price","configuration"].join("-")+".mjs",
  "scripts/"+["stripe","price","configuration","test"].join("-")+".mjs",
]){
  if(await exists(path.join(root,retiredPath)))throw new Error("Retired compatibility file still exists: "+retiredPath);
}

const files=[
  ...rootFiles.map(file=>path.join(root,file)),
  ...(await Promise.all(roots.map(dir=>walk(path.join(root,dir))))).flat(),
];

const forbidden=[
  ["NEXT_PUBLIC_",retiredBackend.toUpperCase()].join(""),
  [retiredBackend.toUpperCase(),"_URL"].join(""),
  [retiredBackend.toUpperCase(),"_ANON_KEY"].join(""),
  [retiredBackend.toUpperCase(),"_SERVICE_ROLE_KEY"].join(""),
  ["privileged",retiredBackend[0].toUpperCase()+retiredBackend.slice(1)].join(""),
  ["invite",retiredBackend[0].toUpperCase()+retiredBackend.slice(1),"User"].join(""),
  [retiredMailProvider.toUpperCase(),"_API_KEY"].join(""),
  ["api.",retiredMailProvider,".com"].join(""),
  ["sendVia",retiredMailProvider[0].toUpperCase()+retiredMailProvider.slice(1)].join(""),
  ["provider:\"",retiredMailProvider,"\""].join(""),
  ["provider:'",retiredMailProvider,"'"].join(""),
  ["EMAIL_DELIVERY_MODE=",retiredMailProvider].join(""),
  "legacy_backend_removed",
  "legacy_rpc_removed",
];

const violations=[];
for(const file of files){
  if(!(await exists(file)))continue;
  if(file.endsWith("repository-cleanliness-check.mjs"))continue;
  const source=await fs.readFile(file,"utf8");
  for(const token of forbidden){
    if(source.toLowerCase().includes(token.toLowerCase())){
      violations.push(path.relative(root,file)+": "+token);
    }
  }
}

if(violations.length){
  throw new Error("Repository cleanliness check failed:\n"+violations.join("\n"));
}

const integrations=await fs.readFile(path.join(root,"lib/server/integrations.ts"),"utf8");
if(!integrations.includes("Microsoft Graph")||!integrations.includes("graphAuthenticationReachable")){
  throw new Error("Integration monitoring must use Microsoft Graph.");
}

const stripeWorkflow=await fs.readFile(path.join(root,".github/workflows/stripe-configuration-audit.yml"),"utf8");
if(stripeWorkflow.includes("price-migration")||stripeWorkflow.includes("MAPPING_FILE")){
  throw new Error("Stripe production audit must not contain retired price migration logic.");
}

console.log("Repository cleanliness passed: current Azure/PostgreSQL/Graph/Stripe architecture only.");
