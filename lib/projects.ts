export const projectStatuses=['planned','in_progress','active','blocked','completed','cancelled'] as const;
export const projectStatusLabels:Record<string,string>={planned:'Geplant',in_progress:'In Bearbeitung',active:'Aktiv',blocked:'Blockiert',completed:'Abgeschlossen',cancelled:'Storniert'};
export const projectAllowsTime=(status:string)=>['planned','in_progress','active'].includes(status);
