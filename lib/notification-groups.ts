export function notificationGroups<T extends {created_at:string}>(items:readonly T[],now=new Date()){
 const day=(date:Date)=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
 const today=day(now),yesterday=new Date(Date.parse(today+"T12:00:00Z")-86400000).toISOString().slice(0,10);
 const groups=new Map<string,{label:string;items:T[]}>();
 for(const item of items){
  const date=new Date(item.created_at),valid=Number.isFinite(date.getTime()),key=valid?day(date):'unknown';
  const label=key===today?'Heute':key===yesterday?'Gestern':valid?date.toLocaleDateString('de-CH',{timeZone:'Europe/Zurich',day:'2-digit',month:'2-digit',year:'numeric'}):'Ohne Datum';
  const group=groups.get(key)??{label,items:[]};group.items.push(item);groups.set(key,group);
 }
 return Array.from(groups.values());
}
