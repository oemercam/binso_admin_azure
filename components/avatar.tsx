"use client";

import {LocalizedElement} from "@/lib/client/locale";
import {companyLogoSource} from "@/lib/image-url";
import {useState} from "react";
import {Icon} from "./ui";

export function avatarIdentity(name:string,identity=name){
 const parts=name.trim().split(/\s+/).filter(Boolean);
 const initials=parts.length?(parts[0][0]+(parts.length>1?parts.at(-1)![0]:"")).toLocaleUpperCase("de-CH"):"";
 let hash=0;for(const character of identity)hash=(Math.imul(hash,31)+character.codePointAt(0)!)>>>0;
 return {initials,tone:parts.length&&identity?hash%5:5};
}

/** Person identity only. Company and platform logos have separate render paths. */
export function Avatar({name="",identity,src,size="medium",preview=false}:{name?:string;identity?:string;src?:string|null;size?:"small"|"medium"|"large";preview?:boolean}){
 const [failed,setFailed]=useState<string|null>(null);
 const {initials,tone}=avatarIdentity(name,identity??name);
 const image=src&&src!==failed&&(/^(\/[^/]|https:\/\/)/.test(src)||(preview&&companyLogoSource(src)===src));
 return <LocalizedElement as="span" className={`person-avatar person-avatar-${size} person-avatar-tone-${tone}`} role="img" aria-label={name||"Person"}>
  {image?<LocalizedElement as="img" src={src} alt="" onError={()=>setFailed(src)}/>:initials||<Icon name="user" size={size==="large"?22:16}/>}
 </LocalizedElement>;
}
