"use client";

import {useEffect,useRef,useState} from "react";
import type {PDFDocumentProxy} from "pdfjs-dist";
import {Icon} from "./ui";

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
  return <section className="pdf-page" data-page-number={pageNumber} aria-label={`Seite ${pageNumber} von ${pdf.numPages}`}>{error?<p role="alert">{error}</p>:<canvas ref={canvas} role="img" aria-label={`PDF-Seite ${pageNumber}`}/>}</section>;
}

export function DocumentPageViewer({file,zoomed=false}: {file:Blob;zoomed?:boolean}) {
  const [loaded,setLoaded]=useState<{file:Blob;pdf:PDFDocumentProxy}|null>(null);
  const [error,setError]=useState<{file:Blob;message:string}|null>(null);
  useEffect(()=>{
    let active=true;
    let task:ReturnType<typeof import("pdfjs-dist").getDocument>|undefined;
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
      if(active)setLoaded({file,pdf:document});
    }).catch(()=>{if(active)setError({file,message:"PDF konnte nicht angezeigt werden."})});
    return()=>{active=false;void task?.destroy()};
  },[file]);
  if(error?.file===file)return <p role="alert">{error.message}</p>;
  if(loaded?.file!==file)return <p role="status">PDF wird angezeigt …</p>;
  return <DocumentPages key={loaded.pdf.fingerprints[0]} pdf={loaded.pdf} zoomed={zoomed}/>;
}

function DocumentPages({pdf,zoomed}:{pdf:PDFDocumentProxy;zoomed:boolean}){
  const [pageNumber,setPageNumber]=useState(1);
  return <div className="document-page-viewer"><div className={`document-page-stage${zoomed?" is-zoomed":""}`}><PdfPage key={`${pageNumber}:${zoomed}`} pdf={pdf} pageNumber={pageNumber} zoomed={zoomed}/></div><nav className="document-page-navigation" aria-label="Dokumentseiten"><button type="button" className="icon-button" aria-label="Vorherige Seite" disabled={pageNumber<=1} onClick={()=>setPageNumber(value=>value-1)}><Icon name="back"/></button><span role="status" aria-live="polite">Seite {pageNumber} von {pdf.numPages}</span><button type="button" className="icon-button" aria-label="Nächste Seite" disabled={pageNumber>=pdf.numPages} onClick={()=>setPageNumber(value=>value+1)}><Icon name="arrow"/></button></nav></div>;
}
