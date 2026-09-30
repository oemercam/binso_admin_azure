"use client";
import {appEvents,emitAppEvent} from "@/lib/client/app-events";
export type ToastTone="success"|"info"|"danger"|"warning";
export function notify(message:string,tone:ToastTone="success",title?:string){
 emitAppEvent(appEvents.toast,{message,tone,title});
}
export function notifyError(message="Ein Fehler ist aufgetreten."){notify(message,"danger","Fehler")}
export function notifySuccess(message="Erfolgreich gespeichert."){notify(message,"success","Erfolg")}
