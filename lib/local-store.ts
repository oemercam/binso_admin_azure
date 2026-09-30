"use client";

import {formatCurrency} from "@/lib/locale-format";
import {getLocale} from "@/lib/i18n";
import {domainConfig} from "@/config/domain";
import {appEvents,emitAppEvent} from "@/lib/client/app-events";
import {readJsonStorage,removeStorage,writeJsonStorage} from "@/lib/client/browser-storage";
import {storageKeys} from "@/config/storage-keys";

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

const KEY = storageKeys.demoRecords;
const SETTINGS_KEY = storageKeys.demoSettings;
const APP_KEY = storageKeys.demoApp;

function all(): LocalRecord[] { return readJsonStorage<LocalRecord[]>(KEY,[]); }

function write(records: LocalRecord[]) {
  writeJsonStorage(KEY,records);
  emitAppEvent(appEvents.dataChanged);
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
export function clearDemoData() { removeStorage(KEY); emitAppEvent(appEvents.dataChanged); }

export function parseMoney(value?: string | number) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/[’']/g, "").replace(/,/g, ".");
  const parts = cleaned.split(".");
  if (parts.length > 2) return Number(parts.join("")) || 0;
  return Number(cleaned) || 0;
}
export function money(value:number){return formatCurrency(value,getLocale(),domainConfig.currency)}

export type UserRole = "Inhaber" | "Admin" | "Finanzen" | "Personal" | "Projektleitung" | "Mitarbeiter" | "Lesen";
export type AppUser = { id:string; name:string; email:string; role:UserRole; active:boolean; language?:"de"|"en"|"fr"|"it"|"tr" };
export type NumberSequences = { kunden:string; offerten:string; auftraege:string; rechnungen:string; projekte:string };
export type DemoSettings = {
  companyName:string; uid:string; address:string; zipCity:string; email:string; phone:string; iban:string;
  defaultVat:string; paymentDays:string; currency:string; language:string; vatMethod:string; invoiceIntro:string; quoteIntro:string;
  reminderDays:string; notificationsEmail:boolean; notificationsPush:boolean;
  users:AppUser[]; sequences:NumberSequences; integrations:Record<string,boolean>;
};

export {demoDefaultSettings as defaultSettings,demoDefaultAppPreferences as defaultAppPreferences} from "@/lib/demo/settings";
import {demoDefaultSettings as defaultSettings,demoDefaultAppPreferences as defaultAppPreferences} from "@/lib/demo/settings";

export function loadSettings(): DemoSettings {
  if(typeof window==='undefined') return defaultSettings;
  try {
    const stored = readJsonStorage<Partial<DemoSettings>>(SETTINGS_KEY,{});
    return {...defaultSettings,...stored,users:stored.users||defaultSettings.users,sequences:{...defaultSettings.sequences,...(stored.sequences||{})},integrations:{...defaultSettings.integrations,...(stored.integrations||{})}};
  } catch { return defaultSettings; }
}
export function saveSettings(settings:DemoSettings){ writeJsonStorage(SETTINGS_KEY,settings); emitAppEvent(appEvents.settingsChanged); }

export type AppPreferences = { activeCompany:string; compact:boolean; activeUserId:string };
export function loadAppPreferences():AppPreferences{return {...defaultAppPreferences,...readJsonStorage<Partial<AppPreferences>>(APP_KEY,{})}}
export function saveAppPreferences(v:AppPreferences){writeJsonStorage(APP_KEY,v);emitAppEvent(appEvents.appChanged);}

export function exportCsv(filename:string, headers:string[], rows:string[][]){
  const esc=(v:string)=>`"${String(v??"").replaceAll('"','""')}"`;
  const content="\ufeff"+[headers,...rows].map(r=>r.map(esc).join(";")).join("\r\n");
  const blob=new Blob([content],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

export function nextNumber(kind:"offerten"|"rechnungen"|"auftraege"){
  const prefix=kind==="offerten"?"O":kind==="rechnungen"?"R":"A";
  const count=all().filter(r=>r.module===kind).length;
  return `${prefix}-${new Date().getFullYear()}-${String(100+count).padStart(4,"0")}`;
}
