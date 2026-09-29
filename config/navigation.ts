import {BarChart3,BadgeDollarSign,Banknote,BookOpen,BriefcaseBusiness,Building2,CalendarOff,Clock3,FileCheck2,Files,FolderKanban,Headphones,LayoutDashboard,ListTodo,Package,Percent,ReceiptText,Settings,Users,WalletCards,Bell} from "lucide-react";
export const portalNavigation=[
 {label:"Übersicht",items:[{label:"Dashboard",href:"/dashboard",icon:LayoutDashboard},{label:"Aufgaben",href:"/aufgaben",icon:ListTodo}]},
 {label:"Verkauf",items:[{label:"Kunden",href:"/kunden",icon:Users},{label:"Offerten",href:"/offerten",icon:FileCheck2},{label:"Aufträge",href:"/auftraege",icon:BriefcaseBusiness},{label:"Rechnungen",href:"/rechnungen",icon:ReceiptText},{label:"Zahlungen",href:"/zahlungen",icon:Banknote}]},
 {label:"Projekte",items:[{label:"Projekte",href:"/projekte",icon:FolderKanban},{label:"Zeiterfassung",href:"/zeiterfassung",icon:Clock3},{label:"Spesen",href:"/spesen",icon:WalletCards}]},
 {label:"Einkauf",items:[{label:"Lieferanten",href:"/lieferanten",icon:Building2},{label:"Eingangsrechnungen",href:"/eingangsrechnungen",icon:ReceiptText}]},
 {label:"Finanzen",items:[{label:"Buchhaltung",href:"/buchhaltung",icon:BookOpen},{label:"Bank",href:"/bank",icon:Banknote},{label:"MWST",href:"/mwst",icon:Percent},{label:"Berichte",href:"/berichte",icon:BarChart3}]},
 {label:"Personal",items:[{label:"Mitarbeitende",href:"/personal",icon:Users},{label:"Abwesenheiten",href:"/abwesenheiten",icon:CalendarOff},{label:"Lohn",href:"/lohn",icon:BadgeDollarSign}]},
 {label:"Stammdaten",items:[{label:"Produkte und Leistungen",href:"/produkte",icon:Package},{label:"Dokumente",href:"/dokumente",icon:Files},{label:"Verträge",href:"/vertraege",icon:FileCheck2}]},
 {label:"System",items:[{label:"Benachrichtigungen",href:"/benachrichtigungen",icon:Bell},{label:"Support",href:"/support",icon:Headphones},{label:"Neuigkeiten",href:"/neuigkeiten",icon:Bell},{label:"Einstellungen",href:"/einstellungen",icon:Settings}]},
] as const;
