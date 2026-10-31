/** Real elapsed intervals split at Swiss calendar boundaries, including DST.
 * Pauses never contribute time. Legacy totals without dates stay explicit. */
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'});
export const timerDay=(timestamp:number)=>formatter.format(timestamp);
type Tracker={day_seconds?:Record<string,number>;accumulated_seconds:number;state:string;active_since:string|Date|null};
export function timerDays(tracker:Tracker,now:number){
 const days={...tracker.day_seconds};
 if(Object.entries(days).some(([date,seconds])=>!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(seconds)||seconds<0))throw new RangeError('Ungültiger Zeitmessungsstand.');
 const recorded=Object.values(days).reduce((sum,value)=>sum+value,0);
 const legacySeconds=Math.max(0,Math.round((Number(tracker.accumulated_seconds)-recorded)*1000)/1000);
 if(tracker.state==='running'&&tracker.active_since){
  let start=new Date(tracker.active_since).getTime();
  if(!Number.isFinite(start)||now<start||now-start>366*86400000)throw new RangeError('Bitte den Zeitraum der Zeitmessung prüfen.');
  const end=start+Math.floor((now-start)/1000)*1000;
  while(start<end){
   const date=timerDay(start);let boundary=end;
   if(timerDay(end-1)!==date){
    let left=start,right=Math.min(end,start+27*3600000);
    while(right-left>1){const middle=Math.floor((left+right)/2);if(timerDay(middle)===date)left=middle;else right=middle;}
    boundary=right;
   }
   days[date]=Math.round(((days[date]??0)+(boundary-start)/1000)*1000)/1000;
   start=boundary;
  }
 }
 return {days,legacySeconds,seconds:Math.round(legacySeconds+Object.values(days).reduce((sum,value)=>sum+value,0))};
}
export function confirmLegacyTimerDays(value:unknown,seconds:number,earliest:string,latest:string){
 if(!Array.isArray(value)||value.length<1||value.length>366)throw new RangeError('Bitte die bisherigen Zeiten nach Datum bestätigen.');
 const days:Record<string,number>={};
 for(const row of value){
  if(!row||typeof row!=='object'||Object.keys(row).some(key=>!['date','seconds'].includes(key))||typeof row.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||new Date(row.date+'T12:00:00Z').toISOString().slice(0,10)!==row.date||row.date<earliest||row.date>latest||typeof row.seconds!=='number'||!Number.isSafeInteger(row.seconds)||row.seconds<=0||Object.hasOwn(days,row.date))throw new RangeError('Bitte Datum und Dauer der bisherigen Zeiten prüfen.');
  days[row.date]=row.seconds;
 }
 if(Object.values(days).reduce((sum,value)=>sum+value,0)!==seconds)throw new RangeError('Die bestätigten Zeiten müssen der bisherigen Dauer entsprechen.');
 return days;
}
