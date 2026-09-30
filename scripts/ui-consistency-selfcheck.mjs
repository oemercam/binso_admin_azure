import fs from "node:fs";
import path from "node:path";

const shellCss=fs.readFileSync("styles/shell.css","utf8");
const appCss=fs.readFileSync("styles/app.css","utf8");
const responsiveCss=fs.readFileSync("styles/responsive-central.css","utf8");

const ownedSelectors=[
 ".app-shell",".sidebar",".content-shell",".topbar",".mobile-nav",
 ".account-trigger",".account-menu",".marketing-header",".marketing-mobile-menu",".marketing-footer"
];
for(const selector of ownedSelectors){
 if(!shellCss.includes(selector))throw new Error(`Canonical shell selector missing: ${selector}`);
 for(const [file,text] of [["styles/app.css",appCss],["styles/responsive-central.css",responsiveCss]]){
  if(text.includes(selector))throw new Error(`Shell selector ${selector} must only live in styles/shell.css; found in ${file}`);
 }
}

const sourceFiles=[];
function walk(dir){for(const name of fs.readdirSync(dir)){if(["node_modules",".next",".git"].includes(name))continue;const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(name))sourceFiles.push(p)}}
for(const root of ["app","components"]){if(fs.existsSync(root))walk(root)}
const normalize=(file)=>file.split(path.sep).join("/");
const marketingHeaderOwners=[];
const directShellOwners=[];
for(const file of sourceFiles){const text=fs.readFileSync(file,"utf8");const normalized=normalize(file);if(text.includes('className="marketing-header"'))marketingHeaderOwners.push(normalized);if(text.includes('@/components/shell'))directShellOwners.push(normalized)}
if(marketingHeaderOwners.join("|")!=="components/marketing/marketing-frame.tsx")throw new Error(`Marketing header must have one owner: ${marketingHeaderOwners.join(", ")}`);
if(directShellOwners.join("|")!=="app/(workspace)/layout.tsx")throw new Error(`Application Shell must be owned only by workspace layout: ${directShellOwners.join(", ")}`);

if(/backdrop-filter\s*:/i.test(shellCss.match(/\.topbar\{[^}]*\}/s)?.[0]||""))throw new Error("Topbar must not use backdrop-filter; PWA chrome must be opaque.");
if(!shellCss.includes("background:var(--surface-1)"))throw new Error("Shell surfaces must use centralized opaque surface token.");

console.log("UI consistency self-check passed: shell ownership, persistent workspace layout and public header are centralized.");
