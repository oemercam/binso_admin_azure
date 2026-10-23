/** Personal UI time follows the application's Swiss localization fallback. */
export function greetingZone(value:unknown){
 if(typeof value==='string')try{new Intl.DateTimeFormat('en',{timeZone:value}).format();return value;}catch{}
 return 'Europe/Zurich';
}
export function greetingPeriod(now:Date,zone:string){
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',hourCycle:'h23'}).format(now));
 return hour>=5&&hour<11?'Guten Morgen':hour>=11&&hour<18?'Guten Tag':'Guten Abend';
}
/** Find the next actual boundary, including timezone offset/DST changes. */
export function nextGreetingChange(now:Date,zone:string){
 const current=greetingPeriod(now,zone),start=now.getTime();
 let high=start+3600000;
 while(greetingPeriod(new Date(high),zone)===current)high+=3600000;
 let low=high-3600000;
 while(high-low>500){const middle=Math.floor((low+high)/2);if(greetingPeriod(new Date(middle),zone)===current)low=middle;else high=middle;}
 return high;
}
