import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const providers=read("components/client-providers.tsx");
const mobile=read("styles/mobile-pwa.css");
const scroll=read("components/route-scroll-reset.tsx");
const responsive=read("styles/responsive-central.css");
const app=read("styles/app.css");
const tokens=read("styles/tokens.css");
const reveal=read("components/marketing/use-marketing-reveal.ts");

if(providers.includes("AppBootLoader"))throw new Error("Custom AppBootLoader must not mount globally; native PWA splash handles app start.");
if(fs.existsSync(path.join(root,"components/app-boot-loader.tsx")))throw new Error("Obsolete custom app boot loader component still exists.");
if((scroll.match(/window\.scrollTo/g)||[]).length!==1)throw new Error("Route scroll reset must perform exactly one window.scrollTo per route change.");
if(/app-boot-icon-reveal|binso-icon-build|clip-path:inset/.test(responsive))throw new Error("Legacy animated boot-loader CSS still exists in responsive-central.css.");
if(/app-boot-loader/.test(app))throw new Error("Legacy custom app boot overlay CSS still exists in app.css.");
if(/\.page\{[^}]*padding-top:(?:17px|20px|22px)/.test(app))throw new Error("Legacy mobile page top spacing still exists in app.css.");
if(/\.marketing-section\{padding:(?:58px|60px|72px)/.test(app))throw new Error("Legacy mobile marketing section spacing still exists in app.css.");
const marketingMainOwners=["styles/shell.css","styles/responsive-central.css","styles/app.css"].filter(file=>read(file).includes(".marketing-shell>main"));
if(marketingMainOwners.join("|")!=="styles/shell.css")throw new Error(`Marketing main header offset must be owned by shell.css only: ${marketingMainOwners.join(", ")}`);
if(!mobile.includes("contain:layout paint style"))throw new Error("Standalone fixed chrome paint containment is missing from the canonical Mobile/PWA layer.");
if(/backdrop-filter:blur\(16px\)/.test(app))throw new Error("Mobile sticky actions must not use expensive backdrop blur.");
for(const token of ["--mobile-content-top","--mobile-section-space","--mobile-block-space","--mobile-card-gap","--mobile-content-bottom"]){
 if(!tokens.includes(token))throw new Error(`Missing centralized mobile layout token: ${token}`);
}
if(!reveal.includes('const compact=window.matchMedia("(max-width: 900px)").matches'))throw new Error("Marketing reveal must be disabled on compact/mobile layouts.");
console.log("Rendering self-check passed: PWA boot, route scroll, mobile spacing and scroll motion are centralized.");
