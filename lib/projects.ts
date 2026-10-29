export const projectStatuses=['planned','in_progress','active','blocked','completed','cancelled'] as const;
export const projectStatusLabels:Record<string,string>={planned:'Geplant',in_progress:'In Bearbeitung',active:'Aktiv',blocked:'Blockiert',completed:'Abgeschlossen',cancelled:'Storniert'};
export const projectAllowsTime=(status:string)=>['planned','in_progress','active'].includes(status);

/** No arithmetic or inferred legacy value: empty is absent; a genuine zero stays zero. */
export function optionalProjectBudget(value:unknown,max=999999999.99):number|null{
 if(value===null||value===undefined||value==='')return null;
 if((typeof value!=='string'&&typeof value!=='number')||!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(String(value))||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>max)throw new RangeError('Bitte ein gültiges Budget mit höchstens zwei Dezimalstellen eingeben.');
 return Number(value);
}
export function sameProjectBudget(left:unknown,right:unknown){try{return optionalProjectBudget(left)===optionalProjectBudget(right)}catch{return false}}
