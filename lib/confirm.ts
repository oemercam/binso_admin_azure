"use client";
export type ConfirmOptions={title?:string;message:string;confirmLabel?:string;cancelLabel?:string;tone?:"default"|"danger"};
export function confirmAction(options:ConfirmOptions):Promise<boolean>{
 return new Promise(resolve=>{
   window.dispatchEvent(new CustomEvent("binso-confirm",{detail:{...options,resolve}}));
 });
}
