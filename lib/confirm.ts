"use client";
import {appEvents,emitAppEvent} from "@/lib/client/app-events";
export type ConfirmOptions={title?:string;message:string;confirmLabel?:string;cancelLabel?:string;tone?:"default"|"danger"};
export function confirmAction(options:ConfirmOptions):Promise<boolean>{
 return new Promise(resolve=>emitAppEvent(appEvents.confirm,{...options,resolve}));
}
