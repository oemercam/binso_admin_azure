"use client";

import {useEffect,useRef,useState} from "react";
import type {PDFDocumentProxy} from "pdfjs-dist";

function PdfPage({pdf,pageNumber,zoomed}: {pdf:PDFDocumentProxy;pageNumber:number;zoomed:boolean}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const frameElement=useRef<HTMLElement>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    const element=canvas.current;
    if(!element)return;
    let active=true;
    let lastSize="";
    let renderTask:ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>|undefined;
    let frame=0;
    const draw=()=>{
      const width=frameElement.current?.clientWidth??0;
      const height=frameElement.current?.clientHeight??0;
      const size=width+":"+height;
      if(width<=0||height<=0||size===lastSize)return;
      lastSize=size;
      delete element.dataset.renderedPage;
      renderTask?.cancel();
      void pdf.getPage(pageNumber).then(page=>{
        if(!active||size!==lastSize)return;
        const base=page.getViewport({scale:1});
        const scale=zoomed?width/base.width*1.75:Math.min(width/base.width,height/base.height);
        const viewport=page.getViewport({scale});
        const ratio=Math.min(window.devicePixelRatio||1,2);
        element.width=Math.floor(viewport.width*ratio);
        element.height=Math.floor(viewport.height*ratio);
        element.style.width=viewport.width+"px";
        element.style.height=viewport.height+"px";
        renderTask=page.render({canvas:element,viewport,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});
        return renderTask.promise.then(()=>{if(active&&size===lastSize)element.dataset.renderedPage=String(pageNumber)});
      }).catch(reason=>{if(active&&reason?.name!=="RenderingCancelledException")setError("PDF-Seite konnte nicht angezeigt werden.")});
    };
    const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw)});
    observer.observe(frameElement.current??element);
    return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();renderTask?.cancel()};
  },[pdf,pageNumber,zoomed]);
  return <section ref={frameElement} className={zoomed?"pdf-page is-zoomed":"pdf-page"} aria-label={`Seite ${pageNumber} von ${pdf.numPages}`}>{error?<p role="alert">{error}</p>:<canvas ref={canvas} role="img" aria-label={`PDF-Seite ${pageNumber}`}/>}</section>;
}

export function DocumentPageViewer({file,zoomed=false}: {file:Blob;zoomed?:boolean}) {
  const [loaded,setLoaded]=useState<{file:Blob;pdf:PDFDocumentProxy}|null>(null);
  const [error,setError]=useState<{file:Blob;message:string}|null>(null);
  const [pageNumber,setPageNumber]=useState(1);
  const touchStart=useRef<{x:number;y:number}|null>(null);
  useEffect(()=>{
    let active=true;
    let task:ReturnType<typeof import("pdfjs-dist").getDocument>|undefined;
    const engineUrl=new URL("pdfjs-dist/build/pdf.mjs",import.meta.url).toString();
    void import(/* webpackIgnore: true */ engineUrl).then(async (engine:typeof import("pdfjs-dist"))=>{
      if(!active)return;
      engine.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
      const data=new Uint8Array(await file.arrayBuffer());
      if(!active)return;
      task=engine.getDocument({data,isEvalSupported:false});
      const document=await task.promise;
      if(active){setError(null);setLoaded({file,pdf:document});setPageNumber(1);}
    }).catch(()=>{if(active)setError({file,message:"PDF konnte nicht angezeigt werden."})});
    return()=>{active=false;void task?.destroy()};
  },[file]);
  const pdf=loaded?.file===file?loaded.pdf:null;
  if(error?.file===file)return <p role="alert">{error.message}</p>;
  if(!pdf)return <p role="status">PDF wird angezeigt …</p>;
  const current=Math.min(Math.max(pageNumber,1),pdf.numPages);
  return <div className="pdf-pages" data-viewer-mode="single-page">
    <div className={zoomed?"pdf-page-stage is-zoomed":"pdf-page-stage"}
      onTouchStart={event=>{const touch=event.touches[0];touchStart.current=!zoomed&&event.touches.length===1&&touch?{x:touch.clientX,y:touch.clientY}:null}}
      onTouchCancel={()=>{touchStart.current=null}}
      onTouchEnd={event=>{const start=touchStart.current;touchStart.current=null;const end=event.changedTouches[0];if(!start||!end||zoomed)return;const dx=end.clientX-start.x,dy=end.clientY-start.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)setPageNumber(value=>Math.min(pdf.numPages,Math.max(1,value+(dx<0?1:-1))))}}>
      <PdfPage key={current} pdf={pdf} pageNumber={current} zoomed={zoomed}/>
    </div>
    <nav className="pdf-page-navigation" aria-label="PDF-Seitennavigation">
      <button type="button" aria-label="Vorherige Seite" disabled={current<=1} onClick={()=>setPageNumber(value=>Math.max(1,value-1))}>‹</button>
      <span aria-live="polite">Seite {current} von {pdf.numPages}</span>
      <button type="button" aria-label="Nächste Seite" disabled={current>=pdf.numPages} onClick={()=>setPageNumber(value=>Math.min(pdf.numPages,value+1))}>›</button>
    </nav>
  </div>;
}

// Existing consumers keep the same API; there is only one viewer implementation.
export {DocumentPageViewer as PdfPreview};
