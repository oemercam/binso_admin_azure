"use client";

import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from "react";
import {useLocale} from "@/components/locale-provider";

const translatableProps=["aria-label","title","placeholder","alt"] as const;

function localize(node:ReactNode,t:(value:string)=>string):ReactNode{
 if(typeof node==="string")return t(node);
 if(typeof node==="number"||node==null||typeof node==="boolean")return node;
 if(Array.isArray(node))return node.map(item=>localize(item,t));
 if(!isValidElement(node))return node;
 const element=node as ReactElement<Record<string,unknown>>;
 const props={...element.props} as Record<string,unknown>;
 let changed=false;
 for(const key of translatableProps){
  if(typeof props[key]==="string"){
   const next=t(props[key] as string);
   if(next!==props[key]){props[key]=next;changed=true}
  }
 }
 if("children" in props){
  const children=Children.map(props.children as ReactNode,child=>localize(child,t));
  props.children=children;
  changed=true;
 }
 return changed?cloneElement(element,props):element;
}

export default function TranslatedMarkup({children}:{children:ReactNode}){
 const {t}=useLocale();
 return <>{localize(children,t)}</>;
}
