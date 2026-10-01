import type {SupportDiagnostics} from "@/lib/support/diagnostics";
import {appEvents,emitAppEvent} from "@/lib/client/app-events";
import {readJsonStorage,writeJsonStorage} from "@/lib/client/browser-storage";
import {storageKeys} from "@/config/storage-keys";
import {demoAnnouncements} from "@/lib/demo/pilot-fixtures";
export type SupportAttachment={id:string;fileName:string;mimeType:string;sizeBytes:number;href?:string;dataUrl?:string};
export type SupportTicket={id:string;number:string;category:string;subject:string;description:string;priority:string;status:string;createdAt:string;updatedAt:string;diagnostics?:SupportDiagnostics;screenshot?:string;attachments?:SupportAttachment[];messages:{id:string;author:string;text:string;createdAt:string}[]};
export type FeedbackEntry={id:string;rating:number;category:string;text:string;contact:boolean;status:string;context:string;createdAt:string};
export type Announcement={id:string;title:string;message:string;kind:"info"|"success"|"warning";active:boolean;createdAt:string;releaseVersion?:string};
const ticketKey=storageKeys.supportTickets;const feedbackKey=storageKeys.pilotFeedback;

function read<T>(key:string,fallback:T):T{return readJsonStorage(key,fallback)}
function write<T>(key:string,value:T){writeJsonStorage(key,value);emitAppEvent(appEvents.pilotDataChanged)}

export function listSupportTickets(){return read<SupportTicket[]>(ticketKey,[])}
export function createSupportTicket(input:{category:string;subject:string;description:string;priority:string;diagnostics?:SupportDiagnostics;screenshot?:string;attachments?:SupportAttachment[]}){
 const items=listSupportTickets();const id=`sup-${Date.now()}`;const ticket:SupportTicket={id,number:`SUP-${new Date().getFullYear()}-${String(items.length+1).padStart(6,"0")}`,status:"open",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),messages:[],...input};write(ticketKey,[ticket,...items]);return ticket;
}
export function getSupportTicket(id:string){return listSupportTickets().find(x=>x.id===id)}
export function addSupportMessage(id:string,text:string,author="Kunde"){const items=listSupportTickets().map(x=>x.id===id?{...x,updatedAt:new Date().toISOString(),messages:[...x.messages,{id:`m-${Date.now()}`,author,text,createdAt:new Date().toISOString()}]}:x);write(ticketKey,items)}
export function updateSupportTicket(id:string,patch:Partial<SupportTicket>){const items=listSupportTickets().map(x=>x.id===id?{...x,...patch,updatedAt:new Date().toISOString()}:x);write(ticketKey,items)}

export function listFeedback(){return read<FeedbackEntry[]>(feedbackKey,[])}
export function createFeedback(input:{rating:number;category:string;text:string;contact:boolean;context:string}){const item:FeedbackEntry={id:`fb-${Date.now()}`,status:"open",createdAt:new Date().toISOString(),...input};write(feedbackKey,[item,...listFeedback()]);return item}

export const localFeatureFlags={pilot_feedback:true,announcements:true,onboarding_checklist:true,support:true};
export const localAnnouncements:Announcement[]=demoAnnouncements.map(item=>({...item}));
