"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getLocale, localeLabels, localeNames, setLocale, translate, type Locale } from "@/lib/i18n";

const LocaleContext=createContext<{locale:Locale;setLocale:(l:Locale)=>void}>({locale:"de",setLocale:()=>{}});
export function useLocale(){return useContext(LocaleContext)}

const textOriginals=new WeakMap<Text,string>();
const attributeOriginals=new WeakMap<Element,Map<string,string>>();

function getOriginalAttribute(el:Element, attr:string){
  let map=attributeOriginals.get(el);
  if(!map){map=new Map();attributeOriginals.set(el,map)}
  if(!map.has(attr)) map.set(attr,el.getAttribute(attr)||"");
  return map.get(attr)||"";
}

function translateNode(root:ParentNode, locale:Locale){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes:Text[]=[];
  let node:Node|null;

  while((node=walker.nextNode())) nodes.push(node as Text);

  for(const textNode of nodes){
    const parent=textNode.parentElement;
    if(!parent||["SCRIPT","STYLE","CODE","PRE"].includes(parent.tagName)) continue;
    if(!textOriginals.has(textNode)) textOriginals.set(textNode,textNode.nodeValue||"");
    const base=textOriginals.get(textNode)||"";
    const translated=translate(base,locale);
    if(textNode.nodeValue!==translated) textNode.nodeValue=translated;
  }

  root.querySelectorAll?.("input[placeholder],textarea[placeholder],[title],[aria-label]").forEach(el=>{
    for(const attr of ["placeholder","title","aria-label"]){
      if(!el.hasAttribute(attr)) continue;
      const original=getOriginalAttribute(el,attr);
      const translated=translate(original,locale);
      if(el.getAttribute(attr)!==translated) el.setAttribute(attr,translated);
    }
  });
}

export default function LocaleProvider({children}:{children:React.ReactNode}){
  const pathname=usePathname();
  const [locale,setCurrent]=useState<Locale>("de");
  const hydrated=useRef(false);
  const observerRef=useRef<MutationObserver|null>(null);

  useEffect(()=>{
    const initial=getLocale();
    document.documentElement.lang=initial==="de"?"de-CH":initial;

    const stateTimer=window.setTimeout(()=>{
      setCurrent(initial);
      hydrated.current=true;
      translateNode(document.body,initial);

      // Start observing only after the initial hydration has settled.
      const observer=new MutationObserver(mutations=>{
        if(!hydrated.current) return;
        const active=getLocale();
        for(const mutation of mutations){
          mutation.addedNodes.forEach(added=>{
            if(added.nodeType===Node.ELEMENT_NODE){
              translateNode(added as Element,active);
            }else if(added.nodeType===Node.TEXT_NODE && added.parentNode){
              translateNode(added.parentNode,active);
            }
          });
        }
      });
      observer.observe(document.body,{subtree:true,childList:true});
      observerRef.current=observer;
    },150);

    const listener=(e:Event)=>{
      const l=(e as CustomEvent).detail.locale as Locale;
      setCurrent(l);
      document.documentElement.lang=l==="de"?"de-CH":l;
      window.requestAnimationFrame(()=>translateNode(document.body,l));
    };

    window.addEventListener("binso-locale-changed",listener);
    return()=>{
      window.clearTimeout(stateTimer);
      observerRef.current?.disconnect();
      observerRef.current=null;
      window.removeEventListener("binso-locale-changed",listener);
    };
  },[]);

  useEffect(()=>{
    if(!hydrated.current) return;
    const timer=window.setTimeout(()=>translateNode(document.body,getLocale()),50);
    return()=>window.clearTimeout(timer);
  },[pathname]);

  return <LocaleContext.Provider value={{locale,setLocale:(l)=>{setLocale(l);setCurrent(l)}}}>{children}</LocaleContext.Provider>
}

export function LanguageSwitcher({compact=false}:{compact?:boolean}){
  const {locale,setLocale}=useLocale();
  return <label className={compact?"language-switcher compact":"language-switcher"} aria-label="Sprache">
    <span>{compact?localeLabels[locale]:"Sprache"}</span>
    <select value={locale} onChange={e=>setLocale(e.target.value as Locale)}>
      {(Object.keys(localeLabels) as Locale[]).map(l=><option value={l} key={l}>{compact?localeLabels[l]:localeNames[l]}</option>)}
    </select>
  </label>
}
