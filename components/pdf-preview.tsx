"use client";

import {useEffect,useRef,useState} from "react";
import type {PDFDocumentProxy} from "pdfjs-dist";
import {Icon, ErrorState, LoadingState} from "./ui";

function PdfPage({pdf,pageNumber,zoomed}: {pdf:PDFDocumentProxy;pageNumber:number;zoomed:boolean}) {
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
        const viewport=page.getViewport({scale:Math.max(scale,.01)*(zoomed?2.5:1)});
        const ratio=Math.min(window.devicePixelRatio||1,2);
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
  },[pdf,pageNumber,zoomed]);
  return <section className="pdf-page" data-page-number={pageNumber} aria-label={`Seite ${pageNumber} von ${pdf.numPages}`}>{error?<ErrorState>{error}</ErrorState>:<canvas ref={canvas} role="img" aria-label={`PDF-Seite ${pageNumber}`}/>}</section>;
}

export function DocumentPageViewer({file,zoomed=false}: {file:Blob;zoomed?:boolean}) {
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
  if(error?.file===file&&error.attempt===attempt)return <ErrorState onRetry={()=>setAttempt(value=>value+1)} retryLabel="Erneut versuchen">{error.message}</ErrorState>;
  if(loaded?.file!==file||loaded.attempt!==attempt)return <LoadingState>PDF wird angezeigt …</LoadingState>;
  return <DocumentPages key={loaded.pdf.fingerprints[0]} pdf={loaded.pdf} zoomed={zoomed}/>;
}

function DocumentPages({pdf,zoomed}:{pdf:PDFDocumentProxy;zoomed:boolean}){
  const [pageNumber,setPageNumber]=useState(1);
  return <div className="document-page-viewer"><div className={`document-page-stage${zoomed?" is-zoomed":""}`}><PdfPage key={`${pageNumber}:${zoomed}`} pdf={pdf} pageNumber={pageNumber} zoomed={zoomed}/></div><nav className="document-page-navigation" aria-label="Dokumentseiten"><button type="button" className="icon-button" aria-label="Vorherige Seite" disabled={pageNumber<=1} onClick={()=>setPageNumber(value=>value-1)}><Icon name="back"/></button><span role="status" aria-live="polite">Seite {pageNumber} von {pdf.numPages}</span><button type="button" className="icon-button" aria-label="Nächste Seite" disabled={pageNumber>=pdf.numPages} onClick={()=>setPageNumber(value=>value+1)}><Icon name="arrow"/></button></nav></div>;
}
