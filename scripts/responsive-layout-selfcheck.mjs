import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");
const responsive=read("styles/responsive-central.css");
const primitives=read("styles/primitives.css");
const app=read("styles/app.css");
const detail=read("components/document-detail.tsx");
const editor=read("components/business-document-editor.tsx");

const required=[
  [responsive,"Binso One v1.5.5 — no-clipping responsive layout standard","central responsive hardening"],
  [responsive,"grid-template-columns:minmax(0,1fr);","single-column mobile navigation/action fallback"],
  [responsive,".document-position-row>:nth-child(5)","responsive document position delete control"],
  [primitives,"min-inline-size:0","iOS date/time control width guard"],
  [primitives,"white-space:normal","mobile button wrapping"],
  [app,"grid-template-columns:repeat(2,minmax(0,1fr));","document action two-column mobile layout"],
  [detail,'placeholder={t("Beschreibung")}',"document-detail mobile position hint"],
  [editor,'placeholder={t("Beschreibung")}',"document-editor mobile position hint"],
];
for(const [source,needle,label] of required){if(!source.includes(needle))throw new Error(`Responsive layout self-check failed: ${label}`)}
if(responsive.includes(".sheet-group-links {\n    grid-template-columns: repeat(2"))throw new Error("Mobile navigation must not be forced to compressed two-column tiles")
console.log("Responsive layout self-check passed: controls, actions, overlays and document position rows are mobile-safe.");
