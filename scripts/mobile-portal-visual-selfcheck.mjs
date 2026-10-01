import fs from "node:fs";
const css=fs.readFileSync("styles/app.css","utf8");
const detail=fs.readFileSync("components/document-detail.tsx","utf8");
const i18n=fs.readFileSync("lib/i18n.ts","utf8");
for(const token of ["html[data-theme=\"dark\"] .document-actions-panel button",".document-detail-page .doc-pos span::before"]){if(!css.includes(token))throw new Error(`Mobile portal visual guard missing: ${token}`)}
const overlays=fs.readFileSync("styles/overlays.css","utf8");
for(const token of [".mobile-navigation-row{","background:var(--surface-2)",".mobile-navigation-footer"]){if(!overlays.includes(token))throw new Error(`Mobile navigation visual guard missing: ${token}`)}
for(const token of ['className="detail-action-icon"','data-label={t("Beschreibung")}','data-label={t("Total")}']){if(!detail.includes(token))throw new Error(`Document detail mobile guard missing: ${token}`)}
for(const token of ['"Wiederkehrend":"Yinelenen"','"Workflow-Aktionen werden serverseitig gespeichert.":"İş akışı işlemleri sunucuda kaydedilir."']){if(!i18n.includes(token))throw new Error(`Turkish portal translation missing: ${token}`)}
console.log("Mobile portal visual self-check passed: dark-mode actions, compact navigation rows, document layout and Turkish workflow copy are guarded.");
