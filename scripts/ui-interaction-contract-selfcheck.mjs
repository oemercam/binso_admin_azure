import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const shell=read("components/shell.tsx");
const overlay=read("components/ui/responsive-overlay.tsx");
const overlays=read("styles/overlays.css");
const primitives=read("styles/primitives.css");
const responsive=read("styles/responsive-central.css");

for(const marker of [
  'headerLeading={<BrandLogo/>}',
  'animatedClose',
  'workspace-menu-toggle-glyph',
  'setMoreOpen(v=>!v)'
]) if(!shell.includes(marker)) throw new Error(`Workspace mobile navigation contract missing: ${marker}`);
for(const marker of ["headerLeading?:React.ReactNode","animatedClose?:boolean","ui-overlay-menu-toggle is-open"])
  if(!overlay.includes(marker)) throw new Error(`Overlay navigation header contract missing: ${marker}`);
for(const marker of [
  "workspace navigation header: brand remains visible",
  ".workspace-navigation-overlay{width:100%;height:100dvh",
  ".ui-overlay-menu-glyph",
  "binso-menu-to-close"
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
console.log("UI interaction contract self-check passed: branded mobile navigation, animated menu glyph, one-line equal-height actions, theme-safe controls and viewport-safe dropdowns are guarded.");
