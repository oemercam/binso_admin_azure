import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const publicFiles=[
  "components/marketing-landing.tsx",
  "components/marketing/features-marketing-page.tsx",
  "components/marketing/pricing-marketing-page.tsx",
  "app/kontakt/page.tsx",
  "app/sicherheit/page.tsx",
  "app/status/page.tsx"
];
const banned=[
  /Trial-Flow/i,
  /lokale Demo/i,
  /Für Unternehmen entwickelt/i,
  /für den Produktivbetrieb .* vorgesehen/i,
  /SaaS-Pläne pro Firma/i
];
for(const file of publicFiles){
  const full=path.join(root,file);
  if(!fs.existsSync(full))throw new Error(`Missing public content file: ${file}`);
  const source=fs.readFileSync(full,"utf8");
  for(const pattern of banned){if(pattern.test(source))throw new Error(`Public copy contains internal or weak wording in ${file}: ${pattern}`);}
}
for(const obsolete of ["components/marketing-features.tsx","components/marketing-pricing.tsx"]){
  if(fs.existsSync(path.join(root,obsolete)))throw new Error(`Obsolete duplicate marketing component still exists: ${obsolete}`);
}
console.log("Content self-check passed: public copy is aligned and obsolete marketing duplicates are removed.");
