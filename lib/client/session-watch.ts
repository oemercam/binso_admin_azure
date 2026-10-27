/** Recheck authoritative session state on resume and while a page stays open.
 * Transport errors never mean signed out. Stop accepting results after unmount. */
export function watchSession(check:()=>Promise<boolean>,onEnded:()=>void){
 let active=true,pending=false,ended=false,queued=false;
 const refresh=async()=>{
  if(!active||ended)return;
  if(pending){queued=true;return;}
  pending=true;
  try{if(!await check()&&active){ended=true;onEnded();}}
  catch{/* The owning view retains its connection error/retry state. */}
  finally{pending=false;if(queued){queued=false;void refresh();}}
 };
 const visible=()=>{if(document.visibilityState==='visible')void refresh();};
 // A fresh document already checks above. Only a bfcache restoration is a
 // pageshow resume; the normal first pageshow must not queue a second startup.
 const restored=(event:PageTransitionEvent)=>{if(event.persisted===true)void refresh();};
 const storage=(event:StorageEvent)=>{if(event.key==='binso.session.changed')void refresh();};
 window.addEventListener('focus',refresh);
 window.addEventListener('online',refresh);
 window.addEventListener('pageshow',restored);
 window.addEventListener('binso-session-invalid',refresh);
 window.addEventListener('storage',storage);
 document.addEventListener('visibilitychange',visible);
 const timer=window.setInterval(visible,60000);
 void refresh();
 return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);window.removeEventListener('pageshow',restored);window.removeEventListener('binso-session-invalid',refresh);window.removeEventListener('storage',storage);document.removeEventListener('visibilitychange',visible);};
}
