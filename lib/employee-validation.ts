/** The general employee endpoint never manages identity, salary, bank or family data. */
export function employeeBodyFieldIssue(input:Record<string,unknown>):string|null {
 const allowed=new Set(['firstName','lastName','email','phone','jobTitle','workloadPercent','entryDate','endDate','workLocation','weeklyHours','vacationDays','address','status']);
 return Object.keys(input).some(key=>!allowed.has(key))?'Diese Mitarbeiterangaben können hier nicht geändert werden.':null;
}

/** Shared client/server validation; the entry date is optional. */
export function employeeInputIssue(input:{email?:unknown;entryDate?:unknown;endDate?:unknown;workLocation?:unknown;workloadPercent?:unknown;weeklyHours?:unknown;vacationDays?:unknown}):string|null {
 const email=String(input.email??"").trim();
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return "Bitte eine gültige E-Mail-Adresse erfassen.";
 const date=String(input.entryDate??"");
 if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))return "Bitte ein gültiges Eintrittsdatum erfassen.";
 const end=String(input.endDate??'');
 if(end&&(!/^\d{4}-\d{2}-\d{2}$/.test(end)||!Number.isFinite(Date.parse(end))||new Date(end).toISOString().slice(0,10)!==end))return 'Bitte ein gültiges Austrittsdatum erfassen.';
 if(date&&end&&end<date)return 'Der Austritt darf nicht vor dem Eintritt liegen.';
 if(input.workLocation!==undefined&&(typeof input.workLocation!=='string'||input.workLocation.length>180))return 'Bitte einen Arbeitsort mit höchstens 180 Zeichen erfassen.';
 for(const [value,min,max,label] of [[input.workloadPercent,0,100,"Pensum"],[input.weeklyHours??42,0,80,"Wochenstunden"],[input.vacationDays??25,0,60,"Ferientage"]] as const){
  const number=Number(value);
  if(String(value??"").trim()===""||!Number.isFinite(number)||number<min||number>max||(label==="Wochenstunden"&&number===0))return `${label}: Bitte einen gültigen Wert ${label==="Wochenstunden"?"grösser als 0 und bis":"zwischen 0 und"} ${max} erfassen.`;
 }
 return null;
}
