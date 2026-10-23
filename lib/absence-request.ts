export const absenceTypes={vacation:'Ferien',sick:'Krankheit',accident:'Unfall',unpaid:'Unbezahlt',military_civil:'Militär / Zivildienst',other:'Andere Abwesenheit'} as const;
export type AbsenceType=keyof typeof absenceTypes;
export type AbsenceRequestInput={employeeId:string;employmentRevisionId:string;absenceType:AbsenceType;startDate:string;endDate:string;days:string};
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const date=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export function absenceRequestIssue(input:unknown):string|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return 'Der Abwesenheitsantrag ist ungültig.';
 const b=input as Record<string,unknown>;
 if(Object.keys(b).some(k=>!['employeeId','employmentRevisionId','absenceType','startDate','endDate','days'].includes(k))||!uuid(b.employeeId)||!uuid(b.employmentRevisionId)||!Object.hasOwn(absenceTypes,String(b.absenceType))||!date(b.startDate)||!date(b.endDate)||String(b.endDate)<String(b.startDate)||typeof b.days!=='string'||!/^(?:0|[1-9]\d{0,3})(?:\.\d{1,2})?$/.test(b.days)||!/[1-9]/.test(b.days))return 'Bitte Mitarbeiter, Anstellung, Abwesenheitsart, Zeitraum und beantragte Tage prüfen.';
 // Only a consistency ceiling. Working days/holidays are never inferred here.
 const span=(Date.parse(String(b.endDate))-Date.parse(String(b.startDate)))/86400000+1;
 if(Number(b.days)>span)return 'Die beantragten Tage dürfen den Kalenderzeitraum nicht überschreiten.';
 return null;
}
