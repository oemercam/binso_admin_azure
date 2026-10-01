import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const shell=read("components/shell.tsx");
const overlay=read("components/ui/responsive-overlay.tsx");
const overlays=read("styles/overlays.css");
const primitives=read("styles/primitives.css");
const responsive=read("styles/responsive-central.css");

for(const marker of [
  "openMoreNavigation","closeMoreNavigation","workspace-menu-toggle-glyph",
  'title={t("Navigation")}',"MobileNavigationRow","mobile-navigation-footer"
]) if(!shell.includes(marker)) throw new Error(`Workspace mobile navigation contract missing: ${marker}`);
if(shell.includes('headerLeading={<BrandLogo/>}')||shell.includes("animatedClose"))throw new Error("Legacy full-screen/branded More header remains.");
for(const marker of ["closeOnBackdrop=true","ui-overlay-close",'<X size={18}/>'])
  if(!overlay.includes(marker)) throw new Error(`Overlay close contract missing: ${marker}`);
for(const marker of [
  "v1.6.7 Mobile/PWA module navigation drawer",
  "max-height:min(82dvh,760px)",
  ".mobile-navigation-row{",
  ".mobile-navigation-footer"
]) if(!overlays.includes(marker)) throw new Error(`Workspace navigation CSS guard missing: ${marker}`);
for(const marker of [
  "final interactive-control contract",
  "height:var(--control-height)",
  "white-space:nowrap",
  "height:44px;min-height:44px;max-height:44px",
  ".relationship-popover,.filter-popover{left:8px;right:8px;width:auto}",
  "Remaining legacy interactive islands"
]) if(!primitives.includes(marker)) throw new Error(`Control geometry/theme guard missing: ${marker}`);
if(!responsive.includes(".page{padding-top:10px}")) throw new Error("Compact mobile page-to-header spacing guard missing");
console.log("UI interaction contract self-check passed: Mobile More uses the canonical bottom drawer and X close action; paired actions, theme-safe controls and viewport-safe dropdowns remain guarded.");
