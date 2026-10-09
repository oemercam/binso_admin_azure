"use client";

import {useEffect,useRef,useState} from "react";
import type {PDFDocumentProxy} from "pdfjs-dist";

function PdfPage({pdf,pageNumber}: {pdf:PDFDocumentProxy;pageNumber:number}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    const element=canvas.current;
    if(!element)return;
    let active=true;
    let lastWidth=0;
    let renderTask:ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>|undefined;
    let frame=0;
    const draw=()=>{
      const width=element.parentElement?.clientWidth??0;
      if(width<=0||width===lastWidth)return;
      lastWidth=width;
      renderTask?.cancel();
      void pdf.getPage(pageNumber).then(page=>{
        if(!active||width!==lastWidth)return;
        const base=page.getViewport({scale:1});
        const viewport=page.getViewport({scale:width/base.width});
        const ratio=Math.min(window.devicePixelRatio||1,2);
        element.width=Math.floor(viewport.width*ratio);
        element.height=Math.floor(viewport.height*ratio);
        element.style.width="100%";
        element.style.height="auto";
        renderTask=page.render({canvas:element,viewport,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});
        return renderTask.promise;
      }).catch(reason=>{if(active&&reason?.name!=="RenderingCancelledException")setError("PDF-Seite konnte nicht angezeigt werden.")});
    };
    const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw)});
    observer.observe(element.parentElement??element);
    return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();renderTask?.cancel()};
  },[pdf,pageNumber]);
  return <section className="pdf-page" aria-label={`Seite ${pageNumber} von ${pdf.numPages}`}>{error?<p role="alert">{error}</p>:<canvas ref={canvas} role="img" aria-label={`PDF-Seite ${pageNumber}`}/>}</section>;
}

export function PdfPreview({file}: {file:Blob}) {
  const [pdf,setPdf]=useState<PDFDocumentProxy|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [pageNumber,setPageNumber]=useState(1);
  const touchStart=useRef<number|null>(null);
  useEffect(()=>{setPdf(null);setError(null);setPageNumber(1)},[file]);
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
      if(active)setPdf(document);
    }).catch(()=>{if(active)setError("PDF konnte nicht angezeigt werden.")});
    return()=>{active=false;void task?.destroy()};
  },[file]);
  if(error)return <p role="alert">{error}</p>;
  if(!pdf)return <p role="status">PDF wird angezeigt …</p>;
  const current=Math.min(Math.max(pageNumber,1),pdf.numPages);
  return <div className="pdf-pages" data-viewer-mode="single-page" style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",minWidth:0,overflowX:"hidden"}}>
    <div style={{width:"100%",maxWidth:"min(100%, 720px)",minWidth:0,touchAction:"pan-y"}} onTouchStart={event=>{touchStart.current=event.touches[0]?.clientX??null}} onTouchEnd={event=>{const start=touchStart.current;touchStart.current=null;if(start===null)return;const delta=(event.changedTouches[0]?.clientX??start)-start;if(Math.abs(delta)>60)setPageNumber(value=>Math.min(pdf.numPages,Math.max(1,value+(delta<0?1:-1))))}}>
      <PdfPage key={current} pdf={pdf} pageNumber={current}/>
    </div>
    <nav aria-label="PDF-Seitennavigation" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,padding:"12px 0",width:"100%"}}>
      <button type="button" aria-label="Vorherige Seite" disabled={current<=1} onClick={()=>setPageNumber(value=>Math.max(1,value-1))}>‹</button>
      <span aria-live="polite">Seite {current} von {pdf.numPages}</span>
      <button type="button" aria-label="Nächste Seite" disabled={current>=pdf.numPages} onClick={()=>setPageNumber(value=>Math.min(pdf.numPages,value+1))}>›</button>
    </nav>
  </div>;
}
