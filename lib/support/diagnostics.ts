"use client";

export type SupportEvent={at:string;type:string;message:string;path?:string};
export type SupportDiagnostics={
  collectedAt:string;
  appVersion:string;
  route:string;
  userAgent:string;
  platform:string;
  language:string;
  languages:string[];
  viewport:{width:number;height:number;devicePixelRatio:number};
  screen:{width:number;height:number};
  online:boolean;
  pwa:boolean;
  theme:string;
  timezone:string;
  recentEvents:SupportEvent[];
};

const EVENT_KEY="binso-support-events";
const MAX_EVENTS=50;

function redact(input:string){
  return input
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[E-MAIL]")
    .replace(/\b(?:CH)?\d{2}(?:\s?\d){17,}\b/gi,"[IBAN]")
    .replace(/(password|token|authorization|cookie|secret)=?[^\s&]*/gi,"$1=[REDACTED]");
}

export function recordSupportEvent(type:string,message:string){
  if(typeof window==="undefined")return;
  try{
    const current=JSON.parse(sessionStorage.getItem(EVENT_KEY)||"[]") as SupportEvent[];
    const next=[...current,{at:new Date().toISOString(),type,message:redact(String(message)).slice(0,500),path:window.location.pathname}].slice(-MAX_EVENTS);
    sessionStorage.setItem(EVENT_KEY,JSON.stringify(next));
  }catch{}
}

export function recentSupportEvents(){
  if(typeof window==="undefined")return [] as SupportEvent[];
  try{return (JSON.parse(sessionStorage.getItem(EVENT_KEY)||"[]") as SupportEvent[]).slice(-MAX_EVENTS)}catch{return []}
}

export function collectSupportDiagnostics():SupportDiagnostics{
  const standalone=window.matchMedia?.("(display-mode: standalone)")?.matches||Boolean((navigator as Navigator & {standalone?:boolean}).standalone);
  return {
    collectedAt:new Date().toISOString(),
    appVersion:document.documentElement.getAttribute("data-app-version")||"1.1.x-pilot",
    route:window.location.pathname,
    userAgent:redact(navigator.userAgent),
    platform:(navigator as Navigator & {userAgentData?:{platform?:string}}).userAgentData?.platform||navigator.platform||"unknown",
    language:navigator.language,
    languages:Array.from(navigator.languages||[]),
    viewport:{width:window.innerWidth,height:window.innerHeight,devicePixelRatio:window.devicePixelRatio||1},
    screen:{width:window.screen.width,height:window.screen.height},
    online:navigator.onLine,
    pwa:standalone,
    theme:document.documentElement.dataset.theme||"system",
    timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"unknown",
    recentEvents:recentSupportEvents(),
  };
}

export async function captureSupportScreenshot():Promise<string>{
  if(!navigator.mediaDevices?.getDisplayMedia)throw new Error("Screenshot-Aufnahme wird von diesem Browser nicht unterstützt.");
  const stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
  try{
    const video=document.createElement("video");
    video.srcObject=stream;video.muted=true;await video.play();
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    const canvas=document.createElement("canvas");
    canvas.width=video.videoWidth||window.innerWidth;canvas.height=video.videoHeight||window.innerHeight;
    const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Screenshot konnte nicht erstellt werden.");
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    return canvas.toDataURL("image/jpeg",0.82);
  }finally{for(const track of stream.getTracks())track.stop()}
}
