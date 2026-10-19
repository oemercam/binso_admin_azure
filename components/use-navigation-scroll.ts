"use client";
import {useEffect,useLayoutEffect,useRef} from 'react';
import {listStateStore} from '@/lib/client/list-state';

/** Restore a return destination, not the page being left. Memory is session-fenced. */
export function useNavigationScroll(pathname:string){
 const current=useRef(''),restoring=useRef(false),navigating=useRef(false);
 useEffect(()=>{
  const remember=()=>{if(!restoring.current&&!navigating.current&&current.current)listStateStore.set('binso.navigation:'+current.current,String(Math.max(0,window.scrollY)))};
  const click=(event:MouseEvent)=>{
   const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null;
   if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const url=new URL(link.href,location.href);if(url.origin!==location.origin)return;
   remember();navigating.current=url.pathname+url.search!==location.pathname+location.search;if(link.matches('.mobile-back,.desktop-back'))listStateStore.set('binso.navigation:return',url.pathname+url.search);
  };
  const back=()=>{navigating.current=true;listStateStore.set('binso.navigation:return',location.pathname+location.search)};
  window.addEventListener('scroll',remember,{passive:true});document.addEventListener('click',click,true);window.addEventListener('popstate',back);
  return()=>{remember();window.removeEventListener('scroll',remember);document.removeEventListener('click',click,true);window.removeEventListener('popstate',back)};
 },[]);
 useLayoutEffect(()=>{
  const key=location.pathname+location.search;current.current=key;navigating.current=false;
  const destination=listStateStore.get('binso.navigation:return');listStateStore.delete('binso.navigation:return');
  if(destination!==key)return;
  const raw=listStateStore.get('binso.navigation:'+key);if(raw===undefined)return;
  const target=Number(raw);if(!Number.isFinite(target)||target<0)return;
  restoring.current=true;let frame=0,stopped=false;
  const stop=()=>{stopped=true;restoring.current=false;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('wheel',stop);window.removeEventListener('touchstart',stop);window.removeEventListener('keydown',stop)};
  const restore=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(stopped)return;window.scrollTo({top:target,left:0,behavior:'instant'});if(Math.abs(window.scrollY-target)<=1)stop()})};
  const observer=new ResizeObserver(restore);observer.observe(document.body);
  window.addEventListener('wheel',stop,{passive:true});window.addEventListener('touchstart',stop,{passive:true});window.addEventListener('keydown',stop);
  restore();const timeout=window.setTimeout(stop,5000);
  return()=>{window.clearTimeout(timeout);stop()};
 },[pathname]);
}
