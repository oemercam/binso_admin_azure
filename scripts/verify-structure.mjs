import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root=process.cwd();

const requiredRoutes=[
  "app/page.tsx",
  "app/login/page.tsx",
  "app/registrieren/page.tsx",
  "app/dashboard/page.tsx",
  "app/kunden/page.tsx",
  "app/kunden/neu/page.tsx",
  "app/angebote/page.tsx",
  "app/angebote/neu/page.tsx",
  "app/rechnungen/page.tsx",
  "app/rechnungen/neu/page.tsx",
  "app/zahlungen/page.tsx",
  "app/zahlungen/neu/page.tsx",
  "app/produkte/page.tsx",
  "app/mitarbeiter/page.tsx",
  "app/spesen/page.tsx",
  "app/zeit/page.tsx",
  "app/support/page.tsx",
  "app/einstellungen/page.tsx",
  "app/belege/page.tsx",
  "app/benachrichtigungen/page.tsx",
  "app/operator/page.tsx",
];

const missing=requiredRoutes.filter(file=>!existsSync(join(root,file)));
if(missing.length){
  throw new Error(`Required routes missing:\n${missing.join("\n")}`);
}

const extensions=new Set([".tsx",".ts",".css",".md",".mjs"]);
const ignore=new Set(["node_modules",".next",".git"]);
const problems=[];

function extension(path){
  const index=path.lastIndexOf(".");
  return index>=0?path.slice(index):"";
}

function walk(directory){
  for(const name of readdirSync(directory)){
    if(ignore.has(name)) continue;
    const full=join(directory,name);
    const stats=statSync(full);
    if(stats.isDirectory()){
      walk(full);
      continue;
    }
    if(!extensions.has(extension(full))) continue;
    const content=readFileSync(full,"utf8");
    const file=relative(root,full);

    if(content.includes('href="#"')) problems.push(`${file}: contains dead href="#"`);
    for(const token of ["Ã","â€“","â€™","â€œ","â€"]){
      if(content.includes(token)) problems.push(`${file}: contains suspected mojibake token ${token}`);
    }
  }
}

walk(join(root,"app"));
walk(join(root,"components"));
walk(join(root,"lib"));

if(problems.length){
  throw new Error(`Structure QA failed:\n${problems.join("\n")}`);
}

console.log(`Structure QA passed: ${requiredRoutes.length} required routes and source encoding checks.`);
