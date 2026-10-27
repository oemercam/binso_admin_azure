export const zurichBusinessDay=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export function statisticWindow(today,months){
 if(![1,3,6,12].includes(months)||!/^\d{4}-\d{2}-\d{2}$/.test(today))throw Error('Invalid statistic calendar window');
 const day=new Date(today+'T00:00:00Z');
 if(!Number.isFinite(+day)||day.toISOString().slice(0,10)!==today)throw Error('Invalid business date');
 const from=new Date(Date.UTC(day.getUTCFullYear(),day.getUTCMonth()-months+1,1)).toISOString().slice(0,10);
 return {from,to:today};
}
export function observedStatisticWindows(before,after,months){
 const first=statisticWindow(before,months),last=statisticWindow(after,months);
 const days=(Date.parse(after)-Date.parse(before))/86400000;
 if(days<0||days>1)throw Error('Unexpected calendar drift during a bounded browser interaction');
 return before===after?[first]:[first,last];
}
export function statisticCaption(today,months){
 const window=statisticWindow(today,months);
 const format=day=>new Intl.DateTimeFormat('de-CH',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
 return format(window.from)+' – '+format(window.to);
}
export function matchesReportStatisticRequest(url,before,after,months){
 return url.pathname==='/api/reports'&&url.searchParams.get('months')==='custom'&&observedStatisticWindows(before,after,months).some(window=>url.searchParams.get('from')===window.from&&url.searchParams.get('to')===window.to);
}
