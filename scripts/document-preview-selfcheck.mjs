import fs from "node:fs";

const detail=fs.readFileSync("components/document-detail.tsx","utf8");
const editor=fs.readFileSync("components/business-document-editor.tsx","utf8");
const css=fs.readFileSync("styles/app.css","utf8");

const requireMarker=(text,marker,label)=>{if(!text.includes(marker))throw new Error(`${label} missing: ${marker}`)};
const forbidMarker=(text,marker,label)=>{if(text.includes(marker))throw new Error(`${label} must not contain: ${marker}`)};

for(const marker of [
  'const [previewOpen,setPreviewOpen]=useState(false)',
  'onClick={()=>setPreviewOpen(true)}',
  'open={previewOpen}',
  'className="document-summary-grid"',
  'className="document-preview-gate"',
  '{documentPreview}'
])requireMarker(detail,marker,"document detail preview gate");

forbidMarker(detail,'onClick={()=>window.print()}><Printer','document detail top actions');
requireMarker(detail,'onClick={()=>window.print()}>{t("Drucken / PDF")}</Button>','preview-only print action');

for(const marker of [
  'document-preview-launcher',
  'setPreview(true)',
  '{t("Vorschau anzeigen")}'
])requireMarker(editor,marker,"document editor preview gate");
forbidMarker(editor,'<div className="mini-document">{renderDocument()}</div>','embedded editor preview');

for(const marker of [
  'Binso One v1.5.6 — on-demand business document preview',
  '.document-summary-grid',
  '.document-preview-gate'
])requireMarker(css,marker,"document preview CSS");

console.log("Document preview self-check passed: invoices/quotes use on-demand preview only.");
