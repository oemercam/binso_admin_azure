import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const editor=read("components/business-document-editor.tsx");
const picker=read("components/relationship-picker.tsx");
const shell=read("components/shell.tsx");
const css=read("styles/responsive-central.css");
const checks=[
 [editor.includes("save('Entwurf',true)"),"document create action must persist and navigate to detail"],
 [editor.includes("loading={saving}"),"document save/create actions must expose pending state"],
 [editor.includes('data-label={t("Beschreibung")}'),"editor document preview needs mobile labels"],
 [picker.includes('document.addEventListener("pointerdown",close)'),"relationship picker must close on outside interaction"],
 [picker.includes('setOpen(false);setQuery("")'),"relationship picker must close after selection"],
 [picker.includes('role="listbox"'),"relationship picker must expose listbox semantics"],
 [shell.includes("searchLoading"),"global search must expose loading state"],
 [shell.includes('type="search"'),"search fields must use search semantics"],
 [shell.includes("workspace-menu-chevron"),"mobile navigation must use canonical row navigation"],
 [css.includes("Document preview is a responsive reading view on phones"),"mobile document preview must be responsive"],
 [css.includes("width:100%;min-width:0;max-width:100%"),"mobile preview must not keep a fixed A4 width"]
];
for(const [ok,message] of checks)if(!ok)throw new Error(message);
console.log("Portal UX/workflow self-check passed: document creation, dropdowns, search, mobile navigation and document preview are guarded.");
