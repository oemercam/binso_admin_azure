"use client";
import {useEffect,useRef} from 'react';
import {useSearchParams} from 'next/navigation';
import {setupField,setupFieldIds,type SetupField} from '@/lib/action-readiness';
import {safeAppPath} from '@/lib/navigation';
/** One explicit field recovery per mounted settings page; never submit on return. */
export function useSetupField(allowed:readonly SetupField[],loaded:boolean,editing:boolean,beginEdit:()=>void,canWrite:boolean){
 const search=useSearchParams(),candidate=setupField(search.get('setupField'));
 const field=candidate&&allowed.includes(candidate)?candidate:null;
 const opened=useRef<string|null>(null);
 useEffect(()=>{if(!field||!loaded||!canWrite||editing||opened.current===field)return;const frame=requestAnimationFrame(()=>{opened.current=field;beginEdit()});return()=>cancelAnimationFrame(frame)},[field,loaded,canWrite,editing,beginEdit]);
 useEffect(()=>{if(!editing||!field)return;const frame=requestAnimationFrame(()=>{const input=document.getElementById(setupFieldIds[field]);const target=input instanceof HTMLInputElement&&input.hidden?input.closest('.form-field')?.querySelector<HTMLElement>('button'):input;if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest'})}});return()=>cancelAnimationFrame(frame)},[editing,field]);
 return {field,returnTo:field?safeAppPath(search.get('returnTo'),'/dashboard'):null};
}
