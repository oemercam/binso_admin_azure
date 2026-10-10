"use client";

import {useDialogFocus} from "./use-dialog-focus";
import {useId} from "react";
import {createPortal} from "react-dom";
import { Button, Icon } from "@/components/ui";

export default function ConfirmDialog({
  open,title,message,confirmLabel="Bestätigen",cancelLabel="Abbrechen",closeLabel="Schliessen",danger=false,busy=false,onConfirm,onCancel,
}:{
  open:boolean;title:string;message:string;confirmLabel?:string;cancelLabel?:string;closeLabel?:string;danger?:boolean;busy?:boolean;
  onConfirm:()=>void;onCancel:()=>void;
}){
  const dialogRef=useDialogFocus(open,()=>{if(!busy)onCancel()});
  const id=useId();

  if(!open)return null;
  return createPortal(<div className="confirm-layer" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onCancel()}}>
    <section ref={dialogRef} tabIndex={-1} className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`}>
      <header><h2 id={`${id}-title`}>{title}</h2><button type="button" className="icon-button" disabled={busy} onClick={onCancel} aria-label={closeLabel}><Icon name="close"/></button></header>
      <p id={`${id}-message`}>{message}</p>
      <div className="confirm-actions"><Button disabled={busy} variant="secondary" onClick={onCancel}>{cancelLabel}</Button><Button disabled={busy} variant={danger?"danger":"primary"} onClick={onConfirm}>{confirmLabel}</Button></div>
    </section>
  </div>,document.body);
}
