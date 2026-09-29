"use client";

import type { ModuleKey } from "@/lib/modules";

export type Position = { description: string; quantity: number; unitPrice: number; vatRate: number };
export type Activity = { at: string; text: string };

export type LocalRecord = {
  id: string;
  module: ModuleKey;
  row: string[];
  fields: Record<string, string>;
  status: string;
  createdAt: string;
  updatedAt: string;
  positions?: Position[];
  meta?: Record<string, unknown>;
  activities?: Activity[];
};

const KEY = "binso-one-demo-records-v2";
const SETTINGS_KEY = "binso-one-demo-settings-v2";
const APP_KEY = "binso-one-demo-app-v1";

function all(): LocalRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as LocalRecord[]; } catch { return []; }
}

function write(records: LocalRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent("binso-data-changed"));
}

export function listLocalRecords(moduleKey?: ModuleKey) { return moduleKey ? all().filter(r => r.module === moduleKey) : all(); }
export function getLocalRecord(id: string) { return all().find(r => r.id === id); }
export function findSeedOverride(moduleKey: ModuleKey, seedId: string) {
  return all().find(r => r.module === moduleKey && r.meta?.sourceSeed === `${moduleKey}:${seedId}`);
}

export function saveLocalRecord(input: Omit<LocalRecord,"id"|"createdAt"|"updatedAt"> & { id?: string }) {
  const records = all();
  const now = new Date().toISOString();
  if (input.id) {
    const index = records.findIndex(r => r.id === input.id);
    if (index >= 0) {
      const previous = records[index];
      records[index] = {
        ...previous,
        ...input,
        activities: input.activities ?? previous.activities,
        updatedAt: now,
      } as LocalRecord;
      write(records);
      return records[index];
    }
  }
  const record: LocalRecord = {
    ...input,
    id: input.id || `local-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    createdAt: now,
    updatedAt: now,
    activities: input.activities ?? [{ at: now, text: "Datensatz erstellt" }],
  };
  records.unshift(record);
  write(records);
  return record;
}

export function updateLocalRecord(id: string, patch: Partial<LocalRecord>, activity?: string) {
  const records = all();
  const index = records.findIndex(r => r.id === id);
  if (index < 0) return;
  const now = new Date().toISOString();
  const current = records[index];
  records[index] = {
    ...current,
    ...patch,
    updatedAt: now,
    activities: activity ? [{ at: now, text: activity }, ...(current.activities || [])] : current.activities,
  };
  write(records);
  return records[index];
}

export function ensureSeedOverride(moduleKey: ModuleKey, seedId: string, row: string[], fields: Record<string,string>) {
  const existing = findSeedOverride(moduleKey, seedId);
  if (existing) return existing;
  return saveLocalRecord({
    module: moduleKey,
    status: row[row.length - 1] || "Aktiv",
    row,
    fields,
    meta: { sourceSeed: `${moduleKey}:${seedId}` },
    activities: [{ at: new Date().toISOString(), text: "Demo-Datensatz zur Bearbeitung übernommen" }],
  });
}

export function deleteLocalRecord(id: string) { write(all().filter(r => r.id !== id)); }
export function clearDemoData() { localStorage.removeItem(KEY); window.dispatchEvent(new CustomEvent("binso-data-changed")); }

export function parseMoney(value?: string | number) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/[’']/g, "").replace(/,/g, ".");
  const parts = cleaned.split(".");
  if (parts.length > 2) return Number(parts.join("")) || 0;
  return Number(cleaned) || 0;
}
export function money(value: number) { return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(value); }

export type UserRole = "Inhaber" | "Admin" | "Finanzen" | "Personal" | "Projektleitung" | "Mitarbeiter" | "Lesen";
export type AppUser = { id:string; name:string; email:string; role:UserRole; active:boolean; language?:"de"|"en"|"fr"|"it" };
export type NumberSequences = { kunden:string; offerten:string; auftraege:string; rechnungen:string; projekte:string };
export type DemoSettings = {
  companyName:string; uid:string; address:string; zipCity:string; email:string; phone:string; iban:string;
  defaultVat:string; paymentDays:string; currency:string; language:string; vatMethod:string; invoiceIntro:string; quoteIntro:string;
  reminderDays:string; notificationsEmail:boolean; notificationsPush:boolean;
  users:AppUser[]; sequences:NumberSequences; integrations:Record<string,boolean>;
};

export const defaultSettings: DemoSettings = {
  companyName:"Binso GmbH", uid:"CHE-173.401.068 MWST", address:"Weissbadstrasse 8b", zipCity:"9050 Appenzell",
  email:"oemer.cam@binso.ch", phone:"+41 58 510 88 58", iban:"CH93 0076 2011 6238 5295 7",
  defaultVat:"8.1", paymentDays:"30", currency:"CHF", language:"de-CH", vatMethod:"Effektive Abrechnung",
  invoiceIntro:"Besten Dank für Ihren Auftrag. Wir erlauben uns, folgende Leistungen in Rechnung zu stellen.",
  quoteIntro:"Besten Dank für Ihre Anfrage. Gerne offerieren wir Ihnen folgende Leistungen.",
  reminderDays:"10", notificationsEmail:true, notificationsPush:true,
  users:[
    {id:"u1",name:"Oemer Cam",email:"oemer.cam@binso.ch",role:"Inhaber",active:true,language:"de"},
    {id:"u2",name:"Anna Muster",email:"anna@binso.ch",role:"Finanzen",active:true,language:"de"},
    {id:"u3",name:"Luca Meier",email:"luca@binso.ch",role:"Mitarbeiter",active:true,language:"de"},
  ],
  sequences:{kunden:"K-{YYYY}-{####}",offerten:"O-{YYYY}-{####}",auftraege:"A-{YYYY}-{####}",rechnungen:"R-{YYYY}-{####}",projekte:"P-{YYYY}-{####}"},
  integrations:{bank:false,email:false,estv:false,storage:true},
};

export function loadSettings(): DemoSettings {
  if(typeof window==='undefined') return defaultSettings;
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}') as Partial<DemoSettings>;
    return {...defaultSettings,...stored,users:stored.users||defaultSettings.users,sequences:{...defaultSettings.sequences,...(stored.sequences||{})},integrations:{...defaultSettings.integrations,...(stored.integrations||{})}};
  } catch { return defaultSettings; }
}
export function saveSettings(settings:DemoSettings){ localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings)); window.dispatchEvent(new CustomEvent('binso-settings-changed')); }

export type AppPreferences = { activeCompany:string; compact:boolean; activeUserId:string };
export const defaultAppPreferences:AppPreferences={activeCompany:"Binso GmbH",compact:false,activeUserId:"u1"};
export function loadAppPreferences():AppPreferences{ if(typeof window==='undefined')return defaultAppPreferences; try{return {...defaultAppPreferences,...JSON.parse(localStorage.getItem(APP_KEY)||'{}')}}catch{return defaultAppPreferences} }
export function saveAppPreferences(v:AppPreferences){localStorage.setItem(APP_KEY,JSON.stringify(v));window.dispatchEvent(new CustomEvent('binso-app-changed'));}

export function exportCsv(filename:string, headers:string[], rows:string[][]){
  const esc=(v:string)=>`"${String(v??"").replaceAll('"','""')}"`;
  const content="\ufeff"+[headers,...rows].map(r=>r.map(esc).join(";")).join("\r\n");
  const blob=new Blob([content],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

export function nextNumber(kind:"offerten"|"rechnungen"|"auftraege"){
  const prefix=kind==="offerten"?"O":kind==="rechnungen"?"R":"A";
  const count=all().filter(r=>r.module===kind).length;
  return `${prefix}-2026-${String(100+count).padStart(4,"0")}`;
}
