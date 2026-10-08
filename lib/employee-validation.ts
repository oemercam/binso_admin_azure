/** Shared client/server validation; the entry date is optional. */
export function employeeInputIssue(input:{email?:unknown;entryDate?:unknown;workloadPercent?:unknown;weeklyHours?:unknown;vacationDays?:unknown}):string|null {
 const email=String(input.email??"").trim();
 if(!email)return "Bitte eine E-Mail-Adresse erfassen.";
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return "Bitte eine gültige E-Mail-Adresse erfassen.";
 const date=String(input.entryDate??"");
 if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))return "Bitte ein gültiges Eintrittsdatum erfassen.";
 for(const [value,min,max,label] of [[input.workloadPercent,0,100,"Pensum"],[input.weeklyHours??42,0,80,"Wochenstunden"],[input.vacationDays??25,0,60,"Ferientage"]] as const){
  const number=Number(value);
  if(String(value??"").trim()===""||!Number.isFinite(number)||number<min||number>max||(label==="Wochenstunden"&&number===0))return `${label}: Bitte einen gültigen Wert ${label==="Wochenstunden"?"grösser als 0 und bis":"zwischen 0 und"} ${max} erfassen.`;
 }
 return null;
}
