import {projectStatusLabels} from './projects';
export type ReportSummary={period:{from:string;to:string};asOf:string;customers:{total:string;added:string}|null;projects:Array<{status:string;count:string}>|null;time:{hours:string;billable_hours:string;invoiced_hours:string}|null;payments:Array<{currency:string;amount:string}>|null;expenses:Array<{currency:string;amount:string}>|null;employees:{total:string;active:string}|null};
/** Spreadsheet-safe text; decimal strings remain exact, including negative values. */
export function reportCsv(rows:readonly (readonly unknown[])[]){
 const cell=(value:unknown)=>{let text=String(value??'');if((/^[\s\uFEFF]*[=+@-]/.test(text)||/^[\t\r\n]/.test(text))&&!/^[-+]?\d+(?:\.\d+)?$/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"'};
 return '\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
}
export function reportRows(data:ReportSummary):string[][]{
 const rows:string[][]=[['Kennzahl','Wert','Einheit'],['Stand',data.asOf,''],['Zeitraum',data.period.from+' – '+data.period.to,'']];
 if(data.customers)rows.push(['Kunden gesamt',data.customers.total,''],['Neue Kunden',data.customers.added,'']);
 if(data.projects)for(const item of data.projects)rows.push(['Projekte · '+(projectStatusLabels[item.status]??item.status),item.count,'']);
 if(data.time)rows.push(['Arbeitszeit',data.time.hours,'h'],['Verrechenbare Zeit',data.time.billable_hours,'h'],['Verrechnete Zeit',data.time.invoiced_hours,'h']);
 if(data.payments)for(const item of data.payments)rows.push(['Eingegangene Zahlungen',item.amount,item.currency]);
 if(data.expenses)for(const item of data.expenses)rows.push(['Erstattete Spesen',item.amount,item.currency]);
 if(data.employees)rows.push(['Mitarbeiter gesamt',data.employees.total,''],['Aktive Mitarbeiter',data.employees.active,'']);
 return rows;
}
