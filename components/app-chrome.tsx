"use client";

import {type ReactNode} from "react";

/** Both portals use the same opaque Microsoft header and unframed actions. */
export function AppHeader({leading,actions,children,detail=false,className="",actionClassName="",leadingClassName="",contentHeader=false}:{leading:ReactNode;actions?:ReactNode;children?:ReactNode;detail?:boolean;className?:string;actionClassName?:string;leadingClassName?:string;contentHeader?:boolean}){
 return <header className={`app-header ${className}`.trim()} data-detail={detail||undefined} data-appearance={contentHeader?"plain":undefined}>
  <div className={`app-header-leading ${leadingClassName}`.trim()}>{leading}</div>
  {children}
  {actions&&<div className={`app-header-actions ${actionClassName}`.trim()}>{actions}</div>}
 </header>;
}

/** Navigation owns destinations only; creation belongs to the page action area. */
export function MobileDock({children,compact=false}:{children:ReactNode;compact?:boolean}){
 return <div className={`mobile-dock${compact?" is-compact":""}`}>
  {children}
 </div>;
}
