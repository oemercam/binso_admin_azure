"use client";

import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import {useEffect,useRef,useState} from "react";
import type {PDFDocumentProxy} from "pdfjs-dist";
import {Icon, ErrorState, LoadingState} from "./ui";
import {boundPdfZoom,pdfSwipePage} from '@/lib/pdf-gestures';
import {useDialogFocus} from "./use-dialog-focus";

function PdfPage({pdf,pageNumber,zoom}: {pdf:PDFDocumentProxy;pageNumber:number;zoom:number}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    const element=canvas.current;
    if(!element)return;
    let active=true;
    let lastSize="";
    let renderTask:ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>|undefined;
    let frame=0;
    const draw=()=>{
      const stage=element.closest(".document-page-stage");
      const width=stage?.clientWidth??0,height=stage?.clientHeight??0;
      const size=`${width}:${height}`;
      if(width<=0||height<=0||size===lastSize)return;
      lastSize=size;
      renderTask?.cancel();
      void pdf.getPage(pageNumber).then(page=>{
        if(!active||size!==lastSize)return;
        const base=page.getViewport({scale:1});
        const scale=Math.min((width-24)/base.width,(height-24)/base.height);
        const viewport=page.getViewport({scale:Math.max(scale,.01)*zoom});
        const ratio=Math.min(window.devicePixelRatio||1,2,8192/viewport.width,8192/viewport.height,Math.sqrt(12_000_000/(viewport.width*viewport.height)));
        element.width=Math.floor(viewport.width*ratio);
        element.height=Math.floor(viewport.height*ratio);
        element.style.width=`${viewport.width}px`;
        element.style.height=`${viewport.height}px`;
        renderTask=page.render({canvas:element,viewport,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});
        return renderTask.promise.then(()=>{if(active&&size===lastSize)element.dataset.renderedPage=String(pageNumber)});
      }).catch(reason=>{if(active&&reason?.name!=="RenderingCancelledException")setError("PDF-Seite konnte nicht angezeigt werden.")});
    };
    const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw)});
    observer.observe(element.closest(".document-page-stage")??element);
    return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();renderTask?.cancel()};
  },[pdf,pageNumber,zoom]);
  return <LocalizedElement as="section" className="pdf-page" data-page-number={pageNumber} aria-label={`Seite ${pageNumber} von ${pdf.numPages}`}>{error?<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>:<LocalizedElement as="canvas" ref={canvas} role="img" aria-label={`PDF-Seite ${pageNumber}`}/>}</LocalizedElement>;
}

export function DocumentPageViewer({file,zoom:controlledZoom,onZoom}: {file:Blob;zoom?:number;onZoom?:(value:number)=>void}) {
  const [localZoom,setLocalZoom]=useState(1);const zoom=controlledZoom??localZoom,setZoom=onZoom??setLocalZoom;
  const [attempt,setAttempt]=useState(0);
  const [loaded,setLoaded]=useState<{file:Blob;attempt:number;pdf:PDFDocumentProxy}|null>(null);
  const [error,setError]=useState<{file:Blob;attempt:number;message:string}|null>(null);
  useEffect(()=>{
    let active=true;
    let task:ReturnType<typeof import("pdfjs-dist").getDocument>|undefined;
    const destroy=()=>{void task?.destroy().catch(()=>{});};
    // Module import and worker startup can remain pending without rejecting.
    // Bound the whole attempt, including file reads, and ignore late results.
    const timeout=window.setTimeout(()=>{
      if(!active)return;
      active=false;
      setError({file,attempt,message:"Die PDF-Vorschau dauert zu lange. Bitte erneut versuchen."});
      destroy();
    },20000);
    // Load the self-contained ESM as a same-origin asset: PDF.js internal
    // webpack bindings collide with eval-wrapped development modules.
    const engineUrl=new URL("pdfjs-dist/build/pdf.mjs",import.meta.url).toString();
    void import(/* webpackIgnore: true */ engineUrl).then(async (engine:typeof import("pdfjs-dist"))=>{
      if(!active)return;
      engine.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
      const data=new Uint8Array(await file.arrayBuffer());
      if(!active)return;
      task=engine.getDocument({data,isEvalSupported:false});
      const document=await task.promise;
      if(active){window.clearTimeout(timeout);setLoaded({file,attempt,pdf:document});}
    }).catch(()=>{if(active){window.clearTimeout(timeout);setError({file,attempt,message:"PDF konnte nicht angezeigt werden."});}});
    return()=>{active=false;window.clearTimeout(timeout);destroy()};
  },[file,attempt]);
  if(error?.file===file&&error.attempt===attempt)return <ErrorState onRetry={()=>setAttempt(value=>value+1)} retryLabel="Erneut versuchen"><LocalizedText>{error.message}</LocalizedText></ErrorState>;
  if(loaded?.file!==file||loaded.attempt!==attempt)return <LoadingState><LocalizedText>{"PDF wird angezeigt …"}</LocalizedText></LoadingState>;
  return <DocumentPages key={loaded.pdf.fingerprints[0]} pdf={loaded.pdf} zoom={zoom} onZoom={setZoom}/>;
}

function DocumentPages({pdf,zoom,onZoom}:{pdf:PDFDocumentProxy;zoom:number;onZoom:(value:number)=>void}){
  const [pageNumber,setPageNumber]=useState(1);
  const lastTap=useRef({time:0,x:0,y:0}),stage=useRef<HTMLDivElement>(null),pointers=useRef(new Map<number,{x:number;y:number}>()),gesture=useRef({x:0,y:0,left:0,top:0,distance:0,zoom:1,multi:false});
  return <div className="document-page-viewer"><div ref={stage} tabIndex={0} role="group" aria-label="Dokumentseite" className={`document-page-stage${zoom>1.01?" is-zoomed":""}`} onDoubleClick={()=>onZoom?.(zoom>1.01?1:2.5)} onKeyDown={event=>{if(zoom<=1.01&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();setPageNumber(value=>Math.max(1,Math.min(pdf.numPages,value+(event.key==='ArrowLeft'?-1:1))));}}} onPointerDown={event=>{
   if(event.pointerType==='mouse'&&event.button!==0)return;
   pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});event.currentTarget.setPointerCapture(event.pointerId);
   if(pointers.current.size===1)gesture.current={x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,top:event.currentTarget.scrollTop,distance:0,zoom,multi:false};
   if(pointers.current.size===2){const [a,b]=[...pointers.current.values()];gesture.current.distance=Math.hypot(a.x-b.x,a.y-b.y);gesture.current.zoom=zoom;gesture.current.multi=true;}
  }} onPointerMove={event=>{
   if(!pointers.current.has(event.pointerId))return;pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
   if(pointers.current.size===2){const [a,b]=[...pointers.current.values()];if(gesture.current.distance>0)onZoom?.(boundPdfZoom(gesture.current.zoom*Math.hypot(a.x-b.x,a.y-b.y)/gesture.current.distance));}
   else if(zoom>1.01&&!gesture.current.multi){event.currentTarget.scrollLeft=gesture.current.left+gesture.current.x-event.clientX;event.currentTarget.scrollTop=gesture.current.top+gesture.current.y-event.clientY;}
  }} onPointerUp={event=>{
   const start=gesture.current;if(!pointers.current.has(event.pointerId))return;pointers.current.delete(event.pointerId);
   if(!pointers.current.size){setPageNumber(value=>pdfSwipePage(value,pdf.numPages,event.clientX-start.x,event.clientY-start.y,zoom,start.multi));
    if(event.pointerType==='touch'&&!start.multi&&Math.hypot(event.clientX-start.x,event.clientY-start.y)<8){const now=Date.now(),previous=lastTap.current;if(now-previous.time<320&&Math.hypot(event.clientX-previous.x,event.clientY-previous.y)<24){onZoom(zoom>1.01?1:2.5);lastTap.current={time:0,x:0,y:0};}else lastTap.current={time:now,x:event.clientX,y:event.clientY};}
   }
  }} onPointerCancel={()=>{pointers.current.clear();gesture.current.multi=true;}}><PdfPage key={pageNumber} pdf={pdf} pageNumber={pageNumber} zoom={zoom}/></div><LocalizedElement as="nav" className="document-page-navigation" aria-label="Dokumentseiten"><LocalizedElement as="button" type="button" className="icon-button" aria-label="Vorherige Seite" disabled={pageNumber<=1} onClick={()=>setPageNumber(value=>value-1)}><Icon name="back"/></LocalizedElement><span role="status" aria-live="polite"><LocalizedText>{"Seite "}</LocalizedText>{pageNumber}<LocalizedText>{" von "}</LocalizedText>{pdf.numPages}</span><LocalizedElement as="button" type="button" className="icon-button" aria-label="Nächste Seite" disabled={pageNumber>=pdf.numPages} onClick={()=>setPageNumber(value=>value+1)}><Icon name="arrow"/></LocalizedElement></LocalizedElement></div>;

}

export function DocumentModal({ title, onClose, pdfNumber, previewDraft, fileUrl, fileBlob, fileName }: { title:string; onClose:()=>void; pdfNumber?:string;previewDraft?:unknown;fileUrl?:string;fileBlob?:Blob;fileName?:string }) {
  const [pdfBlob,setPdfBlob]=useState<Blob|null>(null);
  const [pdfError,setPdfError]=useState<string|null>(null);
  const pdfFile=useRef<File|null>(null);
  const previewJson=JSON.stringify(previewDraft);
  useEffect(()=>{
    let active=true;
    const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),20000);
    const source=fileBlob?Promise.resolve(fileBlob):fetch(fileUrl??(pdfNumber?"/api/documents/"+encodeURIComponent(pdfNumber)+"/pdf":"/api/documents/preview"),{...(fileUrl||pdfNumber?{}:{method:"POST",headers:{"Content-Type":"application/json"},body:previewJson}),signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error("PDF konnte nicht geladen werden.");return response.blob()});
    source.then(blob=>{if(!active)return;window.clearTimeout(timeout);pdfFile.current=new File([blob],(fileName||pdfNumber||"Entwurf")+".pdf",{type:"application/pdf"});setPdfBlob(blob)}).catch(()=>{if(active)setPdfError("PDF konnte nicht geladen werden.")});
    return()=>{active=false;window.clearTimeout(timeout);controller.abort();pdfFile.current=null};
  },[pdfNumber,previewJson,fileUrl,fileBlob,fileName]);
  const [zoom,setZoom]=useState(1);
  const modalDialog=useDialogFocus(true,onClose);
  const share=async()=>{
    if(pdfFile.current&&navigator.canShare?.({files:[pdfFile.current]})){try{await navigator.share({title,files:[pdfFile.current]})}catch{/* share dialog closed */}return;}
    if(pdfBlob){const url=URL.createObjectURL(pdfBlob);const link=document.createElement("a");link.href=url;link.download=(fileName||pdfNumber||"Entwurf")+".pdf";link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  };
  return <LocalizedElement as="section" ref={modalDialog} tabIndex={-1} className="document-modal" role="dialog" aria-modal="true" aria-label={title}>
    <header><span className="document-modal-header-spacer" aria-hidden="true"/><strong><LocalizedText>{title}</LocalizedText></strong><div className="document-modal-header-actions"><LocalizedElement as="button" type="button" aria-label={zoom>1.01?"Auf Bildschirm einpassen":"Vorschau vergrössern"} aria-pressed={zoom>1.01} onClick={()=>setZoom(value=>value>1.01?1:2.5)}><Icon name="search"/></LocalizedElement><LocalizedElement as="button" type="button" disabled={!pdfBlob} aria-label="Teilen oder herunterladen" onClick={()=>void share()}><Icon name="upload"/></LocalizedElement><LocalizedElement as="button" type="button" aria-label="Vorschau schliessen" onClick={onClose}><Icon name="close"/></LocalizedElement></div></header>
    <div className="document-modal-body">{pdfError?<ErrorState><LocalizedText>{pdfError}</LocalizedText></ErrorState>:pdfBlob?<DocumentPageViewer key={previewJson+String(pdfNumber)} file={pdfBlob} zoom={zoom} onZoom={setZoom}/>:<LoadingState><LocalizedText>{"PDF wird geladen …"}</LocalizedText></LoadingState>}</div>
  </LocalizedElement>;
}
