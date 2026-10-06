"use client";

import {useDialogFocus} from "./use-dialog-focus";
import { Button, Icon } from "@/components/ui";

export default function ConfirmDialog({
  open,title,message,confirmLabel="Bestätigen",cancelLabel="Abbrechen",danger=false,busy=false,onConfirm,onCancel,
}:{
  open:boolean;title:string;message:string;confirmLabel?:string;cancelLabel?:string;danger?:boolean;busy?:boolean;
  onConfirm:()=>void;onCancel:()=>void;
}){
  const dialogRef=useDialogFocus(open,()=>{if(!busy)onCancel()});

  if(!open)return null;
  return <div className="confirm-layer" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onCancel()}}>
    <section ref={dialogRef} tabIndex={-1} className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <header><h2 id="confirm-title">{title}</h2><button type="button" className="icon-button" disabled={busy} onClick={onCancel} aria-label="Schliessen"><Icon name="close"/></button></header>
      <p id="confirm-message">{message}</p>
      <div className="confirm-actions"><Button disabled={busy} variant="secondary" onClick={onCancel}>{cancelLabel}</Button><Button disabled={busy} variant={danger?"danger":"primary"} onClick={onConfirm}>{confirmLabel}</Button></div>
    </section>
  </div>;
}
