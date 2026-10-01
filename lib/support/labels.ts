export const supportCategoryLabels:Record<string,string>={question:"Frage",technical:"Technischer Fehler",usage:"Bedienung",billing:"Abrechnung",account:"Konto",security:"Sicherheit",idea:"Idee",other:"Sonstiges"};
export const supportPriorityLabels:Record<string,string>={low:"Niedrig",normal:"Normal",high:"Hoch",urgent:"Kritisch"};
export const supportStatusLabels:Record<string,string>={open:"Neu",in_progress:"In Bearbeitung",waiting_for_customer:"Warten auf Kunde",resolved:"Gelöst",closed:"Geschlossen"};
export const supportCategoryLabel=(value:string)=>supportCategoryLabels[value]||value;
export const supportPriorityLabel=(value:string)=>supportPriorityLabels[value]||value;
export const supportStatusLabel=(value:string)=>supportStatusLabels[value]||value;
