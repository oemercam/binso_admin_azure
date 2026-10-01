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
  const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  if(new RegExp(`${escaped}(?![\\w-])`).test(text))throw new Error(`Shell selector ${selector} must only live in styles/shell.css; found in ${file}`);
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

const marketingFrame=fs.readFileSync("components/marketing/marketing-frame.tsx","utf8");
const marketingFooter=fs.readFileSync("components/marketing/marketing-footer.tsx","utf8");
if(!marketingFrame.includes('className="marketing-mobile-language"'))throw new Error("Mobile marketing navigation must own the compact language switcher.");
if(!shellCss.includes('.marketing-header-language{display:none}'))throw new Error("Mobile/PWA marketing header must hide the language switcher.");
if(marketingFooter.includes("Appenzell, Schweiz"))throw new Error("Compact public footer must not render the location text.");
if(!marketingFooter.includes('href="https://binso.ch"'))throw new Error("Public footer copyright must link to binso.ch.");
if(marketingFooter.includes("footer-heart")||marketingFooter.includes("Mit Liebe in der Schweiz entwickelt"))throw new Error("Compact mobile/PWA footer must not render the previous heart tagline.");
if(!marketingFooter.includes('className="marketing-footer-mobile"'))throw new Error("Public footer must provide a dedicated compact mobile/PWA layout.");
for(const href of ["/agb","/datenschutz","/impressum"]){if(!marketingFooter.includes(`href="${href}"`))throw new Error(`Compact mobile/PWA footer is missing ${href}.`)}
const appPublicCss=fs.readFileSync("styles/app.css","utf8");
const securityRule=appPublicCss.match(/\.security-card\{[^}]*\}/s)?.[0]||"";
if(/#[0-9a-f]{3,8}/i.test(securityRule))throw new Error("Security/CTA card must use theme tokens instead of hard-coded colours.");

console.log("UI consistency self-check passed: shell ownership, persistent workspace layout and public header are centralized.");
