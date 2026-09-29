"use client";
export type ToastTone="success"|"info"|"danger"|"warning";
export function notify(message:string,tone:ToastTone="success",title?:string){
 window.dispatchEvent(new CustomEvent("binso-toast",{detail:{message,tone,title}}));
}
export function notifyError(message="Ein Fehler ist aufgetreten."){notify(message,"danger","Fehler")}
export function notifySuccess(message="Erfolgreich gespeichert."){notify(message,"success","Erfolg")}
