"use client";

import {useState} from "react";
import {Icon} from "./ui";

export function avatarIdentity(name:string,identity=name){
 const parts=name.trim().split(/\s+/).filter(Boolean);
 const initials=parts.length?(parts[0][0]+(parts.length>1?parts.at(-1)![0]:"")).toLocaleUpperCase("de-CH"):"";
 let hash=0;for(const character of identity)hash=(Math.imul(hash,31)+character.codePointAt(0)!)>>>0;
 return {initials,tone:identity?hash%5:5};
}

/** Person identity only. Company and platform logos have separate render paths. */
export function Avatar({name="",identity,src,size="medium"}:{name?:string;identity?:string;src?:string|null;size?:"small"|"medium"|"large"}){
 const [failed,setFailed]=useState<string|null>(null);
 const {initials,tone}=avatarIdentity(name,identity??name);
 const image=src&&src!==failed&&(/^(\/[^/]|https:\/\/)/.test(src));
 return <span className={`person-avatar person-avatar-${size} person-avatar-tone-${tone}`} role="img" aria-label={name||"Person"}>
  {image?<img src={src} alt="" onError={()=>setFailed(src)}/>:initials||<Icon name="user" size={size==="large"?22:16}/>}
 </span>;
}
