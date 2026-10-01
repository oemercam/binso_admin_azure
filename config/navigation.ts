import {BarChart3,BadgeDollarSign,Banknote,BookOpen,BriefcaseBusiness,Building2,CalendarOff,Clock3,FileCheck2,Files,FolderKanban,LayoutDashboard,ListTodo,Package,Percent,ReceiptText,Users,WalletCards} from "lucide-react";

/**
 * Canonical business navigation items. Desktop sidebar, Mobile/PWA More and
 * Quick Create compose from these shared route definitions instead of owning
 * separate route strings.
 */
export const navigationItems={
 dashboard:{label:"Dashboard",href:"/dashboard",icon:LayoutDashboard},
 aufgaben:{label:"Aufgaben",href:"/aufgaben",icon:ListTodo},
 kunden:{label:"Kunden",href:"/kunden",icon:Users},
 offerten:{label:"Offerten",href:"/offerten",icon:FileCheck2},
 auftraege:{label:"Aufträge",href:"/auftraege",icon:BriefcaseBusiness},
 rechnungen:{label:"Rechnungen",href:"/rechnungen",icon:ReceiptText},
 zahlungen:{label:"Zahlungen",href:"/zahlungen",icon:Banknote},
 projekte:{label:"Projekte",href:"/projekte",icon:FolderKanban},
 zeiterfassung:{label:"Zeiterfassung",href:"/zeiterfassung",icon:Clock3},
 spesen:{label:"Spesen",href:"/spesen",icon:WalletCards},
 lieferanten:{label:"Lieferanten",href:"/lieferanten",icon:Building2},
 eingangsrechnungen:{label:"Eingangsrechnungen",href:"/eingangsrechnungen",icon:ReceiptText},
 buchhaltung:{label:"Buchhaltung",href:"/buchhaltung",icon:BookOpen},
 bank:{label:"Bank",href:"/bank",icon:Banknote},
 mwst:{label:"MWST",href:"/mwst",icon:Percent},
 berichte:{label:"Berichte",href:"/berichte",icon:BarChart3},
 personal:{label:"Mitarbeitende",href:"/personal",icon:Users},
 abwesenheiten:{label:"Abwesenheiten",href:"/abwesenheiten",icon:CalendarOff},
 lohn:{label:"Lohn",href:"/lohn",icon:BadgeDollarSign},
 produkte:{label:"Produkte und Leistungen",href:"/produkte",icon:Package},
 dokumente:{label:"Dokumente",href:"/dokumente",icon:Files},
 vertraege:{label:"Verträge",href:"/vertraege",icon:FileCheck2},
} as const;

/** Desktop rendering stays unchanged; only the source of its items is shared. */
export const portalNavigation=[
 {label:"Übersicht",items:[navigationItems.dashboard,navigationItems.aufgaben]},
 {label:"Verkauf",items:[navigationItems.kunden,navigationItems.offerten,navigationItems.auftraege,navigationItems.rechnungen,navigationItems.zahlungen]},
 {label:"Projekte",items:[navigationItems.projekte,navigationItems.zeiterfassung,navigationItems.spesen]},
 {label:"Einkauf",items:[navigationItems.lieferanten,navigationItems.eingangsrechnungen]},
 {label:"Finanzen",items:[navigationItems.buchhaltung,navigationItems.bank,navigationItems.mwst,navigationItems.berichte]},
 {label:"Personal",items:[navigationItems.personal,navigationItems.abwesenheiten,navigationItems.lohn]},
 {label:"Stammdaten",items:[navigationItems.produkte,navigationItems.dokumente,navigationItems.vertraege]},
] as const;

/**
 * Mobile/PWA full module navigation. Start and Quick Create are intentionally
 * absent. Customer and time remain in the complete module map even though they
 * also have primary bottom-nav shortcuts.
 */
export const mobileMoreNavigation=[
 {label:"Verkauf",items:[navigationItems.kunden,navigationItems.offerten,navigationItems.auftraege,navigationItems.rechnungen,navigationItems.zahlungen]},
 {label:"Projekte",items:[navigationItems.projekte,navigationItems.zeiterfassung,navigationItems.spesen,navigationItems.aufgaben]},
 {label:"Einkauf",items:[navigationItems.lieferanten,navigationItems.eingangsrechnungen]},
 {label:"Finanzen",items:[navigationItems.buchhaltung,navigationItems.bank,navigationItems.mwst,navigationItems.berichte]},
 {label:"Unternehmen",items:[navigationItems.personal,navigationItems.abwesenheiten,navigationItems.lohn,navigationItems.produkte,navigationItems.dokumente,navigationItems.vertraege]},
] as const;

export const mobileQuickCreate=[
 {label:"Kunde",href:"/kunden/neu",icon:navigationItems.kunden.icon},
 {label:"Offerte",href:"/offerten/neu",icon:navigationItems.offerten.icon},
 {label:"Rechnung",href:"/rechnungen/neu",icon:navigationItems.rechnungen.icon},
 {label:"Projekt",href:"/projekte/neu",icon:navigationItems.projekte.icon},
 {label:"Zeit",href:"/zeiterfassung/neu",icon:navigationItems.zeiterfassung.icon},
 {label:"Spese",href:"/spesen/neu",icon:navigationItems.spesen.icon},
] as const;
