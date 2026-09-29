import type {SupportDiagnostics} from "@/lib/support/diagnostics";
export type SupportTicket={id:string;number:string;category:string;subject:string;description:string;priority:string;status:string;createdAt:string;updatedAt:string;diagnostics?:SupportDiagnostics; screenshot?:string;messages:{id:string;author:string;text:string;createdAt:string}[]};
export type FeedbackEntry={id:string;rating:number;category:string;text:string;contact:boolean;status:string;context:string;createdAt:string};
export type Announcement={id:string;title:string;message:string;kind:"info"|"success"|"warning";active:boolean;createdAt:string};
const ticketKey="binso-support-tickets";const feedbackKey="binso-pilot-feedback";

function read<T>(key:string,fallback:T):T{if(typeof window==="undefined")return fallback;try{return JSON.parse(localStorage.getItem(key)||"") as T}catch{return fallback}}
function write<T>(key:string,value:T){localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event("binso-pilot-data"))}

export function listSupportTickets(){return read<SupportTicket[]>(ticketKey,[])}
export function createSupportTicket(input:{category:string;subject:string;description:string;priority:string;diagnostics?:SupportDiagnostics;screenshot?:string}){
 const items=listSupportTickets();const id=`sup-${Date.now()}`;const ticket:SupportTicket={id,number:`SUP-${new Date().getFullYear()}-${String(items.length+1).padStart(6,"0")}`,status:"Neu",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),messages:[],...input};write(ticketKey,[ticket,...items]);return ticket;
}
export function getSupportTicket(id:string){return listSupportTickets().find(x=>x.id===id)}
export function addSupportMessage(id:string,text:string,author="Kunde"){const items=listSupportTickets().map(x=>x.id===id?{...x,updatedAt:new Date().toISOString(),messages:[...x.messages,{id:`m-${Date.now()}`,author,text,createdAt:new Date().toISOString()}]}:x);write(ticketKey,items)}
export function updateSupportTicket(id:string,patch:Partial<SupportTicket>){const items=listSupportTickets().map(x=>x.id===id?{...x,...patch,updatedAt:new Date().toISOString()}:x);write(ticketKey,items)}

export function listFeedback(){return read<FeedbackEntry[]>(feedbackKey,[])}
export function createFeedback(input:{rating:number;category:string;text:string;contact:boolean;context:string}){const item:FeedbackEntry={id:`fb-${Date.now()}`,status:"Neu",createdAt:new Date().toISOString(),...input};write(feedbackKey,[item,...listFeedback()]);return item}

export const localFeatureFlags={pilot_feedback:true,announcements:true,onboarding_checklist:true,support:true};
export const localAnnouncements:Announcement[]=[{id:"pilot-1",title:"Willkommen in der Pilotphase",message:"Hilf uns, Binso One zu verbessern. Feedback kannst du jederzeit direkt in der Anwendung senden.",kind:"info",active:true,createdAt:"2026-09-29T00:00:00Z"}];
