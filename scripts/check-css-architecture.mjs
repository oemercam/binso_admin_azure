import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const styleDir=path.join(root,"app","styles");
const runtimeCss=[
  "tokens.css",
  "base.css",
  "marketing.css",
  "app.css",
  "operator.css",
  "responsive.css",
];

const ignoredClasses=new Set([
  "active","selected","full","large","narrow","clean","two","three","thirds",
  "light","dark","system","mobile","support","customer","payment","security","audit","high",
]);

function walk(dir,extensions){
  const out=[];
  if(!fs.existsSync(dir))return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...walk(full,extensions));
    else if(extensions.some(ext=>entry.name.endsWith(ext)))out.push(full);
  }
  return out;
}

const appCssFiles=fs.readdirSync(path.join(root,"app"))
  .filter(name=>name.endsWith(".css"))
  .sort();
if(JSON.stringify(appCssFiles)!==JSON.stringify(["binso-ui.css"])){
  throw new Error(`Only app/binso-ui.css may live in app/. Found: ${appCssFiles.join(", ")}`);
}

const styleCssFiles=fs.readdirSync(styleDir)
  .filter(name=>name.endsWith(".css"))
  .sort();
const expectedCss=[...runtimeCss].sort();
if(JSON.stringify(styleCssFiles)!==JSON.stringify(expectedCss)){
  throw new Error(`Unexpected CSS file in app/styles. Expected ${expectedCss.join(", ")}; found ${styleCssFiles.join(", ")}`);
}

const entry=fs.readFileSync(path.join(root,"app","binso-ui.css"),"utf8");
for(const file of runtimeCss){
  if(!entry.includes(`./styles/${file}`))throw new Error(`Missing runtime CSS import: ${file}`);
}
for(const legacy of [
  "completion.css","completion-v04.css","completion-v06.css","mockup-v10.css","ux-v1.css",
  "pixel-mockup.css","portal-mockup.css","mockup-audit-v4.css","mobile-precision.css",
]){
  if(entry.includes(legacy))throw new Error(`Legacy CSS is still imported: ${legacy}`);
}

let css="";
for(const file of runtimeCss){
  const source=fs.readFileSync(path.join(styleDir,file),"utf8");
  css+="\n"+source;

  if(source.includes("!important"))throw new Error(`!important is not allowed in app/styles/${file}`);

  if(file!=="tokens.css" && /safe-area-inset-(top|right|bottom|left)/.test(source)){
    throw new Error(`Direct safe-area env usage is only allowed in tokens.css: ${file}`);
  }

  if(!["tokens.css","responsive.css"].includes(file) && /@media\b/.test(source)){
    throw new Error(`Responsive rules must live in responsive.css: ${file}`);
  }
}

const defined=new Set();
for(const match of css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g))defined.add(match[1]);

const sourceFiles=[
  ...walk(path.join(root,"components"),[".tsx",".ts"]),
  ...walk(path.join(root,"app"),[".tsx",".ts"]),
];

const used=new Map();
for(const file of sourceFiles){
  const source=fs.readFileSync(file,"utf8");
  const re=/className=(?:\{\`([^\`]+)\`\}|"([^"]+)"|'([^']+)')/g;
  for(const match of source.matchAll(re)){
    const raw=(match[1]||match[2]||match[3]||"").replace(/\$\{[^}]+\}/g," ");
    for(const cls of raw.split(/\s+/).filter(Boolean)){
      if(!/^[A-Za-z][A-Za-z0-9_-]*$/.test(cls))continue;
      if(cls.endsWith("-"))continue;
      if(ignoredClasses.has(cls))continue;
      if(!used.has(cls))used.set(cls,new Set());
      used.get(cls).add(path.relative(root,file));
    }
  }
}

const missing=[...used.keys()].filter(cls=>!defined.has(cls)).sort();
if(missing.length){
  const details=missing.map(cls=>`${cls}: ${[...used.get(cls)].join(", ")}`).join("\n");
  throw new Error(`CSS selector coverage failed:\n${details}`);
}

console.log(`CSS architecture OK: ${used.size} used classes covered by ${runtimeCss.length} runtime stylesheets.`);
