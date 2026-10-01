import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const shell=read("components/shell.tsx");
const overlay=read("components/ui/responsive-overlay.tsx");
const mobile=read("styles/mobile-pwa.css");
const primitives=read("styles/primitives.css");

for(const marker of [
  "openMoreNavigation","closeMoreNavigation","workspace-menu-toggle-glyph",
  'title={t("Navigation")}',"MobileNavigationRow","mobile-navigation-footer"
]) if(!shell.includes(marker)) throw new Error(`Workspace mobile navigation contract missing: ${marker}`);
if(shell.includes('headerLeading={<BrandLogo/>}')||shell.includes("animatedClose"))throw new Error("Legacy full-screen/branded More header remains.");
for(const marker of ["closeOnBackdrop=true","ui-overlay-close",'<X size={18}/>'])
  if(!overlay.includes(marker)) throw new Error(`Overlay close contract missing: ${marker}`);
for(const marker of ["height:calc(100dvh",".mobile-navigation-row{",".mobile-navigation-footer",".mobile-quick-create-overlay{width:100%;height:auto"]) if(!mobile.includes(marker)) throw new Error(`Workspace navigation CSS guard missing: ${marker}`);
for(const marker of [
  "final interactive-control contract",
  "height:var(--control-height)",
  "white-space:nowrap",
  "height:44px;min-height:44px;max-height:44px",
  ".relationship-popover,.filter-popover{left:8px;right:8px;width:auto}",
  "Remaining legacy interactive islands"
]) if(!primitives.includes(marker)) throw new Error(`Control geometry/theme guard missing: ${marker}`);
if(!mobile.includes("padding:14px max(var(--page-gutter-mobile)")) throw new Error("Compact mobile page-to-header spacing guard missing");
console.log("UI interaction contract self-check passed: Mobile More uses the canonical full-height navigation panel and X close action; paired actions, theme-safe controls and viewport-safe dropdowns remain guarded.");
